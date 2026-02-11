'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'

export type SearchableSelectOption = {
  value: string
  label: string
}

type SearchableSelectProps = {
  options: SearchableSelectOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  className?: string
  disabled?: boolean
  hasValue?: boolean
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Válassz...',
  searchPlaceholder = 'Keresés...',
  className = '',
  disabled = false,
  hasValue = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)
  const displayValue = selectedOption?.label || placeholder

  // Szűrt opciók a keresés alapján
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Kattintás kívülre: bezárás
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
        setIsSearchOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      // Fókusz a kereső mezőre amikor megnyílik a kereső
      if (isSearchOpen) {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, isSearchOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange('')
    setIsOpen(false)
    setSearchQuery('')
    setIsSearchOpen(false)
  }

  const handleToggleSearch = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSearchOpen(!isSearchOpen)
    if (!isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setSearchQuery('')
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-4 py-3 ${value && !disabled ? 'pr-20' : 'pr-10'} bg-white border-2 rounded-xl outline-none transition-all text-sm font-medium appearance-none cursor-pointer hover:shadow-md flex items-center justify-between ${
          hasValue || value
            ? 'border-[#2D7A4F] text-[#1B5E20] focus:border-[#2D7A4F] focus:ring-[#2D7A4F]/10'
            : 'border-gray-200 text-gray-900 focus:border-[#2D7A4F] focus:ring-[#2D7A4F]/10 hover:border-gray-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${isOpen ? 'ring-4 ring-[#2D7A4F]/10' : ''}`}
      >
        <span className="truncate text-left flex-1">{displayValue}</span>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 hover:bg-gray-100 rounded transition-colors"
              aria-label="Törlés"
            >
              <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${
              hasValue || value ? 'text-[#2D7A4F]' : 'text-gray-400'
            }`}
          />
        </div>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header: kereső ikon */}
          <div className="p-2 border-b border-gray-200 bg-gray-50 flex-shrink-0 flex items-center justify-end">
            <button
              type="button"
              onClick={handleToggleSearch}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Keresés"
              title="Keresés"
            >
              <Search className={`h-4 w-4 transition-colors ${isSearchOpen ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
            </button>
          </div>

          {/* Kereső mező - csak akkor látható, ha megnyitották */}
          {isSearchOpen && (
            <div className="p-3 border-b border-gray-200 bg-gray-50 flex-shrink-0 animate-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-[#2D7A4F] focus:ring-2 focus:ring-[#2D7A4F]/20 text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    // Escape kezelése: bezárja a keresőt
                    if (e.key === 'Escape') {
                      setIsSearchOpen(false)
                      setSearchQuery('')
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Opciók lista */}
          <div 
            className="max-h-60 overflow-y-auto overscroll-contain"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 #f1f5f9',
              WebkitOverflowScrolling: 'touch',
            }}
            onWheel={(e) => {
              // Biztosítjuk, hogy a görgetés működjön
              e.stopPropagation()
            }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                Nincs találat
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#E8F5E9] ${
                    option.value === value
                      ? 'bg-[#E8F5E9] text-[#1B5E20] font-medium'
                      : 'text-gray-900 hover:text-[#2D7A4F]'
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
