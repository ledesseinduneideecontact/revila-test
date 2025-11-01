import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { uploadToGCS } from '@/lib/gcs'

// Configuration pour accepter des fichiers jusqu'à 200MB
export const maxDuration = 60 // Timeout de 60 secondes pour les gros fichiers
export const dynamic = 'force-dynamic'
const MAX_FILE_BYTES = 200 * 1024 * 1024 // 200 Mo pour photo et vidéo

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

export async function POST(request: NextRequest) {
  console.log('🚀 Starting order creation with payment...')
  
  // Log immédiat pour vérifier que la route est bien appelée
  console.log('📍 Route called at:', new Date().toISOString())
  console.log('📍 Content-Type:', request.headers.get('content-type'))
  console.log('📍 Content-Length:', request.headers.get('content-length'))
  
  try {
    // Log pour debug
    console.log('📍 Environment check:')
    console.log('  - NODE_ENV:', process.env.NODE_ENV)
    console.log('  - Has Stripe key:', !!process.env.STRIPE_SECRET_KEY)
    console.log('  - Has Supabase URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('  - Max file size (bytes):', MAX_FILE_BYTES)
    // Vérifier que les variables d'environnement sont présentes
    const missingVars = []
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
    if (!process.env.STRIPE_SECRET_KEY) missingVars.push('STRIPE_SECRET_KEY')
    
    if (missingVars.length > 0) {
      console.error('❌ Missing environment variables:', missingVars)
      return NextResponse.json(
        { 
          error: 'Configuration manquante', 
          details: `Variables d'environnement manquantes: ${missingVars.join(', ')}`,
          missingVars,
          help: 'Configurez ces variables dans Vercel > Settings > Environment Variables'
        },
        { status: 500 }
      )
    }

    // Vérifier que les variables ne sont pas des valeurs factices
    if (process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://dummy.supabase.co') {
      console.error('❌ Using dummy Supabase URL')
      return NextResponse.json(
        { 
          error: 'Configuration invalide', 
          details: 'URL Supabase factice détectée. Configurez les vraies variables d\'environnement.'
        },
        { status: 500 }
      )
    }

    console.log('📦 Attempting to parse FormData...')
    let formData
    try {
      formData = await request.formData()
      console.log('✅ FormData parsed successfully')
    } catch (parseError: any) {
      console.error('❌ Failed to parse FormData:', parseError)
      return NextResponse.json({
        error: 'Impossible de traiter les données du formulaire',
        details: parseError.message,
        help: 'Vérifiez que les fichiers ne sont pas trop volumineux'
      }, { status: 400 })
    }
    const allKeys = Array.from(formData.keys())
    console.log('📦 FormData received, keys:', allKeys)
    console.log('📸 Item keys found:', allKeys.filter(k => typeof k === 'string' && k.startsWith('items[')))
    
    // Récupérer les données du formulaire
    const customerInfoStr = formData.get('customerInfo') as string
    const totalStr = formData.get('total') as string
    const promoCode = formData.get('promoCode') as string | null
    const promoDiscountStr = formData.get('promoDiscount') as string
    const frameSelectionStr = formData.get('frameSelection') as string | null
    
    console.log('📊 Form data parsed:', {
      hasCustomerInfo: !!customerInfoStr,
      total: totalStr,
      hasPromoCode: !!promoCode,
      promoDiscount: promoDiscountStr,
      hasFrameSelection: !!frameSelectionStr
    })
    
    if (!customerInfoStr || !totalStr) {
      console.error('❌ Missing required data:', { customerInfoStr: !!customerInfoStr, totalStr: !!totalStr })
      return NextResponse.json(
        { error: 'Données manquantes', details: 'customerInfo ou total manquant' },
        { status: 400 }
      )
    }
    
    const customerInfo = JSON.parse(customerInfoStr)
    const total = parseFloat(totalStr)
    const promoDiscount = promoDiscountStr ? parseFloat(promoDiscountStr) : 0
    const frameSelection = frameSelectionStr ? JSON.parse(frameSelectionStr) : null

    // Validation du code promo côté serveur via Supabase
    const promoValidation = await validatePromoCode(promoCode)
    console.log('🎄 Promo code validation:', promoValidation)
    
    if (promoCode && !promoValidation.isValid) {
      return NextResponse.json(
        { error: 'Code promo invalide', details: promoValidation.message },
        { status: 400 }
      )
    }

    if (total <= 0) {
      throw new Error('Le montant doit être supérieur à 0€ pour un paiement')
    }

    // Vérifier si le client existe déjà (par email uniquement pour éviter conflits sur téléphone null/"")
    console.log('🔍 Checking if customer exists by email:', customerInfo.email)
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select()
      .eq('email', customerInfo.email)
      .single()

    let customer
    if (existingCustomer) {
      console.log('✅ Customer already exists:', existingCustomer.id)
      customer = existingCustomer
    } else {
      console.log('📝 Creating new customer:', customerInfo)
      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          first_name: customerInfo.firstName,
          last_name: customerInfo.lastName,
          email: customerInfo.email,
          phone: customerInfo.phone || null,
          is_guest: true // Marquer comme guest car pas de compte utilisateur
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

    // Générer un numéro de commande unique
    const orderNumber = `REV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Calculer les montants
    const shippingCost = 2.99
    const discountAmount = promoDiscount || 0
    // Le subtotal est le total moins les frais de livraison
    const subtotalAmount = total - shippingCost
    
    // Créer la commande avec les colonnes exactes de la BD
    console.log('📦 Creating order:', orderNumber)
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: customer.id,
        subtotal_amount: subtotalAmount,
        discount_amount: discountAmount,
        total_amount: total,
        shipping_cost: shippingCost,  // Ajouter shipping_cost
        // Ajouter aussi les colonnes _cents
        subtotal_cents: Math.round(subtotalAmount * 100),
        discount_cents: Math.round(discountAmount * 100),
        total_cents: Math.round(total * 100),
        shipping_cents: Math.round(shippingCost * 100),
        order_status: 'received',
        payment_status: 'pending',
        discount_code: promoCode || null,
      })
      .select()
      .single()

    if (orderError) {
      console.error('❌ Order creation error:', orderError)
      throw orderError
    }
    console.log('✅ Order created:', order.id, order.order_number)

    // Traiter et stocker les fichiers uploadés
    const cartItems = []
    let itemIndex = 0
    let photoCounter = 1
    let videoCounter = 1
    let totalOrderItems = 0 // Compteur pour vérifier qu'on a bien créé des items
    
    // Créer le chemin de base avec l'année-mois et l'ID de commande
    const now = new Date()
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const basePath = `${yearMonth}/${order.id}`
    
    console.log(`🔍 Début du traitement des items de commande...`)
    console.log(`📊 Total des clés FormData reçues: ${allKeys.length}`)
    console.log(`📊 Clés liées aux items:`, allKeys.filter(k => typeof k === 'string' && k.includes('items[')))
    
    // Structure pour stocker toutes les données avant upload parallèle
    interface ItemToProcess {
      index: number
      position: number
      photoFile?: any
      videoFile?: any
      photoPath?: string
      videoPath?: string
      photoFileName?: string
      videoFileName?: string
      message?: string
      signature?: string
      photoSize: string
      photoQuantity: number
      isGift: boolean
      recipientName: string
      recipientAddress?: string
      recipientPostalCode?: string
      recipientCity?: string
    }
    
    const itemsToProcess: ItemToProcess[] = []
    const uploadTasks: Promise<{ photoUrl?: string; videoUrl?: string; itemIndex: number }>[] = []
    
    // Chercher les items avec les deux formats possibles : items[0] et items[0_0]
    let actualItemIndex = 0
    
    while (true) {
      console.log(`🔍 Vérification item index ${itemIndex}...`)
      
      // Essayer d'abord le format items[0_0] (nouveau format du frontend)
      let photoFile = formData.get(`items[${itemIndex}_0][photo]`) as any
      let videoFile = formData.get(`items[${itemIndex}_0][video]`) as any
      let message = formData.get(`items[${itemIndex}_0][message]`) as string
      let signature = formData.get(`items[${itemIndex}_0][signature]`) as string
      let giftAddress = formData.get(`items[${itemIndex}_0][giftAddress]`) as string
      let giftFirstName = formData.get(`items[${itemIndex}_0][giftFirstName]`) as string
      let giftLastName = formData.get(`items[${itemIndex}_0][giftLastName]`) as string
      let giftPostalCode = formData.get(`items[${itemIndex}_0][giftPostalCode]`) as string
      let giftCity = formData.get(`items[${itemIndex}_0][giftCity]`) as string
      let photoSize = formData.get(`items[${itemIndex}_0][format]`) as string || formData.get(`items[${itemIndex}_0][photoSize]`) as string || '10x15'
      let withFrame = formData.get(`items[${itemIndex}_0][withFrame]`) === 'true'
      let photoQuantity = Number(formData.get(`items[${itemIndex}_0][quantity]`) as string) || 1
      
      // Si pas trouvé, essayer le format items[0] (ancien format)
      if (!photoFile || !videoFile) {
        photoFile = formData.get(`items[${itemIndex}][photo]`) as any
        videoFile = formData.get(`items[${itemIndex}][video]`) as any
        message = formData.get(`items[${itemIndex}][message]`) as string
        signature = formData.get(`items[${itemIndex}][signature]`) as string
        giftAddress = formData.get(`items[${itemIndex}][giftAddress]`) as string
        giftFirstName = formData.get(`items[${itemIndex}][giftFirstName]`) as string
        giftLastName = formData.get(`items[${itemIndex}][giftLastName]`) as string
        giftPostalCode = formData.get(`items[${itemIndex}][giftPostalCode]`) as string
        giftCity = formData.get(`items[${itemIndex}][giftCity]`) as string
        photoSize = formData.get(`items[${itemIndex}][format]`) as string || formData.get(`items[${itemIndex}][photoSize]`) as string || '10x15'
        withFrame = formData.get(`items[${itemIndex}][withFrame]`) === 'true'
        photoQuantity = Number(formData.get(`items[${itemIndex}][quantity]`) as string) || 1
      }
      
      console.log(`📋 Item ${itemIndex} data:`, {
        hasPhoto: !!photoFile && photoFile.size > 0,
        hasVideo: !!videoFile && videoFile.size > 0,
        hasMessage: !!message,
        hasSignature: !!signature,
        photoSize: photoFile?.size || 0,
        videoSize: videoFile?.size || 0,
        photoName: photoFile?.name || 'none',
        videoName: videoFile?.name || 'none',
        format: photoSize,
        withFrame: withFrame
      })
      
      // Debug: vérifier le contenu exact du FormData pour cet item
      console.log(`🔍 Debug FormData pour item ${itemIndex}:`)
      const itemKeys = allKeys.filter(k => typeof k === 'string' && (k.includes(`[${itemIndex}_0]`) || k.includes(`[${itemIndex}]`)))
      itemKeys.forEach((key: string) => {
        const value = formData.get(key)
        if (value && typeof value === 'object' && 'name' in value && 'size' in value) {
          console.log(`  - ${key}: File(${(value as any).name}, ${(value as any).size} bytes, ${(value as any).type})`)
        } else {
          console.log(`  - ${key}: ${value}`)
        }
      })
      
      // Vérification qu'au moins un fichier est présent (photo ou vidéo)
      const hasValidPhoto = photoFile && photoFile.size > 0
      const hasValidVideo = videoFile && videoFile.size > 0
      
      if (!hasValidPhoto && !hasValidVideo) {
        console.log(`⚠️  Arrêt boucle à l'index ${itemIndex} - aucun fichier valide trouvé`)
        break // Plus d'items
      }
      
      // Vérifier la taille des fichiers (200 Mo) avant tout upload
      if (hasValidPhoto && photoFile.size > MAX_FILE_BYTES) {
        console.error(`❌ Photo trop volumineuse: ${(photoFile.size/1024/1024).toFixed(1)} Mo (> ${(MAX_FILE_BYTES/1024/1024)} Mo)`)
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        return NextResponse.json({
          error: 'Photo trop volumineuse',
          details: `Taille: ${(photoFile.size/1024/1024).toFixed(1)} Mo. Limite actuelle: ${(MAX_FILE_BYTES/1024/1024)} Mo.`,
          hint: "Compressez la photo ou augmentez la limite du bucket 'revive.v3' à 200 Mo"
        }, { status: 413 })
      }
      if (hasValidVideo && videoFile.size > MAX_FILE_BYTES) {
        console.error(`❌ Vidéo trop volumineuse: ${(videoFile.size/1024/1024).toFixed(1)} Mo (> ${(MAX_FILE_BYTES/1024/1024)} Mo)`)
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        return NextResponse.json({
          error: 'Vidéo trop volumineuse',
          details: `Taille: ${(videoFile.size/1024/1024).toFixed(1)} Mo. Limite actuelle: ${(MAX_FILE_BYTES/1024/1024)} Mo.`,
          hint: "Compressez la vidéo ou augmentez la limite du bucket 'revive.v3' à 200 Mo"
        }, { status: 413 })
      }
      
      // Message et signature peuvent être vides
      console.log(`✅ Item ${itemIndex} valid - processing files...`)
      
      const position = itemIndex + 1
      
      // Créer les noms de fichiers avec compteurs séparés pour photos et vidéos
      let photoFileName = null
      let videoFileName = null
      let photoPath = null
      let videoPath = null
      
      if (hasValidPhoto) {
        const photoExt = photoFile.name.split('.').pop()
        photoFileName = `photo-${photoCounter}.${photoExt}`
        photoPath = `${basePath}/${photoFileName}`
      }
      
      if (hasValidVideo) {
        const videoExt = videoFile.name.split('.').pop()
        videoFileName = `video-${videoCounter}.${videoExt}`
        videoPath = `${basePath}/${videoFileName}`
      }
      
      // Construire l'adresse cadeau utilisée pour stockage:
      // - si giftAddress fourni pour l'item → l'utiliser
      // - sinon, fallback sur l'adresse acheteur (adresse de commande)
      const giftAddressText = (giftAddress && giftAddress.trim() !== '')
        ? giftAddress
        : [
            customerInfo.firstName || customerInfo.lastName
              ? `Destinataire: ${[customerInfo.firstName, customerInfo.lastName].filter(Boolean).join(' ')}`
              : null,
            customerInfo.address || null,
            [customerInfo.postalCode || null, customerInfo.city || null].filter(Boolean).join(' '),
            customerInfo.country || null
          ].filter(Boolean).join('\n') || null

      // Déterminer si c'est un cadeau et les informations d'adresse
      const isGift = Boolean(giftFirstName || giftLastName || giftAddress || giftPostalCode || giftCity)
      const recipientName = isGift 
        ? `${giftFirstName || ''} ${giftLastName || ''}`.trim()
        : `${customerInfo.firstName} ${customerInfo.lastName}`.trim()
      const recipientAddress = isGift ? giftAddress : customerInfo.address
      const recipientPostalCode = isGift ? giftPostalCode : customerInfo.postalCode
      const recipientCity = isGift ? giftCity : customerInfo.city

      // Stocker les données pour traitement parallèle
      itemsToProcess.push({
        index: itemIndex,
        position,
        photoFile: hasValidPhoto ? photoFile : undefined,
        videoFile: hasValidVideo ? videoFile : undefined,
        photoPath,
        videoPath,
        photoFileName,
        videoFileName,
        message,
        signature,
        photoSize,
        photoQuantity,
        isGift,
        recipientName,
        recipientAddress,
        recipientPostalCode,
        recipientCity
      })

      // Incrémenter les compteurs seulement si les fichiers existent
      if (hasValidPhoto) photoCounter++
      if (hasValidVideo) videoCounter++
      
      itemIndex++
    }

    // ============ UPLOADS PARALLÈLES GCS ============
    console.log(`🚀 Lancement des uploads parallèles pour ${itemsToProcess.length} items...`)
    const uploadStartTime = Date.now()
    
    try {
      // Créer toutes les promesses d'upload
      const uploadPromises = itemsToProcess.map(async (item) => {
        const uploads: { photoUrl?: string; videoUrl?: string } = {}
        
        // Préparer les uploads pour cet item
        const itemUploads: Promise<void>[] = []
        
        if (item.photoFile && item.photoPath) {
          itemUploads.push(
            (async () => {
              console.log(`📤 Upload photo ${item.photoFileName} (${(item.photoFile.size/1024/1024).toFixed(1)} Mo)`)
              const photoBuffer = Buffer.from(await item.photoFile.arrayBuffer())
              uploads.photoUrl = await uploadToGCS(photoBuffer, item.photoPath!, item.photoFile.type)
            })()
          )
        }
        
        if (item.videoFile && item.videoPath) {
          itemUploads.push(
            (async () => {
              console.log(`📤 Upload vidéo ${item.videoFileName} (${(item.videoFile.size/1024/1024).toFixed(1)} Mo)`)
              const videoBuffer = Buffer.from(await item.videoFile.arrayBuffer())
              uploads.videoUrl = await uploadToGCS(videoBuffer, item.videoPath!, item.videoFile.type)
            })()
          )
        }
        
        // Attendre que les deux uploads de cet item soient terminés
        await Promise.all(itemUploads)
        
        return { ...uploads, itemIndex: item.index }
      })
      
      // Attendre tous les uploads en parallèle
      const uploadResults = await Promise.all(uploadPromises)
      
      const uploadDuration = ((Date.now() - uploadStartTime) / 1000).toFixed(1)
      console.log(`✅ Tous les uploads terminés en ${uploadDuration}s`)
      
      // Créer une map des résultats d'upload par index
      const uploadResultsMap = new Map(uploadResults.map(r => [r.itemIndex, r]))
      
      // ============ INSERTION BATCH DES ORDER_ITEMS ============
      console.log(`📝 Insertion des ${itemsToProcess.length} order_items...`)
      
      const orderItemsToInsert = itemsToProcess.map(item => {
        const uploadResult = uploadResultsMap.get(item.index)
        
        return {
          order_id: order.id,
          item_number: item.position,
          categorie: `photo-${item.photoSize}`,
          quantity: item.photoQuantity,
          photo_gcs_url: uploadResult?.photoUrl || null,
          video_gcs_url: uploadResult?.videoUrl || null,
          photo_filename: item.photoFileName || null,
          video_filename: item.videoFileName || null,
          photo_size_bytes: item.photoFile ? item.photoFile.size : null,
          video_size_bytes: item.videoFile ? item.videoFile.size : null,
          photo_mime_type: item.photoFile ? item.photoFile.type : null,
          video_mime_type: item.videoFile ? item.videoFile.type : null,
          unit_price: subtotalAmount / itemsToProcess.length / item.photoQuantity,
          unit_price_cents: Math.round((subtotalAmount / itemsToProcess.length / item.photoQuantity) * 100),
          line_total_cents: Math.round((subtotalAmount / itemsToProcess.length) * 100),
          gcs_upload_status: 'uploaded',
          message_text: item.message || null,
          message_signature: item.signature || null,
          cadeau: item.isGift,
          nom: item.recipientName || null,
          adresse: item.recipientAddress || null,
          code_postal: item.recipientPostalCode || null,
          ville: item.recipientCity || null,
          pays: 'France'
        }
      })
      
      // Insertion batch
      const { error: batchError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemsToInsert)
      
      if (batchError) {
        console.error(`❌ Batch insert error:`, batchError)
        await supabaseAdmin.from('orders').delete().eq('id', order.id)
        throw new Error(`Batch insert failed: ${batchError.message}`)
      }
      
      console.log(`✅ ${orderItemsToInsert.length} order_items insérés avec succès`)
      totalOrderItems = orderItemsToInsert.length
      
      // Ajouter au cartItems pour la réponse
      itemsToProcess.forEach(item => {
        cartItems.push({
          photo: item.photoFileName || '',
          video: item.videoFileName || '',
          message: item.message || '',
          signature: item.signature || ''
        })
      })
      
    } catch (uploadError) {
      console.error(`❌ Erreur lors des uploads parallèles:`, uploadError)
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      throw new Error(`Erreur upload GCS: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`)
    }

    // Ajouter les cadres séparés comme order_items
    if (frameSelection) {
      console.log('🖼️ Processing frame selection:', frameSelection)
      
      const framePrices = {
        '10x15': 12.90,
        '20x30': 16.90,
        '30x45': 19.90
      }
      
      for (const [format, quantity] of Object.entries(frameSelection)) {
        if (Number(quantity) > 0) {
          const framePrice = framePrices[format as keyof typeof framePrices]
          const position = (itemIndex + 1).toString().padStart(3, '0')
          
          console.log(`📦 Creating frame order item: ${quantity} x cadre-${format}`)
          
          const { error: frameError } = await supabaseAdmin
            .from('order_items')
            .insert({
              order_id: order.id,
              item_number: position,
              categorie: `cadre-${format}`, // Par exemple: cadre-10x15
              quantity: Number(quantity), // Utiliser la colonne quantity
              unit_price: framePrice,
              unit_price_cents: Math.round(framePrice * 100),
              line_total_cents: Math.round(framePrice * Number(quantity) * 100), // Prix total = unit_price × quantity
              // Pas de photos/vidéos pour les cadres
              photo_gcs_url: null,
              video_gcs_url: null,
              photo_filename: null,
              video_filename: null,
              gcs_upload_status: 'not_applicable'
            })
          
          if (frameError) {
            console.error(`❌ Frame order item creation error:`, frameError)
            // Supprimer la commande si un cadre échoue
            await supabaseAdmin.from('orders').delete().eq('id', order.id)
            throw new Error(`Frame order item insert failed: ${frameError.message}`)
          }
          
          console.log(`✅ Frame order item ${position} created: ${quantity} x cadre-${format}`)
          totalOrderItems++ // Incrémenter le compteur pour les cadres aussi
          itemIndex++
        }
      }
    }

    // VÉRIFICATION CRITIQUE : S'assurer qu'au moins un order_item a été créé
    console.log(`📊 Total order_items créés: ${totalOrderItems}`)
    
    if (totalOrderItems === 0) {
      console.error('❌ ERREUR CRITIQUE: Aucun order_item créé!')
      console.error('   - FormData keys:', allKeys)
      console.error('   - Items keys:', allKeys.filter(k => typeof k === 'string' && k.includes('items[')))
      
      // Supprimer la commande orpheline
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      
      return NextResponse.json({
        error: 'Aucun article n\'a pu être traité',
        details: 'Les fichiers n\'ont pas pu être traités correctement. Vérifiez le format des données envoyées.',
        debug: {
          totalKeys: allKeys.length,
          itemKeys: allKeys.filter(k => typeof k === 'string' && k.includes('items[')).length,
          orderId: order.id
        }
      }, { status: 400 })
    }
    
    // Vérifier dans la base de données que les items ont bien été créés
    const { data: createdItems, error: checkError } = await supabaseAdmin
      .from('order_items')
      .select('id, item_number, categorie, quantity')
      .eq('order_id', order.id)
    
    if (checkError || !createdItems || createdItems.length === 0) {
      console.error('❌ ERREUR: Items non trouvés dans la DB après insertion!')
      console.error('   - Check error:', checkError)
      console.error('   - Items found:', createdItems?.length || 0)
      
      // Supprimer la commande orpheline
      await supabaseAdmin.from('orders').delete().eq('id', order.id)
      
      return NextResponse.json({
        error: 'Erreur de vérification des articles',
        details: 'Les articles n\'ont pas pu être confirmés dans la base de données.',
        orderId: order.id
      }, { status: 500 })
    }
    
    console.log(`✅ Vérification réussie: ${createdItems.length} items confirmés dans la DB`)
    createdItems.forEach(item => {
      console.log(`   - Item ${item.item_number}: ${item.categorie} (qty: ${item.quantity})`)
    })
    
    // Créer le PaymentIntent Stripe avec gestion d'erreur améliorée
    let paymentIntent
    try {
      console.log('💳 Creating Stripe PaymentIntent for amount:', total)
      
      // Récupérer le total_cents depuis la commande créée
      const { data: orderWithCents } = await supabaseAdmin
        .from('orders')
        .select('total_cents')
        .eq('id', order.id)
        .single()
      
      const amountInCents = orderWithCents?.total_cents || Math.round(total * 100)
      console.log('💰 Amount in cents from DB:', amountInCents)
      
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents, // Utilise total_cents de la DB
        currency: 'eur',
        metadata: {
          orderId: order.id,
          orderNumber: order.order_number,
          itemCount: cartItems.length.toString(),
          customerEmail: customerInfo.email,
          timestamp: new Date().toISOString()
        },
        receipt_email: customerInfo.email,
        description: `Commande ${order.order_number} - ${cartItems.length} item(s)`,
      })

      console.log('✅ PaymentIntent created:', paymentIntent.id)

    } catch (stripeError: any) {
      console.error('❌ Stripe PaymentIntent creation failed:', stripeError)
      
      // Supprimer la commande si le payment intent échoue
      await supabaseAdmin
        .from('orders')
        .delete()
        .eq('id', order.id)
      
      return NextResponse.json({
        error: 'Erreur de création du paiement',
        details: stripeError.message,
        stripe_error_type: stripeError.type,
        orderId: order.id,
        orderNumber: order.order_number
      }, { status: 500 })
    }

    // Mettre à jour la commande avec l'ID du PaymentIntent
    try {
      await supabaseAdmin
        .from('orders')
        .update({ 
          stripe_payment_intent_id: paymentIntent.id,
          payment_status: 'pending'
        })
        .eq('id', order.id)

      console.log('✅ Order updated with PaymentIntent ID')

    } catch (updateError) {
      console.error('❌ Failed to update order with PaymentIntent ID:', updateError)
      
      // Annuler le payment intent si la mise à jour échoue
      try {
        await stripe.paymentIntents.cancel(paymentIntent.id)
        console.log('✅ PaymentIntent cancelled due to order update failure')
      } catch (cancelError) {
        console.error('❌ Failed to cancel PaymentIntent:', cancelError)
      }
      
      return NextResponse.json({
        error: 'Erreur de mise à jour de la commande',
        details: updateError instanceof Error ? updateError.message : 'Unknown error'
      }, { status: 500 })
    }

    console.log('🎉 Order created successfully:', {
      orderId: order.id,
      orderNumber: order.order_number,
      filesUploaded: cartItems.length,
      paymentIntentId: paymentIntent.id
    })

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderId: order.id,
      orderNumber: order.order_number,
      filesUploaded: cartItems.length,
    })
  } catch (error: any) {
    console.error('❌ Error creating order with payment:')
    console.error('  - Message:', error?.message)
    console.error('  - Stack:', error?.stack)
    console.error('  - Type:', error?.constructor?.name)
    console.error('  - Full error:', error)
    
    return NextResponse.json(
      { 
        error: 'Erreur lors de la création de la commande avec paiement',
        details: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}