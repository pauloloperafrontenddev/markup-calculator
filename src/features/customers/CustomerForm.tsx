import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, Mail, MapPin, Phone, Save, Truck } from 'lucide-react'
import { Form } from '@/components/ui/form'
import { AppTextField, AppTextareaField, AppButtonGroupField } from '@/components/form'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { customerSchema, customerSchemaDefaults, type CustomerFormValues, type ShippingMethod } from './schema'

const shippingOptions: { value: ShippingMethod; label: string }[] = [
  { value: 'pickup', label: 'Pickup' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'courier', label: 'Courier' },
]

interface CustomerFormProps {
  defaultValues?: Partial<CustomerFormValues>
  onSubmit: (values: CustomerFormValues) => Promise<void>
  onCancel: () => void
  saving?: boolean
}

export function CustomerForm({
  defaultValues,
  onSubmit,
  onCancel,
  saving = false,
}: CustomerFormProps) {
  // @hookform/resolvers v5 + zod v4: z4.input<T> can resolve optional fields
  // to `unknown` via the $ZodType base interface, making the inferred Resolver
  // generic incompatible with useForm<CustomerFormValues>.
  // Cast to the concrete types — safe because our schema has no transforms
  // (runtime input === output === CustomerFormValues).
  const form = useForm<CustomerFormValues, unknown, CustomerFormValues>({
    resolver: zodResolver(customerSchema) as Resolver<CustomerFormValues, unknown, CustomerFormValues>,
    defaultValues: { ...customerSchemaDefaults, ...defaultValues },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>

        {/* Identity */}
        <section className="space-y-5">
          <h3 className="text-foreground border-b pb-2">Client Details</h3>

          <AppTextField
            control={form.control}
            name="name"
            label="Customer Name"
            placeholder="e.g. Acme Corporation"
            icon={Building2}
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
            <AppTextField
              control={form.control}
              name="phone"
              label="Contact Number"
              placeholder="+63 917 000 0000"
              icon={Phone}
              type="tel"
            />
            <AppTextField
              control={form.control}
              name="email"
              label="Email Address"
              placeholder="hello@company.com"
              icon={Mail}
              type="email"
            />
          </div>

          <AppTextField
            control={form.control}
            name="address"
            label="Address"
            placeholder="123 Rizal Ave, Makati City"
            icon={MapPin}
          />
        </section>

        <Separator />

        {/* Preferences */}
        <section className="space-y-4">
          <h3 className="text-foreground border-b pb-2">Preferences</h3>

          <div className="flex items-start gap-2">
            <Truck className="mt-[1.65rem] size-4 text-muted-foreground shrink-0" />
            <AppButtonGroupField
              control={form.control}
              name="shippingMethod"
              label="Preferred Shipping Method"
              options={shippingOptions}
              size="default"
              className="flex-1"
            />
          </div>
        </section>

        <Separator />

        {/* Notes */}
        <section className="space-y-4">
          <h3 className="text-foreground border-b pb-2">Notes</h3>

          <AppTextareaField
            control={form.control}
            name="notes"
            label="Internal Notes"
            placeholder="Any special instructions, preferences, or reminders…"
            description="Only visible to staff."
            rows={4}
          />
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              'Saving…'
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Save &amp; Continue to Quote
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
