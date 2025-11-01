import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  try {
    const { paymentIntentId } = await params

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment Intent ID requis' },
        { status: 400 }
      )
    }

    console.log('🔍 Looking up order by payment_intent_id:', paymentIntentId)

    // Récupérer la commande avec les informations client et items
    const { data: order, error } = await supabaseAdmin
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
      .eq('payment_intent_id', paymentIntentId)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      
      // Si pas trouvé, retourner 404
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Commande non trouvée pour ce Payment Intent' },
          { status: 404 }
        )
      }
      
      throw error
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Commande non trouvée' },
        { status: 404 }
      )
    }

    console.log('✅ Order found:', {
      id: order.id,
      order_number: order.order_number,
      customer: order.customers?.first_name + ' ' + order.customers?.last_name,
      items_count: order.order_items?.length || 0
    })

    return NextResponse.json(order)

  } catch (error) {
    console.error('❌ Error looking up order by payment intent:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la recherche de la commande',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}