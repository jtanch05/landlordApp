import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  dismissReminderAction,
  reconcileRentRemindersAction,
} from "@/features/reminders/actions";
import { CreatePropertyDialog } from "@/features/properties/components/CreatePropertyDialog";
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
  const netCashFlow = dashboard.rentCollected - dashboard.unpaidExpenses;
  const actionRequired = dashboard.reminders.length;

  return (
    <div className="mx-auto max-w-[1680px] space-y-5 pb-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of your properties
          </p>
        </div>
        <CreatePropertyDialog
          triggerClassName="w-fit"
          triggerIcon={<Plus className="size-4" />}
          triggerLabel="Add Property"
        />
      </header>

      <Card className="overflow-hidden p-0">
        <section className="grid divide-y divide-border md:grid-cols-4 md:divide-x md:divide-y-0">
          {[
            ["Total Income", formatMyr(dashboard.rentCollected), ""],
            ["Total Expenses", formatMyr(dashboard.unpaidExpenses), ""],
            ["Net Cash Flow", formatMyr(netCashFlow), "text-primary"],
            ["Action Required", actionRequired.toString(), ""],
          ].map(([label, value, valueClass]) => (
            <div className="p-5 lg:p-6" key={label}>
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className={`mt-3 text-2xl font-semibold lg:text-3xl ${valueClass}`}>
                {value}
              </p>
            </div>
          ))}
        </section>
      </Card>

      <section className="grid gap-5 xl:grid-cols-[1.8fr_1fr]">
        <Card className="min-h-[300px] xl:min-h-[clamp(300px,33vh,365px)]">
          <CardHeader className="p-5 lg:p-6">
            <CardTitle>Monthly Cash Flow</CardTitle>
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
              href="/reports"
            >
              Details
              <ArrowRight className="size-4" />
            </Link>
          </CardHeader>
          <Separator />
          <CardContent className="p-5 pt-7 lg:p-6 lg:pt-7">
            <div className="flex gap-6 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-primary" />
                Income
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-[#B1ADA1]" />
                Expenses
              </span>
            </div>
            <div className="mt-14 space-y-10 lg:mt-16 lg:space-y-12">
              <Separator />
              <Separator />
            </div>
            <div className="mt-8 grid grid-cols-6 text-center text-xs font-semibold text-muted-foreground lg:mt-9">
              {["Jan", "Feb", "Mar", "Apr", "May", "Jun"].map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-[300px] xl:min-h-[clamp(300px,33vh,365px)]">
          <CardHeader className="p-5 lg:p-6">
            <CardTitle>Expense Breakdown</CardTitle>
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium"
              href="/reports"
            >
              View All
              <ArrowRight className="size-4" />
            </Link>
          </CardHeader>
          <Separator />
          <CardContent className="flex min-h-[220px] items-center justify-center p-5 text-sm text-muted-foreground lg:p-6">
            {dashboard.unpaidExpenses > 0
              ? formatMyr(dashboard.unpaidExpenses)
              : "No expenses recorded yet"}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <Card className="min-h-[136px]">
          <CardHeader className="p-5 lg:p-6">
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="flex min-h-20 items-center justify-center p-5 text-sm text-muted-foreground lg:p-6">
            No activity yet
          </CardContent>
        </Card>

        <Card className="min-h-[136px]">
          <CardHeader className="p-5 lg:p-6">
            <CardTitle>Upcoming Alerts</CardTitle>
            <Link
              className="inline-flex items-center gap-2 text-sm font-medium"
              href="/activity"
            >
              View All
              <ArrowRight className="size-4" />
            </Link>
          </CardHeader>
          <Separator />
          <CardContent className="min-h-20 space-y-3 p-5 lg:p-6">
            {dashboard.reminders.length > 0 ? (
              dashboard.reminders.slice(0, 3).map((reminder) => (
                <form
                  action={dismissReminderAction}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-3"
                  key={reminder.id}
                >
                  <input name="reminderId" type="hidden" value={reminder.id} />
                  <div>
                    <p className="text-sm font-semibold">{reminder.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {reminder.due_date}
                    </p>
                  </div>
                  <Button size="sm" type="submit" variant="secondary">
                    Dismiss
                  </Button>
                </form>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                No alerts - all clear
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <form action={reconcileRentRemindersAction}>
        <Button type="submit" variant="secondary">
          Refresh reminders
        </Button>
      </form>
    </div>
  );
}
