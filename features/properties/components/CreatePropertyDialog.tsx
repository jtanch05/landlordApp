import type { ReactNode } from "react";

import { FormDialog } from "@/components/ui/form-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createPropertyAction } from "@/features/properties/actions";

type CreatePropertyDialogProps = {
  triggerAriaLabel?: string;
  triggerClassName?: string;
  triggerIcon?: ReactNode;
  triggerLabel: ReactNode;
  triggerSize?: "default" | "sm" | "lg" | "icon";
};

export function CreatePropertyDialog({
  triggerAriaLabel,
  triggerClassName,
  triggerIcon,
  triggerLabel,
  triggerSize,
}: CreatePropertyDialogProps) {
  return (
    <FormDialog
      title="Add Property"
      triggerAriaLabel={triggerAriaLabel}
      triggerClassName={triggerClassName}
      triggerIcon={triggerIcon}
      triggerLabel={triggerLabel}
      triggerSize={triggerSize}
    >
      <form action={createPropertyAction} className="space-y-6">
        <section className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Basic Information</h3>
          </div>

          <label className="block text-sm font-medium">
            Property Nickname *
            <Input
              className="mt-2"
              name="nickname"
              placeholder={'e.g. "Taman Melati Condo A-12-3"'}
              required
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              Property Type *
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
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Location</h3>
          <label className="block text-sm font-medium">
            Street Address
            <Input className="mt-2" name="addressLine1" placeholder="Street address" />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium">
              City
              <Input className="mt-2" name="city" placeholder="Kuala Lumpur" />
            </label>
            <label className="block text-sm font-medium">
              Postcode
              <Input className="mt-2" name="postcode" placeholder="57000" />
            </label>
          </div>
          <label className="block text-sm font-medium">
            State
            <Input className="mt-2" name="state" placeholder="Selangor" />
          </label>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Notes</h3>
          <Textarea name="notes" placeholder="Optional setup notes" />
        </section>

        <div className="flex justify-end border-t border-border pt-5">
          <Button type="submit">Create property</Button>
        </div>
      </form>
    </FormDialog>
  );
}
