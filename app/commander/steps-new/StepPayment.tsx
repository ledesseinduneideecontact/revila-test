'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Lock, CheckCircle, Shield, Truck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import type { CartFormat } from '../CommanderWizardNew'
import type { FrameSelection } from './StepOptions'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface StepPaymentProps {
  cart: CartFormat[]
  frameSelection?: FrameSelection
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    postalCode: string
    city: string
  }
  total: number
  onBack?: () => void
  promoCode?: string
  promoDiscount?: number
}

function PaymentForm({ cart, frameSelection, customerInfo, total, onBack, promoCode = '', promoDiscount = 0 }: StepPaymentProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setError(null)

    try {
      // Créer la commande et obtenir le clientSecret
      const formData = new FormData()
      
      // Ajouter les informations client
      formData.append('customerInfo', JSON.stringify(customerInfo))
      
      // Ajouter le montant total (déjà calculé avec réduction dans le parent)
      formData.append('total', total.toString())
      if (promoCode && promoDiscount > 0) {
        formData.append('promoCode', promoCode)
        formData.append('promoDiscount', promoDiscount.toString())
      }
      
      // Ajouter les sélections de cadres
      if (frameSelection) {
        formData.append('frameSelection', JSON.stringify(frameSelection))
      }
      
      // Ajouter les items du panier
      console.log('📦 Cart content before sending:', cart)
      cart.forEach((format, formatIndex) => {
        format.photos.forEach((photo, photoIndex) => {
          const key = `items[${formatIndex}_${photoIndex}]`
          
          console.log(`📸 Processing item ${key}:`, {
            hasPhotoFile: !!photo.photoFile,
            hasVideoFile: !!photo.videoFile,
            photoFileSize: photo.photoFile?.size,
            videoFileSize: photo.videoFile?.size
          })
          
          if (photo.photoFile) {
            formData.append(`${key}[photo]`, photo.photoFile)
          }
          if (photo.videoFile) {
            formData.append(`${key}[video]`, photo.videoFile)
          }
          
          formData.append(`${key}[format]`, format.format)
          formData.append(`${key}[withFrame]`, photo.withFrame.toString())
          formData.append(`${key}[quantity]`, photo.quantity.toString())
          formData.append(`${key}[message]`, photo.message || '')
          formData.append(`${key}[signature]`, photo.signature || '')
          formData.append(`${key}[isGift]`, photo.isGift.toString())
          
          if (photo.isGift) {
            formData.append(`${key}[giftFirstName]`, photo.giftFirstName || '')
            formData.append(`${key}[giftLastName]`, photo.giftLastName || '')
            formData.append(`${key}[giftAddress]`, photo.giftAddress || '')
            formData.append(`${key}[giftPostalCode]`, photo.giftPostalCode || '')
            formData.append(`${key}[giftCity]`, photo.giftCity || '')
          }
        })
      })

      const response = await fetch('/api/orders/create-with-payment', {
        method: 'POST',
        body: formData
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        console.error('❌ Failed to parse response as JSON')
        data = { error: 'Erreur serveur - réponse invalide' }
      }
      
      console.log('📡 API Response:', {
        ok: response.ok,
        status: response.status,
        data: data
      })

      if (!response.ok) {
        console.error('❌ API Error details:', data)
        const errorMessage = data?.details || data?.error || `Erreur ${response.status}: ${response.statusText}`
        throw new Error(errorMessage)
      }

      // Confirmer le paiement
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) throw new Error('Élément de carte non trouvé')

      const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: `${customerInfo.firstName} ${customerInfo.lastName}`,
            email: customerInfo.email,
            phone: customerInfo.phone,
            address: {
              line1: customerInfo.address,
              postal_code: customerInfo.postalCode,
              city: customerInfo.city,
              country: 'FR'
            }
          }
        }
      })

      if (stripeError) {
        throw new Error(stripeError.message)
      }

      // Vider le panier et la configuration avant de rediriger
      sessionStorage.removeItem('commanderConfig')
      sessionStorage.removeItem('cart')
      sessionStorage.removeItem('cartItems')
      sessionStorage.removeItem('currentFormat')
      sessionStorage.removeItem('currentPhotos')
      sessionStorage.removeItem('customerInfo')
      
      // Nettoyer aussi le localStorage pour cet email
      if (customerInfo.email) {
        localStorage.removeItem(`cart_${customerInfo.email}`)
      }
      
      sessionStorage.clear() // Nettoyer tout le sessionStorage pour être sûr
      
      // Rediriger vers la page de confirmation
      window.location.href = `/confirmation?orderId=${data.orderId}`

    } catch (err: any) {
      console.error('Erreur de paiement:', err)
      setError(err.message || 'Une erreur est survenue lors du paiement')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Bouton Retour */}
      {onBack && (
        <Button
          type="button"
          onClick={onBack}
          variant="outline"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux informations
        </Button>
      )}

      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold">Paiement sécurisé</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Informations de carte
            </label>
            <div className="p-3 border border-gray-300 rounded-lg">
              <CardElement 
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-semibold">Total à payer</span>
              <span className="text-2xl font-bold text-orange-600">{total.toFixed(2)}€</span>
            </div>
            <p className="text-xs text-gray-600">
              Inclut la TVA et les frais de livraison
              {promoCode && promoDiscount > 0 && (
                <span className="block text-green-600 mt-1">
                  Code promo {promoCode} appliqué (-{promoDiscount.toFixed(2)}€)
                </span>
              )}
            </p>
          </div>

          <Button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-3">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement du paiement en cours...
              </span>
            ) : (
              `Payer ${total.toFixed(2)}€`
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <Lock className="w-4 h-4" />
            <span>Paiement 100% sécurisé par Stripe</span>
          </div>
        </div>
      </div>

      {/* Image de garanties */}
      <div className="w-full">
        <img 
          src="/frontend-pictures/Simple Lined Watercolor Art Mockup Facebook Post (4).png"
          alt="Garanties et confiance"
          className="w-full h-auto rounded-lg"
        />
      </div>
    </form>
  )
}

export default function StepPayment(props: StepPaymentProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <Elements stripe={stripePromise}>
        <PaymentForm {...props} />
      </Elements>
    </div>
  )
}