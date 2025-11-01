import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { CartItem } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { cartItems, customerInfo, total, promoCode, promoDiscount } = await request.json()

    // Créer le client
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
      })
      .select()
      .single()

    if (customerError) throw customerError

    // Générer un numéro de commande unique
    const orderNumber = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Calculer les montants
    const shippingAmount = total > 0 ? 2.99 : 0
    const subtotalAmount = Math.max(0, total - shippingAmount)
    const discountAmount = promoDiscount || 0
    
    // Créer la commande avec le statut "validated" (validée sans paiement)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        shipping_address: customerInfo.address,
        shipping_postal_code: customerInfo.postalCode,
        shipping_city: customerInfo.city,
        shipping_country: customerInfo.country,
        subtotal_amount: subtotalAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total_amount: total,
        discount_code: promoCode,
        order_status: 'in_production', // Directement en production
        payment_status: total === 0 ? 'free' : 'paid',
        payment_intent_id: null, // Pas de paiement Stripe
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Traiter chaque photo et créer les enregistrements
    for (let i = 0; i < cartItems.length; i++) {
      const item = cartItems[i]
      const position = i + 1

      // Les chemins de stockage (simples pour le moment)
      const photoPath = `commandes/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}/${order.order_number}/photo-${position}.jpg`
      const videoPath = `commandes/${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}/${order.order_number}/video-${position}.mp4`

      // Créer l'enregistrement de la création magique
      await supabaseAdmin
        .from('revive_creations')
        .insert({
          revive_order_ref: order.revive_order_id,
          photo_file_name: `photo-${position}.jpg`,
          video_file_name: `video-${position}.mp4`,
          message_text: item.message,
          message_signature: item.signature,
          storage_path_photo: photoPath,
          storage_path_video: videoPath,
          position_in_order: position,
        })
    }

    // Déclencher le webhook N8N
    const webhookUrl = process.env.NODE_ENV === 'development' 
      ? process.env.N8N_WEBHOOK_NEW_ORDER_TEST 
      : process.env.N8N_WEBHOOK_NEW_ORDER_PROD

    if (webhookUrl) {
      try {
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id
          }),
        })

        if (!webhookResponse.ok) {
          console.warn('Webhook N8N failed but order was created successfully')
        } else {
          console.log('Webhook N8N triggered successfully')
        }
      } catch (webhookError) {
        console.warn('Webhook N8N error:', webhookError)
        // On continue même si le webhook échoue
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
    })
  } catch (error) {
    console.error('Error validating order:', error)
    
    // Détail de l'erreur pour le debug
    let errorMessage = 'Erreur lors de la validation de la commande'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la validation de la commande',
        details: errorMessage,
        debug: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}