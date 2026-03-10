import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/quotes/new')({
  component: NewQuotePage,
})

function NewQuotePage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">New Quote</h1>
      <p className="text-muted-foreground mt-1">Quote builder goes here.</p>
    </div>
  )
}
