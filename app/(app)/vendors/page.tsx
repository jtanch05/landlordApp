import { redirect } from "next/navigation";
import { Mail, Phone, Plus, Search, Star, UsersRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
    <div className="mx-auto max-w-[1576px] space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vendors</h1>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {vendors.length} saved {vendors.length === 1 ? "contact" : "contacts"}
          </p>
        </div>
        <FormDialog
          dialogClassName="w-[min(540px,calc(100vw-32px))]"
          title="Add Vendor"
          triggerIcon={<Plus className="size-4" />}
          triggerLabel="Add Vendor"
        >
          <form action={createVendorAction} className="space-y-5">
            <label className="block text-sm font-medium">
              Name *
              <Input className="mt-2" name="name" placeholder="Vendor name" required />
            </label>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Service Type
                <Select className="mt-2" defaultValue="" name="serviceType">
                  <option value="">Select</option>
                  <option value="Air-Conditioning">Air-Conditioning</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Pest Control">Pest Control</option>
                  <option value="Locksmith">Locksmith</option>
                  <option value="Painting">Painting</option>
                  <option value="Renovation">Renovation</option>
                  <option value="Landscaping">Landscaping</option>
                  <option value="Agent">Agent</option>
                  <option value="Other">Other</option>
                </Select>
              </label>
              <label className="block text-sm font-medium">
                Phone
                <Input className="mt-2" name="phone" placeholder="+60191234567" />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Rating (1-5)
                <Input className="mt-2" defaultValue="0" max="5" min="0" name="rating" type="number" />
              </label>
              <label className="block text-sm font-medium">
                Last Used
                <Input className="mt-2" name="lastUsedDate" type="date" />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Email
              <Input className="mt-2" name="email" placeholder="email@example.com" type="email" />
            </label>
            <label className="block text-sm font-medium">
              Notes
              <Textarea className="mt-2" name="notes" placeholder="Any notes..." rows={3} />
            </label>
            <div className="flex justify-end gap-3 border-t border-border pt-5">
              <Button formMethod="dialog" type="submit" variant="secondary">Cancel</Button>
              <Button type="submit">Add</Button>
            </div>
          </form>
        </FormDialog>
      </header>
 
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input className="h-10 rounded-lg bg-card pl-10 text-[13px]" placeholder="Search vendors..." />
      </label>
 
      <section className="grid content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {vendors.length > 0 ? (
          vendors.map((vendor) => (
            <Card className="rounded-2xl" key={vendor.id}>
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{vendor.name}</h2>
                    {vendor.service_type ? (
                      <Badge className="mt-3" variant="secondary">
                        {vendor.service_type}
                      </Badge>
                    ) : null}
                  </div>
                  <UsersRound className="size-4.5 text-muted-foreground" />
                </div>
                <div className="mt-4 space-y-1.5 text-[13px]">
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
                      <Star className="size-3.5 fill-current" key={index} />
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
            <CardContent className="p-6 text-center text-[13px] text-muted-foreground">
              Store electricians, plumbers, cleaners, agents, and other contacts
              once for the whole portfolio.
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
