'use client'

import React, { useState, useEffect } from 'react'

import { Trash2, Plus, Minus, ShoppingBag, MessageSquare, Save, Edit, Tag, SquarePen, Frame, Check, X, Truck, Calendar, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmationModal from './ConfirmationModal'
import SaveCartModal from './SaveCartModal'
import type { CartFormat } from '../CommanderWizardNew'
import type { FrameSelection } from './StepOptions'
import { calculateOrderPricing, getPhotoPrice, CartItemPricing, PhotoFormat, calculateShippingCost } from '@/lib/pricing'

interface CartSummaryProps {
  cart: CartFormat[]
  frameSelection?: FrameSelection
  onUpdateCart: (cart: CartFormat[]) => void
  onProceedToInfo: () => void
  onContinueShopping: () => void
  onEditFormat?: (formatIndex: number) => void
  onEditFrames?: () => void
  onUpdateFrameQuantity?: (format: keyof FrameSelection, quantity: number) => void
  promoCode?: string
  promoDiscount?: number
  onPromoCodeChange?: (code: string, discount: number) => void
  isWeddingPlanSource?: boolean
}

const SHIPPING_PRICES = {
  withoutFrame: 2.99,
  withFrame: 6.50,
  perGift: 2.00
}

export default function CartSummary({ cart, frameSelection, onUpdateCart, onProceedToInfo, onContinueShopping, onEditFormat, onEditFrames, onUpdateFrameQuantity, promoCode = '', promoDiscount = 0, onPromoCodeChange, isWeddingPlanSource = false }: CartSummaryProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [formatToDelete, setFormatToDelete] = useState<number | null>(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [localPromoCode, setLocalPromoCode] = useState(promoCode)
  const [isPromoValid, setIsPromoValid] = useState<boolean | null>(promoDiscount > 0 ? true : null)
  const [appliedPromoCode, setAppliedPromoCode] = useState(promoCode) // Code actuellement appliqué
  const [isValidatingPromo, setIsValidatingPromo] = useState(false) // État de chargement pour la validation
  const [isPromoLocked, setIsPromoLocked] = useState(false) // État de verrouillage pour WeddingPlan
  
  // Helper pour afficher le format correctement
  const formatDisplay = (format: string) => {
    if (format === 'carre') return '10×10 cm'
    return format.replace('x', '×') + ' cm'
  }

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

  // Calculer la livraison en tenant compte des cadres de StepOptions
  const cartFrameCount = prepareCartItems().filter(item => item.withFrame).reduce((sum, item) => sum + item.quantity, 0)
  const optionsFrameCount = totalFrames // Maintenant totalFrames est défini
  const totalFrameCount = cartFrameCount + optionsFrameCount
  
  // Vérifier s'il y a une photo 30x45
  const hasLargePhoto = cart.some(format => format.format === '30x45')
  
  // Calculer la livraison selon les nouvelles règles
  const calculatedShipping = calculateShippingCost(totalFrameCount, hasLargePhoto)
  
  // Obtenir les données de pricing normales
  const pricingData = calculateOrderPricing(prepareCartItems())
  
  // Remplacer la livraison par notre calcul
  pricingData.shipping = calculatedShipping
  
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
  // Le finalSubtotal doit être : sous-total - réduction DUO - réduction palier
  const finalSubtotal = subtotal - pricingData.duoDiscount - pricingData.tierDiscount
  const shipping = pricingData.shipping
  // Le total avant promo : photos après réductions + cadres + livraison
  const totalBeforePromo = finalSubtotal + framesTotal + shipping
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
      {/* Version Desktop */}
      <div className="hidden md:block">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold">Votre sélection</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left pb-3 text-gray-600 font-medium">Format</th>
                <th className="text-left pb-3 pl-4 text-gray-600 font-medium">Photos</th>
                <th className="text-right pb-3 pr-4 text-gray-600 font-medium">Prix</th>
                <th className="pb-3"></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((format, formatIndex) => {
                const { forMe, gifts } = groupPhotosByDestination(format)
                const rowCount = (forMe.length > 0 ? 1 : 0) + Object.keys(gifts).length
                
                return (
                  <React.Fragment key={formatIndex}>
                    {/* Photos pour moi */}
                    {forMe.length > 0 && (
                      <tr key={`${formatIndex}-forme`}>
                        <td className="py-4 pr-4" rowSpan={rowCount}>
                          <div className="font-semibold">{formatDisplay(format.format)}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-2 max-w-md">
                            {forMe.map((photo) => (
                              <div key={photo.id} className="relative">
                                <div className="relative group">
                                  <img 
                                    src={photo.photoPreview} 
                                    alt=""
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                  {photo.quantity > 1 && (
                                    <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                      {photo.quantity}
                                    </span>
                                  )}
                                  {/* Indicateur message */}
                                  {photo.message && (
                                    <div className="absolute bottom-1 right-1 bg-pink-500/90 rounded-full p-0.5">
                                      <MessageSquare className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                  {/* Indicateur cadre */}
                                  {photo.withFrame && format.format !== 'carre' && (
                                    <div className="absolute top-1 left-1 bg-gray-800/80 text-white text-[10px] px-1 rounded">
                                      Cadre
                                    </div>
                                  )}
                                </div>
                                {photo.message && (
                                  <div className="text-xs text-gray-600 italic mt-1 max-w-16 break-words">
                                    {photo.message}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 pr-4 text-right" rowSpan={rowCount}>
                          <div className="font-semibold">
                            {calculateFormatTotal(format).toFixed(2)}€
                          </div>
                        </td>
                        <td className="py-4 pl-4 text-right" rowSpan={rowCount}>
                          <div className="flex gap-2 justify-end">
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
                        </td>
                      </tr>
                    )}
                    
                    {/* Photos cadeaux */}
                    {Object.entries(gifts).map(([key, giftPhotos], giftIndex) => {
                      const firstPhoto = giftPhotos[0]
                      return (
                        <tr key={`${formatIndex}-gift-${giftIndex}`}>
                          {forMe.length === 0 && giftIndex === 0 && (
                            <>
                              <td className="p-4" rowSpan={Object.keys(gifts).length}>
                                <div className="font-semibold">{formatDisplay(format.format)}</div>
                              </td>
                            </>
                          )}
                          <td className="py-4 px-4">
                            <div className="flex flex-wrap gap-2 max-w-md">
                              {giftPhotos.map((photo) => (
                                <div key={photo.id} className="relative">
                                  <div className="relative group">
                                    <img 
                                      src={photo.photoPreview} 
                                      alt=""
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                    {photo.quantity > 1 && (
                                      <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {photo.quantity}
                                      </span>
                                    )}
                                    {/* Indicateur message */}
                                    {photo.message && (
                                      <div className="absolute bottom-1 right-1 bg-pink-500/90 rounded-full p-0.5">
                                        <MessageSquare className="w-2.5 h-2.5 text-white" />
                                      </div>
                                    )}
                                  </div>
                                  {photo.message && (
                                    <div className="text-xs text-gray-600 italic mt-1 max-w-16 break-words">
                                      {photo.message}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                          {forMe.length === 0 && giftIndex === 0 && (
                            <>
                              <td className="py-4 pr-4 text-right" rowSpan={Object.keys(gifts).length}>
                                <div className="font-semibold">
                                  {calculateFormatTotal(format).toFixed(2)}€
                                </div>
                              </td>
                              <td className="py-4 pl-4 text-right" rowSpan={Object.keys(gifts).length}>
                                <div className="flex gap-2 justify-end">
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
                              </td>
                            </>
                          )}
                        </tr>
                      )
                    })}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Récapitulatif des cadres */}
      {frameSelection && (Object.values(frameSelection).some(qty => qty > 0)) && (
        <div className="bg-white rounded-xl shadow-lg p-6 relative">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Frame className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Cadres sélectionnés</h3>
            </div>
            {onEditFrames && (
              <button
                onClick={onEditFrames}
                className="text-gray-600 hover:text-orange-600 transition-colors"
                title="Modifier les cadres"
              >
                <SquarePen className="w-5 h-5" />
              </button>
            )}
          </div>
          
          {Object.entries(frameSelection).map(([format, quantity]) => {
            if (quantity === 0) return null
            const framePrices = {
              '10x15': 12.90,
              '20x30': 16.90,
              '30x45': 19.90
            }
            const price = framePrices[format as keyof typeof framePrices]
            const total = price * quantity
            
            return (
              <div key={format} className="flex items-center justify-between mb-3 p-2 rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                    <img 
                      src={format === '10x15' ? '/images/cadre-10x15-new.png' :
                           format === '20x30' ? '/images/cadre-20x30.png' :
                           format === '30x45' ? '/images/cadre-30x45.png' : ''}
                      alt={`Cadre ${format}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-gray-700 font-medium">
                      Cadre {format === '10x15' ? '10×15 cm' : 
                             format === '20x30' ? '20×30 cm' : 
                             format === '30x45' ? '30×45 cm' : format}
                    </span>
                    <div className="text-sm text-gray-500">{price.toFixed(2)}€ / unité</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateFrameQuantity && onUpdateFrameQuantity(format as keyof FrameSelection, quantity - 1)}
                      disabled={quantity === 0}
                      className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <button
                      onClick={() => onUpdateFrameQuantity && onUpdateFrameQuantity(format as keyof FrameSelection, quantity + 1)}
                      className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <span className="font-semibold w-20 text-right">{total.toFixed(2)}€</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Version Mobile */}
      <div className="md:hidden space-y-4">
        {cart.map((format, formatIndex) => {
          const { forMe, gifts } = groupPhotosByDestination(format)
          
          return (
            <div key={formatIndex} className="bg-white rounded-xl shadow-lg p-4">
              {/* Format */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-semibold">{formatDisplay(format.format)}</div>
                </div>
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

              {/* Photos et destinations */}
              <div className="space-y-3">
                {forMe.length > 0 && (
                  <div className="flex gap-4 pb-3 border-b">
                    <div className="flex gap-2 flex-wrap flex-1">
                      {forMe.map((photo) => (
                        <div key={photo.id} className="relative">
                          <div className="relative">
                            <img 
                              src={photo.photoPreview} 
                              alt=""
                              className="w-12 h-12 object-cover rounded"
                            />
                            {photo.quantity > 1 && (
                              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                {photo.quantity}
                              </span>
                            )}
                            {/* Mini indicateur message */}
                            {photo.message && (
                              <MessageSquare className="absolute bottom-0.5 right-0.5 w-2 h-2 text-white bg-pink-500/80 rounded-full p-0.5" />
                            )}
                          </div>
                          {photo.message && (
                            <div className="text-[10px] text-gray-600 italic mt-1 max-w-12 break-words">
                              {photo.message}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="text-sm text-gray-600">Pour moi</div>
                  </div>
                )}

                {Object.entries(gifts).map(([key, giftPhotos]) => {
                  const firstPhoto = giftPhotos[0]
                  return (
                    <div key={key} className="flex gap-4 pb-3 border-b">
                      <div className="flex gap-2 flex-wrap flex-1">
                        {giftPhotos.map((photo) => (
                          <div key={photo.id} className="relative">
                            <div className="relative">
                              <img 
                                src={photo.photoPreview} 
                                alt=""
                                className="w-12 h-12 object-cover rounded"
                              />
                              {photo.quantity > 1 && (
                                <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                                  {photo.quantity}
                                </span>
                              )}
                              {/* Mini indicateur message */}
                              {photo.message && (
                                <MessageSquare className="absolute bottom-0.5 right-0.5 w-2 h-2 text-white bg-pink-500/80 rounded-full p-0.5" />
                              )}
                            </div>
                            {photo.message && (
                              <div className="text-[10px] text-gray-600 italic mt-1 max-w-12 break-words">
                                {photo.message}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="text-xs">
                        <div className="font-medium text-purple-600">Cadeau</div>
                        <div>{firstPhoto.giftFirstName} {firstPhoto.giftLastName}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Prix */}
              <div className="mt-3 pt-3 text-right">
                <span className="font-semibold text-lg">
                  {calculateFormatTotal(format).toFixed(2)}€
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Délais de livraison */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-4">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-orange-500" />
          Délais de livraison estimés
        </h3>
        <div className="flex items-center justify-between bg-orange-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-orange-600" />
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
            <span className="font-semibold">{subtotal.toFixed(2)}€</span>
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
          
          {framesTotal > 0 && (
            <div className="flex justify-between">
              <span>Cadres ({totalFrames})</span>
              <span className="font-semibold">{framesTotal.toFixed(2)}€</span>
            </div>
          )}
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>Frais de livraison</span>
            <span>{shipping.toFixed(2)}€</span>
          </div>
          
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
          
          <div className="pt-3 border-t flex justify-between text-xl font-bold">
            <span>Total</span>
            <div className="text-right">
              {promoDiscount > 0 && (
                <span className="text-sm text-gray-400 line-through block">{totalBeforePromo.toFixed(2)}€</span>
              )}
              <span className="text-orange-600">{total.toFixed(2)}€</span>
            </div>
          </div>
          
          {/* Message d'économie */}
          {(pricingData.duoDiscount + pricingData.tierDiscount + promoDiscount) > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <span className="text-green-700 font-semibold">
                Vous économisez {(pricingData.duoDiscount + pricingData.tierDiscount + promoDiscount).toFixed(2)}€ !
              </span>
            </div>
          )}
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