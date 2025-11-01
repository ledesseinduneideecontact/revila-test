'use client'

import { useState } from 'react'
import { ShoppingCart, Tag, Gift, Sparkles, Camera, CreditCard, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PhotoItem } from '../CommanderWizard'

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

interface StepRecapProps {
  photos: PhotoItem[]
  customerInfo: CustomerInfo
  promoCode: string
  onUpdatePromo: (code: string) => void
  total: number
}

export default function StepRecap({ photos, customerInfo, promoCode, onUpdatePromo, total }: StepRecapProps) {
  const [showPromoInput, setShowPromoInput] = useState(false)
  const [tempPromoCode, setTempPromoCode] = useState(promoCode)

  const getFormatDisplay = (format: string) => {
    switch(format) {
      case '10x15': return '10×15 cm'
      case '20x30': return '20×30 cm'
      case '30x45': return '30×45 cm'
      default: return format
    }
  }

  const getFormatPrice = (format: string) => {
    switch(format) {
      case '10x15': return 29.90
      case '20x30': return 39.90
      case '30x45': return 49.90
      default: return 0
    }
  }

  const applyPromoCode = () => {
    onUpdatePromo(tempPromoCode.toUpperCase())
    setShowPromoInput(false)
  }

  const getDiscountAmount = () => {
    if (promoCode === 'PRESTIGE') {
      return total * 0.15 // 15% de réduction
    }
    return 0
  }

  const finalTotal = total - getDiscountAmount()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="w-6 h-6 text-green-500" />
          <h3 className="text-xl font-semibold text-green-700">Récapitulatif de votre commande</h3>
        </div>
        <p className="text-green-600">
          Vérifiez vos informations avant de procéder au paiement
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colonne gauche - Commande */}
        <div className="space-y-6">
          {/* Photos commandées */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-orange-50 px-6 py-4 border-b border-orange-200">
              <h3 className="text-lg font-semibold text-orange-700 flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Vos photos magiques ({photos.length})
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {photos.map((photo, index) => (
                <div key={photo.id} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                  {/* Image miniature */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    {photo.photoPreview ? (
                      <img 
                        src={photo.photoPreview} 
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}
                  </div>

                  {/* Détails */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          Photo #{index + 1} - {getFormatDisplay(photo.format)}
                        </h4>
                        <div className="text-sm text-gray-600 space-y-1 mt-1">
                          {photo.withFrame && (
                            <div className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-purple-500" />
                              <span>Avec cadre élégant</span>
                            </div>
                          )}
                          {photo.message && (
                            <div className="flex items-center gap-1">
                              <span className="text-pink-500">💌</span>
                              <span>Message personnalisé</span>
                            </div>
                          )}
                          {photo.isGift && (
                            <div className="flex items-center gap-1">
                              <Gift className="w-3 h-3 text-purple-500" />
                              <span>Envoi cadeau</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {(getFormatPrice(photo.format) + 
                            (photo.withFrame ? 10 : 0) + 
                            (photo.isGift ? 2 : 0)
                          ).toFixed(2)} €
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Informations client */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200">
              <h3 className="text-lg font-semibold text-blue-700">
                Informations de livraison
              </h3>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-900">
                    {customerInfo.firstName} {customerInfo.lastName}
                  </p>
                  <p className="text-gray-600">{customerInfo.email}</p>
                  {customerInfo.phone && (
                    <p className="text-gray-600">{customerInfo.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-600">{customerInfo.address}</p>
                  <p className="text-gray-600">
                    {customerInfo.postalCode} {customerInfo.city}
                  </p>
                  <p className="text-gray-600">{customerInfo.country}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite - Paiement */}
        <div className="space-y-6">
          {/* Code promo */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200">
              <h3 className="text-lg font-semibold text-purple-700 flex items-center gap-2">
                <Tag className="w-5 h-5" />
                Code promotionnel
              </h3>
            </div>

            <div className="p-6">
              {promoCode ? (
                <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-green-700">Code appliqué : {promoCode}</p>
                    <p className="text-sm text-green-600">
                      Réduction de {(getDiscountAmount()).toFixed(2)} €
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdatePromo('')}
                    className="text-green-600 hover:text-green-800 underline text-sm"
                  >
                    Retirer
                  </button>
                </div>
              ) : showPromoInput ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={tempPromoCode}
                    onChange={(e) => setTempPromoCode(e.target.value)}
                    placeholder="Entrez votre code"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent uppercase"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={applyPromoCode}
                      className="bg-purple-500 hover:bg-purple-600"
                      disabled={!tempPromoCode.trim()}
                    >
                      Appliquer
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPromoInput(false)
                        setTempPromoCode('')
                      }}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowPromoInput(true)}
                  className="w-full p-4 border-2 border-dashed border-gray-300 hover:border-purple-400 bg-gray-50 hover:bg-purple-50 text-gray-600 hover:text-purple-600 rounded-lg transition-all"
                >
                  <Tag className="w-5 h-5 mx-auto mb-1" />
                  <span className="font-medium">Ajouter un code promo</span>
                </button>
              )}

              {/* Codes disponibles */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-gray-600 mb-2">💡 Codes disponibles :</p>
                <button
                  onClick={() => {
                    setTempPromoCode('PRESTIGE')
                    setShowPromoInput(true)
                  }}
                  className="text-xs bg-white border border-gray-200 hover:border-purple-400 px-2 py-1 rounded transition-colors"
                >
                  PRESTIGE (-15%)
                </button>
              </div>
            </div>
          </div>

          {/* Récapitulatif des prix */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Récapitulatif
              </h3>
            </div>

            <div className="p-6 space-y-3">
              {/* Détail par format */}
              {['10x15', '20x30', '30x45'].map(format => {
                const formatPhotos = photos.filter(p => p.format === format)
                if (formatPhotos.length === 0) return null
                
                return (
                  <div key={format} className="flex justify-between text-sm">
                    <span>
                      {formatPhotos.length} × {getFormatDisplay(format)}
                    </span>
                    <span>
                      {(formatPhotos.length * getFormatPrice(format)).toFixed(2)} €
                    </span>
                  </div>
                )
              })}

              {/* Suppléments cadres */}
              {photos.some(p => p.withFrame) && (
                <div className="flex justify-between text-sm">
                  <span>
                    {photos.filter(p => p.withFrame).length} × Cadre(s) élégant(s)
                  </span>
                  <span>
                    {(photos.filter(p => p.withFrame).length * 10).toFixed(2)} €
                  </span>
                </div>
              )}

              {/* Frais livraison cadeaux */}
              {photos.some(p => p.isGift) && (
                <div className="flex justify-between text-sm">
                  <span>
                    {photos.filter(p => p.isGift).length} × Envoi(s) cadeau
                  </span>
                  <span>
                    {(photos.filter(p => p.isGift).length * 2).toFixed(2)} €
                  </span>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-medium">Sous-total</span>
                  <span className="font-medium">{total.toFixed(2)} €</span>
                </div>
              </div>

              {/* Réduction */}
              {getDiscountAmount() > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Code {promoCode}</span>
                  <span>-{getDiscountAmount().toFixed(2)} €</span>
                </div>
              )}

              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-orange-500">
                    {finalTotal.toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Informations paiement */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-5 h-5 text-green-500" />
              <h4 className="font-semibold text-green-700">Paiement sécurisé</h4>
            </div>
            <div className="text-sm text-green-600 space-y-2">
              <p>✅ Paiement 100% sécurisé via Stripe</p>
              <p>✅ Cartes acceptées : Visa, Mastercard, Amex</p>
              <p>✅ Aucune donnée bancaire stockée</p>
              <p>✅ Confirmation immédiate par email</p>
            </div>
          </div>
        </div>
      </div>

      {/* Message si pas de photos */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">Aucune photo dans votre commande</p>
          <p className="text-sm text-gray-400">
            Retournez aux étapes précédentes pour ajouter des photos
          </p>
        </div>
      )}
    </div>
  )
}