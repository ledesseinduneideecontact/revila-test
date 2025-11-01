import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('🧪 Test endpoint called')
  
  try {
    const formData = await request.formData()
    console.log('📦 FormData keys:', Array.from(formData.keys()))
    
    // Simuler une réponse réussie
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      clientSecret: 'pi_test_secret_123',
      orderId: 'test-order-123',
      orderNumber: 'REV-TEST-123',
      filesUploaded: 1,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Test endpoint error:', error)
    return NextResponse.json(
      { 
        error: 'Erreur dans le test endpoint',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ok',
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY
  })
} 