import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    icon?: React.ElementType;
}

export const Button: React.FC<ButtonProps> = ({
    className,
    children,
    isLoading,
    variant = 'primary',
    size = 'md',
    fullWidth,
    disabled,
    icon: Icon,
    ...props
}) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none gap-2';

    const variants = {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 focus:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700 focus:ring-gray-500',
    };

    const sizes = {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 py-2',
        lg: 'h-12 px-6 text-lg',
    };

    const iconSizes = {
        sm: 14,
        md: 16,
        lg: 20,
    };

    return (
        <button
            className= {
            clsx(
                baseStyles,
                variants[variant],
                sizes[size],
                fullWidth && 'w-full',
        className
            )}
disabled = { disabled || isLoading}
{...props }
        >
    { isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
{ !isLoading && Icon && <Icon size={ iconSizes[size] } /> }
{ children }
</button>
    );
};
