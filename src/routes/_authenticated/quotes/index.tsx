import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { FileText, Plus, Search, UserPlus, ChevronRight, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/quotes/')({
  component: QuotesPage,
})

interface CustomerResult {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

interface RecentQuote {
  id: string
  quote_number: string
  status: string
  created_at: string | null
  customer_name_override: string | null
  customers: { name: string } | null
}

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  accepted: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
  cancelled: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
}

function QuotesPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [results, setResults] = useState<CustomerResult[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [recentQuotes, setRecentQuotes] = useState<RecentQuote[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 280)
    return () => clearTimeout(t)
  }, [query])

  // Search customers
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      return
    }
    setLoadingSearch(true)
    supabase
      .from('customers')
      .select('id, name, phone, email, address')
      .ilike('name', `%${debouncedQuery}%`)
      .order('name')
      .limit(8)
      .then(({ data }) => {
        setResults(data ?? [])
        setLoadingSearch(false)
      })
  }, [debouncedQuery])

  // Load recent quotes
  useEffect(() => {
    supabase
      .from('quotes')
      .select('id, quote_number, status, created_at, customer_name_override, customers(name)')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => setRecentQuotes((data as RecentQuote[]) ?? []))
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  function handleSelectCustomer(customer: CustomerResult) {
    setShowDropdown(false)
    setQuery('')
    navigate({ to: '/quotes/new', search: { customerId: customer.id, customerName: customer.name } })
  }

  function handleCreateNew() {
    setShowDropdown(false)
    navigate({ to: '/customers/new', search: { name: query.trim() } })
  }

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase())

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background px-8 py-6">
        <h1 className="text-foreground">Quotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for a client to start a new quote, or view recent quotes below.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
        {/* Search section */}
        <section>
          <h3 className="mb-4 text-foreground">New Quote</h3>

          <div className="relative max-w-lg">
            {/* Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setShowDropdown(true)
                }}
                onFocus={() => query && setShowDropdown(true)}
                placeholder="Search client by name…"
                className="w-full h-11 rounded-lg border border-input bg-background pl-10 pr-4 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/30 transition-colors"
              />
            </div>

            {/* Dropdown */}
            {showDropdown && query.trim() && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1.5 rounded-lg border bg-popover shadow-md z-50 overflow-hidden"
              >
                {loadingSearch && (
                  <div className="px-4 py-3 text-sm text-muted-foreground">Searching…</div>
                )}

                {!loadingSearch && results.length > 0 && (
                  <ul>
                    {results.map((customer) => (
                      <li key={customer.id}>
                        <button
                          onClick={() => handleSelectCustomer(customer)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors group"
                        >
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-foreground truncate">{customer.name}</span>
                            {(customer.phone || customer.email) && (
                              <span className="block text-xs text-muted-foreground truncate">
                                {customer.phone ?? customer.email}
                              </span>
                            )}
                          </span>
                          <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {!loadingSearch && !exactMatch && (
                  <>
                    {results.length > 0 && <div className="border-t" />}
                    <button
                      onClick={handleCreateNew}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent transition-colors group"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <UserPlus className="size-4 text-primary" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-foreground">
                          Add &ldquo;{query.trim()}&rdquo; as new client
                        </span>
                        <span className="block text-xs text-muted-foreground">Create client profile first</span>
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  </>
                )}

                {!loadingSearch && results.length === 0 && exactMatch === false && query.trim() && (
                  <div />
                )}
              </div>
            )}
          </div>
        </section>

        {/* Recent quotes */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="size-4 text-muted-foreground" />
            <h3 className="text-foreground">Recent Quotes</h3>
          </div>

          {recentQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
              <FileText className="size-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">No quotes yet</p>
              <p className="text-xs text-muted-foreground mt-1">Search for a client above to create your first quote.</p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Quote #</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Client</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Date</th>
                    <th className="py-3 px-4 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentQuotes.map((q) => (
                    <tr
                      key={q.id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => navigate({ to: '/quotes/new', search: { customerId: '', customerName: '', quoteId: q.id } as any })}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-medium text-foreground">
                        {q.quote_number}
                      </td>
                      <td className="py-3.5 px-4 text-foreground">
                        {q.customer_name_override ?? q.customers?.name ?? '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize', statusStyles[q.status] ?? statusStyles.draft)}>
                          {q.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground text-xs">
                        {q.created_at
                          ? new Date(q.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <ChevronRight className="size-4 text-muted-foreground inline opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
