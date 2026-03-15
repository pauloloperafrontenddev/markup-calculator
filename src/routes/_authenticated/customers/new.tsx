import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerForm, useCreateCustomer } from '@/features/customers'

const searchSchema = z.object({
  name: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/customers/new')({
  validateSearch: searchSchema,
  component: NewCustomerPage,
})

function NewCustomerPage() {
  const { name: prefillName } = Route.useSearch()
  const navigate = useNavigate()
  const { create, saving } = useCreateCustomer()

  async function handleSubmit(values: Parameters<typeof create>[0]) {
    const customer = await create(values)
    await navigate({
      to: '/quotes/new',
      search: { customerId: customer.id, customerName: customer.name },
    })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background px-8 py-5 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: '/quotes' })}
          className="shrink-0"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h2 className="text-foreground leading-tight">New Client</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Fill in the client details to proceed to the quote.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-xl">
          <CustomerForm
            defaultValues={{ name: prefillName }}
            onSubmit={handleSubmit}
            onCancel={() => navigate({ to: '/quotes' })}
            saving={saving}
          />
        </div>
      </div>
    </div>
  )
}
