'use client'

import { useState } from 'react'
import { Save, X, Mail, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SaveCartModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (email: string, saveToCloud: boolean) => Promise<void>
}

export default function SaveCartModal({ isOpen, onClose, onSave }: SaveCartModalProps) {
  const [email, setEmail] = useState('')
  const [saveToCloud, setSaveToCloud] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async () => {
    if (!email) {
      setError('Veuillez entrer votre email')
      return
    }

    if (!email.includes('@')) {
      setError('Veuillez entrer un email valide')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await onSave(email, saveToCloud)
      onClose()
    } catch (err) {
      setError('Erreur lors de la sauvegarde')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Save className="w-5 h-5 text-orange-500" />
              Sauvegarder votre panier
            </h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Sauvegardez votre panier pour le retrouver plus tard. 
            Vous recevrez un lien par email pour continuer vos achats.
          </p>

          <div className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Votre email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="votre@email.com"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              />
            </div>

            {/* Option cloud */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <input
                type="checkbox"
                id="saveToCloud"
                checked={saveToCloud}
                onChange={(e) => setSaveToCloud(e.target.checked)}
                className="mt-1"
              />
              <label htmlFor="saveToCloud" className="text-sm">
                <div className="font-medium flex items-center gap-1">
                  <Cloud className="w-4 h-4 text-blue-600" />
                  Sauvegarder dans le cloud
                </div>
                <div className="text-gray-600 mt-1">
                  Votre panier sera sauvegardé en ligne et accessible depuis n'importe quel appareil
                </div>
              </label>
            </div>

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}