import { NextRequest, NextResponse } from 'next/server'
import { processWebhookEvent, markWebhookCompleted } from '@/lib/webhook-deduplication'
import { triggerN8NWebhook } from '@/lib/n8n-webhook'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Route de confirmation alternative (backup du webhook Stripe)
 * Utilisée par la page /confirmation si le webhook Stripe a échoué
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      console.error('❌ Order ID manquant dans la requête de confirmation')
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    console.log(`🔄 Traitement route de confirmation pour commande ${orderId}`)

    // 🔍 VÉRIFICATION CRITIQUE: S'assurer que la commande a des order_items
    console.log('🔍 Vérification de l\'intégrité avant confirmation...')
    
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('id, item_number, categorie, quantity')
      .eq('order_id', orderId)
    
    if (itemsError) {
      console.error('❌ Erreur lors de la vérification des order_items:', itemsError)
      return NextResponse.json({ 
        error: 'Impossible de vérifier les articles',
        details: itemsError.message
      }, { status: 500 })
    }
    
    if (!orderItems || orderItems.length === 0) {
      console.error('❌❌❌ ALERTE: Tentative de confirmation sans order_items!')
      console.error('   - Order ID:', orderId)
      
      // Marquer la commande comme problématique
      await supabaseAdmin
        .from('orders')
        .update({
          order_status: 'error',
          notes: 'ERREUR: Tentative de confirmation sans articles. Vérification requise.',
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
      
      return NextResponse.json({ 
        error: 'Commande incomplète',
        message: 'La commande ne contient aucun article. Veuillez contacter le support.',
        orderId,
        itemCount: 0
      }, { status: 400 })
    }
    
    console.log(`✅ Intégrité confirmée: ${orderItems.length} articles trouvés`)
    orderItems.forEach(item => {
      console.log(`   - Item ${item.item_number}: ${item.categorie} (qty: ${item.quantity})`)
    })

    // 🔒 Vérification de déduplication
    const { shouldProcess, isFirstTime, eventId } = await processWebhookEvent({
      orderId,
      eventType: 'confirm_route'
    })

    if (!shouldProcess) {
      console.log(`⚠️  Route de confirmation déjà traitée pour commande ${orderId}`)
      return NextResponse.json({ 
        message: 'Already processed',
        duplicate: true,
        isFirstTime 
      })
    }

    console.log(`✅ Traitement autorisé pour commande ${orderId} (première fois: ${isFirstTime})`)

    // Mettre à jour le statut de paiement (backup si webhook Stripe n'a pas fonctionné)
    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ 
        order_status: 'in_production',
        payment_status: 'paid',
        items_count: orderItems.length,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
    
    if (updateError) {
      console.error('❌ Erreur mise à jour statut commande:', updateError)
    } else {
      console.log('✅ Statut commande mis à jour: payment_status = paid')
    }

    // Déclencher N8N
    console.log('🚀 Déclenchement N8N depuis route de confirmation')
    const n8nSuccess = await triggerN8NWebhook(orderId)
    
    if (!n8nSuccess) {
      console.warn(`⚠️  Échec N8N pour commande ${orderId} depuis route de confirmation`)
    }
    
    // Marquer comme terminé (même si N8N a échoué, pour éviter les boucles)
    await markWebhookCompleted(eventId, n8nSuccess)

    console.log(`✅ Route de confirmation traitée pour commande ${orderId}`)
    
    return NextResponse.json({ 
      message: 'Confirmation processed successfully',
      isFirstTime,
      n8nTriggered: n8nSuccess
    })

  } catch (error) {
    console.error('❌ Erreur route de confirmation:', error)
    return NextResponse.json({ 
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}