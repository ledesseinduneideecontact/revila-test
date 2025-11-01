import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface WebhookEventData {
  orderId: string
  eventType: 'stripe_webhook' | 'confirm_route'
  stripeEventId?: string
}

export interface ProcessResult {
  shouldProcess: boolean
  isFirstTime: boolean
  eventId: string
}

/**
 * Fonction atomique de déduplication des webhooks
 * Utilise les contraintes uniques PostgreSQL pour éviter les race conditions
 */
export async function processWebhookEvent(data: WebhookEventData): Promise<ProcessResult> {
  const { orderId, eventType, stripeEventId } = data
  
  console.log(`🔍 Vérification webhook: ${eventType} pour commande ${orderId}`)
  
  try {
    // 1. Tentative d'insertion atomique avec statut 'processing'
    const { data: newEvent, error: insertError } = await supabase
      .from('webhook_events')
      .insert({
        order_id: orderId,
        event_type: eventType,
        stripe_event_id: stripeEventId,
        status: 'processing'
      })
      .select('id')
      .single()

    if (!insertError && newEvent) {
      console.log(`✅ Premier webhook ${eventType} pour commande ${orderId} - traitement autorisé`)
      return {
        shouldProcess: true,
        isFirstTime: true,
        eventId: newEvent.id
      }
    }

    // 2. Si erreur de contrainte unique, vérifier l'état existant
    if (insertError?.code === '23505') { // PostgreSQL unique violation
      console.log(`🔄 Webhook ${eventType} déjà existant pour commande ${orderId} - vérification de l'état`)
      
      const { data: existingEvent, error: selectError } = await supabase
        .from('webhook_events')
        .select('id, status, n8n_triggered_at, created_at, updated_at')
        .eq('order_id', orderId)
        .eq('event_type', eventType)
        .single()

      if (selectError || !existingEvent) {
        throw new Error(`Impossible de récupérer l'événement existant: ${selectError?.message}`)
      }

      // Si déjà traité avec succès et N8N déclenché, ignorer
      if (existingEvent.status === 'completed' && existingEvent.n8n_triggered_at) {
        console.log(`⏭️  Webhook ${eventType} déjà traité avec succès pour commande ${orderId}`)
        return {
          shouldProcess: false,
          isFirstTime: false,
          eventId: existingEvent.id
        }
      }

      // Si en échec ou en cours depuis plus de 5 minutes, permettre un retry
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const lastUpdate = new Date(existingEvent.updated_at)
      
      const shouldRetry = existingEvent.status === 'failed' || 
                         (existingEvent.status === 'processing' && lastUpdate < fiveMinutesAgo)

      if (shouldRetry) {
        console.log(`🔄 Retry autorisé pour webhook ${eventType} commande ${orderId} (statut: ${existingEvent.status})`)
        
        // Réessayer en mettant à jour le statut
        const { error: updateError } = await supabase
          .from('webhook_events')
          .update({ 
            status: 'processing', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', existingEvent.id)

        if (updateError) {
          throw new Error(`Erreur mise à jour retry: ${updateError.message}`)
        }

        return {
          shouldProcess: true,
          isFirstTime: false,
          eventId: existingEvent.id
        }
      }

      // Sinon, déjà en cours de traitement récent
      console.log(`⚠️  Webhook ${eventType} déjà en cours pour commande ${orderId} - ignoré`)
      return {
        shouldProcess: false,
        isFirstTime: false,
        eventId: existingEvent.id
      }
    }

    // Autre erreur non attendue
    console.error(`❌ Erreur insertion webhook détaillée:`, {
      message: insertError?.message,
      code: insertError?.code,
      details: insertError?.details,
      hint: insertError?.hint,
      orderId,
      eventType
    })
    
    // Erreur spécifique si table n'existe pas
    if (insertError?.message?.includes('relation "webhook_events" does not exist')) {
      throw new Error(`❌ ERREUR: Table 'webhook_events' manquante dans Supabase. Créez-la avec le SQL fourni dans sql/webhook_events.sql`)
    }
    
    throw new Error(`Erreur insertion webhook: ${insertError?.message || 'Erreur inconnue'}`)

  } catch (error) {
    console.error(`❌ Erreur processWebhookEvent (${eventType}, ${orderId}):`, error)
    throw error
  }
}

/**
 * Marque un webhook comme terminé (succès ou échec)
 */
export async function markWebhookCompleted(eventId: string, n8nSuccess: boolean = true): Promise<void> {
  const status = n8nSuccess ? 'completed' : 'failed'
  const updateData: any = { 
    status, 
    updated_at: new Date().toISOString() 
  }
  
  if (n8nSuccess) {
    updateData.n8n_triggered_at = new Date().toISOString()
  }

  console.log(`📝 Marquage webhook ${eventId} comme ${status}`)

  const { error } = await supabase
    .from('webhook_events')
    .update(updateData)
    .eq('id', eventId)

  if (error) {
    console.error(`❌ Erreur marquage webhook ${eventId}:`, error)
    throw error
  }

  console.log(`✅ Webhook ${eventId} marqué comme ${status}`)
}