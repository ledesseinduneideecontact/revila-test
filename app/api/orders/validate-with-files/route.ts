import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Import dynamique pour éviter les erreurs de build
    const { supabaseAdmin } = await import('@/lib/supabase')
    
    const formData = await request.formData()
    
    // Récupérer les données du formulaire
    const customerInfoStr = formData.get('customerInfo') as string
    const totalStr = formData.get('total') as string
    const promoCode = formData.get('promoCode') as string | null
    const promoDiscountStr = formData.get('promoDiscount') as string
    
    if (!customerInfoStr || !totalStr) {
      throw new Error('Données manquantes')
    }
    
    const customerInfo = JSON.parse(customerInfoStr)
    const total = parseFloat(totalStr)
    const promoDiscount = promoDiscountStr ? parseFloat(promoDiscountStr) : 0

    // Créer le client
    const { data: customer, error: customerError } = await supabaseAdmin
      .from('customers')
      .insert({
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
      })
      .select()
      .single()

    if (customerError) throw customerError

    // Générer un numéro de commande unique
    const orderNumber = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Calculer les montants
    const shippingAmount = total > 0 ? 2.99 : 0
    const subtotalAmount = Math.max(0, total - shippingAmount)
    const discountAmount = promoDiscount || 0
    
    // Créer la commande
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        shipping_address: customerInfo.address,
        shipping_postal_code: customerInfo.postalCode,
        shipping_city: customerInfo.city,
        shipping_country: customerInfo.country,
        subtotal_amount: subtotalAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total_amount: total,
        discount_code: promoCode,
        order_status: 'in_production',
        payment_status: total === 0 ? 'free' : 'paid',
        payment_intent_id: null,
      })
      .select()
      .single()

    if (orderError) throw orderError

    // Traiter les fichiers uploadés
    const cartItems = []
    let itemIndex = 0
    
    while (true) {
      const photoFile = formData.get(`items[${itemIndex}][photo]`) as any
      const videoFile = formData.get(`items[${itemIndex}][video]`) as any
      const message = formData.get(`items[${itemIndex}][message]`) as string
      const signature = formData.get(`items[${itemIndex}][signature]`) as string
      const giftAddress = formData.get(`items[${itemIndex}][adresse]`) as string
      
      if (!photoFile || !videoFile || !message || !signature) {
        break // Plus d'items
      }
      
      const position = itemIndex + 1
      
      // Créer les chemins dans le format demandé: orders/nom-commande/fichier
      const folderName = order.order_number
      const photoPath = `orders/${folderName}/${photoFile.name}`
      const videoPath = `orders/${folderName}/${videoFile.name}`
      
      try {
        // Upload photo dans le bucket photos
        const { error: photoUploadError } = await supabaseAdmin.storage
          .from('photos')
          .upload(photoPath, photoFile, {
            cacheControl: '3600',
            upsert: true
          })
        
        if (photoUploadError) {
          console.error('Photo upload error:', photoUploadError)
          throw new Error(`Erreur upload photo ${position}: ${photoUploadError.message}`)
        }
        
        // Upload vidéo dans le bucket videos
        const { error: videoUploadError } = await supabaseAdmin.storage
          .from('videos')
          .upload(videoPath, videoFile, {
            cacheControl: '3600',
            upsert: true
          })
        
        if (videoUploadError) {
          console.error('Video upload error:', videoUploadError)
          throw new Error(`Erreur upload vidéo ${position}: ${videoUploadError.message}`)
        }
        
        // Créer l'enregistrement de l'item de commande
        await supabaseAdmin
          .from('order_items')
          .insert({
            order_id: order.id,
            item_number: position,
            photo_gcs_url: photoPath,
            video_gcs_url: videoPath,
            photo_filename: photoFile.name,
            video_filename: videoFile.name,
            photo_size_bytes: photoFile.size,
            video_size_bytes: videoFile.size,
            photo_mime_type: photoFile.type,
            video_mime_type: videoFile.type,
            message_text: message,
            message_signature: signature,
            unit_price: subtotalAmount / (itemIndex + 1),
            gcs_upload_status: 'uploaded',
            gift_address: giftAddress && giftAddress.trim() !== '' ? giftAddress : null,
          })
          
        cartItems.push({
          photo: photoFile.name,
          video: videoFile.name,
          message,
          signature
        })
        
      } catch (uploadError) {
        console.error(`Upload error for item ${position}:`, uploadError)
        // Continuer avec les autres fichiers
      }
      
      itemIndex++
    }

    // Déclencher le webhook N8N
    const webhookUrl = process.env.NODE_ENV === 'development' 
      ? process.env.N8N_WEBHOOK_NEW_ORDER_TEST 
      : process.env.N8N_WEBHOOK_NEW_ORDER_PROD

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.id
          }),
        })
      } catch (webhookError) {
        console.warn('Webhook N8N error:', webhookError)
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      filesUploaded: cartItems.length,
    })
  } catch (error) {
    console.error('Error validating order with files:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la validation de la commande avec fichiers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}