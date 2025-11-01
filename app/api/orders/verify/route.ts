import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()
    
    if (!orderId) {
      return NextResponse.json(
        { error: 'ID de commande manquant' },
        { status: 400 }
      )
    }

    console.log(`🔍 Vérification de la commande ${orderId}...`)

    // 1. Vérifier que la commande existe dans Supabase
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ Commande non trouvée:', orderError)
      return NextResponse.json(
        { 
          success: false,
          error: 'Commande non trouvée dans la base de données' 
        },
        { status: 404 }
      )
    }

    console.log(`✅ Commande trouvée: ${order.order_number}`)
    console.log(`📦 Nombre d'items: ${order.order_items?.length || 0}`)

    // 2. Vérifier que les items existent
    if (!order.order_items || order.order_items.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucun article trouvé pour cette commande'
      })
    }

    // 3. Vérifier les URLs GCS pour chaque item
    const verificationResults = []
    let allFilesValid = true

    for (const item of order.order_items) {
      const itemCheck = {
        itemId: item.id,
        itemNumber: item.item_number,
        photoUrl: item.photo_gcs_url,
        videoUrl: item.video_gcs_url,
        photoValid: false,
        videoValid: false,
        errors: [] as string[]
      }

      // Vérifier que les URLs sont complètes
      if (!item.photo_gcs_url?.startsWith('https://storage.googleapis.com/')) {
        itemCheck.errors.push('URL photo invalide')
        allFilesValid = false
      } else {
        // Vérifier que le fichier existe sur GCS (via fetch HEAD)
        try {
          const photoResponse = await fetch(item.photo_gcs_url, { method: 'HEAD' })
          itemCheck.photoValid = photoResponse.ok
          if (!photoResponse.ok) {
            itemCheck.errors.push(`Photo non accessible (${photoResponse.status})`)
            allFilesValid = false
          }
        } catch (error) {
          itemCheck.errors.push('Erreur vérification photo')
          allFilesValid = false
        }
      }

      if (!item.video_gcs_url?.startsWith('https://storage.googleapis.com/')) {
        itemCheck.errors.push('URL vidéo invalide')
        allFilesValid = false
      } else {
        try {
          const videoResponse = await fetch(item.video_gcs_url, { method: 'HEAD' })
          itemCheck.videoValid = videoResponse.ok
          if (!videoResponse.ok) {
            itemCheck.errors.push(`Vidéo non accessible (${videoResponse.status})`)
            allFilesValid = false
          }
        } catch (error) {
          itemCheck.errors.push('Erreur vérification vidéo')
          allFilesValid = false
        }
      }

      verificationResults.push(itemCheck)
    }

    console.log('📊 Résultats de vérification:', {
      allFilesValid,
      itemsChecked: verificationResults.length
    })

    // 4. Retourner le résultat complet
    return NextResponse.json({
      success: allFilesValid,
      order: {
        id: order.id,
        orderNumber: order.order_number,
        status: order.payment_status,
        totalAmount: order.total_amount,
        itemCount: order.order_items.length
      },
      verificationDetails: verificationResults,
      message: allFilesValid 
        ? 'Tous les fichiers sont correctement stockés' 
        : 'Certains fichiers sont manquants ou inaccessibles'
    })

  } catch (error: any) {
    console.error('❌ Erreur vérification commande:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la vérification',
        details: error.message 
      },
      { status: 500 }
    )
  }
}