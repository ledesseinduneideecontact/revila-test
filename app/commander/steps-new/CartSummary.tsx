'use client'

import React, { useState, useEffect } from 'react'

import { Trash2, Plus, Minus, ShoppingBag, Edit, Tag, Check, X, Truck, Gift, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmationModal from './ConfirmationModal'
import SaveCartModal from './SaveCartModal'
import type { CartFormat } from '../CommanderWizardNew'
import type { FrameSelection } from './StepOptions'
import { calculateOrderPricing, getPhotoPrice, CartItemPricing, PhotoFormat, calculateShippingCost, calculateShippingByAddress, type PhotoInstance as PricingPhotoInstance, type ShippingByAddressDetail } from '@/lib/pricing'
import { generateFrameMockup, revokeFrameMockupURL } from '@/lib/frameMockupGenerator'
import GiftAddressManager, { GiftAddress } from './GiftAddressManager'
import PhotoAddressDistributor from './PhotoAddressDistributor'
import type { AddressDistribution } from '@/types'

interface CartSummaryProps {
  cart: CartFormat[]
  frameSelection?: FrameSelection
  onUpdateCart: (cart: CartFormat[]) => void
  onProceedToInfo: () => void
  onContinueShopping: () => void
  onEditFormat?: (formatIndex: number) => void
  onEditFrames?: () => void
  onUpdateFrameQuantity?: (format: keyof FrameSelection, quantity: number) => void
  onUpdatePhotoQuantity?: (formatIndex: number, photoId: string, delta: number, isFramed: boolean) => void
  promoCode?: string
  promoDiscount?: number
  onPromoCodeChange?: (code: string, discount: number) => void
  isWeddingPlanSource?: boolean
  giftAddresses: GiftAddress[]
  photoAddressDistributions: Record<string, AddressDistribution[]>
  onAddGiftAddress: (address: Omit<GiftAddress, 'id'>) => void
  onEditGiftAddress: (id: string, address: Omit<GiftAddress, 'id'>) => void
  onDeleteGiftAddress: (id: string) => void
  onPhotoAddressDistribution: (photoId: string, distributions: AddressDistribution[]) => void
}

const SHIPPING_PRICES = {
  withoutFrame: 2.99,
  withFrame: 6.50,
  perGift: 2.00
}

// Composant pour le stepper de quantité
const QuantityStepper = ({
  quantity,
  onIncrement,
  onDecrement
}: {
  quantity: number
  onIncrement: () => void
  onDecrement: () => void
}) => (
  <div className="flex items-center justify-center gap-2 mt-2">
    <button
      onClick={onDecrement}
      className="w-8 h-8 rounded-full border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-colors text-lg font-bold"
      aria-label={quantity === 1 ? "Supprimer" : "Diminuer la quantité"}
    >
      {quantity === 1 ? <Trash2 className="w-4 h-4" /> : '−'}
    </button>
    <span className="min-w-[2.5rem] text-center font-semibold text-gray-900">
      {quantity}
    </span>
    <button
      onClick={onIncrement}
      className="w-8 h-8 rounded-full border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white flex items-center justify-center transition-colors text-lg font-bold"
      aria-label="Augmenter la quantité"
    >
      +
    </button>
  </div>
)

export default function CartSummary({
  cart,
  frameSelection,
  onUpdateCart,
  onProceedToInfo,
  onContinueShopping,
  onEditFormat,
  onEditFrames,
  onUpdateFrameQuantity,
  onUpdatePhotoQuantity,
  promoCode = '',
  promoDiscount = 0,
  onPromoCodeChange,
  isWeddingPlanSource = false,
  giftAddresses,
  photoAddressDistributions,
  onAddGiftAddress,
  onEditGiftAddress,
  onDeleteGiftAddress,
  onPhotoAddressDistribution
}: CartSummaryProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formatToDelete, setFormatToDelete] = useState<number | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [localPromoCode, setLocalPromoCode] = useState(promoCode)
  const [isPromoValid, setIsPromoValid] = useState<boolean | null>(promoDiscount > 0 ? true : null)
  const [appliedPromoCode, setAppliedPromoCode] = useState(promoCode) // Code actuellement appliqué
  const [isValidatingPromo, setIsValidatingPromo] = useState(false) // État de chargement pour la validation
  const [isPromoLocked, setIsPromoLocked] = useState(false) // État de verrouillage pour WeddingPlan

  // États pour les mockups de cadres
  const [photoMockups, setPhotoMockups] = useState<Record<string, string>>({})
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(true)

  // Mode de livraison multiple basé sur la présence d'adresses cadeaux
  const multipleAddressMode = giftAddresses.length > 0

  // Helper pour afficher le format correctement
  const formatDisplay = (format: string) => {
    if (format === 'carre') return '10×10 cm'
    return format.replace('x', '×') + ' cm'
  }

  // Générer les mockups pour les photos avec cadres
  useEffect(() => {
    const generateAllMockups = async () => {
      setIsGeneratingMockups(true)
      const mockups: Record<string, string> = {}

      for (const cartFormat of cart) {
        for (const photo of cartFormat.photos) {
          // Générer mockup seulement si frameQuantity > 0
          if (photo.frameQuantity && photo.frameQuantity > 0) {
            try {
              const orientation = (photo as any).cropConfig?.orientation || 'portrait'
              const mockupUrl = await generateFrameMockup(
                photo.photoPreview || '',
                cartFormat.format as '10x15' | '20x30' | '30x45',
                orientation
              )
              mockups[photo.id] = mockupUrl
            } catch (error) {
              console.error(`Erreur génération mockup pour photo ${photo.id}:`, error)
            }
          }
        }
      }

      setPhotoMockups(mockups)
      setIsGeneratingMockups(false)
    }

    generateAllMockups()

    // Cleanup : révoquer les Blob URLs au démontage
    return () => {
      Object.values(photoMockups).forEach(url => {
        revokeFrameMockupURL(url)
      })
    }
  }, [cart])

  const removeFormat = (index: number) => {
    setFormatToDelete(index)
    setShowDeleteModal(true)
  }

  const confirmRemoveFormat = () => {
    if (formatToDelete !== null) {
      const newCart = cart.filter((_, i) => i !== formatToDelete)
      onUpdateCart(newCart)
      setFormatToDelete(null)
    }
    setShowDeleteModal(false)
  }

  const cancelRemoveFormat = () => {
    setFormatToDelete(null)
    setShowDeleteModal(false)
  }

  const handleSaveCart = async (email: string) => {
    // This function would save the cart to Supabase
    // For now, we'll just log it
    console.log('Saving cart for email:', email, cart)
    // You can implement the actual save logic here later
  }

  // Préparer les données pour le calcul des prix
  const prepareCartItems = (): CartItemPricing[] => {
    const items: CartItemPricing[] = []

    cart.forEach(format => {
      format.photos.forEach(photo => {
        // Utiliser le withFrame individuel de chaque photo
        const priceInfo = getPhotoPrice(format.format as PhotoFormat, photo.withFrame)
        items.push({
          format: format.format as PhotoFormat,
          withFrame: photo.withFrame,
          quantity: photo.quantity,
          basePrice: priceInfo.photoPrice,
          discountedPrice: priceInfo.photoPrice,
          framePrice: priceInfo.framePrice,
          isGift: photo.isGift  // Ajout de l'information cadeau
        })
      })
    })

    return items
  }

  // Préparer les instances de photos pour le calcul de livraison
  const preparePhotoInstances = (): PricingPhotoInstance[] => {
    const instances: PricingPhotoInstance[] = []

    cart.forEach(format => {
      format.photos.forEach(photo => {
        const frameQuantity = photo.frameQuantity || 0
        const noFrameQuantity = photo.quantity - frameQuantity

        // Créer une instance pour les versions avec cadres (si > 0)
        if (frameQuantity > 0) {
          instances.push({
            instanceKey: `${photo.id}-framed`,
            id: photo.id,
            format: format.format as PhotoFormat,
            withFrame: true,
            displayQuantity: frameQuantity
          })
        }

        // Créer une instance pour les versions sans cadres (si > 0)
        if (noFrameQuantity > 0) {
          instances.push({
            instanceKey: `${photo.id}-noframe`,
            id: photo.id,
            format: format.format as PhotoFormat,
            withFrame: false,
            displayQuantity: noFrameQuantity
          })
        }
      })
    })

    return instances
  }

  // Calculer le total des cadres en premier
  let framesTotal = 0
  let totalFrames = 0
  if (frameSelection) {
    const framePrices = {
      '10x15': 12.90,
      '20x30': 16.90,
      '30x45': 19.90
    }
    
    Object.entries(frameSelection).forEach(([format, quantity]) => {
      const price = framePrices[format as keyof typeof framePrices] || 0
      framesTotal += price * quantity
      totalFrames += quantity
    })
  }

  // Calculer la livraison par adresse en fonction du poids
  const photoInstances = preparePhotoInstances()
  const shippingData = calculateShippingByAddress(
    photoInstances,
    photoAddressDistributions,
    giftAddresses
  )

  // Obtenir les données de pricing normales
  const pricingData = calculateOrderPricing(prepareCartItems())

  // Remplacer la livraison par notre calcul par adresse
  pricingData.shipping = shippingData.total
  
  const calculateFormatTotal = (format: CartFormat) => {
    // Calculer le total en tenant compte du withFrame individuel de chaque photo
    return format.photos.reduce((acc, photo) => {
      const priceInfo = getPhotoPrice(format.format as PhotoFormat, photo.withFrame)
      return acc + (priceInfo.total * photo.quantity)
    }, 0)
  }

  const calculateSubtotal = () => {
    return pricingData.subtotal
  }

  // Utiliser les données de pricing calculées
  const subtotal = pricingData.subtotal
  // Le finalSubtotal doit être : sous-total - réduction DUO - réduction palier + cadres
  const finalSubtotal = subtotal - pricingData.duoDiscount - pricingData.tierDiscount + framesTotal
  const shipping = pricingData.shipping
  // Le total avant promo : photos après réductions (incluant cadres) + livraison
  const totalBeforePromo = finalSubtotal + shipping
  const total = totalBeforePromo - promoDiscount

  // Fonction pour valider le code promo via l'API
  const validatePromoCode = async (code: string): Promise<{ isValid: boolean; discount: number; message: string }> => {
    try {
      const response = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Erreur validation code promo:', error)
      return { isValid: false, discount: 0, message: 'Erreur lors de la validation' }
    }
  }

  const handleApplyPromo = async () => {
    if (localPromoCode) {
      setIsValidatingPromo(true)
      
      try {
        const validation = await validatePromoCode(localPromoCode)
        
        if (validation.isValid && validation.discount > 0) {
          const discountAmount = totalBeforePromo * validation.discount
          setIsPromoValid(true)
          setAppliedPromoCode(localPromoCode)
          if (onPromoCodeChange) {
            onPromoCodeChange(localPromoCode, discountAmount)
          }
        } else {
          setIsPromoValid(false)
          setAppliedPromoCode('')
          if (onPromoCodeChange) {
            onPromoCodeChange('', 0)
          }
        }
      } finally {
        setIsValidatingPromo(false)
      }
    }
  }

  const handleRemovePromo = () => {
    setLocalPromoCode('')
    setAppliedPromoCode('')
    setIsPromoValid(null)
    if (onPromoCodeChange) {
      onPromoCodeChange('', 0)
    }
  }

  // Verrouiller automatiquement le code promo WeddingPlan
  useEffect(() => {
    if (isWeddingPlanSource) {
      setLocalPromoCode('WEDDINGPLAN')
      setAppliedPromoCode('WEDDINGPLAN')
      setIsPromoLocked(true)
      setIsPromoValid(true)
      
      // Appliquer automatiquement la remise
      const applyWeddingPlanPromo = async () => {
        const validation = await validatePromoCode('WEDDINGPLAN')
        if (validation.isValid && validation.discount > 0 && onPromoCodeChange) {
          const discountAmount = totalBeforePromo * validation.discount
          onPromoCodeChange('WEDDINGPLAN', discountAmount)
        }
      }
      
      applyWeddingPlanPromo()
    }
  }, [isWeddingPlanSource, totalBeforePromo, onPromoCodeChange])

  // Réappliquer automatiquement le code promo quand le total change
  useEffect(() => {
    const revalidatePromo = async () => {
      if (appliedPromoCode) {
        const validation = await validatePromoCode(appliedPromoCode)
        if (validation.isValid && validation.discount > 0 && onPromoCodeChange) {
          const discountAmount = totalBeforePromo * validation.discount
          onPromoCodeChange(appliedPromoCode, discountAmount)
        }
      }
    }
    
    revalidatePromo()
  }, [totalBeforePromo, appliedPromoCode])

  // Calculer le nombre total de photos
  const calculateTotalPhotos = () => {
    return cart.reduce((acc, format) => {
      return acc + format.photos.reduce((photoAcc, photo) => photoAcc + photo.quantity, 0)
    }, 0)
  }

  const totalPhotos = calculateTotalPhotos()

  // Calculer la date de livraison estimée (5 à 7 jours ouvrés)
  const calculateDeliveryDate = () => {
    const today = new Date()
    let businessDays = 0
    let currentDate = new Date(today)
    
    // Ajouter 5 à 7 jours ouvrés
    const minDays = 5
    const maxDays = 7
    
    // Calculer la date minimum
    const minDate = new Date(today)
    let daysAdded = 0
    while (daysAdded < minDays) {
      minDate.setDate(minDate.getDate() + 1)
      // Si ce n'est pas un weekend (0 = dimanche, 6 = samedi)
      if (minDate.getDay() !== 0 && minDate.getDay() !== 6) {
        daysAdded++
      }
    }
    
    // Calculer la date maximum
    const maxDate = new Date(today)
    daysAdded = 0
    while (daysAdded < maxDays) {
      maxDate.setDate(maxDate.getDate() + 1)
      if (maxDate.getDay() !== 0 && maxDate.getDay() !== 6) {
        daysAdded++
      }
    }
    
    // Formater les dates
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      })
    }
    
    return {
      min: formatDate(minDate),
      max: formatDate(maxDate)
    }
  }

  const deliveryDates = calculateDeliveryDate()

  // Grouper les photos par destination
  const groupPhotosByDestination = (format: CartFormat) => {
    const forMe: typeof format.photos = []
    const gifts: { [key: string]: typeof format.photos } = {}

    format.photos.forEach(photo => {
      if (!photo.isGift) {
        forMe.push(photo)
      } else {
        const key = `${photo.giftFirstName}_${photo.giftLastName}_${photo.giftAddress}`
        if (!gifts[key]) gifts[key] = []
        gifts[key].push(photo)
      }
    })

    return { forMe, gifts }
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Votre panier est vide</h2>
          <p className="text-gray-600 mb-6">Ajoutez des photos pour commencer</p>
          <Button onClick={onContinueShopping} className="bg-orange-500 hover:bg-orange-600">
            Commencer mes achats
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Version Desktop - Galerie */}
      <div className="hidden md:block">
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Grouper par format */}
          {cart.map((format, formatIndex) => (
            <div key={formatIndex} className="mb-8 last:mb-0">
              {/* En-tête du format avec boutons d'action */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-gray-200">
                <h4 className="font-semibold text-lg">{formatDisplay(format.format)}</h4>
                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {onEditFormat && (
                      <button
                        onClick={() => onEditFormat(formatIndex)}
                        className="text-blue-500 hover:text-blue-700"
                        title="Modifier"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFormat(formatIndex)}
                      className="text-red-500 hover:text-red-700"
                      title="Supprimer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Créer les instances de photos (avec/sans cadres) */}
              {(() => {
                const allPhotoInstances = format.photos.flatMap(photo => {
                  const frameQuantity = photo.frameQuantity || 0
                  const noFrameQuantity = photo.quantity - frameQuantity
                  const photoInstances = []

                  // Créer UNE instance pour les versions avec cadres (si > 0)
                  if (frameQuantity > 0) {
                    photoInstances.push({
                      ...photo,
                      instanceKey: `${photo.id}-framed`,
                      showFrame: true,
                      displayQuantity: frameQuantity
                    })
                  }

                  // Créer UNE instance pour les versions sans cadres (si > 0)
                  if (noFrameQuantity > 0) {
                    photoInstances.push({
                      ...photo,
                      instanceKey: `${photo.id}-noframe`,
                      showFrame: false,
                      displayQuantity: noFrameQuantity
                    })
                  }

                  return photoInstances
                })

                // Séparer en deux groupes
                const photosWithoutFrame = allPhotoInstances.filter(p => !p.showFrame)
                const photosWithFrame = allPhotoInstances.filter(p => p.showFrame)

                // Calculer totaux pour chaque groupe
                const countWithoutFrame = photosWithoutFrame.reduce((sum, p) => sum + p.displayQuantity, 0)
                const priceWithoutFrame = photosWithoutFrame.reduce((sum, p) => {
                  const price = getPhotoPrice(format.format as PhotoFormat, false).total
                  return sum + (price * p.displayQuantity)
                }, 0)

                const countWithFrame = photosWithFrame.reduce((sum, p) => sum + p.displayQuantity, 0)
                const priceWithFrame = photosWithFrame.reduce((sum, p) => {
                  const price = getPhotoPrice(format.format as PhotoFormat, true).total
                  return sum + (price * p.displayQuantity)
                }, 0)

                // Rendu des deux sections
                return (
                  <>
                    {/* Section: Photos sans cadres */}
                    {photosWithoutFrame.length > 0 && (
                      <div className="mb-6">
                        {/* En-tête de section */}
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-300">
                          <h5 className="text-sm font-medium text-gray-700">Sans cadres</h5>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">{countWithoutFrame} photo{countWithoutFrame > 1 ? 's' : ''}</span>
                            <span className="font-semibold text-gray-900">{priceWithoutFrame.toFixed(2)}€</span>
                          </div>
                        </div>

                        {/* Grille de photos sans cadres */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {photosWithoutFrame.map(photoInstance => (
                  <div key={photoInstance.instanceKey} className="relative group">
                    {/* Afficher mockup si showFrame, sinon photo normale */}
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {isGeneratingMockups && photoInstance.showFrame ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                      ) : photoInstance.showFrame && photoMockups[photoInstance.id] ? (
                        <img
                          src={photoMockups[photoInstance.id]}
                          alt="Photo encadrée"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={photoInstance.photoPreview}
                          alt="Photo"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {/* Indicateur cadeau */}
                    {photoInstance.isGift && (
                      <div className="absolute top-2 left-2 bg-purple-500/90 text-white text-xs px-2 py-1 rounded shadow-lg">
                        🎁 Cadeau
                      </div>
                    )}

                    {/* Message en bas */}
                    {photoInstance.message && (
                      <div className="mt-2 text-xs text-gray-600 italic truncate" title={photoInstance.message}>
                        "{photoInstance.message}"
                      </div>
                    )}

                    {/* Sélecteur d'adresse de livraison */}
                    <div className="mt-2">
                      <PhotoAddressDistributor
                        instanceKey={photoInstance.instanceKey}
                        totalQuantity={photoInstance.displayQuantity}
                        currentDistributions={photoAddressDistributions[photoInstance.instanceKey] || []}
                        availableAddresses={giftAddresses}
                        onDistribute={(distributions) => onPhotoAddressDistribution(photoInstance.instanceKey, distributions)}
                      />
                    </div>

                    {/* Prix unitaire */}
                    <div className="mt-2 text-center text-sm text-gray-700">
                      <span className="font-semibold">
                        {getPhotoPrice(format.format as PhotoFormat, photoInstance.showFrame).total.toFixed(2)}€
                      </span>
                      <span className="text-gray-500"> / unité</span>
                    </div>

                    {/* Stepper de quantité */}
                    {onUpdatePhotoQuantity && (
                      <QuantityStepper
                        quantity={photoInstance.displayQuantity}
                        onIncrement={() => {
                          onUpdatePhotoQuantity(formatIndex, photoInstance.id, 1, photoInstance.showFrame)
                        }}
                        onDecrement={() => {
                          onUpdatePhotoQuantity(formatIndex, photoInstance.id, -1, photoInstance.showFrame)
                        }}
                      />
                    )}
                  </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Section: Photos avec cadres */}
                    {photosWithFrame.length > 0 && (
                      <div className="mb-6">
                        {/* En-tête de section */}
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-300">
                          <h5 className="text-sm font-medium text-gray-700">Avec cadres</h5>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-gray-600">{countWithFrame} photo{countWithFrame > 1 ? 's' : ''}</span>
                            <span className="font-semibold text-gray-900">{priceWithFrame.toFixed(2)}€</span>
                          </div>
                        </div>

                        {/* Grille de photos avec cadres */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {photosWithFrame.map(photoInstance => (
                  <div key={photoInstance.instanceKey} className="relative group">
                    {/* Afficher mockup si showFrame, sinon photo normale */}
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {isGeneratingMockups && photoInstance.showFrame ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                        </div>
                      ) : photoInstance.showFrame && photoMockups[photoInstance.id] ? (
                        <img
                          src={photoMockups[photoInstance.id]}
                          alt="Photo encadrée"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={photoInstance.photoPreview}
                          alt="Photo"
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>

                    {/* Indicateur cadeau */}
                    {photoInstance.isGift && (
                      <div className="absolute top-2 left-2 bg-purple-500/90 text-white text-xs px-2 py-1 rounded shadow-lg">
                        🎁 Cadeau
                      </div>
                    )}

                    {/* Message en bas */}
                    {photoInstance.message && (
                      <div className="mt-2 text-xs text-gray-600 italic truncate" title={photoInstance.message}>
                        "{photoInstance.message}"
                      </div>
                    )}

                    {/* Sélecteur d'adresse de livraison */}
                    <div className="mt-2">
                      <PhotoAddressDistributor
                        instanceKey={photoInstance.instanceKey}
                        totalQuantity={photoInstance.displayQuantity}
                        currentDistributions={photoAddressDistributions[photoInstance.instanceKey] || []}
                        availableAddresses={giftAddresses}
                        onDistribute={(distributions) => onPhotoAddressDistribution(photoInstance.instanceKey, distributions)}
                      />
                    </div>

                    {/* Prix unitaire */}
                    <div className="mt-2 text-center text-sm text-gray-700">
                      <span className="font-semibold">
                        {getPhotoPrice(format.format as PhotoFormat, photoInstance.showFrame).total.toFixed(2)}€
                      </span>
                      <span className="text-gray-500"> / unité</span>
                    </div>

                    {/* Stepper de quantité */}
                    {onUpdatePhotoQuantity && (
                      <QuantityStepper
                        quantity={photoInstance.displayQuantity}
                        onIncrement={() => {
                          onUpdatePhotoQuantity(formatIndex, photoInstance.id, 1, photoInstance.showFrame)
                        }}
                        onDecrement={() => {
                          onUpdatePhotoQuantity(formatIndex, photoInstance.id, -1, photoInstance.showFrame)
                        }}
                      />
                    )}
                  </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </div>
          ))}
        </div>
      </div>

      {/* Version Mobile - Galerie */}
      <div className="md:hidden space-y-6">
        {cart.map((format, formatIndex) => (
          <div key={formatIndex} className="bg-white rounded-xl shadow-lg p-4">
            {/* En-tête du format avec boutons d'action */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-gray-200">
              <h4 className="font-semibold text-base">{formatDisplay(format.format)}</h4>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {onEditFormat && (
                    <button
                      onClick={() => onEditFormat(formatIndex)}
                      className="text-blue-500 hover:text-blue-700"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => removeFormat(formatIndex)}
                    className="text-red-500 hover:text-red-700"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Grille de photos - 2 colonnes sur mobile */}
            <div className="grid grid-cols-2 gap-3">
              {format.photos.flatMap(photo => {
                const frameQuantity = photo.frameQuantity || 0
                const noFrameQuantity = photo.quantity - frameQuantity
                const photoInstances = []

                // Créer UNE instance pour les versions avec cadres (si > 0)
                if (frameQuantity > 0) {
                  photoInstances.push({
                    ...photo,
                    instanceKey: `${photo.id}-framed`,
                    showFrame: true,
                    displayQuantity: frameQuantity
                  })
                }

                // Créer UNE instance pour les versions sans cadres (si > 0)
                if (noFrameQuantity > 0) {
                  photoInstances.push({
                    ...photo,
                    instanceKey: `${photo.id}-noframe`,
                    showFrame: false,
                    displayQuantity: noFrameQuantity
                  })
                }

                return photoInstances
              }).map(photoInstance => (
                <div key={photoInstance.instanceKey} className="relative group">
                  {/* Afficher mockup si showFrame, sinon photo normale */}
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                    {isGeneratingMockups && photoInstance.showFrame ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
                      </div>
                    ) : photoInstance.showFrame && photoMockups[photoInstance.id] ? (
                      <img
                        src={photoMockups[photoInstance.id]}
                        alt="Photo encadrée"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={photoInstance.photoPreview}
                        alt="Photo"
                        className="w-full h-full object-contain"
                      />
                    )}
                  </div>

                  {/* Indicateur cadeau */}
                  {photoInstance.isGift && (
                    <div className="absolute top-1.5 left-1.5 bg-purple-500/90 rounded-full p-1 shadow-lg">
                      <Gift className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}

                  {/* Message en bas */}
                  {photoInstance.message && (
                    <div className="mt-1 text-[10px] text-gray-600 italic truncate" title={photoInstance.message}>
                      "{photoInstance.message}"
                    </div>
                  )}

                  {/* Sélecteur d'adresse de livraison - Mobile */}
                  <div className="mt-1">
                    <PhotoAddressDistributor
                      instanceKey={photoInstance.instanceKey}
                      totalQuantity={photoInstance.displayQuantity}
                      currentDistributions={photoAddressDistributions[photoInstance.instanceKey] || []}
                      availableAddresses={giftAddresses}
                      onDistribute={(distributions) => onPhotoAddressDistribution(photoInstance.instanceKey, distributions)}
                    />
                  </div>

                  {/* Prix unitaire */}
                  <div className="mt-1 text-center text-xs text-gray-700">
                    <span className="font-semibold">
                      {getPhotoPrice(format.format as PhotoFormat, photoInstance.showFrame).total.toFixed(2)}€
                    </span>
                    <span className="text-gray-500"> / unité</span>
                  </div>

                  {/* Stepper de quantité */}
                  {onUpdatePhotoQuantity && (
                    <QuantityStepper
                      quantity={photoInstance.displayQuantity}
                      onIncrement={() => {
                        onUpdatePhotoQuantity(formatIndex, photoInstance.id, 1, photoInstance.showFrame)
                      }}
                      onDecrement={() => {
                        onUpdatePhotoQuantity(formatIndex, photoInstance.id, -1, photoInstance.showFrame)
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Gestion des adresses de livraison */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        {/* Section adresses cadeaux avec gestionnaire centralisé */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Adresses de livraison</h3>

          <GiftAddressManager
            addresses={giftAddresses}
            onAddAddress={onAddGiftAddress}
            onEditAddress={onEditGiftAddress}
            onDeleteAddress={onDeleteGiftAddress}
          />
        </div>
      </div>

      {/* Délais de livraison */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
        <div className="flex items-center justify-between bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Truck className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-medium text-gray-900">Livraison prévue</p>
              <p className="text-sm text-gray-600">
                Entre le <span className="font-semibold">{deliveryDates.min}</span> et le <span className="font-semibold">{deliveryDates.max}</span>
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-orange-600">5 à 7 jours ouvrés</p>
            <p className="text-xs text-gray-500">Après validation</p>
          </div>
        </div>
      </div>

      {/* Récapitulatif des prix */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-3">
          <div className="flex justify-between text-gray-700">
            <span>Total : {totalPhotos} photo{totalPhotos > 1 ? 's' : ''}</span>
            <span></span>
          </div>
          <div className="flex justify-between">
            <span>Sous-total photos</span>
            <span className="font-semibold">{(subtotal + framesTotal).toFixed(2)}€</span>
          </div>
          
          {/* Réductions appliquées */}
          {pricingData.duoDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Offre Duo (2ème à -50%)
              </span>
              <span>-{pricingData.duoDiscount.toFixed(2)}€</span>
            </div>
          )}
          
          {pricingData.tierDiscount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                {pricingData.appliedTier}
              </span>
              <span>-{pricingData.tierDiscount.toFixed(2)}€</span>
            </div>
          )}
          
          {(pricingData.duoDiscount > 0 || pricingData.tierDiscount > 0) && (
            <div className="flex justify-between font-semibold">
              <span>Sous-total après réductions</span>
              <span>{finalSubtotal.toFixed(2)}€</span>
            </div>
          )}

          {/* Frais de livraison */}
          {shippingData.byAddress.length === 1 ? (
            // Une seule adresse : affichage simple
            <div className="flex justify-between text-sm text-gray-600">
              <span>Frais de livraison</span>
              <span>{shipping.toFixed(2)}€</span>
            </div>
          ) : (
            // Plusieurs adresses : affichage détaillé
            <div className="space-y-1">
              <div className="text-sm font-medium text-gray-700">Frais de livraison :</div>
              {shippingData.byAddress.map((detail, index) => (
                <div key={index} className="flex justify-between text-xs text-gray-600 pl-3">
                  <span>
                    {detail.addressName}
                  </span>
                  <span>{detail.cost.toFixed(2)}€</span>
                </div>
              ))}
              <div className="flex justify-between text-sm font-semibold text-gray-700 pt-1 border-t">
                <span>Total livraison</span>
                <span>{shipping.toFixed(2)}€</span>
              </div>
            </div>
          )}
          
          {/* Section Code Promo */}
          <div className="pt-3 border-t">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code promo ou parrainage (optionnel)
            </label>
            
            {/* Bannière WeddingPlan si applicable */}
            {isWeddingPlanSource && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
                <div className="flex items-center text-green-700">
                  <Check className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">
                    Partenariat WeddingPlan activé
                  </span>
                </div>
                <p className="text-green-600 text-xs mt-1">
                  Code WEDDINGPLAN appliqué automatiquement
                </p>
              </div>
            )}
            
            <div className="flex gap-2">
              <div className="relative flex-1 min-w-0">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={localPromoCode}
                  onChange={(e) => {
                    if (!isPromoLocked) {
                      const code = e.target.value.toUpperCase()
                      setLocalPromoCode(code)
                      if (!code) {
                        setIsPromoValid(null)
                        if (onPromoCodeChange) {
                          onPromoCodeChange('', 0)
                        }
                      }
                    }
                  }}
                  placeholder={isPromoLocked ? "Code WeddingPlan verrouillé" : "CODE2025"}
                  disabled={isPromoLocked}
                  className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent ${
                    isPromoLocked 
                      ? 'bg-green-50 border-green-300 text-green-700 cursor-not-allowed' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
              <Button
                type="button"
                onClick={handleApplyPromo}
                variant="outline"
                className="px-3 sm:px-4 flex-shrink-0"
                disabled={!localPromoCode || localPromoCode === appliedPromoCode || isValidatingPromo || isPromoLocked}
              >
                {isValidatingPromo ? (
                  <span>...</span>
                ) : isPromoLocked ? (
                  <span>Verrouillé</span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Appliquer</span>
                    <span className="sm:hidden">OK</span>
                  </>
                )}
              </Button>
              {appliedPromoCode && !isPromoLocked && (
                <Button
                  type="button"
                  onClick={handleRemovePromo}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 flex-shrink-0"
                  title="Supprimer le code promo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {isPromoValid === true && appliedPromoCode && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <Check className="w-3 h-3" />
                {isPromoLocked ? (
                  <>Code WeddingPlan verrouillé ! Vous économisez {promoDiscount.toFixed(2)}€</>
                ) : (
                  <>Code {appliedPromoCode} appliqué ! Vous économisez {promoDiscount.toFixed(2)}€</>
                )}
              </p>
            )}
            {isPromoValid === false && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <X className="w-3 h-3" />
                Code promo invalide ou expiré
              </p>
            )}
          </div>
          
          {promoDiscount > 0 && appliedPromoCode && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <Tag className="w-4 h-4" />
                Réduction ({appliedPromoCode})
              </span>
              <span>-{promoDiscount.toFixed(2)}€</span>
            </div>
          )}
          
          <div className="pt-3 border-t flex justify-between text-2xl font-bold">
            <span>Total</span>
            <div className="text-right">
              {promoDiscount > 0 && (
                <span className="text-sm text-gray-400 line-through block">{totalBeforePromo.toFixed(2)}€</span>
              )}
              <span className="text-orange-600">{total.toFixed(2)}€</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <Button 
            onClick={onContinueShopping}
            variant="outline"
            className="w-full sm:flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="truncate">Ajouter d'autres photos</span>
          </Button>
          <Button 
            onClick={onProceedToInfo}
            className="w-full sm:flex-1 bg-orange-500 hover:bg-orange-600"
          >
            <span className="truncate">Continuer vers le paiement</span>
          </Button>
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Confirmation de suppression"
        message="Êtes-vous sûr de vouloir retirer ce format du panier ?"
        onConfirm={confirmRemoveFormat}
        onCancel={cancelRemoveFormat}
        confirmText="Retirer"
        cancelText="Annuler"
        confirmVariant="destructive"
      />
      
      {/* Modal de sauvegarde */}
      <SaveCartModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveCart}
      />
    </div>
  )
}