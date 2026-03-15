import { type FieldPath, type FieldValues, type Control } from 'react-hook-form'
import { type LucideIcon } from 'lucide-react'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AppTextFieldProps<T extends FieldValues> {
  // Control<T, any, any>: the third generic (TTransformedValues) is widened to
  // avoid incompatibility with the free Context variable inside the resolver type
  // when using @hookform/resolvers v5 + zod v4.
  control: Control<T, any, any>
  name: FieldPath<T>
  label: string
  placeholder?: string
  description?: string
  icon?: LucideIcon
  type?: React.InputHTMLAttributes<HTMLInputElement>['type']
  disabled?: boolean
  autoFocus?: boolean
  className?: string
}

export function AppTextField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  description,
  icon: Icon,
  type = 'text',
  disabled,
  autoFocus,
  className,
}: AppTextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <div className="relative">
              {Icon && (
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              )}
              <Input
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                autoFocus={autoFocus}
                className={cn(
                  Icon && 'pl-9',
                  fieldState.error && 'border-destructive focus-visible:ring-destructive',
                )}
                {...field}
                value={field.value ?? ''}
              />
            </div>
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
