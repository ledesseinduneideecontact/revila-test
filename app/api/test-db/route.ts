import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Tester si les tables existent
    const tests = []
    
    // Test table customers
    try {
      const { data: customers, error: customersError } = await supabaseAdmin
        .from('customers')
        .select('count')
        .limit(1)
      tests.push({
        table: 'customers',
        status: customersError ? `ERROR: ${customersError.message}` : 'OK',
        hasData: customers ? customers.length > 0 : false
      })
    } catch (err) {
      tests.push({
        table: 'customers',
        status: `EXCEPTION: ${err instanceof Error ? err.message : 'Unknown error'}`,
        hasData: false
      })
    }

    // Test table orders
    try {
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('count')
        .limit(1)
      tests.push({
        table: 'orders',
        status: ordersError ? `ERROR: ${ordersError.message}` : 'OK',
        hasData: orders ? orders.length > 0 : false
      })
    } catch (err) {
      tests.push({
        table: 'orders',
        status: `EXCEPTION: ${err instanceof Error ? err.message : 'Unknown error'}`,
        hasData: false
      })
    }

    // Test table order_items
    try {
      const { data: items, error: itemsError } = await supabaseAdmin
        .from('order_items')
        .select('count')
        .limit(1)
      tests.push({
        table: 'order_items',
        status: itemsError ? `ERROR: ${itemsError.message}` : 'OK',
        hasData: items ? items.length > 0 : false
      })
    } catch (err) {
      tests.push({
        table: 'order_items',
        status: `EXCEPTION: ${err instanceof Error ? err.message : 'Unknown error'}`,
        hasData: false
      })
    }

    return NextResponse.json({
      status: 'Database test',
      supabase_project: process.env.NEXT_PUBLIC_SUPABASE_URL,
      tables: tests,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}