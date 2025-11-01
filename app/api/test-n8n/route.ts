import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl, payload } = await request.json()

    if (!webhookUrl) {
      return NextResponse.json({ error: 'URL webhook requise' }, { status: 400 })
    }

    console.log('🧪 Test N8N webhook:', {
      url: webhookUrl,
      payload: payload
    })

    // Test avec un timeout plus court (10 secondes)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.error('❌ TIMEOUT test N8N après 10s')
      controller.abort()
    }, 10000)

    const startTime = Date.now()

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Revive-App-Test/1.0',
          'X-Source': 'revive-app-test',
          'X-Test': 'true'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      const responseText = await response.text()

      console.log('✅ Test N8N réussi:', {
        status: response.status,
        duration: duration + 'ms',
        responseLength: responseText.length
      })

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        duration: duration,
        response: responseText,
        headers: Object.fromEntries(response.headers.entries())
      })

    } catch (error) {
      clearTimeout(timeoutId)
      const duration = Date.now() - startTime

      console.error('❌ Test N8N échoué:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: duration + 'ms'
      })

      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: duration,
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      }, { status: 500 })

    }

  } catch (error) {
    console.error('❌ Erreur parsing request:', error)
    return NextResponse.json({ 
      error: 'Invalid request body',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 400 })
  }
} 