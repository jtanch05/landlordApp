import { redirect } from "next/navigation";

import { createVendorAction } from "@/features/vendors/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type VendorSummary = {
  email: string | null;
  id: string;
  name: string;
  notes: string | null;
  phone: string | null;
  service_type: string | null;
};

async function getVendors() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("vendors")
    .select("id,name,service_type,phone,email,notes")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load vendors: ${error.message}`);
  }

  return data as VendorSummary[];
}

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="space-y-8">
      <header className="border-b border-[#d8decf] pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4d6650]">
          Portfolio
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[#163300]">
          Vendors
        </h1>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {vendors.length > 0 ? (
            vendors.map((vendor) => (
              <article
                className="rounded-[8px] border border-[#d8decf] bg-white p-5"
                key={vendor.id}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#163300]">
                      {vendor.name}
                    </h2>
                    <p className="mt-1 text-sm text-[#4d6650]">
                      {vendor.service_type || "Service type not set"}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#2f4a34]">
                  {[vendor.phone, vendor.email].filter(Boolean).join(" · ") ||
                    "No contact details"}
                </p>
                {vendor.notes ? (
                  <p className="mt-3 text-sm leading-6 text-[#4d6650]">
                    {vendor.notes}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[8px] border border-[#d8decf] bg-[#f7f7f2] p-6">
              <h2 className="text-xl font-semibold text-[#163300]">
                Add vendor contacts
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#4d6650]">
                Store electricians, plumbers, cleaners, agents, and other
                contacts once for the whole portfolio.
              </p>
            </div>
          )}
        </div>

        <form
          action={createVendorAction}
          className="rounded-[8px] border border-[#d8decf] bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-[#163300]">New vendor</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-[#2f4a34]">
              Name
              <input
                className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="name"
                required
              />
            </label>
            <label className="block text-sm font-medium text-[#2f4a34]">
              Service type
              <input
                className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="serviceType"
                placeholder="Plumbing, electrical, cleaning"
              />
            </label>
            <label className="block text-sm font-medium text-[#2f4a34]">
              Phone
              <input
                className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="phone"
              />
            </label>
            <label className="block text-sm font-medium text-[#2f4a34]">
              Email
              <input
                className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="email"
                type="email"
              />
            </label>
            <label className="block text-sm font-medium text-[#2f4a34]">
              Notes
              <textarea
                className="mt-2 min-h-24 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="notes"
              />
            </label>
          </div>
          <button
            className="mt-5 w-full rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
            type="submit"
          >
            Add vendor
          </button>
        </form>
      </section>
    </div>
  );
}
