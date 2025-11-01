import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...')

    // Test 1: Connection basique
    const { data: healthCheck, error: healthError } = await supabaseAdmin
      .from('customers')
      .select('count')
      .limit(1)

    if (healthError) {
      return NextResponse.json({
        success: false,
        message: 'Erreur de connexion Supabase',
        error: healthError.message,
        data: { healthError }
      })
    }

    // Test 2: Créer un customer de test
    const testCustomer = {
      first_name: 'Test',
      last_name: 'User',
      email: `test-${Date.now()}@example.com`,
      phone: '+33123456789'
    }

    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert(testCustomer)
      .select()
      .single()

    if (customerError) {
      return NextResponse.json({
        success: false,
        message: 'Erreur lors de la création de customer de test',
        error: customerError.message,
        data: { customerError, testCustomer }
      })
    }

    // Test 3: Créer une commande de test
    const testOrder = {
      order_number: `TEST-${Date.now()}`,
      customer_id: customer.id,
      shipping_address: '123 Test Street',
      shipping_postal_code: '75001',
      shipping_city: 'Paris',
      shipping_country: 'France',
      subtotal_amount: 9.50,
      shipping_amount: 2.99,
      discount_amount: 0.00,
      total_amount: 12.49,
      order_status: 'received',
      payment_status: 'pending'
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(testOrder)
      .select()
      .single()

    if (orderError) {
      // Nettoyer le customer créé
      await supabaseAdmin.from('customers').delete().eq('id', customer.id)
      
      return NextResponse.json({
        success: false,
        message: 'Erreur lors de la création de commande de test',
        error: orderError.message,
        data: { orderError, testOrder }
      })
    }

    // Test 4: Vérifier les buckets de stockage
    const { data: photosBucket } = await supabaseAdmin.storage.getBucket('photos')
    const { data: videosBucket } = await supabaseAdmin.storage.getBucket('videos')

    // Nettoyage : supprimer les données de test
    await supabaseAdmin.from('orders').delete().eq('id', order.id)
    await supabaseAdmin.from('customers').delete().eq('id', customer.id)

    return NextResponse.json({
      success: true,
      message: 'Tous les tests Supabase sont passés avec succès !',
      data: {
        connection: 'OK',
        customerCreation: 'OK',
        orderCreation: 'OK',
        buckets: {
          photos: photosBucket ? 'OK' : 'Non trouvé',
          videos: videosBucket ? 'OK' : 'Non trouvé'
        },
        testData: {
          customerId: customer.id,
          orderId: order.id,
          orderNumber: order.order_number
        }
      }
    })

  } catch (error) {
    console.error('❌ Supabase test error:', error)
    return NextResponse.json({
      success: false,
      message: 'Erreur inattendue lors du test Supabase',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: { error }
    }, { status: 500 })
  }
}