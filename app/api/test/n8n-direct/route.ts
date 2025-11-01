import { NextRequest, NextResponse } from 'next/server'
import { triggerN8NWebhook } from '@/lib/n8n-webhook'

/**
 * Route de test pour diagnostiquer N8N directement
 * Utilisation: POST /api/test/n8n-direct 
 * Body: { "orderId": "uuid", "orderNumber": "REV-20250125-0001" }
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, orderNumber } = await request.json()

    if (!orderId || !orderNumber) {
      return NextResponse.json({ 
        error: 'orderId et orderNumber requis',
        example: {
          orderId: 'uuid-format',
          orderNumber: 'REV-20250125-0001'
        }
      }, { status: 400 })
    }

    console.log(`🧪 TEST N8N DIRECT - orderId: ${orderId}, orderNumber: ${orderNumber}`)

    // Test direct avec order_number fourni
    const success = await triggerN8NWebhook(orderId, orderNumber)

    return NextResponse.json({ 
      success,
      orderId,
      orderNumber,
      message: success 
        ? 'Webhook N8N envoyé avec succès' 
        : 'Échec webhook N8N - voir logs serveur',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erreur test N8N direct:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Route de test N8N',
    usage: 'POST avec { "orderId": "uuid", "orderNumber": "REV-xxx" }',
    env: {
      N8N_WEBHOOK_NEW_ORDER_TEST: !!process.env.N8N_WEBHOOK_NEW_ORDER_TEST,
      N8N_WEBHOOK_NEW_ORDER_PROD: !!process.env.N8N_WEBHOOK_NEW_ORDER_PROD,
      url: process.env.N8N_WEBHOOK_NEW_ORDER_PROD || process.env.N8N_WEBHOOK_NEW_ORDER_TEST
    }
  })
}