import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID requis' },
        { status: 400 }
      )
    }

    console.log('🔍 Retrieving Stripe session:', sessionId)

    // Import dynamique de Stripe pour éviter les erreurs de build
    const { stripe } = await import('@/lib/stripe')

    // Récupérer la session Stripe avec les données étendues
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent']
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      )
    }

    console.log('✅ Stripe session retrieved:', {
      id: session.id,
      payment_status: session.payment_status,
      payment_intent: session.payment_intent
    })

    return NextResponse.json({
      id: session.id,
      payment_status: session.payment_status,
      payment_intent: session.payment_intent,
      customer_email: session.customer_details?.email,
      amount_total: session.amount_total,
      currency: session.currency
    })

  } catch (error) {
    console.error('❌ Error retrieving Stripe session:', error)
    
    if (error instanceof Error && error.message.includes('No such checkout session')) {
      return NextResponse.json(
        { error: 'Session Stripe non trouvée' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Erreur lors de la récupération de la session',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}