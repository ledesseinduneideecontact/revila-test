'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Home, MapPin, Check } from 'lucide-react'
import { GiftAddress } from './GiftAddressManager'

interface PhotoAddressSelectorProps {
  photoId: string
  currentSelection: string | null  // address ID or null for "chez moi"
  availableAddresses: GiftAddress[]
  onSelect: (addressId: string | null) => void
  disabled?: boolean
}

export default function PhotoAddressSelector({
  photoId,
  currentSelection,
  availableAddresses,
  onSelect,
  disabled = false
}: PhotoAddressSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectedAddress = currentSelection
    ? availableAddresses.find(addr => addr.id === currentSelection)
    : null

  const displayText = selectedAddress
    ? `${selectedAddress.firstName} ${selectedAddress.lastName}`
    : 'Livré chez moi'

  const displayIcon = selectedAddress ? MapPin : Home

  const handleSelect = (addressId: string | null) => {
    onSelect(addressId)
    setIsOpen(false)
  }

  // If no addresses available and not selected, show "Livré chez moi" text only
  if (availableAddresses.length === 0 && !currentSelection) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-600 justify-center py-1">
        <Home className="w-3.5 h-3.5" />
        <span>Livré chez moi</span>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-colors ${
          disabled
            ? 'cursor-not-allowed text-gray-400'
            : currentSelection
            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
        }`}
        title={disabled ? 'Aucune adresse cadeau disponible' : 'Changer l\'adresse de livraison'}
      >
        {displayIcon && <displayIcon className="w-3.5 h-3.5 flex-shrink-0" />}
        <span className="truncate max-w-[120px]">{displayText}</span>
        {!disabled && availableAddresses.length > 0 && (
          <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto">
          {/* Option: Chez moi */}
          <button
            onClick={() => handleSelect(null)}
            className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${
              !currentSelection ? 'bg-gray-50' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-gray-600" />
              <span className="text-gray-900">Livré chez moi</span>
            </div>
            {!currentSelection && (
              <Check className="w-4 h-4 text-orange-500" />
            )}
          </button>

          {/* Divider */}
          {availableAddresses.length > 0 && (
            <div className="border-t border-gray-100 my-1"></div>
          )}

          {/* Gift addresses */}
          {availableAddresses.map((address) => (
            <button
              key={address.id}
              onClick={() => handleSelect(address.id)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center justify-between ${
                currentSelection === address.id ? 'bg-purple-50' : ''
              }`}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900 truncate">
                    {address.firstName} {address.lastName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {address.city}
                  </div>
                </div>
              </div>
              {currentSelection === address.id && (
                <Check className="w-4 h-4 text-orange-500 flex-shrink-0 ml-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
