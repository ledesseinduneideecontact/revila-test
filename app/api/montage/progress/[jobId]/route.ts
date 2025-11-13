import { NextRequest } from 'next/server'
import { jobManager } from '@/lib/job-manager'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params

  // Vérifier que le job existe
  const job = jobManager.getJob(jobId)
  if (!job) {
    return new Response('Job not found', { status: 404 })
  }

  // Créer un stream pour Server-Sent Events
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Fonction pour envoyer un événement
      const sendEvent = (data: any) => {
        const message = `data: ${JSON.stringify(data)}\n\n`
        controller.enqueue(encoder.encode(message))
      }

      // Envoyer immédiatement l'état actuel
      sendEvent({
        status: job.status,
        progress: job.progress,
        message: job.message,
        videoUrl: job.videoUrl,
        error: job.error
      })

      // Si le job est déjà terminé, fermer le stream
      if (job.status === 'completed' || job.status === 'failed') {
        controller.close()
        return
      }

      // Polling pour envoyer les updates
      const pollInterval = setInterval(() => {
        const currentJob = jobManager.getJob(jobId)

        if (!currentJob) {
          clearInterval(pollInterval)
          controller.close()
          return
        }

        // Envoyer l'état actuel
        sendEvent({
          status: currentJob.status,
          progress: currentJob.progress,
          message: currentJob.message,
          videoUrl: currentJob.videoUrl,
          error: currentJob.error
        })

        // Si le job est terminé, fermer le stream
        if (currentJob.status === 'completed' || currentJob.status === 'failed') {
          clearInterval(pollInterval)
          controller.close()
        }
      }, 500) // Envoyer un update toutes les 500ms

      // Nettoyage quand le client se déconnecte
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval)
        controller.close()
      })
    }
  })

  // Retourner le stream avec les headers appropriés pour SSE
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
