import Link from "next/link";
import { redirect } from "next/navigation";

import {
  dismissReminderAction,
  reconcileRentRemindersAction,
} from "@/features/reminders/actions";
import { createClient } from "@/lib/supabase/server";
import { formatMyr } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [
    propertiesResult,
    rentResult,
    expensesResult,
    remindersResult,
  ] = await Promise.all([
    supabase.from("properties").select("id,status").is("archived_at", null),
    supabase
      .from("rent_records")
      .select("id,amount_due_cents,amount_paid_cents,status,due_date")
      .is("archived_at", null),
    supabase
      .from("expenses")
      .select("id,amount_cents,status,expense_date")
      .is("archived_at", null),
    supabase
      .from("reminders")
      .select("id,title,description,due_date,status")
      .eq("status", "active")
      .order("due_date", { ascending: true })
      .limit(8),
  ]);

  if (propertiesResult.error) throw new Error(propertiesResult.error.message);
  if (rentResult.error) throw new Error(rentResult.error.message);
  if (expensesResult.error) throw new Error(expensesResult.error.message);
  if (remindersResult.error) throw new Error(remindersResult.error.message);

  const rentRecords = rentResult.data ?? [];
  const expenses = expensesResult.data ?? [];

  return {
    activeProperties: (propertiesResult.data ?? []).filter(
      (property) => property.status !== "archived",
    ).length,
    overdueRent: rentRecords
      .filter((record) => record.status !== "paid")
      .reduce((sum, record) => sum + record.amount_due_cents - record.amount_paid_cents, 0),
    reminders: remindersResult.data ?? [],
    rentCollected: rentRecords.reduce(
      (sum, record) => sum + record.amount_paid_cents,
      0,
    ),
    unpaidExpenses: expenses
      .filter((expense) => expense.status === "unpaid")
      .reduce((sum, expense) => sum + expense.amount_cents, 0),
  };
}

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 border-b border-[#d8decf] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4d6650]">
            Portfolio
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#163300]">
            Dashboard
          </h1>
        </div>
        <form action={reconcileRentRemindersAction}>
          <button
            className="rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
            type="submit"
          >
            Refresh reminders
          </button>
        </form>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Active properties", dashboard.activeProperties.toString()],
          ["Rent collected", formatMyr(dashboard.rentCollected)],
          ["Outstanding rent", formatMyr(dashboard.overdueRent)],
          ["Unpaid expenses", formatMyr(dashboard.unpaidExpenses)],
        ].map(([label, value]) => (
          <div className="rounded-[8px] border border-[#d8decf] bg-white p-5" key={label}>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a8577]">
              {label}
            </p>
            <p className="mt-3 text-2xl font-semibold text-[#163300]">{value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[8px] border border-[#d8decf] bg-white p-5">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold text-[#163300]">Reminders</h2>
          <Link className="text-sm font-semibold text-[#2f4a34]" href="/activity">
            View activity
          </Link>
        </div>
        <div className="mt-5 space-y-3">
          {dashboard.reminders.length > 0 ? (
            dashboard.reminders.map((reminder) => (
              <form
                action={dismissReminderAction}
                className="flex flex-col gap-3 rounded-[6px] border border-[#d8decf] px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                key={reminder.id}
              >
                <input name="reminderId" type="hidden" value={reminder.id} />
                <div>
                  <p className="text-sm font-semibold text-[#2f4a34]">
                    {reminder.title}
                  </p>
                  <p className="mt-1 text-sm text-[#4d6650]">
                    {reminder.description || "No details"} · {reminder.due_date}
                  </p>
                </div>
                <button
                  className="rounded-[6px] border border-[#163300] px-3 py-2 text-xs font-semibold text-[#163300]"
                  type="submit"
                >
                  Dismiss
                </button>
              </form>
            ))
          ) : (
            <p className="text-sm leading-6 text-[#4d6650]">
              No active reminders. Refresh reminders after creating rent records.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
