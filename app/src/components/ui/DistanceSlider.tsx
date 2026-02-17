'use client'

import { useState, useEffect } from 'react'
import { Gauge } from 'lucide-react'

interface DistanceSliderProps {
  value: number | null // km-ben, null = nincs szűrő
  onChange: (value: number | null) => void
  max?: number // Maximum távolság (km), default: 50
  step?: number // Lépésköz (km), default: 1
  className?: string
}

export function DistanceSlider({ value, onChange, max = 50, step = 1, className = '' }: DistanceSliderProps) {
  const [localValue, setLocalValue] = useState<number>(value ?? max)

  useEffect(() => {
    if (value !== null) {
      setLocalValue(value)
    } else {
      setLocalValue(max)
    }
  }, [value, max])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value)
    setLocalValue(newValue)
    onChange(newValue === max ? null : newValue)
  }

  const handleClear = () => {
    setLocalValue(max)
    onChange(null)
  }

  const hasValue = value !== null && value < max

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className={`h-3.5 w-3.5 ${hasValue ? 'text-[#2D7A4F]' : 'text-gray-400'}`} />
          <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Távolság</span>
          {hasValue && (
            <span className="ml-auto px-2 py-0.5 bg-[#2D7A4F] text-white text-[10px] font-bold rounded-full">
              Aktív
            </span>
          )}
        </div>
        {hasValue && (
          <button
            onClick={handleClear}
            className="text-xs text-[#2D7A4F] hover:text-[#1B5E20] font-medium"
            type="button"
          >
            Törlés
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="range"
          min={step}
          max={max}
          step={step}
          value={localValue}
          onChange={handleChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #2D7A4F 0%, #2D7A4F ${((localValue - step) / (max - step)) * 100}%, #E5E7EB ${((localValue - step) / (max - step)) * 100}%, #E5E7EB 100%)`,
          }}
        />
        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #2D7A4F;
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: all 0.2s;
          }
          .slider::-webkit-slider-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(45, 122, 79, 0.4);
          }
          .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #2D7A4F;
            cursor: pointer;
            border: 3px solid white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: all 0.2s;
          }
          .slider::-moz-range-thumb:hover {
            transform: scale(1.1);
            box-shadow: 0 4px 8px rgba(45, 122, 79, 0.4);
          }
        `}</style>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium">{hasValue ? `${localValue} km` : 'Nincs korlát'}</span>
        <span className="text-gray-400">{max} km</span>
      </div>
    </div>
  )
}
