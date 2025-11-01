import { NextRequest, NextResponse } from 'next/server'

/**
 * Route de vérification des données Supabase
 * Usage: GET /api/debug/verify-data?orderId=uuid
 */
export async function GET(request: NextRequest) {
  try {
    // Import dynamique pour éviter les erreurs de build
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({ 
        error: 'orderId requis',
        usage: '/api/debug/verify-data?orderId=e964fcdc-3fe3-4c38-b94d-95ec6d5e4fc0'
      }, { status: 400 })
    }

    console.log(`🔍 Vérification données Supabase pour order ${orderId}`)

    // 1. Vérifier l'order et customer
    const { data: orderData, error: orderError } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers (
          id,
          first_name,
          last_name,
          email,
          phone,
          created_at
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError) {
      console.error('❌ Erreur récupération order:', orderError)
      return NextResponse.json({ error: 'Order not found', details: orderError }, { status: 404 })
    }

    // 2. Vérifier les order_items
    const { data: itemsData, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    if (itemsError) {
      console.error('❌ Erreur récupération items:', itemsError)
    }

    // 3. Vérifier les webhook_events
    const { data: webhookData, error: webhookError } = await supabaseAdmin
      .from('webhook_events')
      .select('*')
      .eq('order_id', orderId)

    if (webhookError) {
      console.error('❌ Erreur récupération webhooks:', webhookError)
    }

    const result = {
      orderId,
      timestamp: new Date().toISOString(),
      data: {
        order: orderData,
        items: itemsData || [],
        webhooks: webhookData || [],
      },
      summary: {
        orderExists: !!orderData,
        customerExists: !!orderData?.customers,
        itemCount: itemsData?.length || 0,
        webhookCount: webhookData?.length || 0,
        orderStatus: orderData?.order_status,
        paymentStatus: orderData?.payment_status,
        orderNumber: orderData?.order_number
      }
    }

    console.log(`✅ Données vérifiées:`, result.summary)

    return NextResponse.json(result, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur vérification données:', error)
    return NextResponse.json({ 
      error: 'Verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}