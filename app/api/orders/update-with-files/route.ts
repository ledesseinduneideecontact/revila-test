import { NextRequest, NextResponse } from 'next/server'

export async function PUT(request: NextRequest) {
  console.log('🔄 Starting order update with files...')
  try {
    // Import dynamique pour éviter les erreurs de build
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { stripe } = await import('@/lib/stripe')
    
    const formData = await request.formData()
    
    // Récupérer les données du formulaire
    const orderIdStr = formData.get('orderId') as string
    const customerInfoStr = formData.get('customerInfo') as string
    const totalStr = formData.get('total') as string
    const promoCode = formData.get('promoCode') as string | null
    const promoDiscountStr = formData.get('promoDiscount') as string
    
    if (!orderIdStr || !customerInfoStr || !totalStr) {
      throw new Error('Données manquantes')
    }
    
    const orderId = orderIdStr
    const customerInfo = JSON.parse(customerInfoStr)
    const total = parseFloat(totalStr)
    const promoDiscount = promoDiscountStr ? parseFloat(promoDiscountStr) : 0

    if (total <= 0) {
      throw new Error('Le montant doit être supérieur à 0€ pour un paiement')
    }

    // Récupérer la commande existante
    const { data: existingOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single()

    if (fetchError || !existingOrder) {
      throw new Error('Commande non trouvée')
    }

    console.log('📝 Updating existing order:', orderId)

    // Mettre à jour les informations client
    const { error: customerError } = await supabaseAdmin
      .from('customers')
      .update({
        first_name: customerInfo.firstName,
        last_name: customerInfo.lastName,
        email: customerInfo.email,
        phone: customerInfo.phone,
      })
      .eq('id', existingOrder.customer_id)

    if (customerError) {
      console.error('❌ Customer update error:', customerError)
      throw customerError
    }

    // Calculer les montants
    const photoCount = Array.from(formData.keys()).filter(key => key.includes('[photo]')).length
    const photoPrice = photoCount === 1 ? 9.50 : photoCount <= 2 ? 9.50 : 8.50
    const subtotalAmount = photoPrice * photoCount
    const shippingAmount = 2.99
    const discountAmount = promoDiscount

    // Mettre à jour la commande
    const { error: orderError } = await supabaseAdmin
      .from('orders')
      .update({
        shipping_address: customerInfo.address,
        shipping_postal_code: customerInfo.postalCode,
        shipping_city: customerInfo.city,
        shipping_country: customerInfo.country,
        subtotal_amount: subtotalAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total_amount: total,
        discount_code: promoCode || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (orderError) {
      console.error('❌ Order update error:', orderError)
      throw orderError
    }

    // Supprimer les anciens order_items
    const { error: deleteItemsError } = await supabaseAdmin
      .from('order_items')
      .delete()
      .eq('order_id', orderId)

    if (deleteItemsError) {
      console.error('❌ Error deleting old items:', deleteItemsError)
      throw deleteItemsError
    }

    // Ajouter les nouveaux items avec upload des fichiers
    const itemsData = []
    const currentDate = new Date()
    const monthFolder = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`

    for (let i = 0; ; i++) {
      const photoFile = formData.get(`items[${i}][photo]`) as any
      const videoFile = formData.get(`items[${i}][video]`) as any
      const message = formData.get(`items[${i}][message]`) as string
      const signature = formData.get(`items[${i}][signature]`) as string

      if (!photoFile || !videoFile) break

      // Upload photo
      const photoPath = `${monthFolder}/${orderId}/photo-${i + 1}.${photoFile.name.split('.').pop()}`
      const { error: photoUploadError } = await supabaseAdmin.storage
        .from('revive.v3')
        .upload(photoPath, photoFile, { upsert: true })

      if (photoUploadError) {
        console.error('❌ Photo upload error:', photoUploadError)
        throw photoUploadError
      }

      const { data: photoUrl } = supabaseAdmin.storage
        .from('revive.v3')
        .getPublicUrl(photoPath)

      // Upload video
      const videoPath = `${monthFolder}/${orderId}/video-${i + 1}.${videoFile.name.split('.').pop()}`
      const { error: videoUploadError } = await supabaseAdmin.storage
        .from('revive.v3')
        .upload(videoPath, videoFile, { upsert: true })

      if (videoUploadError) {
        console.error('❌ Video upload error:', videoUploadError)
        throw videoUploadError
      }

      const { data: videoUrl } = supabaseAdmin.storage
        .from('revive.v3')
        .getPublicUrl(videoPath)

      itemsData.push({
        order_id: orderId,
        item_number: i + 1,
        photo_gcs_url: photoUrl.publicUrl,
        video_gcs_url: videoUrl.publicUrl,
        photo_filename: photoFile.name,
        video_filename: videoFile.name,
        photo_size_bytes: photoFile.size,
        video_size_bytes: videoFile.size,
        photo_mime_type: photoFile.type,
        video_mime_type: videoFile.type,
        unit_price: photoPrice,
        message_text: message || null,
        message_signature: signature || null,
        gcs_upload_status: 'uploaded',
        created_at: new Date().toISOString(),
      })
    }

    // Insérer les nouveaux order_items
    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsData)

    if (itemsError) {
      console.error('❌ Items insertion error:', itemsError)
      throw itemsError
    }

    console.log(`✅ Order updated with ${itemsData.length} items`)

    // Mettre à jour le PaymentIntent Stripe avec le nouveau montant
    let clientSecret = existingOrder.payment_intent_id
    if (clientSecret) {
      const paymentIntentId = clientSecret.split('_secret_')[0]
      await stripe.paymentIntents.update(paymentIntentId, {
        amount: Math.round(total * 100), // Stripe utilise les centimes
        metadata: {
          orderId: orderId,
          orderNumber: existingOrder.order_number,
        },
      })
      console.log('✅ PaymentIntent updated with new amount')
    }

    return NextResponse.json({
      success: true,
      orderId: orderId,
      orderNumber: existingOrder.order_number,
      clientSecret: clientSecret,
      filesUploaded: itemsData.length * 2,
      updated: true
    })

  } catch (error: any) {
    console.error('❌ Error updating order:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la mise à jour de la commande',
        details: error.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}