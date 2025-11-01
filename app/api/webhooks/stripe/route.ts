import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { processWebhookEvent, markWebhookCompleted } from '@/lib/webhook-deduplication'
import { triggerN8NWebhook } from '@/lib/n8n-webhook'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('No Stripe signature found')
      return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event
    try {
      // Vérifier la signature du webhook
      console.log('🔐 STRIPE_WEBHOOK_SECRET configured:', !!process.env.STRIPE_WEBHOOK_SECRET)
      
      // Vérifier si le webhook secret est configuré correctement
      if (!process.env.STRIPE_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET === 'whsec_your_webhook_secret_here') {
        console.warn('⚠️ STRIPE_WEBHOOK_SECRET non configuré ou utilise la valeur par défaut!')
        console.warn('👉 Configurez un webhook dans Stripe Dashboard: https://dashboard.stripe.com/test/webhooks')
        console.warn('👉 Ou utilisez Stripe CLI: stripe listen --forward-to localhost:3004/api/webhooks/stripe')
      }
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error(`❌ Webhook signature verification failed:`, err)
      console.log('📝 Signature received:', signature)
      console.log('🔑 Secret configured:', process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + '...')
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 400 })
    }

    console.log('Received Stripe webhook:', event.type)

    // Gérer les événements Stripe
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object, event.id)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentSuccess(paymentIntent: any, stripeEventId: string) {
  const orderId = paymentIntent.metadata.orderId
  let eventId: string | undefined

  try {
    console.log('🔄 Processing Stripe payment success:', paymentIntent.id)
    
    if (!orderId) {
      console.error('❌ No orderId in payment intent metadata')
      return
    }

    // 🔍 VÉRIFICATION CRITIQUE: S'assurer que la commande a des order_items
    console.log('🔍 Vérification de l\'intégrité de la commande:', orderId)
    
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('id, item_number, categorie, quantity')
      .eq('order_id', orderId)
    
    if (itemsError) {
      console.error('❌ Erreur lors de la vérification des order_items:', itemsError)
      throw new Error('Impossible de vérifier les articles de la commande')
    }
    
    if (!orderItems || orderItems.length === 0) {
      console.error('❌❌❌ ALERTE CRITIQUE: Paiement reçu mais AUCUN order_item trouvé!')
      console.error('   - Order ID:', orderId)
      console.error('   - Payment Intent:', paymentIntent.id)
      console.error('   - Amount:', paymentIntent.amount / 100, '€')
      
      // Marquer la commande comme ayant un problème
      await supabaseAdmin
        .from('orders')
        .update({
          order_status: 'error',
          payment_status: 'paid_but_incomplete',
          notes: 'ERREUR: Paiement reçu mais aucun article trouvé. Intervention manuelle requise.',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
      
      // Créer une alerte dans une table d'erreurs si elle existe
      try {
        await supabaseAdmin
          .from('system_alerts')
          .insert({
            type: 'critical',
            message: `Commande ${orderId} payée mais sans articles`,
            order_id: orderId,
            payment_intent_id: paymentIntent.id,
            amount_cents: paymentIntent.amount,
            created_at: new Date().toISOString()
          })
      } catch (err) {
        console.log('Table system_alerts non disponible')
      }
      
      // NE PAS déclencher N8N pour une commande incomplète
      console.error('🚫 N8N NON déclenché - commande incomplète')
      return
    }
    
    console.log(`✅ Intégrité confirmée: ${orderItems.length} articles trouvés`)
    orderItems.forEach(item => {
      console.log(`   - Item ${item.item_number}: ${item.categorie} (qty: ${item.quantity})`)
    })

    // 🔒 Vérification de déduplication
    const { shouldProcess, isFirstTime, eventId: webhookEventId } = await processWebhookEvent({
      orderId,
      eventType: 'stripe_webhook',
      stripeEventId
    })

    eventId = webhookEventId

    if (!shouldProcess) {
      console.log(`⚠️  Webhook Stripe déjà traité pour commande ${orderId}`)
      return
    }

    console.log(`✅ Traitement autorisé pour commande ${orderId} (première fois: ${isFirstTime})`)

    // 1. Mettre à jour le statut de la commande
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        order_status: 'in_production',
        payment_status: 'paid',
        payment_intent_id: paymentIntent.id,
        stripe_payment_intent_id: paymentIntent.id, // Doublon pour compatibilité
        items_count: orderItems.length, // Stocker le nombre d'items pour vérification
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('❌ Error updating order status:', updateError)
      throw updateError
    }

    // 2. Déclencher N8N
    console.log('🚀 Déclenchement N8N depuis webhook Stripe')
    const n8nSuccess = await triggerN8NWebhook(orderId)
    
    // 3. Marquer comme terminé
    await markWebhookCompleted(eventId, n8nSuccess)

    console.log(`✅ Webhook Stripe traité avec succès pour commande ${orderId}`)

  } catch (error) {
    console.error('❌ Erreur traitement webhook Stripe:', error)
    
    // Marquer comme échoué si on a un eventId
    if (eventId) {
      try {
        await markWebhookCompleted(eventId, false)
      } catch (markError) {
        console.error('❌ Erreur marquage échec:', markError)
      }
    }
    
    // Ne pas faire échouer le webhook Stripe pour éviter les retries
    // Stripe va continuer à renvoyer le webhook si on retourne une erreur
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    console.log('Processing payment failure:', paymentIntent.id)
    
    const orderId = paymentIntent.metadata.orderId
    if (!orderId) {
      console.error('No orderId in payment intent metadata')
      return
    }

    // Mettre à jour le statut de la commande
    await supabaseAdmin
      .from('orders')
      .update({ 
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    console.log('Payment failure processed for order:', orderId)
  } catch (error) {
    console.error('Error handling payment failure:', error)
  }
}