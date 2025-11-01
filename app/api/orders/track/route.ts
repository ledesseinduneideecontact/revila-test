import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: API en LECTURE SEULE uniquement
// Cette route ne doit JAMAIS modifier les données

export async function POST(request: NextRequest) {
  console.log('📍 Track order API called')
  
  try {
    // Parser le body de la requête
    const body = await request.json()
    const orderNumber = body.orderNumber
    
    console.log('🔍 Looking for order:', orderNumber)

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Numéro de commande requis' },
        { status: 400 }
      )
    }

    // Validation du format du numéro de commande
    if (!orderNumber.startsWith('REV-')) {
      return NextResponse.json(
        { error: 'Format de numéro de commande invalide' },
        { status: 400 }
      )
    }

    // Récupérer les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      )
    }
    
    // Créer le client Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. Récupérer la commande
    console.log('📋 Fetching order...')
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !order) {
      console.log('Order not found:', orderNumber)
      return NextResponse.json(
        { error: 'Commande introuvable' },
        { status: 404 }
      )
    }
    
    console.log('✅ Order found:', order.id)

    // 2. Récupérer le client
    let customer = null
    if (order.customer_id) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('first_name, last_name, email, phone, address, postal_code, city')
        .eq('id', order.customer_id)
        .single()
      
      customer = customerData
    }

    // 3. Récupérer les articles
    const { data: items } = await supabase
      .from('order_items')
      .select(`
        item_number,
        categorie,
        quantity,
        unit_price,
        unit_price_cents,
        line_total_cents,
        photo_filename,
        video_filename,
        message_text,
        message_signature,
        cadeau,
        nom,
        adresse,
        code_postal,
        ville
      `)
      .eq('order_id', order.id)
      .order('item_number', { ascending: true })

    // Formater la réponse
    const response = {
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status || 'pending',
        created_at: order.created_at,
        total_amount: order.total_amount || 0,
        subtotal_amount: order.subtotal_amount || 0,
        discount_amount: order.discount_amount || 0,
        shipping_cost: order.shipping_cost || 0,
        promo_code: order.promo_code || null
      },
      customer: customer || {
        first_name: '',
        last_name: '',
        email: '',
        phone: null,
        address: null,
        postal_code: null,
        city: null
      },
      items: items || []
    }

    console.log(`✅ Order ${orderNumber} retrieved successfully`)

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Track order error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération de la commande',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Méthode GET pour info
export async function GET() {
  return NextResponse.json({
    message: 'API de consultation des commandes',
    method: 'POST',
    required: { orderNumber: 'REV-XXXXXXXXXXXX-XXXXXXXXX' },
    note: 'Cette API est en lecture seule uniquement'
  })
}