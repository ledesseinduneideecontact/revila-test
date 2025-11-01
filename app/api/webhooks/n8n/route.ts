import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, orderId } = await request.json()

    // Log pour le debug
    console.log('Webhook N8N triggered:', { orderNumber, orderId })

    // Le workflow N8N récupérera les détails depuis Supabase
    // en utilisant l'orderId fourni

    return NextResponse.json({ 
      success: true,
      message: 'Webhook reçu avec succès' 
    })
  } catch (error) {
    console.error('Error in N8N webhook:', error)
    return NextResponse.json(
      { error: 'Erreur lors du traitement du webhook' },
      { status: 500 }
    )
  }
}