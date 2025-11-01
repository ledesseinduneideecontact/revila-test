import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST() {
  try {
    console.log('🧪 Quick payment test starting...')

    // 1. Tester la connexion Stripe
    console.log('🔌 Testing Stripe connection...')
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1599, // 15.99€
      currency: 'eur',
      metadata: {
        test: 'true',
        orderId: 'test-quick-' + Date.now()
      },
    })
    
    console.log('✅ PaymentIntent created:', paymentIntent.id)

    // 2. Tester la base de données
    console.log('🗄️ Testing database connection...')
    const { data: testCustomer, error: dbError } = await supabaseAdmin
      .from('customers')
      .insert({
        first_name: 'Quick',
        last_name: 'Test',
        email: `quick-test-${Date.now()}@example.com`,
        phone: '0123456789'
      })
      .select()
      .single()

    if (dbError) {
      console.error('❌ Database test failed:', dbError)
      throw dbError
    }

    console.log('✅ Customer created:', testCustomer.id)

    // 3. Nettoyer (supprimer le client de test)
    await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', testCustomer.id)

    console.log('🧹 Test data cleaned up')

    return NextResponse.json({
      success: true,
      message: 'Quick payment test completed successfully',
      results: {
        stripe: {
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status
        },
        database: {
          customerCreated: testCustomer.id,
          cleaned: true
        },
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          stripeMode: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('test') ? 'test' : 'live'
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Quick payment test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}