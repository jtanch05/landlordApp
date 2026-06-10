import { redirect } from "next/navigation";
import { ArrowRight, FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="mx-auto max-w-[1440px] space-y-7">
      <header>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF-ready portfolio and property statements.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ["Rent due", formatMyr(summary.rentDue)],
          ["Rent collected", formatMyr(summary.rentCollected)],
          ["Expenses", formatMyr(summary.expenseTotal)],
        ].map(([label, value]) => (
          <Card className="rounded-[18px]" key={label}>
            <CardContent className="p-6">
              <p className="text-sm font-medium text-muted-foreground">{label}</p>
              <p className="mt-3 text-3xl font-semibold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-7 xl:grid-cols-[420px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Report setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <Button className="w-full" type="button">
              Generate PDF
              <ArrowRight className="size-4" />
            </Button>
            <p className="text-xs leading-5 text-muted-foreground">
              PDF rendering for rent ledger and expenses reports remains in the
              implementation ledger.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Basic property statement</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Current portfolio summary
              </p>
            </div>
            <Badge variant="secondary">PDF only</Badge>
          </CardHeader>
          <Separator />
          <CardContent className="space-y-4 pt-6">
            <div className="flex justify-between border-b border-border pb-3 text-sm">
              <span>Rent collected</span>
              <strong>{formatMyr(summary.rentCollected)}</strong>
            </div>
            <div className="flex justify-between border-b border-border pb-3 text-sm">
              <span>Expenses</span>
              <strong>{formatMyr(summary.expenseTotal)}</strong>
            </div>
            <div className="flex justify-between pt-2 text-lg">
              <span>Net cash flow</span>
              <strong className="text-primary">{formatMyr(netCashFlow)}</strong>
            </div>
            <div className="mt-8 flex min-h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-center text-sm text-muted-foreground">
              <div>
                <FileText className="mx-auto mb-3 size-10 text-border" />
                PDF preview appears after report rendering is implemented.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
