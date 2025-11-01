'use client'

import { useState } from 'react'
import { Gift, X, MapPin, User, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PhotoItem } from '../CommanderWizard'

interface StepGiftsProps {
  photos: PhotoItem[]
  onUpdate: (id: string, updates: Partial<PhotoItem>) => void
}

interface GiftModalProps {
  photo: PhotoItem
  isOpen: boolean
  onClose: () => void
  onSave: (giftInfo: Partial<PhotoItem>) => void
}

function GiftModal({ photo, isOpen, onClose, onSave }: GiftModalProps) {
  const [firstName, setFirstName] = useState(photo?.giftFirstName || '')
  const [lastName, setLastName] = useState(photo?.giftLastName || '')
  const [address, setAddress] = useState(photo?.giftAddress || '')
  const [postalCode, setPostalCode] = useState(photo?.giftPostalCode || '')
  const [city, setCity] = useState(photo?.giftCity || '')

  const handleSave = () => {
    onSave({
      isGift: true,
      giftFirstName: firstName,
      giftLastName: lastName,
      giftAddress: address,
      giftPostalCode: postalCode,
      giftCity: city
    })
    onClose()
  }

  const isValid = firstName && lastName && address && postalCode && city

  if (!isOpen || !photo) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Gift className="w-6 h-6 text-purple-500" />
            <h3 className="text-xl font-semibold text-gray-900">
              Adresse de livraison
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-purple-700 text-sm">
              <Gift className="w-4 h-4 inline mr-1" />
              Cette photo sera envoyée directement au destinataire avec un emballage cadeau.
              <strong className="block mt-1">Frais de livraison : +2,00 €</strong>
            </p>
          </div>

          {/* Prénom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Prénom du destinataire *
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nom du destinataire *
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom de famille"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Adresse de livraison *
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Numéro et nom de rue"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {/* Code postal et ville */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Code postal *
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="75000"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Paris"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isValid}
            className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50"
          >
            Confirmer l'envoi cadeau
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function StepGifts({ photos, onUpdate }: StepGiftsProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)

  const getFormatDisplay = (format: string) => {
    switch(format) {
      case '10x15': return '10×15 cm'
      case '20x30': return '20×30 cm'
      case '30x45': return '30×45 cm'
      default: return format
    }
  }

  const handleSaveGift = (giftInfo: Partial<PhotoItem>) => {
    if (selectedPhoto) {
      onUpdate(selectedPhoto.id, giftInfo)
    }
  }

  const handleToggleGift = (photo: PhotoItem) => {
    if (photo.isGift) {
      // Désactiver le mode cadeau
      onUpdate(photo.id, { 
        isGift: false,
        giftFirstName: undefined,
        giftLastName: undefined,
        giftAddress: undefined,
        giftPostalCode: undefined,
        giftCity: undefined
      })
    } else {
      // Activer le mode cadeau avec modal
      setSelectedPhoto(photo)
    }
  }

  return (
    <div className="space-y-8">
      {/* Info sur le service */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Gift className="w-6 h-6 text-purple-500" />
          <h3 className="text-lg font-semibold text-purple-700">Envoi en cadeau</h3>
        </div>
        <p className="text-purple-600 mb-2">
          Offrez directement vos photos magiques à vos proches. 
          Emballage cadeau et livraison inclus.
        </p>
        <p className="text-sm text-purple-500 font-semibold">
          + 2,00 € de frais de livraison par photo
        </p>
      </div>

      {/* Grille de photos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo, index) => (
          <div 
            key={photo.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
          >
            {/* Image */}
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              {photo.photoPreview ? (
                <img 
                  src={photo.photoPreview} 
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-sm">Photo {index + 1}</span>
                </div>
              )}
              
              {/* Indicateur de cadeau */}
              {photo.isGift && (
                <div className="absolute top-2 right-2">
                  <div className="bg-purple-500 text-white p-1 rounded-full shadow-lg">
                    <Gift className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>

            {/* Infos photo */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {getFormatDisplay(photo.format)}
                </span>
                <span className="text-xs text-gray-500">
                  Photo #{index + 1}
                </span>
              </div>
            </div>

            {/* Options cadeau */}
            <div className="p-4">
              {photo.isGift ? (
                <div className="space-y-3">
                  {/* Adresse de livraison */}
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium text-purple-700">
                        Envoi cadeau
                      </span>
                    </div>
                    <div className="text-xs text-purple-600 space-y-1">
                      <p className="font-medium">
                        {photo.giftFirstName} {photo.giftLastName}
                      </p>
                      <p>{photo.giftAddress}</p>
                      <p>{photo.giftPostalCode} {photo.giftCity}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedPhoto(photo)}
                      className="flex-1 bg-purple-100 hover:bg-purple-200 text-purple-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleToggleGift(photo)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => handleToggleGift(photo)}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-purple-400 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-600 py-3 px-3 rounded-lg text-sm font-medium transition-all"
                >
                  <Gift className="w-4 h-4 mx-auto mb-1" />
                  Envoyer en cadeau
                  <span className="block text-xs mt-1">+2,00 €</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Résumé */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Résumé des cadeaux</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {photos.filter(p => !p.isGift).length} photo{photos.filter(p => !p.isGift).length !== 1 ? 's' : ''} pour vous
            </span>
            <span className="text-sm font-medium text-gray-800">
              0,00 €
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {photos.filter(p => p.isGift).length} photo{photos.filter(p => p.isGift).length !== 1 ? 's' : ''} en cadeau
            </span>
            <span className="text-sm font-medium text-gray-800">
              {(photos.filter(p => p.isGift).length * 2).toFixed(2)} €
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total frais de livraison</span>
              <span className="font-bold text-purple-500 text-lg">
                {(photos.filter(p => p.isGift).length * 2).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message si pas de photos */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">Aucune photo disponible</p>
          <p className="text-sm text-gray-400">
            Ajoutez d'abord des photos pour configurer l'envoi en cadeau
          </p>
        </div>
      )}

      {/* Modal d'adresse cadeau */}
      <GiftModal
        photo={selectedPhoto!}
        isOpen={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        onSave={handleSaveGift}
      />
    </div>
  )
}