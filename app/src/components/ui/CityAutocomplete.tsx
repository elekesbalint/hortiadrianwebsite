'use client'

import { useEffect, useRef, useState } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import { MapPin, X } from 'lucide-react'

const GOOGLE_MAPS_LIBS: ('places')[] = ['places']

type CityAutocompleteProps = {
  value: string
  onChange: (city: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/** Településnév kinyerése a Google Place address_components-ból vagy name-ből */
function getLocalityName(place: google.maps.places.PlaceResult): string {
  const ac = place.address_components
  if (ac) {
    const locality = ac.find((c) => c.types.includes('locality'))
    if (locality?.long_name) return locality.long_name
    const admin2 = ac.find((c) => c.types.includes('administrative_area_level_2'))
    if (admin2?.long_name) return admin2.long_name
  }
  if (place.name) return place.name
  const addr = place.formatted_address || ''
  return addr.split(',')[0]?.trim() || addr
}

export function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Teljes ország',
  className = '',
  disabled = false,
}: CityAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState(value)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: GOOGLE_MAPS_LIBS,
  })

  // Szinkronizálás: külső value (pl. szűrő törölve) → input
  useEffect(() => {
    if (!value) setInputValue('')
    else if (value && inputValue !== value) setInputValue(value)
  }, [value])

  useEffect(() => {
    if (!isLoaded || typeof google === 'undefined' || !inputRef.current || disabled) return
    const input = inputRef.current
    const autocomplete = new google.maps.places.Autocomplete(input, {
      types: ['(cities)'],
      componentRestrictions: { country: 'hu' },
      fields: ['address_components', 'name', 'formatted_address'],
    })
    autocompleteRef.current = autocomplete
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace()
      const name = getLocalityName(place)
      if (name) {
        setInputValue(name)
        onChange(name)
      }
    })
    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearListeners(autocompleteRef.current, 'place_changed')
        autocompleteRef.current = null
      }
    }
  }, [isLoaded, disabled, onChange])

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setInputValue('')
    onChange('')
    inputRef.current?.focus()
  }

  const hasValue = !!value || !!inputValue

  if (!isLoaded) {
    return (
      <div
        className={`w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm text-gray-500 ${className}`}
      >
        Település betöltése…
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <div
        className={`flex items-center gap-2 w-full bg-white border-2 rounded-xl outline-none transition-all text-sm font-medium ${
          hasValue ? 'border-[#2D7A4F] text-[#1B5E20]' : 'border-gray-200 text-gray-900 hover:border-gray-300'
        } ${disabled ? 'opacity-50' : ''}`}
      >
        <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400 ml-3" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={() => {
            if (!inputValue.trim()) onChange('')
            else if (inputValue.trim() !== value) onChange(inputValue.trim())
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              const v = inputValue.trim()
              if (v) onChange(v)
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 min-w-0 py-3 pr-8 bg-transparent border-0 outline-none placeholder:text-gray-400"
          autoComplete="off"
        />
        {hasValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 mr-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Törlés"
          >
            <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
    </div>
  )
}
