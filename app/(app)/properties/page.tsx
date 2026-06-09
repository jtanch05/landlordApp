import Link from "next/link";
import { redirect } from "next/navigation";

import { createPropertyAction } from "@/features/properties/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PropertySummary = {
  city: string | null;
  id: string;
  nickname: string;
  postcode: string | null;
  state: string | null;
  status: string;
  type: string;
};

async function getProperties() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("properties")
    .select("id,nickname,type,status,city,state,postcode")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load properties: ${error.message}`);
  }

  return data as PropertySummary[];
}

export default async function PropertiesPage() {
  const properties = await getProperties();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 border-b border-[#d8decf] pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#4d6650]">
            Portfolio
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-[#163300]">
            Properties
          </h1>
        </div>
        <div className="text-sm text-[#4d6650]">
          {properties.length} active {properties.length === 1 ? "property" : "properties"}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {properties.length > 0 ? (
            properties.map((property) => (
              <Link
                className="block rounded-[8px] border border-[#d8decf] bg-white p-5 transition hover:border-[#163300]"
                href={`/properties/${property.id}`}
                key={property.id}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-[#163300]">
                      {property.nickname}
                    </h2>
                    <p className="mt-1 text-sm text-[#4d6650]">
                      {property.type}
                      {property.city ? ` in ${property.city}` : ""}
                    </p>
                  </div>
                  <span className="w-fit rounded-full bg-[#f2f5ee] px-3 py-1 text-xs font-semibold capitalize text-[#2f4a34]">
                    {property.status}
                  </span>
                </div>
                <p className="mt-4 text-sm text-[#4d6650]">
                  {[property.city, property.state, property.postcode]
                    .filter(Boolean)
                    .join(", ") || "No address details yet"}
                </p>
              </Link>
            ))
          ) : (
            <div className="rounded-[8px] border border-[#d8decf] bg-[#f7f7f2] p-6">
              <h2 className="text-xl font-semibold text-[#163300]">
                Add your first property
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#4d6650]">
                Start with the property name, type, location, and whether it is
                vacant or currently occupied.
              </p>
            </div>
          )}
        </div>

        <form
          action={createPropertyAction}
          className="rounded-[8px] border border-[#d8decf] bg-white p-5"
        >
          <h2 className="text-lg font-semibold text-[#163300]">
            New property
          </h2>

          <div className="mt-5 space-y-4">
            <label className="block text-sm font-medium text-[#2f4a34]">
              Nickname
              <input
                className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="nickname"
                placeholder="Bukit Jalil Condo"
                required
              />
            </label>

            <label className="block text-sm font-medium text-[#2f4a34]">
              Property type
              <input
                className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="type"
                placeholder="Condo, terrace, apartment"
                required
              />
            </label>

            <label className="block text-sm font-medium text-[#2f4a34]">
              Status
              <select
                className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] bg-white px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="status"
                defaultValue="vacant"
              >
                <option value="vacant">Vacant</option>
                <option value="occupied">Occupied</option>
              </select>
            </label>

            <label className="block text-sm font-medium text-[#2f4a34]">
              Address
              <input
                className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="addressLine1"
                placeholder="Street address"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium text-[#2f4a34]">
                City
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="city"
                  placeholder="Kuala Lumpur"
                />
              </label>
              <label className="block text-sm font-medium text-[#2f4a34]">
                Postcode
                <input
                  className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                  name="postcode"
                  placeholder="57000"
                />
              </label>
            </div>

            <label className="block text-sm font-medium text-[#2f4a34]">
              State
              <input
                className="mt-2 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="state"
                placeholder="Selangor"
              />
            </label>

            <label className="block text-sm font-medium text-[#2f4a34]">
              Notes
              <textarea
                className="mt-2 min-h-24 w-full rounded-[6px] border border-[#cbd5c1] px-3 py-2 text-sm text-[#163300] outline-none focus:border-[#163300] focus:ring-2 focus:ring-[#9fe870]"
                name="notes"
                placeholder="Optional setup notes"
              />
            </label>
          </div>

          <button
            className="mt-5 w-full rounded-[6px] bg-[#9fe870] px-4 py-3 text-sm font-semibold text-[#163300] transition hover:bg-[#8bdb5d]"
            type="submit"
          >
            Create property
          </button>
        </form>
      </section>
    </div>
  );
}
