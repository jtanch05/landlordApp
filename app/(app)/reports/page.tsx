import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { formatMyr } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

async function getReportSummary() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [rentResult, expenseResult] = await Promise.all([
    supabase
      .from("rent_records")
      .select("amount_due_cents,amount_paid_cents,status")
      .is("archived_at", null),
    supabase
      .from("expenses")
      .select("amount_cents,status")
      .is("archived_at", null),
  ]);

  if (rentResult.error) throw new Error(rentResult.error.message);
  if (expenseResult.error) throw new Error(expenseResult.error.message);

  const rents = rentResult.data ?? [];
  const expenses = expenseResult.data ?? [];

  return {
    expenseTotal: expenses.reduce((sum, expense) => sum + expense.amount_cents, 0),
    rentCollected: rents.reduce((sum, rent) => sum + rent.amount_paid_cents, 0),
    rentDue: rents.reduce((sum, rent) => sum + rent.amount_due_cents, 0),
  };
}

export default async function ReportsPage() {
  const summary = await getReportSummary();
  const netCashFlow = summary.rentCollected - summary.expenseTotal;

  return (
    <div className="space-y-8">
      <header className="border-b border-[#d8decf] pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4d6650]">
          Portfolio
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#163300]">
          Reports
        </h1>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Rent due", formatMyr(summary.rentDue)],
          ["Rent collected", formatMyr(summary.rentCollected)],
          ["Expenses", formatMyr(summary.expenseTotal)],
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
        <h2 className="text-lg font-semibold text-[#163300]">
          Basic property statement
        </h2>
        <div className="mt-5 grid gap-3 text-sm text-[#2f4a34]">
          <div className="flex justify-between border-b border-[#eef1ea] pb-3">
            <span>Rent collected</span>
            <strong>{formatMyr(summary.rentCollected)}</strong>
          </div>
          <div className="flex justify-between border-b border-[#eef1ea] pb-3">
            <span>Expenses</span>
            <strong>{formatMyr(summary.expenseTotal)}</strong>
          </div>
          <div className="flex justify-between pt-2 text-base text-[#163300]">
            <span>Net cash flow</span>
            <strong>{formatMyr(netCashFlow)}</strong>
          </div>
        </div>
      </section>
    </div>
  );
}
