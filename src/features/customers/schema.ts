import { z } from 'zod'

export type ShippingMethod = 'pickup' | 'delivery' | 'courier'

// z.preprocess changes the input type to `unknown`, which breaks zodResolver's
// generic inference. Use plain optional strings + a refine for email instead.
// Empty strings are valid — the mutation hook normalises them to null before saving.
const optionalEmail = z
  .string()
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'Enter a valid email address',
  })
  .optional()

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  email: optionalEmail,
  address: z.string().optional(),
  shippingMethod: z.enum(['pickup', 'delivery', 'courier']),
  notes: z.string().optional(),
})

export type CustomerFormValues = z.infer<typeof customerSchema>

export const customerSchemaDefaults: CustomerFormValues = {
  name: '',
  phone: '',
  email: '',
  address: '',
  shippingMethod: 'pickup',
  notes: '',
}
