import { forwardRef } from 'react';
import { cn } from '../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-[rgb(var(--color-text-secondary))]"
          >
            {label}
          </label>
        )}
        <input
          type={type}
          id={id}
          className={cn(
            'flex h-10 w-full rounded-md border border-[rgb(var(--color-border-default))]',
            'bg-[rgb(var(--color-surface-primary))] px-3 py-2 text-sm',
            'text-[rgb(var(--color-text-primary))]',
            'placeholder:text-[rgb(var(--color-text-tertiary))]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--color-brand-500))]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'transition-shadow duration-200',
            error && 'border-red-500 focus-visible:ring-red-500',
            className,
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="mt-1 text-xs text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export { Input };
