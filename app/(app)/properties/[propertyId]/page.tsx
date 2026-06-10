import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Activity,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  FileText,
  Landmark,
  Mail,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  ReceiptText,
  Search,
  Shield,
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
import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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
import { CreatePropertyDialog } from "@/features/properties/components/CreatePropertyDialog";
import { PropertyWorkspaceTabsClient } from "@/features/properties/components/PropertyWorkspaceTabsClient";
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

function statusVariant(status: string) {
  if (status === "paid" || status === "occupied" || status === "held") return "success";
  if (status === "overdue" || status === "unpaid") return "warning";
  if (status === "archived") return "destructive";
  return "secondary";
}

function displayValue(value: string | null | undefined) {
  return value?.trim() || "Not added yet";
}

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-MY", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatMonth(value: string) {
  const date = new Date(`${value}-01T00:00:00`);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric",
  });
}

function agreementTypeLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function daysLeft(endDate: string) {
  const end = new Date(`${endDate}T00:00:00`).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (Number.isNaN(end)) return null;

  return Math.max(0, Math.ceil((end - today) / 86_400_000));
}

function DefinitionRow({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-2 border-b border-border py-2.5 sm:grid-cols-[140px_minmax(0,1fr)] text-[13px]">
      <dt className="font-semibold text-muted-foreground">{label}</dt>
      <dd className="font-semibold leading-5 text-foreground">{children}</dd>
    </div>
  );
}

function SegmentedChoice({
  defaultValue,
  name,
  options,
}: {
  defaultValue: string;
  name: string;
  options: Array<{ label: string; value: string }>;
}) {
  return (
    <div className="grid rounded-full border border-border bg-muted/20 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <label
          className="relative flex h-9 cursor-pointer items-center justify-center rounded-full text-sm font-semibold text-muted-foreground has-[:checked]:bg-foreground has-[:checked]:text-background"
          key={option.value}
        >
          <input
            className="sr-only"
            defaultChecked={option.value === defaultValue}
            name={name}
            type="radio"
            value={option.value}
          />
          {option.label}
        </label>
      ))}
    </div>
  );
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
  ]);

  return (
    <div className="grid min-h-0 gap-4 lg:h-full xl:grid-cols-[280px_minmax(0,1fr)]">
      <Card className="flex min-h-[640px] flex-col p-0 lg:h-full lg:min-h-0 lg:overflow-hidden">
        <CardHeader className="pb-3">
          <div>
            <CardTitle>Properties</CardTitle>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              {properties.length} {properties.length === 1 ? "property" : "properties"}
            </p>
          </div>
          <CreatePropertyDialog
            triggerAriaLabel="Add property"
            triggerIcon={<Plus className="size-4" />}
            triggerLabel={<span className="sr-only">Add property</span>}
            triggerSize="icon"
            triggerClassName="bg-transparent text-foreground hover:bg-muted"
          />
        </CardHeader>
        <CardContent className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search properties..." />
          </label>
          <div className="space-y-3">
            {properties.map((item) => (
              <div
                className={`flex items-center gap-2.5 rounded-xl border p-2.5 transition hover:bg-muted/35 ${
                  item.id === propertyId
                    ? "border-border bg-card shadow-sm"
                    : "border-transparent"
                }`}
                key={item.id}
              >
                <Link
                  className="flex min-w-0 flex-1 items-center gap-2.5"
                  href={`/properties/${item.id}?tab=${activeTab}`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${
                      item.id === propertyId
                        ? "bg-foreground text-background"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Building2 className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold">
                      {item.nickname}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 truncate text-[13px] text-muted-foreground">
                      <span className="truncate">
                        {item.state || item.city || item.type}
                      </span>
                      {item.id === propertyId ? (
                        <span className="size-1.5 shrink-0 rounded-full bg-emerald-600" />
                      ) : null}
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
        <CardHeader className="shrink-0 px-6 py-4">
          <div>
            <CardTitle className="text-lg font-semibold">{property.nickname}</CardTitle>
          </div>
        </CardHeader>

        <PropertyWorkspaceTabsClient initialTab={activeTab}>
            <div data-tab="overview" className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Property Information</h2>
                <FormDialog
                  title="Edit Property"
                  triggerIcon={<Pencil className="size-4" />}
                  triggerLabel="Edit"
                  triggerVariant="secondary"
                >
                  <form action={updatePropertyAction} className="grid gap-4 md:grid-cols-2">
                    <input name="propertyId" type="hidden" value={property.id} />
                    <label className="block text-sm font-medium">
                      Property Nickname *
                      <Input className="mt-2" defaultValue={property.nickname} name="nickname" required />
                    </label>
                    <label className="block text-sm font-medium">
                      Property Type *
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
                      Address / Unit
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
                    <label className="block text-sm font-medium md:col-span-2">
                      State
                      <Input className="mt-2" defaultValue={property.state ?? ""} name="state" />
                    </label>
                    <label className="block text-sm font-medium md:col-span-2">
                      Notes
                      <Textarea className="mt-2" defaultValue={property.notes ?? ""} name="notes" />
                    </label>
                    <div className="flex justify-end gap-3 border-t border-border pt-5 md:col-span-2">
                      <Button formMethod="dialog" type="submit" variant="secondary">Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                    </div>
                  </form>
                </FormDialog>
              </div>
              <dl className="border-t border-border">
                <DefinitionRow label="Type">{displayValue(property.type)}</DefinitionRow>
                <DefinitionRow label="Title Type">Non-Strata</DefinitionRow>
                <DefinitionRow label="Location">
                  <span className="block">{displayValue(property.state || property.city)}</span>
                  <span className="mt-1 block text-sm font-normal text-muted-foreground">
                    {displayValue(property.city)}
                  </span>
                </DefinitionRow>
                <DefinitionRow label="Address / Unit">{displayValue(property.address_line1)}</DefinitionRow>
                <DefinitionRow label="Storeys">Not added yet</DefinitionRow>
                <DefinitionRow label="Year Built">Not added yet</DefinitionRow>
                <DefinitionRow label="Furnished">{property.notes || "Not added yet"}</DefinitionRow>
              </dl>
            </div>

            <div data-tab="tenants" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Associated Tenants</h2>
                <FormDialog
                  title="Add Tenant"
                  triggerIcon={<Plus className="size-4" />}
                  triggerLabel="New Tenant"
                >
                  <form action={createTenantAction} className="grid gap-4 md:grid-cols-2">
                    <input name="propertyId" type="hidden" value={property.id} />
                    <label className="block text-sm font-medium md:col-span-2">
                      Property *
                      <Input className="mt-2" disabled value={property.nickname} />
                    </label>
                    <label className="block text-sm font-medium md:col-span-2">
                      Name (as per agreement) *
                      <Input className="mt-2" name="name" placeholder="Full name" required />
                    </label>
                    <label className="block text-sm font-medium">
                      Phone
                      <Input className="mt-2" name="phone" placeholder="+60121234567" />
                    </label>
                    <label className="block text-sm font-medium">
                      Email
                      <Input className="mt-2" name="email" placeholder="email@example.com" type="email" />
                    </label>
                    <label className="block text-sm font-medium">
                      Status
                      <div className="mt-2">
                        <SegmentedChoice
                          defaultValue="active"
                          name="statusDisplay"
                          options={[
                            { label: "Active", value: "active" },
                            { label: "Vacated", value: "vacated" },
                          ]}
                        />
                      </div>
                    </label>
                    <label className="block text-sm font-medium">
                      Move-in Date
                      <Input className="mt-2" type="date" />
                    </label>
                    <div className="flex justify-end gap-3 border-t border-border pt-5 md:col-span-2">
                      <Button formMethod="dialog" type="submit" variant="secondary">Cancel</Button>
                      <Button type="submit">Add Tenant</Button>
                    </div>
                  </form>
                </FormDialog>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="relative min-w-[260px] flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Search tenants..." />
                </label>
                <div className="flex gap-2">
                  {["All", "Active", "Vacated"].map((label, index) => (
                    <Button key={label} size="sm" type="button" variant={index === 0 ? "default" : "ghost"}>
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                {tenants.map((tenant) => (
                  <div className="flex items-center gap-3.5 rounded-2xl border border-border px-5 py-3.5" key={tenant.id}>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <UsersRound className="size-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold">{tenant.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{property.nickname}</p>
                      <p className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {tenant.phone ? <span className="inline-flex items-center gap-1"><Phone className="size-3" />{tenant.phone}</span> : null}
                        {tenant.email ? <span className="inline-flex items-center gap-1"><Mail className="size-3" />{tenant.email}</span> : null}
                      </p>
                    </div>
                    <Badge variant={statusVariant(tenant.status)}>{tenant.status}</Badge>
                    <Button aria-label={`Edit ${tenant.name}`} size="icon" type="button" variant="ghost"><Pencil className="size-4" /></Button>
                    <Button aria-label={`Archive ${tenant.name}`} size="icon" type="button" variant="ghost"><Trash2 className="size-4" /></Button>
                  </div>
                ))}
                {tenants.length === 0 ? (
                  <EmptyPanel
                    description="Add a tenant and link them to this property."
                    icon={<UsersRound className="size-12" />}
                    title="No tenants yet"
                  />
                ) : null}
              </div>
            </div>

            <div data-tab="agreements" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Lease Agreements</h2>
                <FormDialog
                  title="Add Agreement"
                  triggerIcon={<Plus className="size-4" />}
                  triggerLabel="New Agreement"
                >
                  <form action={createAgreementAction} className="grid gap-4 md:grid-cols-2">
                    <input name="propertyId" type="hidden" value={property.id} />
                    <label className="block text-sm font-medium">
                      Property *
                      <Input className="mt-2" disabled value={property.nickname} />
                    </label>
                    <label className="block text-sm font-medium">
                      Tenant
                      <Select className="mt-2" name="tenantId" required>
                        <option value="">Select</option>
                        {tenants.map((tenant) => (
                          <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                        ))}
                      </Select>
                    </label>
                    <label className="block text-sm font-medium">
                      Agreement Type
                      <Select className="mt-2" defaultValue="one_year" name="type">
                        <option value="six_months">6 Months</option>
                        <option value="one_year">1 Year</option>
                        <option value="two_years">2 Years</option>
                        <option value="three_years">3 Years</option>
                        <option value="custom">Custom</option>
                      </Select>
                    </label>
                    <label className="block text-sm font-medium">
                      Notice Period (months)
                      <Input className="mt-2" defaultValue="2" min="0" type="number" />
                    </label>
                    <label className="block text-sm font-medium">
                      Start Date *
                      <Input className="mt-2" name="startDate" required type="date" />
                    </label>
                    <label className="block text-sm font-medium">
                      End Date (auto)
                      <Input className="mt-2" name="customEndDate" type="date" />
                    </label>
                    <label className="block text-sm font-medium">
                      Monthly Rent (RM)
                      <Input className="mt-2" min="0" name="rentAmount" placeholder="1500" required step="0.01" type="number" />
                    </label>
                    <label className="block text-sm font-medium">
                      Renewal Option
                      <div className="mt-2">
                        <SegmentedChoice
                          defaultValue="no"
                          name="renewalOption"
                          options={[
                            { label: "No", value: "no" },
                            { label: "Yes", value: "yes" },
                          ]}
                        />
                      </div>
                    </label>
                    <input name="rentDueDay" type="hidden" value="1" />
                    <div className="flex justify-end gap-3 border-t border-border pt-5 md:col-span-2">
                      <Button formMethod="dialog" type="submit" variant="secondary">Cancel</Button>
                      <Button type="submit">Add Agreement</Button>
                    </div>
                  </form>
                </FormDialog>
              </div>
              <div className="space-y-4">
                {agreements.map((agreement) => {
                  const left = daysLeft(agreement.end_date);
                  const heldDeposits = deposits
                    .filter((deposit) => deposit.status === "held")
                    .reduce((sum, deposit) => sum + deposit.amount_cents, 0);

                  return (
                    <article className="rounded-2xl border border-border px-5 py-4 shadow-sm" key={agreement.id}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">{property.nickname}</h3>
                          <p className="mt-2 text-sm text-muted-foreground">{tenants[0]?.name ?? "Tenant not linked"}</p>
                          <p className="mt-1 text-xs font-semibold uppercase text-muted-foreground">
                            {agreementTypeLabel(agreement.type)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {left !== null ? <Badge variant="success">{left}D LEFT</Badge> : null}
                          <Button aria-label="Edit agreement" size="icon" type="button" variant="ghost"><Pencil className="size-4" /></Button>
                          <Button aria-label="Archive agreement" size="icon" type="button" variant="ghost"><Trash2 className="size-4" /></Button>
                        </div>
                      </div>
                      <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Period</p>
                          <p className="mt-2 font-semibold">{formatDate(agreement.start_date)} - {formatDate(agreement.end_date)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Rent</p>
                          <p className="mt-2 font-semibold">{formatMyr(agreement.rent_amount_cents)}/mo</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Deposits Held</p>
                          <p className="mt-2 font-semibold">{formatMyr(heldDeposits)}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold uppercase text-muted-foreground">Notice</p>
                          <p className="mt-2 font-semibold">2 months</p>
                        </div>
                      </div>
                      <div className="mt-5 border-t border-border pt-4">
                        <div className="flex justify-between text-xs font-semibold uppercase tracking-wide">
                          <span>Rent Collection</span>
                          <span className="text-muted-foreground">0/12 months - RM 0</span>
                        </div>
                        <div className="mt-3 h-1 rounded-full bg-muted" />
                      </div>
                      <button className="mt-4 inline-flex items-center gap-2 text-sm font-medium" type="button">
                        <Shield className="size-4" />
                        Deposits ({deposits.length})
                        <ChevronRight className="size-4 rotate-90" />
                      </button>
                    </article>
                  );
                })}
                {agreements.length === 0 ? (
                  <EmptyPanel description="Create an agreement to generate the rent schedule." icon={<FileText className="size-12" />} title="No agreements yet" />
                ) : null}
              </div>
            </div>

            <div data-tab="rent" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Rent Ledger</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Button className="text-red-600 hover:text-red-700" type="button" variant="ghost">
                    <CircleAlert className="size-4" /> Clear All
                  </Button>
                  <Button type="button" variant="secondary"><FileText className="size-4" /> Export</Button>
                  <FormDialog
                    title="Add Rent Record"
                    triggerIcon={<Plus className="size-4" />}
                    triggerLabel="Add Record"
                  >
                    <form action={createManualRentRecordAction} className="grid gap-4 md:grid-cols-2">
                      <input name="propertyId" type="hidden" value={property.id} />
                      <label className="block text-sm font-medium">
                        Property *
                        <Input className="mt-2" disabled value={property.nickname} />
                      </label>
                      <label className="block text-sm font-medium">
                        Tenant
                        <Select className="mt-2">
                          <option value="">Select</option>
                          {tenants.map((tenant) => (
                            <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="block text-sm font-medium">
                        Month *
                        <Input className="mt-2" name="month" placeholder="2026-06" required />
                      </label>
                      <label className="block text-sm font-medium">
                        Amount Due (RM)
                        <Input className="mt-2" min="0" name="amountDue" placeholder="1500" required step="0.01" type="number" />
                      </label>
                      <div className="py-6 md:col-span-2">
                        <p className="font-semibold"><span className="mr-2 text-primary">-</span>Deductions</p>
                        <p className="mt-4 text-sm text-muted-foreground">No maintenance records available for deduction</p>
                      </div>
                      <label className="block text-sm font-medium">
                        Status
                        <p className="mt-5 flex items-center gap-2 text-lg font-semibold"><span className="size-2 rounded-full bg-muted-foreground" /> Unpaid</p>
                      </label>
                      <label className="block text-sm font-medium">
                        Payment Date
                        <Input className="mt-2" type="date" />
                      </label>
                      <label className="block text-sm font-medium">
                        Payment Method
                        <Select className="mt-2">
                          <option>Bank Transfer</option>
                          <option>Cash</option>
                          <option>DuitNow</option>
                        </Select>
                      </label>
                      <label className="block text-sm font-medium">
                        Amount Paid (RM)
                        <Input className="mt-2" placeholder="1500" type="number" />
                      </label>
                      <label className="block text-sm font-medium md:col-span-2">
                        Notes
                        <Input className="mt-2" name="notes" placeholder="Optional notes" />
                      </label>
                      <input name="dueDate" type="hidden" value={new Date().toISOString().slice(0, 10)} />
                      <div className="flex justify-end gap-3 border-t border-border pt-5 md:col-span-2">
                        <Button formMethod="dialog" type="submit" variant="secondary">Cancel</Button>
                        <Button type="submit">Add Record</Button>
                      </div>
                    </form>
                  </FormDialog>
                </div>
              </div>
              <div className="flex gap-2">
                {["All", "Paid", "Unpaid", "Partial"].map((label, index) => (
                  <Button key={label} size="sm" type="button" variant={index === 0 ? "default" : "ghost"}>
                    {label}
                  </Button>
                ))}
              </div>
              {rentRecords.length > 0 ? (
                <div className="space-y-8">
                  <div>
                    <p className="border-b border-border pb-2 text-sm font-semibold uppercase tracking-wide text-red-600">
                      <CircleAlert className="mr-2 inline size-4" /> Overdue & Due Now ({rentRecords.filter((record) => record.status !== "paid").length})
                    </p>
                    <div className="mt-3 space-y-3">
                      {rentRecords.slice(0, 1).map((record) => (
                        <div className="flex items-center gap-3.5 rounded-2xl border border-border px-5 py-3.5" key={record.id}>
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                            <CircleAlert className="size-4.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold">{formatMonth(record.month)}</h3>
                            <p className="text-sm text-muted-foreground">{property.nickname}</p>
                            <p className="text-sm font-semibold text-red-600">{record.status === "paid" ? "Paid" : "Due now"}</p>
                          </div>
                          <p className="font-semibold">{formatMyr(record.amount_due_cents)}</p>
                          <form action={updateRentRecordPaymentAction}>
                            <input name="propertyId" type="hidden" value={property.id} />
                            <input name="rentRecordId" type="hidden" value={record.id} />
                            <input name="amountPaid" type="hidden" value={(record.amount_due_cents / 100).toString()} />
                            <input name="paymentMethod" type="hidden" value="manual" />
                            <Button size="sm" type="submit">Mark Paid</Button>
                          </form>
                          <Button aria-label="Comment" size="icon" type="button" variant="ghost"><MessageCircle className="size-4" /></Button>
                          <Button aria-label="Edit rent record" size="icon" type="button" variant="ghost"><Pencil className="size-4" /></Button>
                          <Button aria-label="Archive rent record" size="icon" type="button" variant="ghost"><Trash2 className="size-4" /></Button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="flex w-full items-center justify-between rounded-xl border border-border px-5 py-3 text-sm font-semibold uppercase" type="button">
                    <span><ChevronRight className="mr-2 inline size-4" /><CalendarDays className="mr-2 inline size-4" />Upcoming ({Math.max(rentRecords.length - 1, 0)} months)</span>
                    <span className="text-muted-foreground">{formatMyr(rentRecords.slice(1).reduce((sum, record) => sum + record.amount_due_cents, 0))} scheduled</span>
                  </button>
                </div>
              ) : (
                <EmptyPanel description="Rent records appear after an agreement is created." icon={<WalletCards className="size-12" />} title="No rent records yet" />
              )}
            </div>

            <div data-tab="expenses" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Property Expenses</h2>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="relative w-[280px] max-w-full">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Search expenses..." />
                  </label>
                  <Button type="button" variant="secondary"><FileText className="size-4" /> Export</Button>
                  <FormDialog
                    title="Log New Expense"
                    triggerIcon={<Plus className="size-4" />}
                    triggerLabel="Log Expense"
                  >
                    <form action={createExpenseAction} className="grid gap-4 md:grid-cols-2">
                      <input name="propertyId" type="hidden" value={property.id} />
                      <label className="block text-sm font-medium md:col-span-2">
                        Expense Category
                        <Select className="mt-2" name="categoryId" required>
                          <option value="">Select category</option>
                          {expenseCategories.map((category) => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </Select>
                      </label>
                      <label className="block text-sm font-medium">
                        Property
                        <Input className="mt-2" disabled value={property.nickname} />
                      </label>
                      <label className="block text-sm font-medium">
                        Amount (RM)
                        <Input className="mt-2" min="0" name="amount" placeholder="0.00" required step="0.01" type="number" />
                      </label>
                      <label className="block text-sm font-medium">
                        Expense Sub-type
                        <Input className="mt-2" name="description" placeholder="Assessment Tax" required />
                      </label>
                      <label className="block text-sm font-medium">
                        Date
                        <Input className="mt-2" name="expenseDate" required type="date" />
                      </label>
                      <label className="block text-sm font-medium">
                        Status
                        <div className="mt-2">
                          <SegmentedChoice
                            defaultValue="paid"
                            name="status"
                            options={[
                              { label: "Paid", value: "paid" },
                              { label: "Unpaid / Pending", value: "unpaid" },
                            ]}
                          />
                        </div>
                      </label>
                      <label className="block text-sm font-medium">
                        Tax Deductible (LHDN)
                        <div className="mt-2">
                          <SegmentedChoice
                            defaultValue="on"
                            name="taxDeductible"
                            options={[
                              { label: "Yes", value: "on" },
                              { label: "No", value: "off" },
                            ]}
                          />
                        </div>
                        <span className="mt-2 block text-xs leading-5 text-muted-foreground">
                          Per LHDN: quit rent, assessment tax, daily repairs, fire insurance premiums are deductible.
                        </span>
                      </label>
                      <label className="block text-sm font-medium md:col-span-2">
                        Notes / Description (Optional)
                        <Input className="mt-2" name="notes" placeholder="e.g. Paid via JomPAY" />
                      </label>
                      <div className="flex justify-end gap-3 border-t border-border pt-5 md:col-span-2">
                        <Button formMethod="dialog" type="submit" variant="secondary">Cancel</Button>
                        <Button type="submit">Save Expense</Button>
                      </div>
                    </form>
                  </FormDialog>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["All Expenses", "Taxes", "Utilities", "Insurance", "Mgmt Fees"].map((label, index) => (
                  <Button key={label} size="sm" type="button" variant={index === 0 ? "default" : "secondary"}>
                    {index === 1 ? <Landmark className="size-4" /> : index === 3 ? <Shield className="size-4" /> : null}
                    {label}
                  </Button>
                ))}
              </div>
              <div className="overflow-hidden rounded-[22px] border border-border">
                <div className="grid grid-cols-[1fr_2fr_1.4fr_1.2fr_1fr_1.2fr_1.2fr_80px] bg-muted/50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>Type</span>
                  <span>Description</span>
                  <span>Property</span>
                  <span>Date</span>
                  <span>Status</span>
                  <span>Deductible</span>
                  <span className="text-right">Amount</span>
                  <span />
                </div>
                {expenses.map((expense) => (
                  <div className="grid grid-cols-[1fr_2fr_1.4fr_1.2fr_1fr_1.2fr_1.2fr_80px] items-center border-t border-border px-4 py-3.5 text-[13px]" key={expense.id}>
                    <span className="font-semibold text-red-600"><ReceiptText className="mr-2 inline size-4" />Expense</span>
                    <span className="font-semibold">{expense.description}</span>
                    <span>{property.nickname}</span>
                    <span className="text-muted-foreground">{formatDate(expense.expense_date)}</span>
                    <span><Badge variant={statusVariant(expense.status)}>{expense.status}</Badge></span>
                    <span><Badge variant="success">Yes</Badge></span>
                    <span className="text-right font-semibold">{formatMyr(expense.amount_cents)}</span>
                    <span className="flex justify-end gap-1">
                      <Button aria-label="Edit expense" size="icon" type="button" variant="ghost"><Pencil className="size-4" /></Button>
                      <Button aria-label="Archive expense" size="icon" type="button" variant="ghost"><Trash2 className="size-4" /></Button>
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr_2fr_1.4fr_1.2fr_1fr_1.2fr_1.2fr_80px] border-t border-border px-4 py-3.5 text-[13px] font-semibold">
                  <span className="col-span-6 text-right">Total</span>
                  <span className="text-right">{formatMyr(expenses.reduce((sum, expense) => sum + expense.amount_cents, 0))}</span>
                  <span />
                </div>
                {expenses.length === 0 ? (
                  <div className="border-t border-border py-12 text-center text-sm text-muted-foreground">No expenses found</div>
                ) : null}
              </div>
            </div>

            <div data-tab="maintenance" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Maintenance</h2>
                <FormDialog
                  title="Log Maintenance Issue"
                  triggerIcon={<Plus className="size-4" />}
                  triggerLabel="Log Issue"
                >
                  <form action={createMaintenanceIssueAction} className="grid gap-4 md:grid-cols-2">
                    <input name="propertyId" type="hidden" value={property.id} />
                    <label className="block text-sm font-medium">
                      Property
                      <Input className="mt-2" disabled value={property.nickname} />
                    </label>
                    <label className="block text-sm font-medium">
                      Issue Type
                      <Select className="mt-2" defaultValue="Plumbing" name="issueType">
                        <option>Plumbing</option>
                        <option>Electrical</option>
                        <option>Air-Conditioning</option>
                        <option>Pest Control</option>
                        <option>Painting</option>
                        <option>Waterproofing</option>
                        <option>Appliance Repair</option>
                      </Select>
                    </label>
                    <label className="block text-sm font-medium md:col-span-2">
                      Description
                      <Input className="mt-2" name="description" placeholder="Describe the issue" required />
                    </label>
                    <label className="block text-sm font-medium">
                      Reported Date
                      <Input className="mt-2" name="reportedDate" required type="date" />
                    </label>
                    <label className="block text-sm font-medium">
                      Vendor
                      <Select className="mt-2" name="vendorId">
                        <option value="">Select</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                        ))}
                      </Select>
                    </label>
                    <label className="block text-sm font-medium">
                      Cost (RM)
                      <Input className="mt-2" min="0" name="cost" placeholder="150" step="0.01" type="number" />
                    </label>
                    <label className="block text-sm font-medium">
                      Status
                      <div className="mt-2">
                        <SegmentedChoice
                          defaultValue="open"
                          name="statusDisplay"
                          options={[
                            { label: "Open", value: "open" },
                            { label: "Closed", value: "closed" },
                          ]}
                        />
                      </div>
                    </label>
                    <label className="flex items-center gap-2 text-sm md:col-span-2">
                      <input className="size-4 rounded border-border" type="checkbox" /> Scheduled / Recurring Maintenance
                    </label>
                    <Select className="hidden" name="expenseCategoryId">
                      <option value="">No linked expense</option>
                      {expenseCategories.map((category) => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </Select>
                    <div className="flex justify-end gap-3 border-t border-border pt-5 md:col-span-2">
                      <Button formMethod="dialog" type="submit" variant="secondary">Cancel</Button>
                      <Button type="submit">Add</Button>
                    </div>
                  </form>
                </FormDialog>
              </div>
              <div className="space-y-3">
                {maintenanceIssues.map((issue) => (
                  <div className="flex items-center gap-3.5 rounded-2xl border border-border px-5 py-3.5" key={issue.id}>
                    <Wrench className="size-5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold">{issue.description}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{formatDate(issue.reported_date)}</p>
                    </div>
                    <p className="font-semibold">{issue.cost_cents ? formatMyr(issue.cost_cents) : "No cost"}</p>
                    <Badge variant={statusVariant(issue.status)}>{issue.status}</Badge>
                  </div>
                ))}
                {maintenanceIssues.length === 0 ? (
                  <EmptyPanel description="Track repairs and service items for this property." icon={<Wrench className="size-12" />} title="No maintenance issues yet" />
                ) : null}
              </div>
            </div>

            <div data-tab="deposits" className="grid gap-8 xl:grid-cols-[1fr_340px]">
              <div className="space-y-3">
                {deposits.map((deposit) => (
                  <form action={updateDepositStatusAction} className="rounded-xl border border-border p-4" key={deposit.id}>
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
              <div className="flex items-start justify-end">
                <FormDialog
                  title="Add Deposit"
                  triggerIcon={<Plus className="size-4" />}
                  triggerLabel="Add Deposit"
                >
                  <form action={createDepositAction} className="space-y-4">
                    <input name="propertyId" type="hidden" value={property.id} />
                    <Select name="agreementId" required>
                      <option value="">Select agreement</option>
                      {agreements.map((agreement) => (
                        <option key={agreement.id} value={agreement.id}>{agreement.start_date} to {agreement.end_date}</option>
                      ))}
                    </Select>
                    <Input name="label" placeholder="Security deposit" required />
                    <Input min="0" name="amount" placeholder="Amount" required step="0.01" type="number" />
                    <div className="flex justify-end border-t border-border pt-5">
                      <Button type="submit">Add deposit</Button>
                    </div>
                  </form>
                </FormDialog>
              </div>
            </div>

            <div data-tab="files" className="space-y-3">
              {attachments.map((attachment) => (
                <Card className="rounded-xl shadow-none" key={attachment.id}>
                  <CardContent className="flex items-start justify-between gap-3 p-4">
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
