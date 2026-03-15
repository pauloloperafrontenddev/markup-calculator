import { cn } from '@/lib/utils'

interface ButtonGroupOption<T extends string> {
  value: T
  label: string
  icon?: React.ReactNode
}

interface ButtonGroupProps<T extends string> {
  options: ButtonGroupOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
  size?: 'sm' | 'default'
}

export function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'sm',
}: ButtonGroupProps<T>) {
  const h = size === 'sm' ? 'h-8 px-3 text-sm' : 'h-9 px-4 text-sm'

  return (
    <div className={cn('flex rounded-md overflow-hidden border border-input', className)}>
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'inline-flex items-center gap-1.5 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
            h,
            i > 0 && 'border-l border-input',
            value === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          )}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
