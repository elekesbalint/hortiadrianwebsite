'use client'

import { cn } from '@/lib/utils'
import { forwardRef, type HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  elevated?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, elevated = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white rounded-2xl border border-gray-100 overflow-hidden',
          'transition-all duration-300 ease-out',
          hover && 'cursor-pointer hover:border-gray-200 card-hover',
          elevated ? 'shadow-elevated' : 'shadow-soft',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

const CardImage = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { src?: string; alt?: string }>(
  ({ className, src, alt, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('relative w-full h-48 overflow-hidden img-zoom', className)} {...props}>
        {src ? (
          <img
            src={src}
            alt={alt || ''}
            className="w-full h-full object-cover"
          />
        ) : (
          children
        )}
      </div>
    )
  }
)

CardImage.displayName = 'CardImage'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('p-5', className)} {...props}>
        {children}
      </div>
    )
  }
)

CardContent.displayName = 'CardContent'

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3 ref={ref} className={cn('text-lg font-bold text-gray-900 tracking-tight', className)} {...props}>
        {children}
      </h3>
    )
  }
)

CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <p ref={ref} className={cn('text-sm text-gray-500 mt-1 leading-relaxed', className)} {...props}>
        {children}
      </p>
    )
  }
)

CardDescription.displayName = 'CardDescription'

export { Card, CardImage, CardContent, CardTitle, CardDescription }
