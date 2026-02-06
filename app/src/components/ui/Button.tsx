'use client'

import { cn } from '@/lib/utils'
import { forwardRef, type ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, asChild, ...props }, ref) => {
    const baseStyles = `
      inline-flex items-center justify-center font-semibold rounded-xl
      transition-all duration-200 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:pointer-events-none
      active:scale-[0.98]
    `
    
    const variants = {
      primary: `
        bg-gradient-to-r from-[#2D7A4F] to-[#236B43] text-white
        hover:from-[#236B43] hover:to-[#1B5E20]
        focus-visible:ring-[#2D7A4F]
        shadow-lg shadow-[#2D7A4F]/25
        hover:shadow-xl hover:shadow-[#2D7A4F]/30
      `,
      secondary: `
        bg-[#E8F5E9] text-[#1B5E20]
        hover:bg-[#D4EDDA]
        focus-visible:ring-[#2D7A4F]
        shadow-sm
        hover:shadow-md
      `,
      outline: `
        border-2 border-[#2D7A4F] text-[#2D7A4F]
        hover:bg-[#2D7A4F] hover:text-white
        focus-visible:ring-[#2D7A4F]
      `,
      ghost: `
        text-gray-600
        hover:bg-gray-100 hover:text-gray-900
      `,
    }
    
    const sizes = {
      sm: 'h-9 px-4 text-sm gap-1.5',
      md: 'h-11 px-5 text-sm gap-2',
      lg: 'h-13 px-7 text-base gap-2.5',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
