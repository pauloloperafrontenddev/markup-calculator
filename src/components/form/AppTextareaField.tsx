import { type FieldPath, type FieldValues, type Control } from 'react-hook-form'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface AppTextareaFieldProps<T extends FieldValues> {
  control: Control<T, any, any>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  rows?: number
  disabled?: boolean
  className?: string
}

export function AppTextareaField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  rows = 4,
  disabled,
  className,
}: AppTextareaFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Textarea
              placeholder={placeholder}
              rows={rows}
              disabled={disabled}
              className={cn(
                'resize-none',
                fieldState.error && 'border-destructive focus-visible:ring-destructive',
              )}
              {...field}
              value={field.value ?? ''}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
