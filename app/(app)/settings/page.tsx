import { redirect } from "next/navigation";

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
    <div className="space-y-8">
      <header className="border-b border-[#d8decf] pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4d6650]">
          Portfolio
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#163300]">
          Settings
        </h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="rounded-[8px] border border-[#d8decf] bg-white p-5">
          <h2 className="text-lg font-semibold text-[#163300]">
            Expense categories
          </h2>
          <div className="mt-5 space-y-3">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div
                  className="rounded-[6px] border border-[#d8decf] px-3 py-3"
                  key={category.id}
                >
                  <p className="text-sm font-semibold text-[#2f4a34]">
                    {category.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#7a8577]">
                    {category.default_tax_deductible
                      ? "Tax deductible by default"
                      : "Not tax deductible by default"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-[#4d6650]">
                Add categories such as Repairs, Assessment, Insurance, or Agent fees.
              </p>
            )}
          </div>
        </div>

        <form
          action={createExpenseCategoryAction}
          className="rounded-[8px] border border-[#d8decf] bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-[#163300]">
            New category
          </h2>
          <label className="mt-5 block text-sm font-medium text-[#2f4a34]">
            Name
            <input
              className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
              name="name"
              required
            />
          </label>
          <label className="mt-4 flex items-center gap-2 text-sm font-medium text-[#2f4a34]">
            <input name="defaultTaxDeductible" type="checkbox" />
            Tax deductible by default
          </label>
          <button
            className="mt-5 w-full rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
            type="submit"
          >
            Add category
          </button>
        </form>
      </section>
    </div>
  );
}
