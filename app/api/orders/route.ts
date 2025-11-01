import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { CartItem } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { cartItems, customerInfo, total } = await request.json()

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
    const shippingAmount = 2.99
    const subtotalAmount = total - shippingAmount
    const discountAmount = 0
    
    // Créer la commande
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
        order_status: 'received',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Créer le PaymentIntent Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Montant en centimes
      currency: 'eur',
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
      },
    })

    // Mettre à jour la commande avec l'ID du PaymentIntent
    await supabaseAdmin
      .from('orders')
      .update({ payment_intent_id: paymentIntent.id })
      .eq('id', order.id)

    // Stocker temporairement les cartItems pour les traiter après le paiement
    try {
      await supabaseAdmin.storage
        .from('revive-temp')
        .upload(`orders/${order.id}/cart-items.json`, JSON.stringify(cartItems))
    } catch (storageError) {
      console.warn('Storage error (non-critical):', storageError)
      // Continuer sans bloquer si le stockage échoue
    }

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
    })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la commande' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers (
          first_name,
          last_name,
          email
        ),
        order_items (*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json(orders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des commandes' },
      { status: 500 }
    )
  }
}