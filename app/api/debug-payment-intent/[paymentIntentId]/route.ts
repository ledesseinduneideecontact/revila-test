import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  try {
    const { paymentIntentId } = await params
    
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        error: 'STRIPE_SECRET_KEY manquante',
        paymentIntentId
      }, { status: 500 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-06-30.basil',
    })

    console.log(`🔍 Recherche du payment intent: ${paymentIntentId}`)

    try {
      // Essayer de récupérer le payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: new Date(paymentIntent.created * 1000).toISOString(),
          metadata: paymentIntent.metadata,
          last_payment_error: paymentIntent.last_payment_error,
          client_secret: paymentIntent.client_secret
        },
        environment: {
          STRIPE_SECRET_KEY: 'SET',
          NODE_ENV: process.env.NODE_ENV
        }
      })

    } catch (stripeError: any) {
      console.error(`❌ Erreur Stripe pour ${paymentIntentId}:`, stripeError)
      
      return NextResponse.json({
        success: false,
        error: stripeError.message,
        error_type: stripeError.type,
        paymentIntentId,
        suggestions: [
          'Le payment intent a peut-être expiré (24h)',
          'Vérifiez que l\'ID est correct',
          'Le payment intent a peut-être été annulé',
          'Problème de synchronisation avec Stripe'
        ]
      }, { status: 404 })

    }

  } catch (error) {
    console.error('❌ Erreur générale:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 