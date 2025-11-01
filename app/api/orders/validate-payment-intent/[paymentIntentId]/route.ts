import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  try {
    const { paymentIntentId } = await params
    
    console.log(`🔍 Validating payment intent: ${paymentIntentId}`)

    // Vérifier que les variables d'environnement sont présentes
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        error: 'Configuration manquante',
        details: 'STRIPE_SECRET_KEY manquante'
      }, { status: 500 })
    }

    // Import dynamique pour éviter les erreurs de build
    const { stripe } = await import('@/lib/stripe')
    const { supabaseAdmin } = await import('@/lib/supabase')

    try {
      // Récupérer le payment intent depuis Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      console.log(`✅ PaymentIntent found: ${paymentIntent.id} (status: ${paymentIntent.status})`)

      // Récupérer la commande associée depuis Supabase
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          customers (
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('payment_intent_id', paymentIntentId)
        .single()

      if (orderError) {
        console.error('❌ Order not found for payment intent:', orderError)
        return NextResponse.json({
          error: 'Commande non trouvée',
          details: 'Aucune commande associée à ce payment intent',
          paymentIntent: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            created: new Date(paymentIntent.created * 1000).toISOString()
          }
        }, { status: 404 })
      }

      // Vérifier la cohérence des montants
      const amountMismatch = paymentIntent.amount !== Math.round(order.total_amount * 100)
      
      return NextResponse.json({
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          created: new Date(paymentIntent.created * 1000).toISOString(),
          metadata: paymentIntent.metadata,
          client_secret: paymentIntent.client_secret
        },
        order: {
          id: order.id,
          order_number: order.order_number,
          total_amount: order.total_amount,
          payment_status: order.payment_status,
          order_status: order.order_status,
          customer: order.customers
        },
        validation: {
          amount_matches: !amountMismatch,
          amount_mismatch_details: amountMismatch ? {
            stripe_amount: paymentIntent.amount,
            order_amount: Math.round(order.total_amount * 100)
          } : null,
          is_valid: paymentIntent.status === 'requires_payment_method' || 
                   paymentIntent.status === 'requires_confirmation' ||
                   paymentIntent.status === 'requires_action'
        }
      })

    } catch (stripeError: any) {
      console.error(`❌ Stripe error for ${paymentIntentId}:`, stripeError)
      
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
    console.error('❌ General error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 