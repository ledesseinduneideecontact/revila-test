import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testing N8N webhook connection...')

    const webhookUrl = process.env.NODE_ENV === 'development' 
      ? process.env.N8N_WEBHOOK_NEW_ORDER_TEST 
      : process.env.N8N_WEBHOOK_NEW_ORDER_PROD

    if (!webhookUrl) {
      return NextResponse.json({
        success: false,
        message: 'URL du webhook N8N non configurée',
        error: `Variable manquante: N8N_WEBHOOK_NEW_ORDER_${process.env.NODE_ENV === 'development' ? 'TEST' : 'PROD'}`,
        data: {
          NODE_ENV: process.env.NODE_ENV,
          testUrl: process.env.N8N_WEBHOOK_NEW_ORDER_TEST,
          prodUrl: process.env.N8N_WEBHOOK_NEW_ORDER_PROD
        }
      })
    }

    // Générer un UUID valide pour le test (format identique à Supabase)
    const generateUUID = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Payload identique à celui envoyé par le webhook Stripe
    const testPayload = {
      orderId: generateUUID()
    }

    console.log(`🔗 Sending test to webhook: ${webhookUrl}`)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload),
    })

    const responseText = await response.text()
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = responseText
    }

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Webhook N8N a retourné une erreur HTTP ${response.status}`,
        error: responseText,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          payload: testPayload,
          response: responseData
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook N8N répond correctement !',
      data: {
        webhookUrl,
        status: response.status,
        statusText: response.statusText,
        payload: testPayload,
        response: responseData,
        headers: {
          'content-type': response.headers.get('content-type'),
          'server': response.headers.get('server')
        }
      }
    })

  } catch (error) {
    console.error('❌ N8N webhook test error:', error)
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return NextResponse.json({
        success: false,
        message: 'Impossible de joindre le webhook N8N',
        error: 'Erreur de réseau - vérifiez l\'URL du webhook',
        data: { 
          error: error.message,
          webhookUrl: process.env.NODE_ENV === 'development' 
            ? process.env.N8N_WEBHOOK_NEW_ORDER_TEST 
            : process.env.N8N_WEBHOOK_NEW_ORDER_PROD
        }
      })
    }

    return NextResponse.json({
      success: false,
      message: 'Erreur inattendue lors du test N8N',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: { error }
    }, { status: 500 })
  }
}