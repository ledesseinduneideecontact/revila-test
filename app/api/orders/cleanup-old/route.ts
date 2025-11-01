import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Starting cleanup of old pending orders...')
    
    // Calculer la date limite (2 semaines)
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const cutoffDate = twoWeeksAgo.toISOString()
    
    console.log('📅 Cutoff date:', cutoffDate)
    
    // Récupérer les commandes pending anciennes
    const { data: oldOrders, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, created_at')
      .eq('payment_status', 'pending')
      .lt('created_at', cutoffDate)
    
    if (fetchError) {
      console.error('❌ Error fetching old orders:', fetchError)
      throw fetchError
    }
    
    if (!oldOrders || oldOrders.length === 0) {
      console.log('✅ No old pending orders to clean up')
      return NextResponse.json({ 
        success: true, 
        deletedCount: 0,
        message: 'No old pending orders found'
      })
    }
    
    console.log(`🔍 Found ${oldOrders.length} old pending orders to delete`)
    
    // Supprimer les order_items associés d'abord (contrainte foreign key)
    const orderIds = oldOrders.map(order => order.id)
    const { error: deleteItemsError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .in('order_id', orderIds)
    
    if (deleteItemsError) {
      console.error('❌ Error deleting order items:', deleteItemsError)
      throw deleteItemsError
    }
    
    // Supprimer les commandes
    const { error: deleteOrdersError } = await supabaseAdmin
      .from('orders')
      .delete()
      .in('id', orderIds)
    
    if (deleteOrdersError) {
      console.error('❌ Error deleting orders:', deleteOrdersError)
      throw deleteOrdersError
    }
    
    // Optionnel: supprimer les fichiers du storage pour ces commandes
    // (non implémenté pour éviter les suppressions accidentelles)
    
    console.log(`✅ Successfully deleted ${oldOrders.length} old pending orders`)
    
    return NextResponse.json({ 
      success: true, 
      deletedCount: oldOrders.length,
      deletedOrders: oldOrders.map(o => ({ id: o.id, orderNumber: o.order_number })),
      message: `Deleted ${oldOrders.length} old pending orders`
    })
    
  } catch (error: any) {
    console.error('❌ Error during cleanup:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors du nettoyage',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Optionnel: permettre le GET pour les tests
export async function GET() {
  try {
    // Juste vérifier combien d'anciennes commandes il y a sans les supprimer
    const twoWeeksAgo = new Date()
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
    const cutoffDate = twoWeeksAgo.toISOString()
    
    const { data: oldOrders, error } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, created_at')
      .eq('payment_status', 'pending')
      .lt('created_at', cutoffDate)
    
    if (error) throw error
    
    return NextResponse.json({ 
      oldOrdersCount: oldOrders?.length || 0,
      cutoffDate,
      oldOrders: oldOrders || []
    })
    
  } catch (error: any) {
    console.error('❌ Error checking old orders:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la vérification',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}