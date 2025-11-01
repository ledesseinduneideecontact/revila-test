'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

function CheckoutForm() {
  const stripe = useStripe()
  const elements = useElements()
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return

    setLoading(true)
    setStatus('Création du PaymentIntent...')

    try {
      // 1. Créer un PaymentIntent simple de test
      const response = await fetch('/api/test-stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: 1000 }) // 10€
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur serveur')
      }

      setStatus('PaymentIntent créé ! Confirmation du paiement...')

      // 2. Confirmer le paiement
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      })

      if (result.error) {
        throw new Error(result.error.message)
      }

      setStatus(`✅ Paiement réussi ! ID: ${result.paymentIntent?.id}`)
    } catch (error: any) {
      setStatus(`❌ Erreur: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border rounded-lg p-4">
        <CardElement 
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': { color: '#aab7c4' }
              }
            }
          }}
        />
      </div>
      
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Traitement...' : 'Tester paiement (10€)'}
      </button>

      {status && (
        <div className={`p-4 rounded-lg ${status.includes('✅') ? 'bg-green-100' : status.includes('❌') ? 'bg-red-100' : 'bg-blue-100'}`}>
          <pre className="text-sm whitespace-pre-wrap">{status}</pre>
        </div>
      )}
    </form>
  )
}

export default function TestStripePage() {
  const [envStatus, setEnvStatus] = useState<any>(null)

  const checkEnv = async () => {
    const res = await fetch('/api/test-stripe-env')
    const data = await res.json()
    setEnvStatus(data)
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Test Stripe Integration</h1>
      
      <div className="space-y-6">
        {/* Section 1: Vérification des variables d'environnement */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">1. Variables d'environnement</h2>
          <button
            onClick={checkEnv}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Vérifier les variables
          </button>
          
          {envStatus && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="text-xs">{JSON.stringify(envStatus, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Section 2: Test de paiement */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">2. Test de paiement</h2>
          <p className="text-sm text-gray-600 mb-4">
            Carte test : 4242 4242 4242 4242 | Date: 12/34 | CVC: 123
          </p>
          <Elements stripe={stripePromise}>
            <CheckoutForm />
          </Elements>
        </div>

        {/* Section 3: Infos de debug */}
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">3. Informations de debug</h2>
          <div className="space-y-2 text-sm">
            <p>🔑 Clé publique Stripe : {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? '✅ Définie' : '❌ Manquante'}</p>
            <p>📍 URL actuelle : {typeof window !== 'undefined' && window.location.origin}</p>
            <p>🌐 Mode : {process.env.NODE_ENV}</p>
          </div>
        </div>
      </div>
    </div>
  )
}