import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

// ── Route — public, no auth ───────────────────────────────────────────────────

export const Route = createFileRoute('/quote/view/$quoteId')({
  component: QuoteViewerPage,
})

// ── QR Payload type (mirrors src/lib/qr.ts when implemented) ─────────────────

type QRPayload = {
  v: 1
  id: string
  cn: string
  st: string
  ex: string | null
  lines: Array<{ d: string; q: number; u: number }>
  sub: number
  rush: number | null
  vat: number | null
  tot: number
  dp: number | null
  payments: number | null
  note: string | null
  biz: string
  gen: string
}

// ── Decoder (reads from URL hash, no network call) ────────────────────────────

function decodePayload(hash: string): QRPayload | null {
  try {
    const b64 = decodeURIComponent(hash)
    const json = atob(b64)
    return JSON.parse(json) as QRPayload
  } catch {
    return null
  }
}

function formatCentavos(c: number) {
  return new Intl.NumberFormat('fil-PH', { style: 'currency', currency: 'PHP' }).format(c / 100)
}

// ── Component ─────────────────────────────────────────────────────────────────

function QuoteViewerPage() {
  const [payload, setPayload] = useState<QRPayload | null>(null)
  const [invalid, setInvalid] = useState(false)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (!hash) {
      setInvalid(true)
      return
    }
    const decoded = decodePayload(hash)
    if (!decoded) {
      setInvalid(true)
      return
    }
    setPayload(decoded)
  }, [])

  if (invalid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Invalid or missing quote data.</p>
      </div>
    )
  }

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading quote…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{payload.biz}</p>
          <h1 className="text-2xl font-bold">{payload.id}</h1>
          <p className="text-muted-foreground">For: {payload.cn}</p>
          {payload.ex && (
            <p className="text-sm text-muted-foreground">
              Expires: {new Date(payload.ex).toLocaleDateString('en-PH')}
            </p>
          )}
        </div>

        {/* Line items */}
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Item</th>
                <th className="text-right px-4 py-2 font-medium">Qty</th>
                <th className="text-right px-4 py-2 font-medium">Unit</th>
                <th className="text-right px-4 py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payload.lines.map((line, i) => (
                <tr key={i}>
                  <td className="px-4 py-2">{line.d}</td>
                  <td className="px-4 py-2 text-right">{line.q}</td>
                  <td className="px-4 py-2 text-right">{formatCentavos(line.u)}</td>
                  <td className="px-4 py-2 text-right">{formatCentavos(line.u * line.q)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCentavos(payload.sub)}</span>
          </div>
          {payload.rush != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rush Order Surcharge</span>
              <span>{formatCentavos(payload.rush)}</span>
            </div>
          )}
          {payload.vat != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">VAT (12%)</span>
              <span>{formatCentavos(payload.vat)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-base pt-1 border-t">
            <span>Total</span>
            <span>{formatCentavos(payload.tot)}</span>
          </div>
          {payload.dp != null && (
            <div className="flex justify-between text-muted-foreground pt-1">
              <span>Down Payment Due (50%)</span>
              <span>{formatCentavos(payload.dp)}</span>
            </div>
          )}
          {payload.payments != null && payload.payments > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Payments Received</span>
              <span>({formatCentavos(payload.payments)})</span>
            </div>
          )}
        </div>

        {payload.note && (
          <div className="rounded-lg border p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Notes</p>
            <p className="whitespace-pre-line">{payload.note}</p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Generated {new Date(payload.gen).toLocaleString('en-PH')}. This is a point-in-time snapshot — contact us for the latest status.
        </p>
      </div>
    </div>
  )
}
