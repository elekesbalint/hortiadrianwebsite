'use client'

import { useState, ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface AccordionProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  children: ReactNode
  defaultOpen?: boolean
  hasActiveFilter?: boolean
  className?: string
}

export function Accordion({ title, icon: Icon, children, defaultOpen = false, hasActiveFilter = false, className = '' }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`border border-gray-200 rounded-xl overflow-hidden transition-all ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3.5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {Icon && (
            <Icon className={`h-4 w-4 ${hasActiveFilter ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
          )}
          <span className={`text-sm font-bold ${hasActiveFilter ? 'text-[#2D7A4F]' : 'text-gray-700'}`}>
            {title}
          </span>
          {hasActiveFilter && (
            <span className="px-2 py-0.5 bg-[#2D7A4F] text-white text-[10px] font-bold rounded-full">
              Aktív
            </span>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  )
}
