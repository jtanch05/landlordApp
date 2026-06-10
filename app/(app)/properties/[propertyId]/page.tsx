import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Activity,
  Building2,
  FileText,
  Pencil,
  ReceiptText,
  Search,
  Trash2,
  UsersRound,
  WalletCards,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  createAgreementAction,
  createManualRentRecordAction,
  updateRentRecordPaymentAction,
} from "@/features/agreements/actions";
import { createDepositAction, updateDepositStatusAction } from "@/features/deposits/actions";
import { createExpenseAction } from "@/features/expenses/actions";
import { createMaintenanceIssueAction } from "@/features/maintenance/actions";
import {
  archivePropertyAction,
  updatePropertyAction,
} from "@/features/properties/actions";
import {
  normalizeWorkspaceTab,
} from "@/features/properties/workspace-tabs";
import { PropertyWorkspaceTabsClient } from "@/features/properties/components/PropertyWorkspaceTabsClient";
import {
  inviteCoOwnerAction,
  revokePropertyAccessAction,
  updatePropertyAccessAction,
} from "@/features/sharing/actions";
import { createTenantAction } from "@/features/tenants/actions";
import { createClient } from "@/lib/supabase/server";
import { formatMyr } from "@/lib/utils/currency";

export const dynamic = "force-dynamic";

type PropertyWorkspacePageProps = {
  params: Promise<{ propertyId: string }>;
  searchParams?: Promise<{ tab?: string | string[] }>;
};

type PropertySummary = {
  city: string | null;
  id: string;
  nickname: string;
  state: string | null;
  type: string;
};

type PropertyDetail = PropertySummary & {
  address_line1: string | null;
  notes: string | null;
  postcode: string | null;
  status: string;
};

type ActivityEvent = {
  action: string;
  created_at: string;
  id: string;
  summary: string;
};

type AttachmentSummary = {
  created_at: string;
  file_name: string;
  id: string;
  is_private: boolean;
  size_bytes: number | null;
  target_type: string;
};

type TenantSummary = {
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
  status: string;
};

type AgreementSummary = {
  end_date: string;
  id: string;
  rent_amount_cents: number;
  start_date: string;
  type: string;
};

type RentRecordSummary = {
  amount_due_cents: number;
  amount_paid_cents: number;
  due_date: string;
  id: string;
  month: string;
  status: string;
};

type ExpenseCategorySummary = {
  default_tax_deductible: boolean;
  id: string;
  name: string;
};

type ExpenseSummary = {
  amount_cents: number;
  description: string;
  expense_date: string;
  id: string;
  status: string;
};

type VendorSummary = {
  id: string;
  name: string;
  service_type: string | null;
};

type MaintenanceIssueSummary = {
  cost_cents: number | null;
  description: string;
  id: string;
  reported_date: string;
  status: string;
};

type DepositSummary = {
  amount_cents: number;
  id: string;
  label: string;
  refund_date: string | null;
  status: string;
};

type PropertyAccessSummary = {
  can_edit: boolean;
  can_view_tenant_contact: boolean;
  created_at: string;
  id: string;
  user_id: string;
};

type InvitationSummary = {
  can_edit: boolean;
  email: string;
  expires_at: string;
  id: string;
  status: string;
};

async function getProperties(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("properties")
    .select("id,nickname,type,city,state")
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load properties: ${error.message}`);
  }

  return data as PropertySummary[];
}

async function getProperty(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("properties")
    .select("id,nickname,type,status,address_line1,city,state,postcode,notes")
    .eq("id", propertyId)
    .is("archived_at", null)
    .single();

  if (error) {
    notFound();
  }

  return data as PropertyDetail;
}

async function getPropertyActivity(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("audit_events")
    .select("id,action,summary,created_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) throw new Error(`Failed to load activity: ${error.message}`);
  return data as ActivityEvent[];
}

async function getPropertyAttachments(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("attachments")
    .select("id,file_name,target_type,size_bytes,is_private,created_at")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load files: ${error.message}`);
  return data as AttachmentSummary[];
}

async function getTenants(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("tenants")
    .select("id,name,phone,email,status")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load tenants: ${error.message}`);
  return data as TenantSummary[];
}

async function getAgreements(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("agreements")
    .select("id,type,start_date,end_date,rent_amount_cents")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("start_date", { ascending: false });

  if (error) throw new Error(`Failed to load agreements: ${error.message}`);
  return data as AgreementSummary[];
}

async function getRentRecords(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("rent_records")
    .select("id,month,due_date,amount_due_cents,amount_paid_cents,status")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("due_date", { ascending: true })
    .limit(24);

  if (error) throw new Error(`Failed to load rent records: ${error.message}`);
  return data as RentRecordSummary[];
}

async function getExpenseCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("expense_categories")
    .select("id,name,default_tax_deductible")
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load expense categories: ${error.message}`);
  return data as ExpenseCategorySummary[];
}

async function getExpenses(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id,description,amount_cents,status,expense_date")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("expense_date", { ascending: false })
    .limit(12);

  if (error) throw new Error(`Failed to load expenses: ${error.message}`);
  return data as ExpenseSummary[];
}

async function getVendors(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("vendors")
    .select("id,name,service_type")
    .is("archived_at", null)
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load vendors: ${error.message}`);
  return data as VendorSummary[];
}

async function getMaintenanceIssues(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("maintenance_issues")
    .select("id,description,reported_date,status,cost_cents")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("reported_date", { ascending: false })
    .limit(12);

  if (error) throw new Error(`Failed to load maintenance: ${error.message}`);
  return data as MaintenanceIssueSummary[];
}

async function getDeposits(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("deposits")
    .select("id,label,amount_cents,status,refund_date")
    .eq("property_id", propertyId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load deposits: ${error.message}`);
  return data as DepositSummary[];
}

async function getPropertyAccess(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("property_access")
    .select("id,user_id,can_edit,can_view_tenant_contact,created_at")
    .eq("property_id", propertyId)
    .is("revoked_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load property access: ${error.message}`);
  return data as PropertyAccessSummary[];
}

async function getInvitations(supabase: SupabaseClient, propertyId: string) {
  const { data, error } = await supabase
    .from("invitations")
    .select("id,email,can_edit,status,expires_at")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Failed to load invitations: ${error.message}`);
  return data as InvitationSummary[];
}

function statusVariant(status: string) {
  if (status === "paid" || status === "occupied" || status === "held") return "success";
  if (status === "overdue" || status === "unpaid") return "warning";
  if (status === "archived") return "destructive";
  return "secondary";
}

function EmptyPanel({
  action,
  description,
  icon,
  title,
}: {
  action?: React.ReactNode;
  description: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center">
      <div>
        <div className="mx-auto flex size-14 items-center justify-center text-border">
          {icon}
        </div>
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}

export default async function PropertyWorkspacePage({
  params,
  searchParams,
}: PropertyWorkspacePageProps) {
  const { propertyId } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const activeTab = normalizeWorkspaceTab(resolvedSearchParams.tab);
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect("/login");
  }

  const [
    properties,
    property,
    activityEvents,
    attachments,
    tenants,
    agreements,
    rentRecords,
    expenseCategories,
    expenses,
    vendors,
    maintenanceIssues,
    deposits,
    propertyAccess,
    invitations,
  ] = await Promise.all([
    getProperties(supabase),
    getProperty(supabase, propertyId),
    getPropertyActivity(supabase, propertyId),
    getPropertyAttachments(supabase, propertyId),
    getTenants(supabase, propertyId),
    getAgreements(supabase, propertyId),
    getRentRecords(supabase, propertyId),
    getExpenseCategories(supabase),
    getExpenses(supabase, propertyId),
    getVendors(supabase),
    getMaintenanceIssues(supabase, propertyId),
    getDeposits(supabase, propertyId),
    getPropertyAccess(supabase, propertyId),
    getInvitations(supabase, propertyId),
  ]);

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
            <Link href="/properties#new-property" aria-label="Add property">
              +
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search properties..." />
          </label>
          <div className="space-y-3">
            {properties.map((item) => (
              <div
                className={`flex items-center gap-3 rounded-xl border p-3 transition hover:bg-muted/35 ${
                  item.id === propertyId
                    ? "border-border bg-card shadow-sm"
                    : "border-transparent"
                }`}
                key={item.id}
              >
                <Link
                  className="flex min-w-0 flex-1 items-center gap-3"
                  href={`/properties/${item.id}?tab=${activeTab}`}
                >
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      item.id === propertyId
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Building2 className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">
                      {item.nickname}
                    </span>
                    <span className="mt-1 block truncate text-sm text-muted-foreground">
                      {[item.city, item.state].filter(Boolean).join(", ") || item.type}
                    </span>
                  </span>
                </Link>
                <span className="hidden shrink-0 items-center gap-1 text-muted-foreground sm:flex">
                  <Button asChild size="icon" variant="ghost">
                    <Link
                      aria-label={`Open ${item.nickname}`}
                      href={`/properties/${item.id}?tab=${activeTab}`}
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                  <form action={archivePropertyAction}>
                    <input name="propertyId" type="hidden" value={item.id} />
                    <Button
                      aria-label={`Archive ${item.nickname}`}
                      size="icon"
                      type="submit"
                      variant="ghost"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </form>
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="flex min-h-[640px] flex-col overflow-hidden p-0 lg:h-full lg:min-h-0">
        <CardHeader className="shrink-0 px-9 py-7">
          <div>
            <CardTitle className="text-2xl">{property.nickname}</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              {[property.type, property.city, property.state].filter(Boolean).join(" - ")}
            </p>
          </div>
          <Badge variant={statusVariant(property.status)}>{property.status}</Badge>
        </CardHeader>

        <PropertyWorkspaceTabsClient initialTab={activeTab}>
            <div data-tab="overview" className="grid gap-6 xl:grid-cols-[1fr_360px]">
              <div className="space-y-6">
                <Card className="rounded-xl shadow-none">
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <dl className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <dt className="text-xs font-semibold uppercase text-muted-foreground">
                          Address
                        </dt>
                        <dd className="mt-1 text-sm">
                          {[property.address_line1, property.city, property.state, property.postcode]
                            .filter(Boolean)
                            .join(", ") || "Not added yet"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase text-muted-foreground">
                          Property type
                        </dt>
                        <dd className="mt-1 text-sm">{property.type}</dd>
                      </div>
                      <div className="sm:col-span-2">
                        <dt className="text-xs font-semibold uppercase text-muted-foreground">
                          Notes
                        </dt>
                        <dd className="mt-1 text-sm leading-6">
                          {property.notes || "No notes yet"}
                        </dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                <form action={updatePropertyAction} className="grid gap-4 rounded-xl border border-border p-5 sm:grid-cols-2">
                  <input name="propertyId" type="hidden" value={property.id} />
                  <h2 className="text-lg font-semibold sm:col-span-2">Edit property</h2>
                  <label className="block text-sm font-medium">
                    Nickname
                    <Input className="mt-2" defaultValue={property.nickname} name="nickname" required />
                  </label>
                  <label className="block text-sm font-medium">
                    Property type
                    <Input className="mt-2" defaultValue={property.type} name="type" required />
                  </label>
                  <label className="block text-sm font-medium">
                    Status
                    <Select className="mt-2" defaultValue={property.status === "occupied" ? "occupied" : "vacant"} name="status">
                      <option value="vacant">Vacant</option>
                      <option value="occupied">Occupied</option>
                    </Select>
                  </label>
                  <label className="block text-sm font-medium">
                    Address
                    <Input className="mt-2" defaultValue={property.address_line1 ?? ""} name="addressLine1" />
                  </label>
                  <label className="block text-sm font-medium">
                    City
                    <Input className="mt-2" defaultValue={property.city ?? ""} name="city" />
                  </label>
                  <label className="block text-sm font-medium">
                    Postcode
                    <Input className="mt-2" defaultValue={property.postcode ?? ""} name="postcode" />
                  </label>
                  <label className="block text-sm font-medium sm:col-span-2">
                    State
                    <Input className="mt-2" defaultValue={property.state ?? ""} name="state" />
                  </label>
                  <label className="block text-sm font-medium sm:col-span-2">
                    Notes
                    <Textarea className="mt-2" defaultValue={property.notes ?? ""} name="notes" />
                  </label>
                  <Button className="w-fit" type="submit">Save changes</Button>
                </form>
              </div>

              <aside className="space-y-6">
                <Card className="rounded-xl shadow-none">
                  <CardHeader>
                    <CardTitle>Sharing</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <form action={inviteCoOwnerAction} className="space-y-3">
                      <input name="propertyId" type="hidden" value={property.id} />
                      <Input name="email" placeholder="co-owner@email.com" required type="email" />
                      <label className="flex items-center gap-2 text-sm">
                        <input name="canEdit" type="checkbox" /> Can edit
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input name="canViewTenantContact" type="checkbox" /> Tenant contact
                      </label>
                      <Button className="w-full" type="submit">Invite Co-owner</Button>
                    </form>
                    <Separator />
                    <div className="space-y-3">
                      {propertyAccess.map((access) => (
                        <form action={updatePropertyAccessAction} className="space-y-2 rounded-xl border border-border p-3" key={access.id}>
                          <input name="propertyId" type="hidden" value={property.id} />
                          <input name="accessId" type="hidden" value={access.id} />
                          <p className="truncate text-sm font-semibold">{access.user_id}</p>
                          <label className="flex items-center gap-2 text-xs">
                            <input defaultChecked={access.can_edit} name="canEdit" type="checkbox" /> Can edit
                          </label>
                          <label className="flex items-center gap-2 text-xs">
                            <input defaultChecked={access.can_view_tenant_contact} name="canViewTenantContact" type="checkbox" /> Tenant contact
                          </label>
                          <div className="flex gap-2">
                            <Button size="sm" type="submit">Save</Button>
                            <Button formAction={revokePropertyAccessAction} size="sm" type="submit" variant="destructive">Revoke</Button>
                          </div>
                        </form>
                      ))}
                      {invitations.map((invitation) => (
                        <div className="rounded-xl border border-border p-3 text-sm" key={invitation.id}>
                          <p className="font-semibold">{invitation.email}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {invitation.status} - expires {invitation.expires_at}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <form action={archivePropertyAction} className="rounded-xl border border-destructive/25 bg-destructive/5 p-5">
                  <input name="propertyId" type="hidden" value={property.id} />
                  <h2 className="font-semibold text-destructive">Archive property</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Historical records stay linked and the property leaves active views.
                  </p>
                  <Button className="mt-4" type="submit" variant="destructive">Archive</Button>
                </form>
              </aside>
            </div>
            <div data-tab="tenants" className="grid gap-8 xl:grid-cols-[1fr_340px]">
              {tenants.length > 0 ? (
                <div className="grid gap-3">
                  {tenants.map((tenant) => (
                    <Card className="rounded-xl shadow-none" key={tenant.id}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="font-semibold">{tenant.name}</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {[tenant.phone, tenant.email].filter(Boolean).join(" - ") ||
                                "No contact details"}
                            </p>
                          </div>
                          <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  description="Add a tenant and link them to this property."
                  icon={<UsersRound className="size-12" />}
                  title="No tenants yet"
                />
              )}
              <form action={createTenantAction} className="space-y-4">
                <h2 className="text-lg font-semibold">New tenant</h2>
                <input name="propertyId" type="hidden" value={property.id} />
                <Input name="name" placeholder="Tenant name" required />
                <Input name="phone" placeholder="Phone" />
                <Input name="email" placeholder="Email" type="email" />
                <Textarea name="notes" placeholder="Notes" />
                <Button className="w-full" type="submit">Add Tenant</Button>
              </form>
            </div>

            <div data-tab="agreements" className="grid gap-8 xl:grid-cols-[1fr_360px]">
              <div className="space-y-3">
                {agreements.map((agreement) => (
                  <Card className="rounded-xl shadow-none" key={agreement.id}>
                    <CardContent className="p-5">
                      <h2 className="font-semibold capitalize">{agreement.type.replaceAll("_", " ")}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {agreement.start_date} to {agreement.end_date}
                      </p>
                      <p className="mt-3 font-semibold">{formatMyr(agreement.rent_amount_cents)}</p>
                    </CardContent>
                  </Card>
                ))}
                {agreements.length === 0 ? (
                  <EmptyPanel description="Create an agreement to generate the rent schedule." icon={<FileText className="size-12" />} title="No agreements yet" />
                ) : null}
              </div>
              <form action={createAgreementAction} className="space-y-4">
                <h2 className="text-lg font-semibold">New agreement</h2>
                <input name="propertyId" type="hidden" value={property.id} />
                <Select name="tenantId" required>
                  <option value="">Select tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                </Select>
                <Select name="type" defaultValue="one_year">
                  <option value="six_months">Six months</option>
                  <option value="one_year">One year</option>
                  <option value="two_years">Two years</option>
                  <option value="three_years">Three years</option>
                  <option value="custom">Custom</option>
                </Select>
                <Input name="startDate" required type="date" />
                <Input name="customEndDate" type="date" />
                <Input min="1" name="rentDueDay" placeholder="Rent due day" required type="number" />
                <Input min="0" name="rentAmount" placeholder="Monthly rent (RM)" required step="0.01" type="number" />
                <Input name="renewalOption" placeholder="Renewal option" />
                <Textarea name="notes" placeholder="Notes" />
                <Button className="w-full" type="submit">Create agreement</Button>
              </form>
            </div>

            <div data-tab="rent" className="space-y-6">
              <Card className="rounded-xl shadow-none">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rentRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{record.month}</TableCell>
                          <TableCell>{record.due_date}</TableCell>
                          <TableCell>{formatMyr(record.amount_due_cents)}</TableCell>
                          <TableCell><Badge variant={statusVariant(record.status)}>{record.status}</Badge></TableCell>
                          <TableCell>
                            <form action={updateRentRecordPaymentAction} className="grid gap-2 sm:grid-cols-[90px_1fr_auto]">
                              <input name="propertyId" type="hidden" value={property.id} />
                              <input name="rentRecordId" type="hidden" value={record.id} />
                              <Input defaultValue={(record.amount_paid_cents / 100).toString()} min="0" name="amountPaid" step="0.01" type="number" />
                              <Input name="paymentMethod" placeholder="Method" />
                              <Button size="sm" type="submit">Save</Button>
                            </form>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {rentRecords.length === 0 ? (
                    <div className="p-6">
                      <EmptyPanel description="Rent records appear after an agreement is created." icon={<WalletCards className="size-12" />} title="No rent records yet" />
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              <form action={createManualRentRecordAction} className="grid gap-3 rounded-xl border border-border p-5 md:grid-cols-[1fr_1fr_1fr_auto]">
                <input name="propertyId" type="hidden" value={property.id} />
                <Input name="month" placeholder="2026-06" required />
                <Input name="dueDate" required type="date" />
                <Input min="0" name="amountDue" placeholder="Amount due" required step="0.01" type="number" />
                <Button type="submit">Add manual rent</Button>
              </form>
            </div>

            <div data-tab="expenses" className="grid gap-8 xl:grid-cols-[1fr_340px]">
              <div className="space-y-3">
                {expenses.map((expense) => (
                  <Card className="rounded-xl shadow-none" key={expense.id}>
                    <CardContent className="flex items-start justify-between gap-3 p-5">
                      <div>
                        <h2 className="font-semibold">{expense.description}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">{expense.expense_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatMyr(expense.amount_cents)}</p>
                        <Badge className="mt-2" variant={statusVariant(expense.status)}>{expense.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {expenses.length === 0 ? (
                  <EmptyPanel description="Track property costs and tax-deductible expenses here." icon={<ReceiptText className="size-12" />} title="No expenses recorded yet" />
                ) : null}
              </div>
              <form action={createExpenseAction} className="space-y-4">
                <h2 className="text-lg font-semibold">Add expense</h2>
                <input name="propertyId" type="hidden" value={property.id} />
                <Input name="description" placeholder="Description" required />
                <Select name="categoryId" required>
                  <option value="">Select category</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
                <Input min="0" name="amount" placeholder="Amount" required step="0.01" type="number" />
                <Input name="expenseDate" required type="date" />
                <Select name="status" defaultValue="unpaid">
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </Select>
                <label className="flex items-center gap-2 text-sm"><input name="taxDeductible" type="checkbox" /> Tax deductible</label>
                <Button className="w-full" type="submit">Add expense</Button>
              </form>
            </div>

            <div data-tab="maintenance" className="grid gap-8 xl:grid-cols-[1fr_340px]">
              <div className="space-y-3">
                {maintenanceIssues.map((issue) => (
                  <Card className="rounded-xl shadow-none" key={issue.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h2 className="font-semibold">{issue.description}</h2>
                          <p className="mt-1 text-sm text-muted-foreground">{issue.reported_date}</p>
                        </div>
                        <Badge variant={statusVariant(issue.status)}>{issue.status}</Badge>
                      </div>
                      <p className="mt-3 text-sm">{issue.cost_cents ? formatMyr(issue.cost_cents) : "No cost recorded"}</p>
                    </CardContent>
                  </Card>
                ))}
                {maintenanceIssues.length === 0 ? (
                  <EmptyPanel description="Track repairs and service items for this property." icon={<Wrench className="size-12" />} title="No maintenance issues yet" />
                ) : null}
              </div>
              <form action={createMaintenanceIssueAction} className="space-y-4">
                <h2 className="text-lg font-semibold">Add issue</h2>
                <input name="propertyId" type="hidden" value={property.id} />
                <Textarea name="description" placeholder="Description" required />
                <Input name="issueType" placeholder="Issue type" />
                <Select name="vendorId">
                  <option value="">No vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </Select>
                <Select name="expenseCategoryId">
                  <option value="">No linked expense</option>
                  {expenseCategories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </Select>
                <Input name="reportedDate" required type="date" />
                <Input min="0" name="cost" placeholder="Cost" step="0.01" type="number" />
                <Button className="w-full" type="submit">Add issue</Button>
              </form>
            </div>

            <div data-tab="deposits" className="grid gap-8 xl:grid-cols-[1fr_340px]">
              <div className="space-y-3">
                {deposits.map((deposit) => (
                  <form action={updateDepositStatusAction} className="rounded-xl border border-border p-5" key={deposit.id}>
                    <input name="propertyId" type="hidden" value={property.id} />
                    <input name="depositId" type="hidden" value={deposit.id} />
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-semibold">{deposit.label}</h2>
                        <p className="mt-1 text-sm">{formatMyr(deposit.amount_cents)}</p>
                      </div>
                      <Badge variant={statusVariant(deposit.status)}>{deposit.status}</Badge>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                      <Select defaultValue={deposit.status} name="status">
                        <option value="held">Held</option>
                        <option value="refunded">Refunded</option>
                      </Select>
                      <Input defaultValue={deposit.refund_date ?? ""} name="refundDate" type="date" />
                      <Button type="submit">Save</Button>
                    </div>
                  </form>
                ))}
                {deposits.length === 0 ? (
                  <EmptyPanel description="Deposits tied to agreements will appear here." icon={<WalletCards className="size-12" />} title="No deposits recorded yet" />
                ) : null}
              </div>
              <form action={createDepositAction} className="space-y-4">
                <h2 className="text-lg font-semibold">Add deposit</h2>
                <input name="propertyId" type="hidden" value={property.id} />
                <Select name="agreementId" required>
                  <option value="">Select agreement</option>
                  {agreements.map((agreement) => (
                    <option key={agreement.id} value={agreement.id}>{agreement.start_date} to {agreement.end_date}</option>
                  ))}
                </Select>
                <Input name="label" placeholder="Security deposit" required />
                <Input min="0" name="amount" placeholder="Amount" required step="0.01" type="number" />
                <Button className="w-full" type="submit">Add deposit</Button>
              </form>
            </div>

            <div data-tab="files" className="space-y-3">
              {attachments.map((attachment) => (
                <Card className="rounded-xl shadow-none" key={attachment.id}>
                  <CardContent className="flex items-start justify-between gap-3 p-5">
                    <div>
                      <h2 className="font-semibold">{attachment.file_name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {attachment.target_type} - {attachment.created_at}
                      </p>
                    </div>
                    <Badge variant={attachment.is_private ? "warning" : "secondary"}>
                      {attachment.is_private ? "Private to Host" : "Shared"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              {attachments.length === 0 ? (
                <EmptyPanel description="Linked agreement, expense, maintenance, and deposit files will appear here." icon={<FileText className="size-12" />} title="No files yet" />
              ) : null}
            </div>

            <div data-tab="activity" className="space-y-4">
              {activityEvents.map((event) => (
                <article className="border-l-2 border-primary pl-4" key={event.id}>
                  <p className="text-sm font-semibold">{event.summary}</p>
                  <p className="mt-1 text-xs uppercase text-muted-foreground">
                    {event.action} - {new Date(event.created_at).toLocaleString()}
                  </p>
                </article>
              ))}
              {activityEvents.length === 0 ? (
                <EmptyPanel description="Activity will appear after property changes are recorded." icon={<Activity className="size-12" />} title="No activity yet" />
              ) : null}
            </div>
        </PropertyWorkspaceTabsClient>
      </Card>
    </div>
  );
}
