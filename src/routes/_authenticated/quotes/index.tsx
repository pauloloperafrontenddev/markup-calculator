import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/quotes/')({
  component: QuotesPage,
})

function QuotesPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">bombasitc breh</h1>
      <p className="text-muted-foreground mt-1">Your quote history will appear here.</p>
    </div>
  )
}
