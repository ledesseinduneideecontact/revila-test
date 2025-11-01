/**
 * Fonction centralisée pour déclencher les webhooks N8N
 * Gère les timeouts, retry et logging unifié
 */
export async function triggerN8NWebhook(orderId: string, orderNumber?: string): Promise<boolean> {
  // En développement, utiliser le webhook de test
  const webhookUrl = process.env.NODE_ENV === 'development' 
    ? process.env.N8N_WEBHOOK_NEW_ORDER_TEST 
    : process.env.N8N_WEBHOOK_NEW_ORDER_PROD || process.env.N8N_WEBHOOK_NEW_ORDER_TEST
  
  if (!webhookUrl) {
    console.error('❌ URL webhook N8N manquante dans les variables d\'environnement')
    console.error('   Variables attendues: N8N_WEBHOOK_NEW_ORDER_PROD ou N8N_WEBHOOK_NEW_ORDER_TEST')
    return false
  }

  console.log(`🚀 Déclenchement webhook N8N pour commande ${orderId}`)
  console.log(`   URL: ${webhookUrl}`)

  try {
    // 🔥 FIX CRITIQUE : N8N s'attend à recevoir "order_number", pas "order_id"
    let finalOrderNumber = orderNumber
    
    // Si pas de order_number fourni, récupérer depuis la base
    if (!finalOrderNumber) {
      console.log(`🔍 Récupération order_number pour orderId: ${orderId}`)
      try {
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        const { data: order, error } = await supabase
          .from('orders')
          .select('order_number')
          .eq('id', orderId)
          .single()
          
        if (error || !order) {
          console.error(`❌ Impossible de récupérer order_number pour ${orderId}:`, error)
          return false
        }
        
        finalOrderNumber = order.order_number
        console.log(`✅ Order number récupéré: ${finalOrderNumber}`)
      } catch (dbError) {
        console.error(`❌ Erreur base de données:`, dbError)
        return false
      }
    }

    // Payload compatible avec N8N (selon CLAUDE.md)
    const payload = {
      order_number: finalOrderNumber,  // 🎯 Format attendu par N8N
      timestamp: new Date().toISOString(),
      source: 'revive-app',
      environment: process.env.NODE_ENV || 'development'
    }

    // 🚨 LOGS PRÉ-FETCH - Diagnostic complet
    console.log(`\n🔍 === DIAGNOSTIC N8N PRÉ-FETCH ===`)
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`)
    console.log(`📊 Performance start: ${performance.now()}ms`)
    console.log(`🌐 URL webhook N8N: ${webhookUrl}`)
    console.log(`📦 Payload à envoyer:`, JSON.stringify(payload, null, 2))
    console.log(`🔧 Variables env disponibles:`)
    console.log(`   N8N_WEBHOOK_NEW_ORDER_PROD: ${!!process.env.N8N_WEBHOOK_NEW_ORDER_PROD}`)
    console.log(`   N8N_WEBHOOK_NEW_ORDER_TEST: ${!!process.env.N8N_WEBHOOK_NEW_ORDER_TEST}`)
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
    console.log(`🚀 Démarrage fetch...`)

    let response: Response
    const startTime = performance.now()

    try {
      // Création du controller pour timeout de 60 secondes
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        console.error(`❌ TIMEOUT N8N après 60s pour commande ${orderId}`)
        controller.abort()
      }, 60000)

      console.log(`📡 Envoi fetch vers: ${webhookUrl}`)
      
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'User-Agent': 'Revive-App-Webhook/1.0',
          'X-Source': 'revive-app',
          'X-Order-Id': orderId
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      const fetchDuration = performance.now() - startTime

      console.log(`✅ Fetch terminé en ${fetchDuration.toFixed(2)}ms`)
      console.log(`📊 Status HTTP: ${response.status} ${response.statusText}`)
      console.log(`🔗 Response URL: ${response.url}`)
      console.log(`📋 Response Headers:`, Object.fromEntries(response.headers.entries()))

    } catch (fetchError: any) {
      const fetchDuration = performance.now() - startTime
      console.error(`\n❌ === ERREUR FETCH N8N ===`)
      console.error(`⏱️  Durée avant erreur: ${fetchDuration.toFixed(2)}ms`)
      console.error(`🚨 Type erreur: ${fetchError.name}`)
      console.error(`📝 Message: ${fetchError.message}`)
      console.error(`🔍 Stack:`, fetchError.stack)
      
      if (fetchError.name === 'AbortError') {
        console.error(`⏰ Timeout de 30 secondes atteint`)
      } else if (fetchError.code === 'ENOTFOUND') {
        console.error(`🌐 DNS resolution failed - URL introuvable`)
      } else if (fetchError.code === 'ECONNREFUSED') {
        console.error(`🔌 Connexion refusée par le serveur`)
      }
      
      return false
    }

    // 🔍 ANALYSE DE LA RÉPONSE
    try {
      const responseText = await response.text()
      console.log(`📄 Response body: ${responseText.substring(0, 1000)}${responseText.length > 1000 ? '...' : ''}`)

      if (response.ok) {
        console.log(`\n✅ === SUCCÈS N8N ===`)
        console.log(`🎯 Order Number: ${finalOrderNumber}`)
        console.log(`📊 Status: ${response.status}`)
        console.log(`📄 Body length: ${responseText.length} chars`)
        return true
      } else {
        console.error(`\n❌ === ÉCHEC N8N ===`)
        console.error(`🎯 Order Number: ${finalOrderNumber}`)
        console.error(`📊 Status: ${response.status} ${response.statusText}`)
        console.error(`🌐 URL: ${webhookUrl}`)
        console.error(`📄 Error body: ${responseText}`)
        
        // 🚨 Diagnostic par code d'erreur
        if (response.status === 404) {
          console.error(`🔍 404: Webhook N8N inexistant ou URL incorrecte`)
        } else if (response.status === 400) {
          console.error(`🔍 400: Format payload incorrect ou champs manquants`)
        } else if (response.status === 500) {
          console.error(`🔍 500: Erreur interne N8N - vérifiez les logs N8N`)
        } else if (response.status === 502 || response.status === 503) {
          console.error(`🔍 ${response.status}: N8N indisponible temporairement`)
        }
        
        return false
      }
    } catch (textError) {
      console.error(`❌ Impossible de lire response.text():`, textError)
      return false
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`❌ Webhook N8N timeout (30s) pour commande ${orderId}`)
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error(`❌ Webhook N8N - Erreur réseau pour commande ${orderId}:`, error.message)
    } else {
      console.error(`❌ Webhook N8N - Erreur inattendue pour commande ${orderId}:`, error)
    }
    return false
  }
}

/**
 * Version avec retry automatique (optionnel)
 */
export async function triggerN8NWebhookWithRetry(
  orderId: string, 
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
    console.log(`🔄 Tentative ${attempt}/${maxRetries + 1} webhook N8N pour commande ${orderId}`)
    
    const success = await triggerN8NWebhook(orderId)
    
    if (success) {
      if (attempt > 1) {
        console.log(`✅ Webhook N8N réussi après ${attempt} tentatives pour commande ${orderId}`)
      }
      return true
    }
    
    // Si ce n'est pas la dernière tentative, attendre avant retry
    if (attempt <= maxRetries) {
      console.log(`⏳ Attente ${delayMs}ms avant retry...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
      delayMs *= 2 // Backoff exponentiel
    }
  }
  
  console.error(`❌ Webhook N8N définitivement échoué après ${maxRetries + 1} tentatives pour commande ${orderId}`)
  return false
}