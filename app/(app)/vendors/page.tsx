import { redirect } from "next/navigation";
import { Mail, Phone, Plus, Search, Star, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="mx-auto max-w-[1576px] space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Vendors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {vendors.length} saved {vendors.length === 1 ? "contact" : "contacts"}
          </p>
        </div>
        <Button asChild>
          <a href="#new-vendor">
            <Plus className="size-4" />
            Add Vendor
          </a>
        </Button>
      </header>

      <label className="relative block">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-12 rounded-xl bg-card pl-11" placeholder="Search vendors..." />
      </label>

      <section className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="grid content-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {vendors.length > 0 ? (
            vendors.map((vendor) => (
              <Card className="rounded-[22px]" key={vendor.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{vendor.name}</h2>
                      {vendor.service_type ? (
                        <Badge className="mt-5" variant="secondary">
                          {vendor.service_type}
                        </Badge>
                      ) : null}
                    </div>
                    <UsersRound className="size-5 text-muted-foreground" />
                  </div>
                  <div className="mt-5 space-y-2 text-sm">
                    {vendor.phone ? (
                      <p className="flex items-center gap-2">
                        <Phone className="size-4 text-muted-foreground" />
                        {vendor.phone}
                      </p>
                    ) : null}
                    {vendor.email ? (
                      <p className="flex items-center gap-2">
                        <Mail className="size-4 text-muted-foreground" />
                        {vendor.email}
                      </p>
                    ) : null}
                    <p className="flex items-center gap-1 text-[#D97706]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star className="size-4 fill-current" key={index} />
                      ))}
                    </p>
                    {vendor.notes ? (
                      <p className="pt-1 text-muted-foreground">{vendor.notes}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="sm:col-span-2 xl:col-span-3">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Store electricians, plumbers, cleaners, agents, and other contacts
                once for the whole portfolio.
              </CardContent>
            </Card>
          )}
        </div>

        <form action={createVendorAction} className="space-y-4 rounded-[22px] border border-border bg-card p-6" id="new-vendor">
          <div>
            <h2 className="text-lg font-semibold">New vendor</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Save a portfolio-level service contact.
            </p>
          </div>
          <Input name="name" placeholder="Name" required />
          <Input name="serviceType" placeholder="Service type" />
          <Input name="phone" placeholder="Phone" />
          <Input name="email" placeholder="Email" type="email" />
          <Textarea name="notes" placeholder="Notes" />
          <Button className="w-full" type="submit">Add vendor</Button>
        </form>
      </section>
    </div>
  );
}
