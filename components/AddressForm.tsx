'use client'

import { MapPin, Info } from 'lucide-react'
import { useState } from 'react'

export interface AddressData {
  firstName: string
  lastName: string
  address: string
  postalCode: string
  city: string
  country: string
}

export interface AddressErrors {
  firstName?: string
  lastName?: string
  address?: string
  postalCode?: string
  city?: string
}

interface AddressFormProps {
  data: AddressData
  errors: AddressErrors
  onChange: (field: keyof AddressData, value: string) => void
  showCountryInfo?: boolean
}

export default function AddressForm({
  data,
  errors,
  onChange,
  showCountryInfo = true
}: AddressFormProps) {
  const [isCountryInfoVisible, setIsCountryInfoVisible] = useState(false)

  return (
    <div className="space-y-4">
      {/* Nom et prénom */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prénom *
          </label>
          <input
            type="text"
            value={data.firstName}
            onChange={(e) => onChange('firstName', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.firstName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Prénom du destinataire"
          />
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nom *
          </label>
          <input
            type="text"
            value={data.lastName}
            onChange={(e) => onChange('lastName', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.lastName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nom du destinataire"
          />
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Adresse */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Adresse *
        </label>
        <input
          type="text"
          value={data.address}
          onChange={(e) => onChange('address', e.target.value)}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
            errors.address ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Numéro et nom de rue"
        />
        {errors.address && (
          <p className="text-red-500 text-xs mt-1">{errors.address}</p>
        )}
      </div>

      {/* Code postal et ville */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Code postal *
          </label>
          <input
            type="text"
            value={data.postalCode}
            onChange={(e) => onChange('postalCode', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.postalCode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="75001"
            maxLength={5}
          />
          {errors.postalCode && (
            <p className="text-red-500 text-xs mt-1">{errors.postalCode}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ville *
          </label>
          <input
            type="text"
            value={data.city}
            onChange={(e) => onChange('city', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Paris"
          />
          {errors.city && (
            <p className="text-red-500 text-xs mt-1">{errors.city}</p>
          )}
        </div>
      </div>

      {/* Pays */}
      {showCountryInfo && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pays *
          </label>
          <div className="relative">
            <input
              type="text"
              value="FRANCE"
              disabled
              className="w-full p-3 border rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed border-gray-300"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div
                className="relative"
                onMouseEnter={() => setIsCountryInfoVisible(true)}
                onMouseLeave={() => setIsCountryInfoVisible(false)}
              >
                <button
                  type="button"
                  onClick={() => setIsCountryInfoVisible(!isCountryInfoVisible)}
                  className="text-orange-500 hover:text-orange-600 transition-colors"
                >
                  <Info className="w-5 h-5" />
                </button>
                {isCountryInfoVisible && (
                  <div className="absolute right-0 bottom-full mb-2 w-80 bg-white border-2 border-gray-300 text-gray-800 text-sm rounded-lg p-4 shadow-2xl z-50">
                    <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r-2 border-b-2 border-gray-300"></div>
                    <p className="mb-2 font-medium">
                      Nous livrons par défaut en France métropolitaine.
                    </p>
                    <p className="text-gray-600">
                      Pour une livraison à l'international, merci de nous contacter par email à{' '}
                      <a
                        href="mailto:contact@revila.fr"
                        className="text-orange-600 hover:text-orange-700 underline font-medium"
                      >
                        contact@revila.fr
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
