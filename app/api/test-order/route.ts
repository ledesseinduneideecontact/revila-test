import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  console.log('🧪 Test order creation...')
  
  try {
    // Test simple de création PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // 10€
      currency: 'eur',
      automatic_payment_methods: {
        enabled: true,
      },
    })

    console.log('✅ Test PaymentIntent created:', paymentIntent.id)

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (error: any) {
    console.error('❌ Test order error:', error)
    return NextResponse.json({
      error: error.message,
      type: error.type,
      code: error.code
    }, { status: 500 })
  }
}