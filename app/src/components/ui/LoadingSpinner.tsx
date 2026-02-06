'use client'

import { cn } from '@/lib/utils'

type LoadingSpinnerProps = {
  /** Inline: kis spinner + szöveg; centered: középre igazítva, nagyobb (pl. teljes oldal) */
  variant?: 'inline' | 'centered'
  /** Szöveg megjelenítése (alap: Betöltés…) */
  label?: string
  className?: string
}

export function LoadingSpinner({ variant = 'inline', label = 'Betöltés…', className }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        'shrink-0 rounded-full border-2 border-gray-200 border-t-[#2D7A4F] animate-spin',
        variant === 'inline' ? 'h-5 w-5' : 'h-8 w-8'
      )}
      aria-hidden
    />
  )

  if (variant === 'centered') {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-3 text-gray-500',
          className ?? 'min-h-[calc(100vh-80px)] bg-[#F8FAF8]'
        )}
        role="status"
        aria-label={label}
      >
        {spinner}
        <span className="text-sm">{label}</span>
      </div>
    )
  }

  return (
    <div
      className={cn('inline-flex items-center gap-2 text-gray-500', className)}
      role="status"
      aria-label={label}
    >
      {spinner}
      <span className="text-sm">{label}</span>
    </div>
  )
}
