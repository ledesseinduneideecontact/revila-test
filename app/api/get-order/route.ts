import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    console.log('📋 Fetching order:', orderId)
    
    // Créer le client Supabase avec les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase credentials')
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, total_cents, payment_status')
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('❌ Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.log('✅ Order found:', order.order_number)
    return NextResponse.json(order)
    
  } catch (error: any) {
    console.error('❌ API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}