import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const orderNumber = searchParams.get('orderNumber')

    if (!email && !orderNumber) {
      return NextResponse.json(
        { error: 'Email ou numéro de commande requis' },
        { status: 400 }
      )
    }

    // Construire la requête de base
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        customer:customers!inner(
          prenom,
          nom,
          email,
          telephone,
          adresse,
          code_postal,
          ville,
          pays
        ),
        order_items(
          id,
          item_number,
          categorie,
          quantity,
          unit_price,
          unit_price_cents,
          line_total_cents,
          photo_gcs_url,
          video_gcs_url,
          message_text,
          message_signature,
          cadeau,
          nom,
          adresse,
          code_postal,
          ville,
          pays
        )
      `)

    // Ajouter les conditions de recherche
    if (email) {
      query = query.eq('customers.email', email)
    } else if (orderNumber) {
      query = query.eq('order_number', orderNumber)
    }

    // Trier par date de création décroissante et prendre la plus récente
    query = query.order('created_at', { ascending: false }).limit(1)

    const { data: orders, error } = await query

    if (error) {
      console.error('Erreur Supabase:', error)
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de la commande' },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { error: 'Aucune commande trouvée' },
        { status: 404 }
      )
    }

    // Formater la réponse
    const order = orders[0]
    const formattedOrder = {
      id: order.id,
      order_number: order.order_number,
      created_at: order.created_at,
      status: order.status,
      total_cents: order.total_cents || Math.round((order.total_amount || 0) * 100),
      subtotal_cents: order.subtotal_cents || Math.round((order.subtotal_amount || 0) * 100),
      shipping_cents: order.shipping_cents || Math.round((order.shipping_cost || 0) * 100),
      discount_cents: order.discount_cents || Math.round((order.discount_amount || 0) * 100),
      stripe_payment_intent_id: order.stripe_payment_intent_id,
      customer: order.customer,
      order_items: order.order_items.map((item: any) => ({
        ...item,
        line_total_cents: item.line_total_cents || Math.round((item.unit_price || 0) * (item.quantity || 1) * 100)
      }))
    }

    return NextResponse.json({ order: formattedOrder })
  } catch (error) {
    console.error('Erreur serveur:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}