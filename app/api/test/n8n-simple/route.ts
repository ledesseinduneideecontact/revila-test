import { NextRequest, NextResponse } from 'next/server'

/**
 * Test ultra-simple N8N - Version basique pour diagnostic
 * Usage: POST /api/test/n8n-simple avec { "order_number": "REV-test-001" }
 */
export async function POST(request: NextRequest) {
  try {
    const { order_number } = await request.json()

    if (!order_number) {
      return NextResponse.json({ 
        error: 'order_number requis',
        example: { order_number: 'REV-test-001' }
      }, { status: 400 })
    }

    console.log('\n🧪 === TEST N8N SIMPLE ===')
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`)
    console.log(`📦 Order number: ${order_number}`)
    
    const webhookUrl = process.env.N8N_WEBHOOK_NEW_ORDER_PROD || process.env.N8N_WEBHOOK_NEW_ORDER_TEST
    console.log(`🌐 URL: ${webhookUrl}`)

    if (!webhookUrl) {
      console.error('❌ Aucune URL N8N configurée')
      return NextResponse.json({ error: 'N8N URL not configured' }, { status: 500 })
    }

    console.log(`🚀 Envoi fetch simple...`)
    const startTime = performance.now()

    // 🎯 VERSION ULTRA-SIMPLE - Exactement comme avant
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_number }),
    })
    .then(async res => {
      const duration = performance.now() - startTime
      const text = await res.text()
      console.log(`✅ [N8N Simple] ${res.status} (${duration.toFixed(2)}ms)`)
      console.log(`📄 Response: ${text}`)
      
      return {
        success: res.ok,
        status: res.status,
        response: text,
        duration: `${duration.toFixed(2)}ms`
      }
    })
    .catch(err => {
      const duration = performance.now() - startTime
      console.error(`❌ [N8N Error] (${duration.toFixed(2)}ms)`, err)
      
      return {
        success: false,
        error: err.message,
        duration: `${duration.toFixed(2)}ms`
      }
    })

    return NextResponse.json({ 
      message: 'Test N8N simple terminé - voir logs serveur',
      order_number,
      webhookUrl,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur test N8N simple:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  const webhookUrl = process.env.N8N_WEBHOOK_NEW_ORDER_PROD || process.env.N8N_WEBHOOK_NEW_ORDER_TEST
  
  return NextResponse.json({
    message: 'Test N8N simple',
    usage: 'POST avec { "order_number": "REV-test-001" }',
    config: {
      webhookUrl,
      hasUrlProd: !!process.env.N8N_WEBHOOK_NEW_ORDER_PROD,
      hasUrlTest: !!process.env.N8N_WEBHOOK_NEW_ORDER_TEST,
      nodeEnv: process.env.NODE_ENV
    }
  })
}