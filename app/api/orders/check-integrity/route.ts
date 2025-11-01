import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const checkAll = searchParams.get('checkAll') === 'true'
    
    if (!checkAll && !orderId) {
      return NextResponse.json({ 
        error: 'Paramètre manquant',
        help: 'Utilisez ?orderId=xxx ou ?checkAll=true' 
      }, { status: 400 })
    }

    if (orderId) {
      // Vérifier une commande spécifique
      const result = await checkOrderIntegrity(orderId)
      return NextResponse.json(result)
    }

    // Vérifier toutes les commandes récentes (dernières 24h)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: recentOrders, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, payment_status, total_cents')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false })
    
    if (error) {
      throw error
    }
    
    const results = []
    for (const order of recentOrders || []) {
      const integrity = await checkOrderIntegrity(order.id)
      results.push({
        orderId: order.id,
        orderNumber: order.order_number,
        ...integrity
      })
    }
    
    const problematicOrders = results.filter(r => !r.isValid)
    
    return NextResponse.json({
      totalOrders: results.length,
      validOrders: results.filter(r => r.isValid).length,
      problematicOrders: problematicOrders.length,
      problems: problematicOrders,
      allResults: results
    })
    
  } catch (error) {
    console.error('Erreur lors de la vérification d\'intégrité:', error)
    return NextResponse.json({ 
      error: 'Erreur de vérification',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

async function checkOrderIntegrity(orderId: string) {
  try {
    // 1. Récupérer la commande
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    
    if (orderError || !order) {
      return {
        isValid: false,
        error: 'Commande non trouvée',
        orderId
      }
    }
    
    // 2. Récupérer les order_items
    const { data: items, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)
    
    if (itemsError) {
      return {
        isValid: false,
        error: 'Erreur lors de la récupération des items',
        orderId,
        orderNumber: order.order_number
      }
    }
    
    const itemCount = items?.length || 0
    
    // 3. Vérifier le PaymentIntent Stripe si payé
    let stripeStatus = null
    if (order.payment_status === 'paid' && order.stripe_payment_intent_id) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(
          order.stripe_payment_intent_id
        )
        stripeStatus = {
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          matchesOrder: paymentIntent.amount === order.total_cents
        }
      } catch (stripeError) {
        console.error('Erreur Stripe:', stripeError)
        stripeStatus = { error: 'Impossible de vérifier le paiement Stripe' }
      }
    }
    
    // 4. Analyser les problèmes
    const problems = []
    
    if (itemCount === 0) {
      problems.push('CRITIQUE: Aucun order_item trouvé')
    }
    
    if (order.payment_status === 'paid' && itemCount === 0) {
      problems.push('CRITIQUE: Commande payée mais sans articles')
    }
    
    if (stripeStatus && !stripeStatus.matchesOrder) {
      problems.push(`Montant Stripe (${stripeStatus.amount}) ne correspond pas au total (${order.total_cents})`)
    }
    
    // 5. Calculer le total des items
    let calculatedTotal = 0
    if (items && items.length > 0) {
      calculatedTotal = items.reduce((sum, item) => {
        return sum + (item.line_total_cents || 0)
      }, 0)
      
      // Ajouter les frais de livraison
      calculatedTotal += order.shipping_cents || 299 // 2.99€ par défaut
      
      // Soustraire la réduction
      if (order.discount_cents) {
        calculatedTotal -= order.discount_cents
      }
      
      const difference = Math.abs(calculatedTotal - order.total_cents)
      if (difference > 10) { // Tolérance de 10 centimes
        problems.push(`Total calculé (${calculatedTotal}) ne correspond pas au total commande (${order.total_cents})`)
      }
    }
    
    // 6. Vérifier les fichiers uploadés
    const itemsWithoutFiles = items?.filter(item => 
      item.categorie?.startsWith('photo-') && 
      !item.photo_gcs_url && 
      !item.video_gcs_url
    ) || []
    
    if (itemsWithoutFiles.length > 0) {
      problems.push(`${itemsWithoutFiles.length} article(s) sans fichiers uploadés`)
    }
    
    return {
      isValid: problems.length === 0,
      orderId,
      orderNumber: order.order_number,
      paymentStatus: order.payment_status,
      orderStatus: order.order_status,
      itemCount,
      totalCents: order.total_cents,
      calculatedTotalCents: calculatedTotal,
      stripeStatus,
      problems,
      createdAt: order.created_at,
      items: items?.map(i => ({
        item_number: i.item_number,
        categorie: i.categorie,
        quantity: i.quantity,
        hasPhoto: !!i.photo_gcs_url,
        hasVideo: !!i.video_gcs_url,
        unitPriceCents: i.unit_price_cents,
        lineTotalCents: i.line_total_cents
      }))
    }
    
  } catch (error) {
    console.error('Erreur checkOrderIntegrity:', error)
    return {
      isValid: false,
      error: 'Erreur lors de la vérification',
      details: error instanceof Error ? error.message : 'Erreur inconnue',
      orderId
    }
  }
}

// Route POST pour corriger les commandes problématiques
export async function POST(request: NextRequest) {
  try {
    const { orderId, action } = await request.json()
    
    if (!orderId || !action) {
      return NextResponse.json({ 
        error: 'Paramètres manquants',
        help: 'Envoyez { orderId, action: "markAsError" | "requestRefund" }' 
      }, { status: 400 })
    }
    
    const integrity = await checkOrderIntegrity(orderId)
    
    if (integrity.isValid) {
      return NextResponse.json({ 
        message: 'Cette commande n\'a pas de problème',
        integrity 
      })
    }
    
    switch (action) {
      case 'markAsError':
        // Marquer la commande comme ayant une erreur
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({
            order_status: 'error',
            notes: `Marqué comme erreur le ${new Date().toISOString()}. Problèmes: ${integrity.problems?.join(', ')}`
          })
          .eq('id', orderId)
        
        if (updateError) {
          throw updateError
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Commande marquée comme erreur',
          problems: integrity.problems
        })
        
      case 'requestRefund':
        // Créer une demande de remboursement
        if (integrity.stripeStatus && integrity.paymentStatus === 'paid') {
          // Ici vous pourriez créer un refund Stripe ou juste le marquer pour traitement manuel
          await supabaseAdmin
            .from('orders')
            .update({
              order_status: 'refund_requested',
              notes: `Remboursement demandé le ${new Date().toISOString()}. Problèmes: ${integrity.problems?.join(', ')}`
            })
            .eq('id', orderId)
          
          return NextResponse.json({ 
            success: true, 
            message: 'Demande de remboursement créée',
            note: 'Traitement manuel requis dans Stripe Dashboard'
          })
        }
        
        return NextResponse.json({ 
          error: 'Impossible de demander un remboursement',
          reason: 'Commande non payée ou paiement non vérifié'
        }, { status: 400 })
        
      default:
        return NextResponse.json({ 
          error: 'Action non reconnue',
          validActions: ['markAsError', 'requestRefund']
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Erreur lors de la correction:', error)
    return NextResponse.json({ 
      error: 'Erreur de correction',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}