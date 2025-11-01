import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Test Supabase connection
    const { data: testData, error: supabaseError } = await supabaseAdmin
      .from('customers')
      .select('count')
      .limit(1)

    // Test variables d'environnement
    const envCheck = {
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'MISSING',
      supabase_anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING',
      supabase_service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING',
      stripe_publishable: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'OK' : 'MISSING',
      stripe_secret: process.env.STRIPE_SECRET_KEY ? 'OK' : 'MISSING',
      node_env: process.env.NODE_ENV,
      supabase_connection: supabaseError ? `ERROR: ${supabaseError.message}` : 'OK',
    }

    return NextResponse.json({
      status: 'Environment test',
      variables: envCheck,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Environment test error:', error)
    return NextResponse.json(
      { 
        error: 'Environment test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}