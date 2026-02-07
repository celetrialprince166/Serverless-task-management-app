import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
    className,
    label,
    error,
    fullWidth = true,
    id,
    ...props
}, ref) => {
    const inputId = id || props.name;

    return (
        <div className= { clsx('flex flex-col gap-1.5', fullWidth && 'w-full', className)}>
            { label && (
                <label htmlFor={ inputId } className = "text-sm font-medium text-gray-700" >
                    { label }
                    </label>
      )}
<input
        ref={ ref }
id = { inputId }
className = {
    clsx(
          'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
        error
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'
    )
}
{...props }
      />
{
    error && (
        <p className="text-sm text-red-500" > { error } </p>
      )
}
</div>
  );
});

Input.displayName = 'Input';
