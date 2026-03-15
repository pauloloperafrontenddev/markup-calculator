import { type FieldPath, type FieldValues, type Control } from 'react-hook-form'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ButtonGroup } from '@/components/ui/button-group'

interface Option<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface AppButtonGroupFieldProps<TForm extends FieldValues, TOption extends string> {
  control: Control<TForm, any, any>
  name: FieldPath<TForm>
  label: string
  options: Option<TOption>[]
  description?: string
  size?: 'sm' | 'default'
  className?: string
}

export function AppButtonGroupField<TForm extends FieldValues, TOption extends string>({
  control,
  name,
  label,
  options,
  description,
  size,
  className,
}: AppButtonGroupFieldProps<TForm, TOption>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <ButtonGroup<TOption>
              options={options}
              value={field.value}
              onChange={field.onChange}
              size={size}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
