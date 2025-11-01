'use client'

import { useState } from 'react'
import { MessageSquare, X, Heart, Edit3, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PhotoItem } from '../CommanderWizard'

interface StepMessagesProps {
  photos: PhotoItem[]
  onUpdate: (id: string, updates: Partial<PhotoItem>) => void
}

interface MessageModalProps {
  photo: PhotoItem
  isOpen: boolean
  onClose: () => void
  onSave: (message: string, signature: string) => void
}

function MessageModal({ photo, isOpen, onClose, onSave }: MessageModalProps) {
  const [message, setMessage] = useState(photo?.message || '')
  const [signature, setSignature] = useState(photo?.signature || '')

  const handleSave = () => {
    onSave(message, signature)
    onClose()
  }

  const handleRemoveMessage = () => {
    onSave('', '')
    onClose()
  }

  if (!isOpen || !photo) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-orange-500" />
            <h3 className="text-xl font-semibold text-gray-900">
              Personnaliser le message
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Preview de l'étiquette */}
          <div className="flex justify-center">
            <div className="relative">
              <img 
                src="/etiquette-carre.jpg"
                alt="Aperçu de l'étiquette personnalisée"
                className="w-48 h-48 rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-black/10 rounded-lg"></div>
              <div className="absolute inset-0 flex flex-col justify-center items-center p-4 text-center">
                <div className="bg-white/90 rounded-lg p-3 shadow-lg max-w-full">
                  <p className="text-xs font-medium text-gray-800 leading-relaxed">
                    {message || "Votre message apparaîtra ici..."}
                  </p>
                  {signature && (
                    <p className="text-xs text-gray-600 mt-1 italic">
                      - {signature}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Formulaire de message */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Heart className="w-4 h-4 inline mr-1 text-red-500" />
                Message personnel
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Écrivez votre message d'amour, de tendresse ou de souvenir..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={4}
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/150 caractères
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Edit3 className="w-4 h-4 inline mr-1 text-blue-500" />
                Signature (optionnel)
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Votre nom, prénom..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={50}
              />
              <p className="text-xs text-gray-500 mt-1">
                {signature.length}/50 caractères
              </p>
            </div>
          </div>

          {/* Messages d'exemple */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-orange-700 mb-2">💡 Idées de messages</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setMessage("Je t'aime pour toujours")}
                className="text-left p-2 bg-white rounded border hover:bg-orange-50 transition-colors"
              >
                "Je t'aime pour toujours"
              </button>
              <button
                onClick={() => setMessage("Souvenir inoubliable")}
                className="text-left p-2 bg-white rounded border hover:bg-orange-50 transition-colors"
              >
                "Souvenir inoubliable"
              </button>
              <button
                onClick={() => setMessage("Joyeux anniversaire !")}
                className="text-left p-2 bg-white rounded border hover:bg-orange-50 transition-colors"
              >
                "Joyeux anniversaire !"
              </button>
              <button
                onClick={() => setMessage("Merci d'être là")}
                className="text-left p-2 bg-white rounded border hover:bg-orange-50 transition-colors"
              >
                "Merci d'être là"
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between p-6 border-t bg-gray-50">
          {/* Bouton supprimer le message (si message existant) */}
          <div>
            {(photo?.message || message) && (
              <Button 
                variant="ghost"
                onClick={handleRemoveMessage}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="w-4 h-4 mr-2" />
                Supprimer le message
              </Button>
            )}
          </div>
          
          {/* Boutons action */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StepMessages({ photos, onUpdate }: StepMessagesProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoItem | null>(null)

  const getFormatDisplay = (format: string) => {
    switch(format) {
      case '10x15': return '10×15 cm'
      case '20x30': return '20×30 cm'
      case '30x45': return '30×45 cm'
      default: return format
    }
  }

  const handleSaveMessage = (message: string, signature: string) => {
    if (selectedPhoto) {
      onUpdate(selectedPhoto.id, { message, signature })
    }
  }

  return (
    <div className="space-y-8">
      {/* Info sur le service */}
      <div className="bg-gradient-to-r from-pink-50 to-orange-50 border border-pink-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-pink-500" />
          <h3 className="text-lg font-semibold text-pink-700">Messages personnalisés</h3>
        </div>
        <p className="text-pink-600 mb-3">
          Ajoutez un message personnel sur chaque photo magique. 
          Parfait pour transmettre vos émotions et créer des souvenirs uniques.
        </p>
        <div className="flex justify-center">
          <img 
            src="/etiquette-carre.jpg"
            alt="Exemple d'étiquette personnalisée"
            className="w-32 h-32 rounded-lg shadow-md"
          />
        </div>
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
              
              {/* Indicateur de message */}
              {photo.message && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-500 text-white p-1 rounded-full shadow-lg">
                    <MessageSquare className="w-4 h-4" />
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

            {/* Message actuel */}
            <div className="p-4">
              {photo.message ? (
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-700 leading-relaxed">
                      "{photo.message}"
                    </p>
                    {photo.signature && (
                      <p className="text-xs text-gray-500 mt-1 italic">
                        - {photo.signature}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedPhoto(photo)}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                  >
                    Modifier le message
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSelectedPhoto(photo)}
                  className="w-full border-2 border-dashed border-gray-300 hover:border-orange-400 bg-gray-50 hover:bg-orange-50 text-gray-600 hover:text-orange-600 py-3 px-3 rounded-lg text-sm font-medium transition-all"
                >
                  <MessageSquare className="w-4 h-4 mx-auto mb-1" />
                  Ajouter un message
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Résumé */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Résumé des messages</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {photos.filter(p => p.message).length} photo{photos.filter(p => p.message).length !== 1 ? 's' : ''} avec message
            </span>
            <span className="text-sm font-medium text-green-600">
              ✓ Inclus
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {photos.filter(p => !p.message).length} photo{photos.filter(p => !p.message).length !== 1 ? 's' : ''} sans message
            </span>
            <span className="text-sm text-gray-400">
              Optionnel
            </span>
          </div>
        </div>
      </div>

      {/* Message si pas de photos */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">Aucune photo disponible</p>
          <p className="text-sm text-gray-400">
            Ajoutez d'abord des photos pour personnaliser les messages
          </p>
        </div>
      )}

      {/* Modal de message */}
      <MessageModal
        photo={selectedPhoto!}
        isOpen={selectedPhoto !== null}
        onClose={() => setSelectedPhoto(null)}
        onSave={handleSaveMessage}
      />
    </div>
  )
}