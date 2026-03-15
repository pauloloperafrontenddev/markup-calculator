import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'
import {
  ArrowLeft,
  ChevronDown,
  Percent,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ButtonGroup } from '@/components/ui/button-group'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type MarkupType = 'percentage' | 'fixed'
type ExpiryType = 'none' | 'fixed' | 'relative'
type QuotaMode = 'soft' | 'hard'
type DiscountType = 'percentage' | 'fixed_per_item'

interface PriceSet {
  id: string
  name: string
  is_default: boolean | null
}

interface ItemResult {
  id: string
  name: string
  sku: string | null
  base_cost: number
  category: string | null
}

interface LineItem {
  _id: string // local key
  itemId: string
  itemName: string
  sku: string | null
  quantity: number
  unitRetailPrice: number  // centavos
  unitBaseCost: number     // centavos
  discountType: DiscountType | null
  discountValue: number
  descriptionOverride: string
}

interface Incidental {
  _id: string
  name: string
  cost: number // centavos
}

interface QuoteParams {
  priceSetId: string
  vatEnabled: boolean
  vatRateBps: number
  expiryType: ExpiryType
  expiryDate: string
  expiryDays: number
  downPaymentPct: number
  quotaMode: QuotaMode
  quotaMinEnabled: boolean
  quotaMinValue: number
  quotaMaxEnabled: boolean
  quotaMaxValue: number
  agentMarkupEnabled: boolean
  agentMarkupType: MarkupType
  agentMarkupValueBps: number
  commissionEnabled: boolean
  commissionType: MarkupType
  commissionValueBps: number
  commissionReferredBy: string
  notes: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function centavosToDisplay(c: number): string {
  return (c / 100).toFixed(2)
}

function displayToCentavos(s: string): number {
  const n = parseFloat(s.replace(/,/g, ''))
  return isNaN(n) ? 0 : Math.round(n * 100)
}

function bpsToDisplay(bps: number): string {
  return (bps / 100).toFixed(2)
}

function displayToBps(s: string): number {
  const n = parseFloat(s.replace(/,/g, ''))
  return isNaN(n) ? 0 : Math.round(n * 100)
}

function formatPeso(centavos: number) {
  return '₱' + (centavos / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function lineTotal(item: LineItem): number {
  let price = item.unitRetailPrice * item.quantity
  if (item.discountType === 'percentage' && item.discountValue > 0) {
    price = price * (1 - item.discountValue / 10000) // bps
  } else if (item.discountType === 'fixed_per_item' && item.discountValue > 0) {
    price = price - item.discountValue * item.quantity
  }
  return Math.max(0, price)
}

function uid() {
  return Math.random().toString(36).slice(2)
}

// ── Route ─────────────────────────────────────────────────────────────────────

const searchSchema = z.object({
  customerId: z.string().optional().default(''),
  customerName: z.string().optional().default(''),
})

export const Route = createFileRoute('/_authenticated/quotes/new')({
  validateSearch: searchSchema,
  component: NewQuotePage,
})

// ── Shared sub-components ─────────────────────────────────────────────────────

function PanelSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function ParamRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground font-normal">{label}</Label>
      {children}
    </div>
  )
}

function PesoInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">₱</span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-7 h-8 text-sm"
        placeholder={placeholder ?? '0.00'}
      />
    </div>
  )
}

function PctInput({
  value,
  onChange,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pr-8 h-8 text-sm"
        placeholder={placeholder ?? '0.00'}
      />
      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">%</span>
    </div>
  )
}

// ── Parameters Panel ──────────────────────────────────────────────────────────

function QuoteParamsPanel({
  params,
  priceSets,
  onChange,
}: {
  params: QuoteParams
  priceSets: PriceSet[]
  onChange: <K extends keyof QuoteParams>(key: K, value: QuoteParams[K]) => void
}) {
  const markupOptions = [
    { value: 'percentage' as MarkupType, label: '%' },
    { value: 'fixed' as MarkupType, label: '₱' },
  ]
  const expiryOptions = [
    { value: 'none' as ExpiryType, label: 'None' },
    { value: 'fixed' as ExpiryType, label: 'Date' },
    { value: 'relative' as ExpiryType, label: 'Days' },
  ]
  const quotaModeOptions = [
    { value: 'soft' as QuotaMode, label: 'Soft' },
    { value: 'hard' as QuotaMode, label: 'Hard' },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="px-5 py-5 space-y-6">

        {/* Price Set */}
        <PanelSection title="Pricing">
          <ParamRow label="Price Set">
            <select
              value={params.priceSetId}
              onChange={(e) => onChange('priceSetId', e.target.value)}
              className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-colors"
            >
              <option value="">— Select price set —</option>
              {priceSets.map((ps) => (
                <option key={ps.id} value={ps.id}>
                  {ps.name}{ps.is_default ? ' (default)' : ''}
                </option>
              ))}
            </select>
          </ParamRow>

          {/* Down Payment */}
          <ParamRow label="Down Payment">
            <PctInput
              value={bpsToDisplay(params.downPaymentPct)}
              onChange={(v) => onChange('downPaymentPct', displayToBps(v))}
            />
          </ParamRow>
        </PanelSection>

        <Separator />

        {/* VAT */}
        <PanelSection title="Tax">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground font-normal">VAT</Label>
            <button
              type="button"
              onClick={() => onChange('vatEnabled', !params.vatEnabled)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                params.vatEnabled ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform',
                  params.vatEnabled ? 'translate-x-4' : 'translate-x-0',
                )}
              />
            </button>
          </div>
          {params.vatEnabled && (
            <PctInput
              value={bpsToDisplay(params.vatRateBps)}
              onChange={(v) => onChange('vatRateBps', displayToBps(v))}
              placeholder="12.00"
            />
          )}
        </PanelSection>

        <Separator />

        {/* Expiry */}
        <PanelSection title="Validity">
          <ParamRow label="Expiry Type">
            <ButtonGroup
              options={expiryOptions}
              value={params.expiryType}
              onChange={(v) => onChange('expiryType', v)}
              className="w-full"
            />
          </ParamRow>
          {params.expiryType === 'fixed' && (
            <ParamRow label="Expiry Date">
              <Input
                type="date"
                value={params.expiryDate}
                onChange={(e) => onChange('expiryDate', e.target.value)}
                className="h-8 text-sm"
              />
            </ParamRow>
          )}
          {params.expiryType === 'relative' && (
            <ParamRow label="Valid for (days)">
              <Input
                type="number"
                min={1}
                value={params.expiryDays || ''}
                onChange={(e) => onChange('expiryDays', parseInt(e.target.value) || 0)}
                className="h-8 text-sm"
                placeholder="30"
              />
            </ParamRow>
          )}
        </PanelSection>

        <Separator />

        {/* Quota */}
        <PanelSection title="Quota Controls">
          <ParamRow label="Quota Mode">
            <ButtonGroup
              options={quotaModeOptions}
              value={params.quotaMode}
              onChange={(v) => onChange('quotaMode', v)}
            />
          </ParamRow>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quota-min"
                checked={params.quotaMinEnabled}
                onChange={(e) => onChange('quotaMinEnabled', e.target.checked)}
                className="accent-primary"
              />
              <Label htmlFor="quota-min" className="text-xs text-muted-foreground font-normal cursor-pointer">Min Quota</Label>
            </div>
            {params.quotaMinEnabled && (
              <PesoInput
                value={centavosToDisplay(params.quotaMinValue)}
                onChange={(v) => onChange('quotaMinValue', displayToCentavos(v))}
                placeholder="Minimum amount"
              />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="quota-max"
                checked={params.quotaMaxEnabled}
                onChange={(e) => onChange('quotaMaxEnabled', e.target.checked)}
                className="accent-primary"
              />
              <Label htmlFor="quota-max" className="text-xs text-muted-foreground font-normal cursor-pointer">Max Quota</Label>
            </div>
            {params.quotaMaxEnabled && (
              <PesoInput
                value={centavosToDisplay(params.quotaMaxValue)}
                onChange={(v) => onChange('quotaMaxValue', displayToCentavos(v))}
                placeholder="Maximum amount"
              />
            )}
          </div>
        </PanelSection>

        <Separator />

        {/* Quote Markup */}
        <PanelSection title="Quote Markup">
          <ParamRow label="Markup Type &amp; Value">
            <div className="flex gap-2">
              <ButtonGroup
                options={markupOptions}
                value={params.agentMarkupType}
                onChange={(v) => onChange('agentMarkupType', v)}
              />
              {params.agentMarkupType === 'percentage' ? (
                <PctInput
                  value={bpsToDisplay(params.agentMarkupValueBps)}
                  onChange={(v) => onChange('agentMarkupValueBps', displayToBps(v))}
                  className="flex-1"
                />
              ) : (
                <PesoInput
                  value={centavosToDisplay(params.agentMarkupValueBps)}
                  onChange={(v) => onChange('agentMarkupValueBps', displayToCentavos(v))}
                  className="flex-1"
                />
              )}
            </div>
          </ParamRow>
        </PanelSection>

        <Separator />

        {/* Commission */}
        <PanelSection title="Commission">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground font-normal">Enable commission</Label>
            <button
              type="button"
              onClick={() => onChange('commissionEnabled', !params.commissionEnabled)}
              className={cn(
                'relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors',
                params.commissionEnabled ? 'bg-primary' : 'bg-muted',
              )}
            >
              <span className={cn('pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform', params.commissionEnabled ? 'translate-x-4' : 'translate-x-0')} />
            </button>
          </div>
          {params.commissionEnabled && (
            <>
              <div className="flex gap-2">
                <ButtonGroup
                  options={markupOptions}
                  value={params.commissionType}
                  onChange={(v) => onChange('commissionType', v)}
                />
                {params.commissionType === 'percentage' ? (
                  <PctInput
                    value={bpsToDisplay(params.commissionValueBps)}
                    onChange={(v) => onChange('commissionValueBps', displayToBps(v))}
                    className="flex-1"
                  />
                ) : (
                  <PesoInput
                    value={centavosToDisplay(params.commissionValueBps)}
                    onChange={(v) => onChange('commissionValueBps', displayToCentavos(v))}
                    className="flex-1"
                  />
                )}
              </div>
              <ParamRow label="Referred by">
                <Input
                  value={params.commissionReferredBy}
                  onChange={(e) => onChange('commissionReferredBy', e.target.value)}
                  placeholder="Agent or referral name"
                  className="h-8 text-sm"
                />
              </ParamRow>
            </>
          )}
        </PanelSection>

        <Separator />

        {/* Notes */}
        <PanelSection title="Notes">
          <Textarea
            value={params.notes}
            onChange={(e) => onChange('notes', e.target.value)}
            placeholder="Internal notes or instructions…"
            rows={3}
            className="text-sm resize-none"
          />
        </PanelSection>

        {/* Bottom padding */}
        <div className="h-4" />
      </div>
    </ScrollArea>
  )
}

// ── Item Search ───────────────────────────────────────────────────────────────

function ItemSearch({ onAdd }: { onAdd: (item: ItemResult) => void }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<ItemResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (!debouncedQuery) { setResults([]); return }
    setLoading(true)
    supabase
      .from('items')
      .select('id, name, sku, base_cost, category')
      .eq('is_active', true)
      .ilike('name', `%${debouncedQuery}%`)
      .limit(8)
      .then(({ data }) => { setResults(data ?? []); setLoading(false) })
  }, [debouncedQuery])

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function handleSelect(item: ItemResult) {
    onAdd(item)
    setQuery('')
    setOpen(false)
    setResults([])
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => query && setOpen(true)}
          placeholder="Search and add items…"
          className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 transition-colors"
        />
      </div>

      {open && query && (
        <div ref={dropdownRef} className="absolute top-full left-0 right-0 mt-1 rounded-lg border bg-popover shadow-md z-50 overflow-hidden">
          {loading && <div className="px-4 py-2.5 text-sm text-muted-foreground">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-2.5 text-sm text-muted-foreground">No items found for &ldquo;{query}&rdquo;</div>
          )}
          {results.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSelect(item)}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors"
            >
              <div>
                <span className="block text-sm font-medium text-foreground">{item.name}</span>
                {item.sku && <span className="text-xs text-muted-foreground">SKU: {item.sku}</span>}
              </div>
              <span className="text-sm text-muted-foreground shrink-0">
                {formatPeso(item.base_cost)} base
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Line Items Table ──────────────────────────────────────────────────────────

const discountOptions = [
  { value: 'percentage' as DiscountType, label: '%' },
  { value: 'fixed_per_item' as DiscountType, label: '₱' },
]

function LineItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: LineItem
  onChange: (updated: LineItem) => void
  onRemove: () => void
}) {
  function set<K extends keyof LineItem>(key: K, value: LineItem[K]) {
    onChange({ ...item, [key]: value })
  }

  return (
    <tr className="group border-b last:border-0">
      <td className="py-3 pl-4 pr-2 align-top">
        <div>
          <p className="text-sm font-medium text-foreground leading-tight">{item.itemName}</p>
          {item.sku && <p className="text-xs text-muted-foreground">{item.sku}</p>}
          <input
            value={item.descriptionOverride}
            onChange={(e) => set('descriptionOverride', e.target.value)}
            placeholder="Override description…"
            className="mt-1 w-full text-xs text-muted-foreground bg-transparent outline-none placeholder:text-muted-foreground/50 border-b border-transparent focus:border-border transition-colors"
          />
        </div>
      </td>
      <td className="py-3 px-2 align-top w-24">
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => set('quantity', Math.max(1, parseInt(e.target.value) || 1))}
          className="h-8 text-sm text-center"
        />
      </td>
      <td className="py-3 px-2 align-top w-36">
        <PesoInput
          value={centavosToDisplay(item.unitRetailPrice)}
          onChange={(v) => set('unitRetailPrice', displayToCentavos(v))}
        />
      </td>
      <td className="py-3 px-2 align-top w-40">
        <div className="flex gap-1.5">
          {item.discountType && (
            <>
              <ButtonGroup
                options={discountOptions}
                value={item.discountType}
                onChange={(v) => set('discountType', v)}
              />
              {item.discountType === 'percentage' ? (
                <PctInput
                  value={bpsToDisplay(item.discountValue)}
                  onChange={(v) => set('discountValue', displayToBps(v))}
                  className="w-20"
                />
              ) : (
                <PesoInput
                  value={centavosToDisplay(item.discountValue)}
                  onChange={(v) => set('discountValue', displayToCentavos(v))}
                  className="w-24"
                />
              )}
            </>
          )}
          {!item.discountType && (
            <button
              onClick={() => set('discountType', 'percentage')}
              className="h-8 px-2.5 rounded-md border border-dashed border-input text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              + Discount
            </button>
          )}
        </div>
      </td>
      <td className="py-3 pl-2 pr-4 align-top text-right w-28">
        <span className="text-sm font-medium tabular-nums">
          {formatPeso(lineTotal(item))}
        </span>
      </td>
      <td className="py-3 pl-1 pr-4 align-top w-8">
        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-1 rounded text-muted-foreground hover:text-destructive transition-all"
        >
          <Trash2 className="size-3.5" />
        </button>
      </td>
    </tr>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

function NewQuotePage() {
  const { customerId, customerName } = Route.useSearch()
  const navigate = useNavigate()

  const [priceSets, setPriceSets] = useState<PriceSet[]>([])
  const [lineItems, setLineItems] = useState<LineItem[]>([])
  const [incidentals, setIncidentals] = useState<Incidental[]>([])
  const [saving, setSaving] = useState(false)

  const [params, setParams] = useState<QuoteParams>({
    priceSetId: '',
    vatEnabled: false,
    vatRateBps: 1200,
    expiryType: 'none',
    expiryDate: '',
    expiryDays: 30,
    downPaymentPct: 5000, // 50% default in bps
    quotaMode: 'soft',
    quotaMinEnabled: false,
    quotaMinValue: 0,
    quotaMaxEnabled: false,
    quotaMaxValue: 0,
    agentMarkupEnabled: false,
    agentMarkupType: 'percentage',
    agentMarkupValueBps: 0,
    commissionEnabled: false,
    commissionType: 'percentage',
    commissionValueBps: 0,
    commissionReferredBy: '',
    notes: '',
  })

  // Load price sets + default
  useEffect(() => {
    supabase
      .from('price_sets')
      .select('id, name, is_default')
      .order('name')
      .then(({ data }) => {
        const ps = data ?? []
        setPriceSets(ps)
        const def = ps.find((p) => p.is_default)
        if (def) setParams((prev) => ({ ...prev, priceSetId: def.id }))
      })

    supabase
      .from('global_settings')
      .select('vat_enabled, vat_rate_bps, default_down_payment_pct')
      .single()
      .then(({ data }) => {
        if (data) {
          setParams((prev) => ({
            ...prev,
            vatEnabled: data.vat_enabled,
            vatRateBps: data.vat_rate_bps,
            downPaymentPct: data.default_down_payment_pct,
          }))
        }
      })
  }, [])

  function updateParam<K extends keyof QuoteParams>(key: K, value: QuoteParams[K]) {
    setParams((prev) => ({ ...prev, [key]: value }))
  }

  function addItem(item: ItemResult) {
    setLineItems((prev) => [
      ...prev,
      {
        _id: uid(),
        itemId: item.id,
        itemName: item.name,
        sku: item.sku,
        quantity: 1,
        unitRetailPrice: item.base_cost,
        unitBaseCost: item.base_cost,
        discountType: null,
        discountValue: 0,
        descriptionOverride: '',
      },
    ])
  }

  function updateLineItem(id: string, updated: LineItem) {
    setLineItems((prev) => prev.map((li) => (li._id === id ? updated : li)))
  }

  function removeLineItem(id: string) {
    setLineItems((prev) => prev.filter((li) => li._id !== id))
  }

  function addIncidental() {
    setIncidentals((prev) => [...prev, { _id: uid(), name: '', cost: 0 }])
  }

  function updateIncidental(id: string, updated: Incidental) {
    setIncidentals((prev) => prev.map((i) => (i._id === id ? updated : i)))
  }

  function removeIncidental(id: string) {
    setIncidentals((prev) => prev.filter((i) => i._id !== id))
  }

  // Totals
  const subtotal = lineItems.reduce((acc, li) => acc + lineTotal(li), 0)
  const incidentalTotal = incidentals.reduce((acc, i) => acc + i.cost, 0)
  const vatAmount = params.vatEnabled ? Math.round((subtotal + incidentalTotal) * (params.vatRateBps / 10000)) : 0
  const grandTotal = subtotal + incidentalTotal + vatAmount

  async function handleSave() {
    if (!params.priceSetId) {
      alert('Please select a price set before saving.')
      return
    }
    setSaving(true)
    try {
      const { data: quote, error } = await supabase
        .from('quotes')
        .insert({
          customer_id: customerId || null,
          customer_name_override: !customerId ? customerName || null : null,
          price_set_id: params.priceSetId,
          vat_enabled: params.vatEnabled,
          vat_rate_bps: params.vatEnabled ? params.vatRateBps : null,
          expiry_type: params.expiryType,
          expiry_date: params.expiryType === 'fixed' ? params.expiryDate || null : null,
          expiry_days: params.expiryType === 'relative' ? params.expiryDays || null : null,
          down_payment_pct: params.downPaymentPct,
          quota_mode: params.quotaMode,
          quota_min_type: params.quotaMinEnabled ? 'fixed' : null,
          quota_min_value: params.quotaMinEnabled ? params.quotaMinValue : null,
          quota_max_type: params.quotaMaxEnabled ? 'fixed' : null,
          quota_max_value: params.quotaMaxEnabled ? params.quotaMaxValue : null,
          agent_markup_type: params.agentMarkupValueBps > 0 ? params.agentMarkupType : null,
          agent_markup_value: params.agentMarkupValueBps > 0 ? params.agentMarkupValueBps : null,
          commission_type: params.commissionEnabled ? params.commissionType : null,
          commission_value: params.commissionEnabled ? params.commissionValueBps : null,
          commission_referred_by: params.commissionEnabled ? params.commissionReferredBy || null : null,
          notes: params.notes || null,
          status: 'draft',
        })
        .select('id, quote_number')
        .single()

      if (error) throw error

      // Insert line items
      if (lineItems.length > 0) {
        const { error: liErr } = await supabase.from('quote_line_items').insert(
          lineItems.map((li, idx) => ({
            quote_id: quote.id,
            item_id: li.itemId,
            quantity: li.quantity,
            unit_retail_price: li.unitRetailPrice,
            unit_base_cost: li.unitBaseCost,
            discount_type: li.discountType,
            discount_value: li.discountType ? li.discountValue : null,
            description_override: li.descriptionOverride || null,
            sort_order: idx,
          })),
        )
        if (liErr) throw liErr
      }

      // Insert incidentals
      if (incidentals.length > 0) {
        const { error: incErr } = await supabase.from('quote_incidentals').insert(
          incidentals
            .filter((i) => i.name.trim())
            .map((i, idx) => ({
              quote_id: quote.id,
              name: i.name,
              cost: i.cost,
              sort_order: idx,
            })),
        )
        if (incErr) throw incErr
      }

      alert(`Quote ${quote.quote_number} saved successfully!`)
      navigate({ to: '/quotes' })
    } catch (err: any) {
      console.error(err)
      alert(err?.message ?? 'Failed to save quote.')
    } finally {
      setSaving(false)
    }
  }

  const displayName = customerName || 'Unknown Client'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 border-b bg-background px-6 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/quotes' })}>
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <User className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-foreground leading-tight truncate">{displayName}</h2>
            <p className="text-xs text-muted-foreground">New Quote · Draft</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => navigate({ to: '/quotes' })} disabled={saving}>
            Discard
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save Quote'}
          </Button>
        </div>
      </div>

      {/* Body: main + side panel */}
      <div className="flex flex-1 overflow-hidden">

        {/* Main content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* Line Items */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground">Line Items</h3>
            </div>

            {/* Item search */}
            <div className="mb-4 max-w-md">
              <ItemSearch onAdd={addItem} />
            </div>

            {lineItems.length > 0 ? (
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="py-2.5 pl-4 pr-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Item</th>
                      <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-24">Qty</th>
                      <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-36">Unit Price</th>
                      <th className="py-2.5 px-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide w-40">Discount</th>
                      <th className="py-2.5 pl-2 pr-4 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide w-28">Total</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li) => (
                      <LineItemRow
                        key={li._id}
                        item={li}
                        onChange={(updated) => updateLineItem(li._id, updated)}
                        onRemove={() => removeLineItem(li._id)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                <Search className="size-8 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Search above to add items to this quote.</p>
              </div>
            )}
          </section>

          {/* Incidentals */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-foreground">Incidentals</h3>
              <Button variant="outline" size="sm" onClick={addIncidental}>
                <Plus className="size-3.5 mr-1.5" />
                Add
              </Button>
            </div>
            {incidentals.length > 0 && (
              <div className="space-y-2">
                {incidentals.map((inc) => (
                  <div key={inc._id} className="flex items-center gap-3">
                    <Input
                      value={inc.name}
                      onChange={(e) => updateIncidental(inc._id, { ...inc, name: e.target.value })}
                      placeholder="Description (e.g. Shipping fee)"
                      className="flex-1 h-8 text-sm"
                    />
                    <PesoInput
                      value={centavosToDisplay(inc.cost)}
                      onChange={(v) => updateIncidental(inc._id, { ...inc, cost: displayToCentavos(v) })}
                      className="w-32"
                    />
                    <button
                      onClick={() => removeIncidental(inc._id)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Totals Summary */}
          <section className="pb-8">
            <div className="ml-auto max-w-xs space-y-2 rounded-xl border bg-muted/30 px-5 py-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatPeso(subtotal)}</span>
              </div>
              {incidentalTotal > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Incidentals</span>
                  <span className="tabular-nums">{formatPeso(incidentalTotal)}</span>
                </div>
              )}
              {params.vatEnabled && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT ({bpsToDisplay(params.vatRateBps)}%)</span>
                  <span className="tabular-nums">{formatPeso(vatAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span className="tabular-nums text-primary">{formatPeso(grandTotal)}</span>
              </div>
              {params.downPaymentPct > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Down Payment ({bpsToDisplay(params.downPaymentPct)}%)</span>
                  <span className="tabular-nums">{formatPeso(Math.round(grandTotal * (params.downPaymentPct / 10000)))}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Right panel */}
        <div className="w-72 shrink-0 border-l bg-sidebar flex flex-col overflow-hidden">
          <div className="shrink-0 px-5 py-3.5 border-b">
            <p className="text-sm font-semibold text-foreground">Quote Parameters</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <QuoteParamsPanel params={params} priceSets={priceSets} onChange={updateParam} />
          </div>
        </div>
      </div>
    </div>
  )
}
