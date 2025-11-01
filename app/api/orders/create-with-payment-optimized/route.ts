import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import crypto from 'crypto'

// Fonction de validation du code promo via Supabase
async function validatePromoCode(code: string | null): Promise<{ isValid: boolean; discount: number; message: string }> {
  if (!code) {
    return { isValid: false, discount: 0, message: 'Aucun code promo fourni' }
  }
  
  try {
    // Appeler la fonction Supabase pour valider le code
    const { data, error } = await supabaseAdmin.rpc('validate_promo_code', {
      p_code: code.trim()
    })

    if (error) {
      console.error('Erreur validation code promo:', error)
      return { isValid: false, discount: 0, message: 'Erreur lors de la validation du code' }
    }

    if (data && data.length > 0) {
      const result = data[0]
      return {
        isValid: result.is_valid,
        discount: result.is_valid ? result.discount_percentage / 100 : 0, // Convertir en décimal
        message: result.message
      }
    }

    return { isValid: false, discount: 0, message: 'Code promo invalide' }
  } catch (error) {
    console.error('Erreur validation code promo:', error)
    // En cas d'erreur, on accepte pas le code mais on ne bloque pas la commande
    return { isValid: false, discount: 0, message: 'Impossible de valider le code promo' }
  }
}

// Fonction pour générer un hash unique d'un item
function generateContentHash(item: {
  photoPath?: string,
  videoPath?: string,
  message?: string,
  signature?: string,
  format: string,
  withFrame: boolean
}): string {
  const content = [
    item.photoPath || '',
    item.videoPath || '',
    item.message || '',
    item.signature || '',
    item.format,
    item.withFrame.toString()
  ].join('|')
  
  return crypto.createHash('md5').update(content).digest('hex')
}

export async function POST(request: NextRequest) {
  console.log('🚀 Starting optimized order creation with payment...')
  
  try {
    // Vérifier les variables d'environnement
    const missingVars = []
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
    if (!process.env.STRIPE_SECRET_KEY) missingVars.push('STRIPE_SECRET_KEY')
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars)
      return NextResponse.json(
        { error: 'Configuration manquante', details: `Variables manquantes: ${missingVars.join(', ')}` },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    console.log('📦 FormData received, keys:', Array.from(formData.keys()))
    
    // Récupérer les données du formulaire
    const customerInfoStr = formData.get('customerInfo') as string
    const totalStr = formData.get('total') as string
    const promoCode = formData.get('promoCode') as string | null
    const promoDiscountStr = formData.get('promoDiscount') as string
    const frameSelectionStr = formData.get('frameSelection') as string | null
    
    if (!customerInfoStr || !totalStr) {
      return NextResponse.json(
        { error: 'Données manquantes', details: 'customerInfo ou total manquant' },
        { status: 400 }
      )
    }
    
    const customerInfo = JSON.parse(customerInfoStr)
    const total = parseFloat(totalStr)
    const promoDiscount = promoDiscountStr ? parseFloat(promoDiscountStr) : 0
    const frameSelection = frameSelectionStr ? JSON.parse(frameSelectionStr) : null

    // Validation du code promo via Supabase
    const promoValidation = await validatePromoCode(promoCode)
    console.log('🎄 Promo code validation:', promoValidation)
    
    if (promoCode && !promoValidation.isValid) {
      return NextResponse.json(
        { error: 'Code promo invalide', details: promoValidation.message },
        { status: 400 }
      )
    }

    if (total <= 0) {
      throw new Error('Le montant doit être supérieur à 0€')
    }

    // =========================================
    // 1. GESTION DU CLIENT AVEC ADRESSE COMPLÈTE
    // =========================================
    console.log('🔍 Checking if customer exists:', customerInfo)
    
    // Rechercher le client par email uniquement (plus flexible)
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select()
      .eq('email', customerInfo.email)
      .single()

    let customer
    if (existingCustomer) {
      console.log('✅ Customer exists, updating info:', existingCustomer.id)
      // Mettre à jour les infos du client existant
      const { data: updatedCustomer, error: updateError } = await supabaseAdmin
        .from('customers')
        .update({
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          phone: customerInfo.phone || null,
          address: customerInfo.address || null,
          postal_code: customerInfo.postalCode || null,
          city: customerInfo.city || null,
          country: customerInfo.country || 'France'
        })
        .eq('id', existingCustomer.id)
        .select()
        .single()
      
      if (updateError) throw updateError
      customer = updatedCustomer
    } else {
      console.log('📝 Creating new customer with full address')
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone || null,
          address: customerInfo.address || null,
          postal_code: customerInfo.postalCode || null,
          city: customerInfo.city || null,
          country: customerInfo.country || 'France',
          is_guest: true
        })
        .select()
        .single()

      if (customerError) {
        console.error('❌ Customer creation error:', customerError)
        throw customerError
      }
      console.log('✅ Customer created:', newCustomer.id)
      customer = newCustomer
    }

    // =========================================
    // 2. CRÉER LA COMMANDE
    // =========================================
    const orderNumber = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const shippingAmount = 2.99
    const subtotalAmount = Math.max(0, total - shippingAmount)
    const discountAmount = promoDiscount || 0
    
    console.log('📦 Creating order:', orderNumber)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        shipping_address: customerInfo.address,
        shipping_postal_code: customerInfo.postalCode,
        shipping_city: customerInfo.city,
        shipping_country: customerInfo.country || 'France',
        subtotal_amount: subtotalAmount,
        shipping_amount: shippingAmount,
        discount_amount: discountAmount,
        total_amount: total,
        discount_code: promoCode,
        order_status: 'received',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      console.error('❌ Order creation error:', orderError)
      throw orderError
    }
    console.log('✅ Order created:', order.id, order.order_number)

    // =========================================
    // 3. TRAITER LES ITEMS AVEC DÉDUPLICATION
    // =========================================
    
    // Structure pour stocker les items groupés
    const itemsMap = new Map<string, any>()
    const uploadedFiles: any[] = []
    
    // Créer le chemin de base pour les fichiers
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const basePath = `${yearMonth}/${order.id}`
    
    let itemIndex = 0
    let photoCounter = 1
    let videoCounter = 1
    
    console.log('🔍 Processing order items with deduplication...')
    
    // Parcourir tous les items uploadés
    while (true) {
      const photoFile = formData.get(`items[${itemIndex}][photo]`) as any
      const videoFile = formData.get(`items[${itemIndex}][video]`) as any
      const message = formData.get(`items[${itemIndex}][message]`) as string
      const signature = formData.get(`items[${itemIndex}][signature]`) as string
      const giftAddress = formData.get(`items[${itemIndex}][adresse]`) as string
      const giftFirstName = formData.get(`items[${itemIndex}][giftFirstName]`) as string
      const giftLastName = formData.get(`items[${itemIndex}][giftLastName]`) as string
      const giftPostalCode = formData.get(`items[${itemIndex}][giftPostalCode]`) as string
      const giftCity = formData.get(`items[${itemIndex}][giftCity]`) as string
      const photoSize = formData.get(`items[${itemIndex}][photoSize]`) as string || '10x15'
      const withFrame = formData.get(`items[${itemIndex}][withFrame]`) === 'true'
      const quantity = parseInt(formData.get(`items[${itemIndex}][quantity]`) as string) || 1
      
      if (!photoFile || !videoFile || photoFile.size === 0 || videoFile.size === 0) {
        console.log(`⚠️ No more items at index ${itemIndex}`)
        break
      }
      
      console.log(`✅ Processing item ${itemIndex + 1}...`)
      
      // Upload des fichiers
      const photoExt = photoFile.name.split('.').pop()
      const videoExt = videoFile.name.split('.').pop()
      const photoFileName = `photo-${photoCounter}.${photoExt}`
      const videoFileName = `video-${videoCounter}.${videoExt}`
      const photoPath = `${basePath}/${photoFileName}`
      const videoPath = `${basePath}/${videoFileName}`
      
      // Upload photo
      const { error: photoUploadError } = await supabaseAdmin.storage
        .from('revive.v3')
        .upload(photoPath, photoFile, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (photoUploadError) throw new Error(`Erreur upload photo: ${photoUploadError.message}`)
      
      // Upload vidéo
      const { error: videoUploadError } = await supabaseAdmin.storage
        .from('revive.v3')
        .upload(videoPath, videoFile, {
          cacheControl: '3600',
          upsert: true
        })
      
      if (videoUploadError) throw new Error(`Erreur upload vidéo: ${videoUploadError.message}`)
      
      // Générer le hash pour détecter les duplicatas
      const contentHash = generateContentHash({
        photoPath,
        videoPath,
        message: message?.trim(),
        signature: signature?.trim(),
        format: photoSize,
        withFrame
      })
      
      // Déterminer si c'est un cadeau
      const isGift = Boolean(giftFirstName || giftLastName || giftAddress)
      
      // Créer l'objet item
      const itemData = {
        order_id: order.id,
        item_type: 'photo',
        format: photoSize,
        with_frame: withFrame,
        photo_gcs_url: photoPath,
        video_gcs_url: videoPath,
        photo_filename: photoFileName,
        video_filename: videoFileName,
        photo_size_bytes: photoFile.size,
        video_size_bytes: videoFile.size,
        photo_mime_type: photoFile.type,
        video_mime_type: videoFile.type,
        message_text: message?.trim() || null,
        message_signature: signature?.trim() || null,
        unit_price: subtotalAmount / (itemIndex + 1),
        gcs_upload_status: 'uploaded',
        content_hash: contentHash,
        quantity: quantity,
        cadeau: isGift,
        nom: isGift ? `${giftFirstName || ''} ${giftLastName || ''}`.trim() : null,
        adresse: isGift ? giftAddress : null,
        code_postal: isGift ? giftPostalCode : null,
        ville: isGift ? giftCity : null,
      }
      
      // Vérifier si un item identique existe déjà
      if (itemsMap.has(contentHash)) {
        // Augmenter la quantité de l'item existant
        console.log(`📦 Duplicate detected, increasing quantity for hash: ${contentHash}`)
        itemsMap.get(contentHash).quantity += quantity
      } else {
        // Ajouter le nouvel item
        itemsMap.set(contentHash, itemData)
      }
      
      uploadedFiles.push({ photo: photoFileName, video: videoFileName })
      photoCounter++
      videoCounter++
      itemIndex++
    }
    
    // =========================================
    // 4. AJOUTER LES CADRES COMME ITEMS SÉPARÉS
    // =========================================
    if (frameSelection) {
      console.log('🖼️ Processing frame orders:', frameSelection)
      
      const framePrices = {
        '10x15': 12.90,
        '20x30': 16.90,
        '30x45': 19.90
      }
      
      for (const [format, quantity] of Object.entries(frameSelection)) {
        if ((quantity as number) > 0) {
          const framePrice = framePrices[format as keyof typeof framePrices] || 0
          const frameHash = `frame_${format}`
          
          const frameItem = {
            order_id: order.id,
            item_type: 'frame',
            format: null,
            frame_size: format,
            with_frame: false,
            photo_gcs_url: null,
            video_gcs_url: null,
            photo_filename: null,
            video_filename: null,
            photo_size_bytes: null,
            video_size_bytes: null,
            photo_mime_type: null,
            video_mime_type: null,
            message_text: null,
            message_signature: null,
            unit_price: framePrice,
            gcs_upload_status: null,
            content_hash: frameHash,
            quantity: quantity as number,
            cadeau: false,
            nom: null,
            adresse: null,
            code_postal: null,
            ville: null,
            categorie: `cadre-${format}`
          }
          
          itemsMap.set(frameHash, frameItem)
          console.log(`✅ Added ${quantity} frame(s) of size ${format}`)
        }
      }
    }
    
    // =========================================
    // 5. INSÉRER TOUS LES ITEMS DANS LA BASE
    // =========================================
    console.log(`📝 Inserting ${itemsMap.size} unique items into database...`)
    
    let itemNumber = 1
    for (const [hash, itemData] of itemsMap) {
      // Ajouter le numéro d'item
      itemData.item_number = itemNumber
      
      const { error: itemError } = await supabaseAdmin
        .from('order_items')
        .insert(itemData)
      
      if (itemError) {
        console.error(`❌ Error inserting item ${itemNumber}:`, itemError)
        // Supprimer la commande si l'insertion échoue
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        throw new Error(`Erreur insertion item: ${itemError.message}`)
      }
      
      console.log(`✅ Item ${itemNumber} inserted (quantity: ${itemData.quantity})`)
      itemNumber++
    }
    
    // =========================================
    // 6. CRÉER LE PAYMENT INTENT STRIPE
    // =========================================
    console.log('💳 Creating Stripe PaymentIntent for amount:', total)
    
    const totalItems = Array.from(itemsMap.values()).reduce((sum, item) => sum + item.quantity, 0)
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'eur',
      metadata: {
        orderId: order.id,
        orderNumber: order.order_number,
        uniqueItemsCount: itemsMap.size.toString(),
        totalItemsQuantity: totalItems.toString(),
        customerEmail: customerInfo.email,
        timestamp: new Date().toISOString()
      },
      receipt_email: customerInfo.email,
      description: `Commande ${order.order_number} - ${totalItems} article(s)`,
    })

    console.log('✅ PaymentIntent created:', paymentIntent.id)

    // Mettre à jour la commande avec l'ID du PaymentIntent
    await supabaseAdmin
      .from('orders')
      .update({ 
        payment_intent_id: paymentIntent.id,
        stripe_payment_intent_id: paymentIntent.id, // Pour compatibilité
        payment_status: 'pending'
      })
      .eq('id', order.id)

    console.log('🎉 Order created successfully with optimizations:', {
      orderId: order.id,
      orderNumber: order.order_number,
      uniqueItems: itemsMap.size,
      totalQuantity: totalItems,
      filesUploaded: uploadedFiles.length,
      paymentIntentId: paymentIntent.id
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      orderNumber: order.order_number,
      uniqueItems: itemsMap.size,
      totalQuantity: totalItems,
      filesUploaded: uploadedFiles.length,
    })
    
  } catch (error: any) {
    console.error('Error creating optimized order:', error)
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la commande',
        details: error?.message || 'Unknown error'
      },
      { status: 500 }
    )
  }
}