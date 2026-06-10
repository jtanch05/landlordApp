import { redirect } from "next/navigation";
import { ArrowRight, FileText, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormDialog } from "@/components/ui/form-dialog";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
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
    <div className="mx-auto max-w-[1440px] space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            PDF-ready portfolio and property statements.
          </p>
        </div>
        <FormDialog
          dialogClassName="w-[min(480px,calc(100vw-32px))]"
          title="New Report"
          triggerIcon={<Plus className="size-4" />}
          triggerLabel="New Report"
        >
          <div className="space-y-4">
            <Select defaultValue="property-statement">
              <option value="property-statement">Basic property statement</option>
              <option value="rent-ledger">Rent ledger</option>
              <option value="expenses">Expenses</option>
            </Select>
            <Select defaultValue="current-month">
              <option value="current-month">Current month</option>
              <option value="year-to-date">Year to date</option>
              <option value="custom">Custom range</option>
            </Select>
            <div className="flex justify-end border-t border-border pt-5">
              <Button type="button">
                Generate PDF
                <ArrowRight className="size-4" />
              </Button>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              PDF rendering for rent ledger and expenses reports remains in the
              implementation ledger.
            </p>
          </div>
        </FormDialog>
      </header>
 
      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Rent due", formatMyr(summary.rentDue)],
          ["Rent collected", formatMyr(summary.rentCollected)],
          ["Expenses", formatMyr(summary.expenseTotal)],
        ].map(([label, value]) => (
          <Card className="rounded-xl" key={label}>
            <CardContent className="p-4 lg:p-5">
              <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
              <p className="mt-2 text-xl font-semibold lg:text-2xl">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
 
      <section>
        <Card>
          <CardHeader className="p-4 lg:p-5 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Basic property statement</CardTitle>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Current portfolio summary
              </p>
            </div>
            <Badge variant="secondary">PDF only</Badge>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-3 p-4 lg:p-5">
            <div className="flex justify-between border-b border-border pb-2.5 text-[13px]">
              <span>Rent collected</span>
              <strong className="font-semibold">{formatMyr(summary.rentCollected)}</strong>
            </div>
            <div className="flex justify-between border-b border-border pb-2.5 text-[13px]">
              <span>Expenses</span>
              <strong className="font-semibold">{formatMyr(summary.expenseTotal)}</strong>
            </div>
            <div className="flex justify-between pt-1 text-base font-semibold">
              <span>Net cash flow</span>
              <strong className="text-primary">{formatMyr(netCashFlow)}</strong>
            </div>
            <div className="mt-6 flex min-h-36 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center text-[13px] text-muted-foreground">
              <div>
                <FileText className="mx-auto mb-2 size-8 text-border" />
                PDF preview appears after report rendering is implemented.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
