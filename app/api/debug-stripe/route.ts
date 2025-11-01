import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(request: NextRequest) {
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-06-30.basil',
    })

    // Test de connexion Stripe
    const testPaymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // 10€ en centimes
      currency: 'eur',
      metadata: {
        test: 'true',
        source: 'debug-endpoint'
      }
    })

    // Récupérer les détails du payment intent
    const paymentIntentDetails = await stripe.paymentIntents.retrieve(testPaymentIntent.id)

    // Annuler le payment intent de test
    await stripe.paymentIntents.cancel(testPaymentIntent.id)

    return NextResponse.json({
      success: true,
      stripe_connection: 'OK',
      test_payment_intent: {
        id: testPaymentIntent.id,
        status: testPaymentIntent.status,
        amount: testPaymentIntent.amount,
        currency: testPaymentIntent.currency
      },
      environment: {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur diagnostic Stripe:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING',
        NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING',
        NODE_ENV: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 