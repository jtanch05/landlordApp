# PropTrack Context

PropTrack is a property management context for Malaysian landlords who track rental properties, tenancy records, cash flow, maintenance, documents, and shared co-owner access.

## Language

**Portfolio**:
A collection of properties and related records managed by a Host. A user may have multiple portfolios, but each property belongs to one portfolio.
_Avoid_: Account, organization, workspace

**Host**:
The user who owns and administers a portfolio. The Host controls portfolio settings, property records, invitations, access, and co-owner share configuration.
_Avoid_: Admin, owner, landlord account

**Co-owner**:
An invited user who has access to one or more shared properties. A Co-owner may be view-only or editable, but does not control invitations, ownership, or split percentages.
_Avoid_: Member, collaborator, guest

**Property**:
A rental property being managed inside a portfolio. Property-specific records include tenants, agreements, rent records, expenses, maintenance, deposits, files, and activity.
_Avoid_: Unit, asset, listing

**Property Workspace**:
The property-level area where users manage one property's operational and financial records. It is the primary place for rent, expenses, maintenance, tenants, agreements, deposits, and files.
_Avoid_: Property detail page, module hub

**Tenant**:
A person recorded as occupying or having occupied a property. Tenants are records in v1, not app users.
_Avoid_: Renter, occupant, customer

**Agreement**:
The tenancy arrangement between a tenant and a property for a date range and rent amount. Agreements are the source for generated rent schedules.
_Avoid_: Lease, contract, tenancy

**Rent Record**:
A monthly rent obligation for a property, tenant, and agreement. A rent record tracks amount due, amount paid, status, due date, payment method, and notes.
_Avoid_: Invoice, payment, rent item

**Expense**:
A financial cost associated with a property or portfolio. Expenses belong to an expense category and may be paid or unpaid.
_Avoid_: Cost, bill, charge

**Expense Category**:
A portfolio-level classification used to group expenses for reporting and cash-flow analysis. Categories can be archived while historical expenses remain linked.
_Avoid_: Expense type, accounting code

**Maintenance Issue**:
An operational repair or service item for a property. A maintenance issue may create or update a linked expense when it has a cost.
_Avoid_: Repair, job, ticket

**Vendor**:
A portfolio-level contact who provides property-related services. Vendors can be linked to maintenance issues and may serve multiple properties.
_Avoid_: Contractor, supplier, service provider

**Deposit**:
Money held under an agreement, such as a rental or security deposit. In v1, deposits track simple held or refunded status.
_Avoid_: Bond, security payment

**Reminder**:
A generated item that brings attention to upcoming or overdue property management work. Reminders come from source records and can be dismissed.
_Avoid_: Alert, notification, task

**Activity**:
A human-readable history entry showing who changed what and when. Activity is derived from audit events and supports accountability for shared access.
_Avoid_: Audit log, event, history

**Attachment**:
A file linked to a supported record, such as an agreement document, receipt, maintenance photo, or deposit proof. Attachments may be marked private by the Host.
_Avoid_: File, document, upload

**Report**:
A generated PDF view of property or portfolio records. V1 reports include rent ledger, expenses, and basic property statement.
_Avoid_: Export, statement, document

**Co-owner Share**:
The calculated share of positive net cash flow for a property based on configured split percentages. It is shown in reports but does not create payout records in v1.
_Avoid_: Payout, distribution, profit share
