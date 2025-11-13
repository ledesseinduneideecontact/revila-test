import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import * as Shotstack from 'shotstack-sdk'

const shotstackApiKey = process.env.SHOTSTACK_API_KEY || ''
const shotstackEnvironment = process.env.SHOTSTACK_ENVIRONMENT || 'stage'

/**
 * Endpoint SSE (Server-Sent Events) pour suivre le statut d'un montage
 * Utilise l'API Shotstack pour récupérer la progression du rendu
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: montageId } = await params

  try {
    // Configuration SSE
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    // Fonction pour envoyer des événements SSE
    const sendEvent = async (data: any) => {
      const message = `data: ${JSON.stringify(data)}\n\n`
      await writer.write(encoder.encode(message))
    }

    // Polling de statut en arrière-plan
    const pollStatus = async () => {
      try {
        // Récupérer le montage depuis la DB
        const { data: montage, error: dbError } = await supabaseAdmin
          .from('montages')
          .select('*')
          .eq('id', montageId)
          .single()

        if (dbError || !montage) {
          await sendEvent({
            status: 'error',
            message: 'Montage introuvable',
          })
          await writer.close()
          return
        }

        // Si le montage est déjà terminé ou en erreur, envoyer le statut final
        if (montage.shotstack_status === 'completed' || montage.shotstack_status === 'failed') {
          await sendEvent({
            status: montage.shotstack_status,
            progress: montage.shotstack_progress,
            videoUrl: montage.final_video_gcs_url,
            error: montage.shotstack_error_message,
          })
          await writer.close()
          return
        }

        // Sinon, interroger Shotstack pour le statut
        if (montage.shotstack_render_id) {
          const shotstackStatus = await getShotstackRenderStatus(montage.shotstack_render_id)

          // Mettre à jour la DB avec le nouveau statut
          const updateData: any = {
            shotstack_status: shotstackStatus.status,
            shotstack_progress: shotstackStatus.progress,
          }

          if (shotstackStatus.status === 'completed' && shotstackStatus.url) {
            updateData.final_video_gcs_url = shotstackStatus.url
            updateData.processing_completed_at = new Date().toISOString()
          } else if (shotstackStatus.status === 'failed') {
            updateData.shotstack_error_message = shotstackStatus.error || 'Erreur inconnue'
          }

          await supabaseAdmin
            .from('montages')
            .update(updateData)
            .eq('id', montageId)

          // Envoyer l'événement au client
          await sendEvent({
            status: shotstackStatus.status,
            progress: shotstackStatus.progress,
            videoUrl: shotstackStatus.url,
            error: shotstackStatus.error,
          })

          // Si terminé, fermer le stream
          if (shotstackStatus.status === 'completed' || shotstackStatus.status === 'failed') {
            await writer.close()
            return
          }
        }

        // Continuer le polling toutes les 2 secondes
        setTimeout(pollStatus, 2000)
      } catch (error) {
        console.error('Error polling status:', error)
        await sendEvent({
          status: 'error',
          message: 'Erreur lors de la récupération du statut',
        })
        await writer.close()
      }
    }

    // Démarrer le polling
    pollStatus()

    // Retourner la réponse SSE
    return new NextResponse(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error setting up SSE:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la configuration du streaming' },
      { status: 500 }
    )
  }
}

/**
 * Récupère le statut d'un rendu depuis Shotstack API
 */
async function getShotstackRenderStatus(renderId: string): Promise<{
  status: string
  progress: number
  url?: string
  error?: string
}> {
  try {
    // Configuration de l'API Shotstack
    const defaultClient = Shotstack.ApiClient.instance
    const DeveloperKey = defaultClient.authentications['DeveloperKey']
    DeveloperKey.apiKey = shotstackApiKey

    // Définir l'environnement
    if (shotstackEnvironment === 'production') {
      defaultClient.basePath = 'https://api.shotstack.io/v1'
    } else {
      defaultClient.basePath = 'https://api.shotstack.io/stage'
    }

    const api = new Shotstack.EditApi()

    // Récupérer le statut du rendu
    const response = await api.getRender(renderId)
    const render = response.response

    let status = 'processing'
    let progress = 0

    switch (render.status) {
      case 'queued':
        status = 'processing'
        progress = 10
        break
      case 'fetching':
        status = 'processing'
        progress = 30
        break
      case 'rendering':
        status = 'processing'
        progress = 60
        break
      case 'saving':
        status = 'processing'
        progress = 90
        break
      case 'done':
        status = 'completed'
        progress = 100
        break
      case 'failed':
        status = 'failed'
        progress = 0
        break
    }

    return {
      status,
      progress,
      url: render.url || undefined,
      error: render.error || undefined,
    }
  } catch (error) {
    console.error('Shotstack API error:', error)
    return {
      status: 'error',
      progress: 0,
      error: 'Erreur lors de la récupération du statut Shotstack',
    }
  }
}
