'use client'

import { ReactNode } from 'react'

interface FilterChipProps {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  isSelected: boolean
  onClick: () => void
  className?: string
}

export function FilterChip({ label, icon: Icon, isSelected, onClick, className = '' }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
        ${isSelected 
          ? 'bg-gray-200 border-2 border-gray-300 text-gray-900 shadow-sm' 
          : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
        }
        active:scale-[0.98]
        ${className}
      `}
    >
      {Icon && <Icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? 'text-gray-900' : 'text-gray-600'}`} />}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}
