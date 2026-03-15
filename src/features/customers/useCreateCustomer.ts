import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CustomerFormValues } from './schema'

interface CreatedCustomer {
  id: string
  name: string
}

interface UseCreateCustomerResult {
  create: (values: CustomerFormValues) => Promise<CreatedCustomer>
  saving: boolean
  error: string | null
}

/**
 * Mutation hook for inserting a new customer row.
 * Preferred shipping method is prepended to notes since it
 * doesn't have a dedicated column yet.
 * TODO: add preferred_shipping_method column to customers table.
 */
export function useCreateCustomer(): UseCreateCustomerResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create(values: CustomerFormValues): Promise<CreatedCustomer> {
    setSaving(true)
    setError(null)

    try {
      const shipping = `Preferred Shipping: ${values.shippingMethod.charAt(0).toUpperCase() + values.shippingMethod.slice(1)}`
      const notesValue = [shipping, values.notes?.trim()]
        .filter(Boolean)
        .join('\n\n') || null

      const { data, error: dbError } = await supabase
        .from('customers')
        .insert({
          name: values.name.trim(),
          phone: values.phone?.trim() || null,
          email: values.email?.trim() || null,
          address: values.address?.trim() || null,
          notes: notesValue,
        })
        .select('id, name')
        .single()

      if (dbError) throw dbError
      return data
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to save customer.'
      setError(msg)
      throw new Error(msg)
    } finally {
      setSaving(false)
    }
  }

  return { create, saving, error }
}
