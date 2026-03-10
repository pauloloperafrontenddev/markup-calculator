import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/maintenance/item-sets')({
  component: ItemSetsPage,
})

function ItemSetsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Item Sets</h1>
      <p className="text-muted-foreground mt-1">Bundle management goes here.</p>
    </div>
  )
}
