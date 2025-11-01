import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  console.log('🧪 Test Stripe - Creating PaymentIntent...')
  
  try {
    const { amount } = await request.json()
    
    // Vérifier que Stripe est configuré
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        error: 'STRIPE_SECRET_KEY manquante',
        help: 'Vérifiez votre fichier .env.local'
      }, { status: 500 })
    }

    // Créer un PaymentIntent simple
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount || 1000, // 10€ par défaut
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        test: 'true',
        timestamp: new Date().toISOString()
      }
    })

    console.log('✅ PaymentIntent créé:', paymentIntent.id)

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status
    })
  } catch (error: any) {
    console.error('❌ Erreur Stripe:', error)
    
    return NextResponse.json({
      error: error.message,
      type: error.type,
      code: error.code,
      stripeVersion: error.headers?.['stripe-version']
    }, { status: 500 })
  }
}