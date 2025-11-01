import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    console.log('📋 Fetching order:', id)
    
    // Créer le client Supabase directement
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, total_cents, payment_status')
      .eq('id', id)
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