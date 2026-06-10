import { redirect } from "next/navigation";
import { Plus, ReceiptText, Settings2, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createExpenseCategoryAction } from "@/features/expenses/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ExpenseCategory = {
  default_tax_deductible: boolean;
  id: string;
  name: string;
};

async function getExpenseCategories() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("expense_categories")
    .select("id,name,default_tax_deductible")
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load expense categories: ${error.message}`);
  }

  return data as ExpenseCategory[];
}

export default async function SettingsPage() {
  const categories = await getExpenseCategories();

  return (
    <div className="mx-auto max-w-[880px] space-y-5 py-2">
      <header>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Portfolio defaults and operational configuration.
        </p>
      </header>
 
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Portfolio</h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            <div className="flex items-center justify-between gap-4 p-4 lg:p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <Settings2 className="size-4" />
                </span>
                <div>
                  <h3 className="text-[13px] font-semibold">Profile and portfolio defaults</h3>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    Theme switching stays deferred; v1 uses the light Claude-inspired palette.
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Light only</Badge>
            </div>
            <div className="flex items-center justify-between gap-4 p-4 lg:p-5">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                  <UsersRound className="size-4" />
                </span>
                <div>
                  <h3 className="text-[13px] font-semibold">Members and invitations</h3>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    Property-level Co-owner access is managed inside each property workspace.
                  </p>
                </div>
              </div>
              <Badge variant="outline">Property scoped</Badge>
            </div>
          </CardContent>
        </Card>
      </section>
 
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Expense Categories</h2>
        <Card>
          <CardHeader className="p-4 lg:p-5 pb-0">
            <CardTitle className="text-base font-semibold">Current categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 p-4 lg:p-5">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div
                  className="flex items-center justify-between gap-4 rounded-xl border border-border p-3"
                  key={category.id}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-primary">
                      <ReceiptText className="size-4" />
                    </span>
                    <div>
                      <p className="text-[13px] font-semibold">{category.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {category.default_tax_deductible
                          ? "Tax deductible by default"
                          : "Not tax deductible by default"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      category.default_tax_deductible ? "success" : "secondary"
                    }
                  >
                    {category.default_tax_deductible ? "Deductible" : "Standard"}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Add categories such as Repairs, Assessment, Insurance, or Agent fees.
              </p>
            )}
          </CardContent>
        </Card>
 
        <form
          action={createExpenseCategoryAction}
          className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-[1fr_auto_auto]"
        >
          <Input className="h-9 text-[13px]" name="name" placeholder="New category name" required />
          <label className="flex items-center gap-2 text-[13px] font-medium">
            <input name="defaultTaxDeductible" type="checkbox" />
            Tax deductible
          </label>
          <Button size="sm" type="submit">
            <Plus className="size-4" />
            Add category
          </Button>
        </form>
      </section>
    </div>
  );
}
