import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🧪 Testing orders retrieval...')

    // Récupérer toutes les commandes avec leurs customers et items
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        order_status,
        payment_status,
        total_amount,
        created_at,
        customers (
          first_name,
          last_name,
          email
        ),
        order_items (
          id,
          item_number,
          photo_filename,
          video_filename,
          message_text
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (ordersError) {
      return NextResponse.json({
        success: false,
        message: 'Erreur lors de la récupération des commandes',
        error: ordersError.message,
        data: { ordersError }
      })
    }

    // Statistiques
    const { data: stats, error: statsError } = await supabaseAdmin
      .from('orders')
      .select('order_status, payment_status, total_amount')

    const statistics = stats ? {
      total: stats.length,
      byStatus: stats.reduce((acc, order) => {
        acc[order.order_status] = (acc[order.order_status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      byPaymentStatus: stats.reduce((acc, order) => {
        acc[order.payment_status] = (acc[order.payment_status] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      totalRevenue: stats
        .filter(order => order.payment_status === 'paid')
        .reduce((sum, order) => sum + parseFloat(order.total_amount), 0)
    } : null

    // Test des buckets de stockage
    const { data: photosFiles } = await supabaseAdmin.storage
      .from('photos')
      .list('orders', { limit: 5 })

    const { data: videosFiles } = await supabaseAdmin.storage
      .from('videos')
      .list('orders', { limit: 5 })

    return NextResponse.json({
      success: true,
      message: `${orders?.length || 0} commandes trouvées`,
      data: {
        orders: orders || [],
        statistics,
        storage: {
          photosCount: photosFiles?.length || 0,
          videosCount: videosFiles?.length || 0,
          photosFiles: photosFiles?.slice(0, 3), // Premiers fichiers seulement
          videosFiles: videosFiles?.slice(0, 3)
        },
        summary: {
          ordersCount: orders?.length || 0,
          hasOrders: (orders?.length || 0) > 0,
          latestOrder: orders?.[0] || null
        }
      }
    })

  } catch (error) {
    console.error('❌ Orders test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur inattendue lors du test des commandes',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: { error }
    }, { status: 500 })
  }
}