import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, Pencil, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  archivePropertyAction,
  createPropertyAction,
} from "@/features/properties/actions";
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
  const firstProperty = properties[0];

  return (
    <div className="grid min-h-0 gap-5 lg:h-full xl:grid-cols-[378px_minmax(0,1fr)]">
      <Card className="flex min-h-[640px] flex-col p-0 lg:h-full lg:min-h-0 lg:overflow-hidden">
        <CardHeader className="pb-4">
          <div>
            <CardTitle>Properties</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {properties.length} {properties.length === 1 ? "property" : "properties"}
            </p>
          </div>
          <Button asChild size="icon" variant="ghost">
            <a href="#new-property" aria-label="Add property">
              <Plus className="size-5" />
            </a>
          </Button>
        </CardHeader>

        <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search properties..." />
          </label>

          <div className="space-y-3">
            {properties.length > 0 ? (
              properties.map((property, index) => (
                <div
                  className={`flex items-center gap-3 rounded-xl border p-3 transition hover:bg-muted/35 ${
                    index === 0 ? "border-border bg-card shadow-sm" : "border-transparent"
                  }`}
                  key={property.id}
                >
                  <Link
                    className="flex min-w-0 flex-1 items-center gap-3"
                    href={`/properties/${property.id}`}
                  >
                    <span
                      className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                        index === 0
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Building2 className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">
                        {property.nickname}
                      </span>
                      <span className="mt-1 block truncate text-sm text-muted-foreground">
                        {[property.city, property.state].filter(Boolean).join(", ") ||
                          property.type}
                      </span>
                    </span>
                  </Link>
                  <span className="hidden shrink-0 items-center gap-1 text-muted-foreground sm:flex">
                    <Button
                      asChild
                      size="icon"
                      variant="ghost"
                    >
                      <Link
                        aria-label={`Open ${property.nickname}`}
                        href={`/properties/${property.id}`}
                      >
                        <Pencil className="size-4" />
                      </Link>
                    </Button>
                    <form action={archivePropertyAction}>
                      <input name="propertyId" type="hidden" value={property.id} />
                      <Button
                        aria-label={`Archive ${property.nickname}`}
                        size="icon"
                        type="submit"
                        variant="ghost"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </form>
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No properties yet.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-[640px] flex-col p-0 lg:h-full lg:min-h-0 lg:overflow-hidden">
        <CardHeader className="border-b border-border">
          <div>
            <CardTitle>
              {firstProperty ? firstProperty.nickname : "No property selected"}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {firstProperty
                ? [firstProperty.city, firstProperty.state, firstProperty.postcode]
                    .filter(Boolean)
                    .join(", ") || "Open the workspace to manage records."
                : "Create a property to start managing records."}
            </p>
          </div>
          {firstProperty ? (
            <Button asChild>
              <Link href={`/properties/${firstProperty.id}`}>Open workspace</Link>
            </Button>
          ) : null}
        </CardHeader>

        <CardContent className="min-h-0 flex-1 overflow-y-auto p-6">
          <section className="flex min-h-[360px] items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center lg:h-[calc(100%-84px)] lg:min-h-0">
            <div>
              <Building2 className="mx-auto size-12 text-border" />
              <h2 className="mt-5 text-xl font-semibold">
                {firstProperty ? "Select a property workspace" : "No property selected"}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                {firstProperty
                  ? "Open a property from the list to view tenants, agreements, ledger, expenses, maintenance, deposits, files, and activity."
                  : "Add your first property to unlock the property workspace."}
              </p>
              {firstProperty ? (
                <Button asChild className="mt-5">
                  <Link href={`/properties/${firstProperty.id}`}>View details</Link>
                </Button>
              ) : null}
            </div>
          </section>

          <details
            className="mt-5 rounded-xl border border-border bg-card p-4"
            id="new-property"
          >
            <summary className="cursor-pointer text-sm font-semibold">
              New property
            </summary>
            <form action={createPropertyAction} className="mt-5 grid gap-4 lg:grid-cols-2">
              <label className="block text-sm font-medium">
                Nickname
                <Input
                  className="mt-2"
                  name="nickname"
                  placeholder="Bukit Jalil Condo"
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                Property type
                <Input
                  className="mt-2"
                  name="type"
                  placeholder="Condo, terrace, apartment"
                  required
                />
              </label>

              <label className="block text-sm font-medium">
                Status
                <Select className="mt-2" name="status" defaultValue="vacant">
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                </Select>
              </label>

              <label className="block text-sm font-medium">
                Address
                <Input className="mt-2" name="addressLine1" placeholder="Street address" />
              </label>

              <label className="block text-sm font-medium">
                City
                <Input className="mt-2" name="city" placeholder="Kuala Lumpur" />
              </label>

              <label className="block text-sm font-medium">
                Postcode
                <Input className="mt-2" name="postcode" placeholder="57000" />
              </label>

              <label className="block text-sm font-medium">
                State
                <Input className="mt-2" name="state" placeholder="Selangor" />
              </label>

              <label className="block text-sm font-medium lg:col-span-2">
                Notes
                <Textarea className="mt-2" name="notes" placeholder="Optional setup notes" />
              </label>

              <Button className="w-fit" type="submit">
                Create property
              </Button>
            </form>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
