import React from 'react';
import { cn } from '../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {

    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] shadow-sm';

    const variants = {
      primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-primary/20 hover:shadow-primary/30',
      secondary: 'bg-white text-text-primary border border-gray-200 hover:bg-gray-50 focus:ring-primary hover:border-gray-300',
      danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-red-500/20',
      ghost: 'bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-primary focus:ring-gray-200 shadow-none hover:shadow-none',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 py-2 text-sm',
      lg: 'h-12 px-6 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <span className="mr-2 animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
        )}
        {!isLoading && leftIcon && <span className="mr-2 flex items-center">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2 flex items-center">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
