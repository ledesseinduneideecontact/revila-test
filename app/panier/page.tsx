'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CartItem, PRICING } from '@/types'
import { detectStripeBlocked, getStripeBlockedMessage } from './stripe-detector'
import { ArrowLeft, Check, CreditCard } from 'lucide-react'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm({ 
  paymentData
}: { 
  paymentData: any
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) return

    setIsProcessing(true)
    setError(null)

    try {
      console.log('💳 Confirmation du paiement avec clientSecret:', paymentData.clientSecret)

      // Vérifier d'abord si le payment intent est toujours valide
      try {
        const validationResponse = await fetch(`/api/orders/validate-payment-intent/${paymentData.clientSecret.split('_secret_')[0]}`)
        const validationData = await validationResponse.json()
        
        if (!validationResponse.ok) {
          console.error('❌ Payment intent invalide:', validationData)
          setError('Le paiement a expiré. Veuillez recommencer votre commande.')
          sessionStorage.removeItem('paymentData')
          return
        }
        
        if (!validationData.validation.is_valid) {
          console.error('❌ Payment intent status invalide:', validationData.paymentIntent.status)
          setError('Le statut du paiement est invalide. Veuillez recommencer votre commande.')
          sessionStorage.removeItem('paymentData')
          return
        }
        
        console.log('✅ Payment intent validé:', validationData.paymentIntent.status)
        
      } catch (validationError) {
        console.error('❌ Erreur lors de la validation du payment intent:', validationError)
        setError('Impossible de valider le paiement. Veuillez recommencer votre commande.')
        sessionStorage.removeItem('paymentData')
        return
      }

      // Confirmer le paiement avec le clientSecret déjà créé
      const result = await stripe.confirmCardPayment(paymentData.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
          billing_details: {
            name: `${paymentData.customerInfo.firstName} ${paymentData.customerInfo.lastName}`,
            email: paymentData.customerInfo.email,
            phone: paymentData.customerInfo.phone,
            address: {
              line1: paymentData.customerInfo.address,
              postal_code: paymentData.customerInfo.postalCode,
              city: paymentData.customerInfo.city,
              country: 'FR',
            },
          },
        },
      })

      if (result.error) {
        console.error('❌ Erreur de paiement:', result.error)
        
        // Gestion spécifique des erreurs Stripe
        if (result.error.type === 'card_error') {
          setError(`Erreur de carte: ${result.error.message}`)
        } else if (result.error.type === 'validation_error') {
          setError(`Erreur de validation: ${result.error.message}`)
        } else if (result.error.type === 'invalid_request_error') {
          setError('Le paiement a expiré ou est invalide. Veuillez recommencer votre commande.')
          sessionStorage.removeItem('paymentData')
        } else {
          setError(result.error.message || 'Erreur de paiement')
        }
      } else {
        // Paiement réussi - le webhook Stripe se chargera du reste
        console.log(`✅ Paiement réussi pour la commande ${paymentData.orderNumber} avec ${paymentData.filesUploaded} fichiers`)
        
        // Nettoyer le sessionStorage
        sessionStorage.removeItem('paymentData')

        // Rediriger vers la page de confirmation
        router.push(`/confirmation?order=${paymentData.orderId}&payment=success`)
      }
    } catch (err) {
      console.error('❌ Erreur lors du paiement:', err)
      setError(err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.')
    }

    setIsProcessing(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="border border-border-light shadow-light bg-gradient-to-br from-blue-50 to-cyan-100 rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 text-text-white py-6 shadow-lg">
          <CardTitle className="text-xl font-bold flex items-center gap-3">
            <CreditCard className="w-5 h-5" />
            Informations de paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 bg-white/50 backdrop-blur-sm">
          <div className="space-y-4">
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
                  invalid: {
                    color: '#9e2146',
                  },
                },
                hidePostalCode: true,
                disableLink: true, // Désactive le bouton Link
                hideIcon: false,
                iconStyle: 'solid',
              }}
            />
            <p className="text-sm text-gray-600 text-center">
              Entrez vos informations de carte bancaire ci-dessus
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-soft">
          <p className="font-medium">Erreur de paiement</p>
          <p className="text-sm mt-1">{error}</p>
          {(error.includes('Failed to fetch') || error.includes('ERR_BLOCKED_BY_CLIENT')) && (
            <div className="mt-2 text-sm">
              <p className="font-medium">🛡️ Bloqueur de publicités détecté :</p>
              <ul className="list-disc list-inside mt-1">
                <li>Désactivez temporairement uBlock Origin/AdBlock pour localhost</li>
                <li>Ou testez en mode navigation privée</li>
                <li>Ou ajoutez *.stripe.com à votre liste blanche</li>
              </ul>
            </div>
          )}
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold shadow-lg"
        disabled={!stripe || isProcessing}
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            Traitement en cours...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-3">
            <Check className="w-6 h-6" />
            Valider la commande • {paymentData.total.toFixed(2)}€
          </span>
        )}
      </Button>

      {/* Garanties de sécurité */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Paiement 100% sécurisé</span>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>SSL/TLS 256 bits</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h3 className="font-semibold text-center mb-4">Vos garanties</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">Livraison garantie</p>
                <p className="text-gray-600 text-xs">Sous 7-10 jours ouvrés</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">Satisfait ou remboursé</p>
                <p className="text-gray-600 text-xs">Garantie 30 jours</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="font-medium">Service client</p>
                <p className="text-gray-600 text-xs">7j/7 par email</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            En validant cette commande, vous acceptez nos{' '}
            <a href="#" className="underline hover:text-gray-700">conditions générales de vente</a>
          </p>
        </div>
      </div>
    </form>
  )
}

export default function Panier() {
  const router = useRouter()
  const [paymentData, setPaymentData] = useState<any>(null)
  const [stripeBlocked, setStripeBlocked] = useState(false)

  useEffect(() => {
    // Récupérer les données de paiement du sessionStorage
    const storedPaymentData = sessionStorage.getItem('paymentData')

    if (!storedPaymentData) {
      console.warn('⚠️ Aucune donnée de paiement trouvée, redirection vers /commander')
      router.push('/commander')
      return
    }

    const data = JSON.parse(storedPaymentData)
    console.log('💳 Données de paiement récupérées:', {
      orderNumber: data.orderNumber,
      total: data.total,
      filesUploaded: data.filesUploaded
    })
    
    setPaymentData(data)
    
    // Détecter si Stripe est bloqué
    detectStripeBlocked().then(blocked => {
      setStripeBlocked(blocked)
      if (blocked) {
        console.warn('⚠️ Stripe is blocked by adblocker')
      }
    })
  }, [router])

  if (!paymentData) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white py-8 shadow-xl border-b border-border-light">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-black text-accent-primary tracking-tight">
              REVILA
            </h1>
            <p className="text-text-secondary mt-3 font-semibold text-lg">Photos magiques qui prennent vie</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/commander')}
            className="flex items-center gap-2 text-accent-primary hover:text-accent-secondary"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la commande
          </Button>
          <h2 className="text-3xl font-bold">Finaliser votre commande</h2>
          <div></div> {/* Spacer for centering */}
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Récapitulatif de la commande */}
          <Card className="border border-border-light shadow-light bg-gradient-to-br from-green-50 to-green-100 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 text-text-white py-6 shadow-lg">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Check className="w-5 h-5" />
                Récapitulatif de la commande
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4 bg-white/50 backdrop-blur-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Commande</span>
                  <span className="font-medium">{paymentData.orderNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sous-total</span>
                  <span>{(paymentData.subtotal ?? (paymentData.total - PRICING.shipping)).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between">
                  <span>Livraison</span>
                  <span>{(paymentData.shipping ?? PRICING.shipping).toFixed(2)}€</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{paymentData.total.toFixed(2)}€</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vos informations */}
          <Card>
            <CardHeader>
              <CardTitle>Vos informations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">
                {paymentData.customerInfo.firstName} {paymentData.customerInfo.lastName}
              </p>
              <p>{paymentData.customerInfo.address}</p>
              <p>
                {paymentData.customerInfo.postalCode} {paymentData.customerInfo.city}
              </p>
              <p>{paymentData.customerInfo.country}</p>
              <p className="mt-2 text-gray-600">{paymentData.customerInfo.email}</p>
              {paymentData.customerInfo.phone && (
                <p className="text-gray-600">{paymentData.customerInfo.phone}</p>
              )}
            </CardContent>
          </Card>

          {/* Informations de paiement */}
          {stripeBlocked ? (
            <Card>
              <CardHeader>
                <CardTitle>🛡️ Bloqueur de publicités détecté</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Votre bloqueur de publicités empêche le chargement du système de paiement sécurisé Stripe.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-soft">
                  <p className="font-medium text-yellow-800 mb-2">Solutions :</p>
                  <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
                    <li>Désactivez temporairement votre bloqueur pour localhost</li>
                    <li>Ajoutez *.stripe.com à votre liste blanche</li>
                    <li>Testez en mode navigation privée</li>
                  </ol>
                </div>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                  variant="outline"
                >
                  🔄 Réessayer après désactivation du bloqueur
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Elements stripe={stripePromise}>
              <CheckoutForm
                paymentData={paymentData}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  )
}