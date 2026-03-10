import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/maintenance/volume-tiers')({
  component: VolumeTiersPage,
})

function VolumeTiersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Volume Tiers</h1>
      <p className="text-muted-foreground mt-1">Global volume tier management goes here.</p>
    </div>
  )
}
