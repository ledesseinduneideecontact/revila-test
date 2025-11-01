import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Import dynamique pour éviter les erreurs de build
    const { supabaseAdmin, enrichOrderItemsWithUrls } = await import('@/lib/supabase')
    
    const { id } = await params
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        customers (
          first_name,
          last_name,
          email,
          phone
        ),
        order_items (*)
      `)
      .eq('id', id)
      .single()

    if (error) throw error

    // Enrichir les order_items avec les URLs publiques
    if (order.order_items && order.order_items.length > 0) {
      order.order_items = enrichOrderItemsWithUrls(order.order_items)
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération de la commande' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Import dynamique pour éviter les erreurs de build
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ order_status: status })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la commande' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Import dynamique pour éviter les erreurs de build
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    const { id } = await params
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }
    
    // Supprimer d'abord les items associés
    await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', id)

    // Puis supprimer la commande
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la commande' },
      { status: 500 }
    )
  }
}