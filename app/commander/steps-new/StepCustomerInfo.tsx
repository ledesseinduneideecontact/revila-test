'use client'

import { useState } from 'react'
import { User, Mail, Phone, MapPin, ArrowLeft, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
}

interface StepCustomerInfoProps {
  customerInfo: CustomerInfo
  onComplete: (info: CustomerInfo) => void
  onBack?: () => void
}

export default function StepCustomerInfo({ customerInfo, onComplete, onBack }: StepCustomerInfoProps) {
  const [formData, setFormData] = useState<CustomerInfo>(customerInfo)
  const [errors, setErrors] = useState<Partial<CustomerInfo>>({})
  const [cgvAccepted, setCgvAccepted] = useState(false)
  const [cgvError, setCgvError] = useState('')

  const handleChange = (field: keyof CustomerInfo, value: string) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const validateForm = () => {
    const newErrors: Partial<CustomerInfo> = {}
    let isValid = true

    if (!formData.firstName) newErrors.firstName = 'Prénom requis'
    if (!formData.lastName) newErrors.lastName = 'Nom requis'
    if (!formData.email) newErrors.email = 'Email requis'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }
    if (!formData.phone) newErrors.phone = 'Téléphone requis'
    if (!formData.address) newErrors.address = 'Adresse requise'
    if (!formData.postalCode) newErrors.postalCode = 'Code postal requis'
    if (!formData.city) newErrors.city = 'Ville requise'

    if (!cgvAccepted) {
      setCgvError('Vous devez accepter les conditions générales de vente')
      isValid = false
    } else {
      setCgvError('')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0 && isValid
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onComplete(formData)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Bouton Retour */}
      {onBack && (
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au panier
        </Button>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold">Vos informations de livraison</h2>
        </div>

        {/* Nom et prénom */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prénom *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
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
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email et téléphone */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              Téléphone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
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
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
              errors.address ? 'border-red-500' : 'border-gray-300'
            }`}
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
              value={formData.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.postalCode ? 'border-red-500' : 'border-gray-300'
              }`}
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
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
            )}
          </div>
        </div>

        {/* Case à cocher CGV */}
        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="cgv"
              checked={cgvAccepted}
              onChange={(e) => {
                setCgvAccepted(e.target.checked)
                if (e.target.checked) setCgvError('')
              }}
              className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
            />
            <label htmlFor="cgv" className="text-sm text-gray-700">
              J'accepte les{' '}
              <a
                href="https://docs.google.com/document/d/15RcgjznCGNSeSNaFoHu2xNqa1heAlLc0/edit?usp=sharing&ouid=106586421486475401283&rtpof=true&sd=true"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-500 hover:text-orange-600 underline inline-flex items-center gap-1"
              >
                conditions générales de vente
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
          </div>
          {cgvError && (
            <p className="text-red-500 text-xs ml-7">{cgvError}</p>
          )}
        </div>

        {/* Bouton de validation */}
        <Button
          type="submit"
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
        >
          Continuer vers le paiement
        </Button>

        <p className="text-xs text-gray-500 text-center">
          * Champs obligatoires
        </p>
      </form>
    </div>
  )
}