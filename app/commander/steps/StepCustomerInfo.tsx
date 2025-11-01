'use client'

import { User, Mail, Phone, MapPin, Flag } from 'lucide-react'

interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  postalCode: string
  city: string
  country: string
}

interface StepCustomerInfoProps {
  customerInfo: CustomerInfo
  onUpdate: (info: Partial<CustomerInfo>) => void
}

export default function StepCustomerInfo({ customerInfo, onUpdate }: StepCustomerInfoProps) {
  return (
    <div className="space-y-8">
      {/* Info sur l'étape */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <User className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-blue-700">Vos coordonnées</h3>
        </div>
        <p className="text-blue-600">
          Ces informations nous permettront de vous livrer vos photos magiques 
          et de vous tenir informé du suivi de votre commande.
        </p>
      </div>

      {/* Formulaire */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Informations personnelles</h3>
            <p className="text-sm text-gray-600 mt-1">
              Tous les champs marqués d'un * sont obligatoires
            </p>
          </div>

          {/* Formulaire */}
          <div className="p-6 space-y-6">
            {/* Prénom et nom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Prénom *
                </label>
                <input
                  type="text"
                  value={customerInfo.firstName}
                  onChange={(e) => onUpdate({ firstName: e.target.value })}
                  placeholder="Votre prénom"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Nom *
                </label>
                <input
                  type="text"
                  value={customerInfo.lastName}
                  onChange={(e) => onUpdate({ lastName: e.target.value })}
                  placeholder="Votre nom"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Adresse email *
              </label>
              <input
                type="email"
                value={customerInfo.email}
                onChange={(e) => onUpdate({ email: e.target.value })}
                placeholder="votre@email.fr"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Nous vous enverrons la confirmation de commande et le suivi
              </p>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Numéro de téléphone
              </label>
              <input
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => onUpdate({ phone: e.target.value })}
                placeholder="06 12 34 56 78"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optionnel - Pour le suivi de livraison uniquement
              </p>
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                Adresse de livraison *
              </label>
              <input
                type="text"
                value={customerInfo.address}
                onChange={(e) => onUpdate({ address: e.target.value })}
                placeholder="Numéro et nom de rue, appartement, etc."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                required
              />
            </div>

            {/* Code postal et ville */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code postal *
                </label>
                <input
                  type="text"
                  value={customerInfo.postalCode}
                  onChange={(e) => onUpdate({ postalCode: e.target.value })}
                  placeholder="75000"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  value={customerInfo.city}
                  onChange={(e) => onUpdate({ city: e.target.value })}
                  placeholder="Paris"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            {/* Pays */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Flag className="w-4 h-4 inline mr-1" />
                Pays
              </label>
              <select
                value={customerInfo.country}
                onChange={(e) => onUpdate({ country: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
              >
                <option value="France">France</option>
                <option value="Belgique">Belgique</option>
                <option value="Suisse">Suisse</option>
                <option value="Luxembourg">Luxembourg</option>
                <option value="Canada">Canada</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Actuellement, nous livrons uniquement dans ces pays
              </p>
            </div>
          </div>
        </div>

        {/* Informations de livraison */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-green-700 mb-3">
            📦 Informations de livraison
          </h4>
          <div className="space-y-2 text-sm text-green-600">
            <div className="flex items-start gap-2">
              <span className="font-medium">🚚 Délai :</span>
              <span>3-5 jours ouvrés après validation de la commande</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">📋 Suivi :</span>
              <span>Numéro de suivi envoyé par email</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">🛡️ Protection :</span>
              <span>Emballage sécurisé pour vos photos magiques</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">💰 Frais :</span>
              <span>Livraison gratuite en France métropolitaine</span>
            </div>
          </div>
        </div>

        {/* Politique de confidentialité */}
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            <strong>🔒 Confidentialité :</strong> Vos données personnelles sont protégées et utilisées 
            uniquement pour le traitement de votre commande. Elles ne seront jamais partagées 
            avec des tiers sans votre consentement. Vous pouvez demander leur suppression 
            à tout moment en nous contactant.
          </p>
        </div>
      </div>
    </div>
  )
}