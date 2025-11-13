import { NextRequest, NextResponse } from 'next/server'
import { jobManager } from '@/lib/job-manager'
import {
  probeMedia,
  getMediaType,
  createMontage,
  calculateImageDuration,
  type MediaFile
} from '@/lib/ffmpeg-processor'
import { getMusicById } from '@/lib/music-library'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

const TMP_DIR = path.join(process.cwd(), 'tmp')
const OUTPUT_DIR = path.join(process.cwd(), 'outputs')

// Créer les dossiers si ils n'existent pas
async function ensureDirectories() {
  if (!existsSync(TMP_DIR)) {
    await fs.mkdir(TMP_DIR, { recursive: true })
  }
  if (!existsSync(OUTPUT_DIR)) {
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mediaPaths, musicTrackId, musicPath, format } = body

    if (!mediaPaths || !Array.isArray(mediaPaths) || mediaPaths.length === 0) {
      return NextResponse.json(
        { error: 'No media paths provided' },
        { status: 400 }
      )
    }

    // Filtrer les valeurs undefined/null et valider les chemins
    const validMediaPaths = mediaPaths.filter((media) => {
      if (!media) return false

      // Support both string paths and {path, type} objects
      const mediaPath = typeof media === 'string' ? media : media?.path

      if (!mediaPath || typeof mediaPath !== 'string') {
        console.warn('⚠️ Invalid media path filtered out:', media)
        return false
      }

      return true
    })

    if (validMediaPaths.length === 0) {
      return NextResponse.json(
        { error: 'No valid media paths after filtering' },
        { status: 400 }
      )
    }

    console.log(`✅ Valid media paths: ${validMediaPaths.length}/${mediaPaths.length}`)

    // Créer un ID de job unique
    const jobId = uuidv4()

    // Créer le job
    jobManager.createJob(jobId)

    // Lancer le traitement en asynchrone avec les chemins validés
    setImmediate(async () => {
      await processMontage(jobId, validMediaPaths, musicTrackId, musicPath, format)
    })

    // Retourner immédiatement
    return NextResponse.json({
      success: true,
      jobId,
      progressUrl: `/api/montage/progress/${jobId}`
    })

  } catch (error) {
    console.error('Create montage error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Traitement du montage en asynchrone
 */
async function processMontage(
  jobId: string,
  mediaPaths: Array<{ path: string; type: 'image' | 'video'; duration?: number } | string>,
  musicTrackId: string | null,
  customMusicPath: string | undefined,
  format: 'portrait' | 'landscape'
): Promise<void> {
  const tempFiles: string[] = []

  try {
    await ensureDirectories()

    jobManager.updateJob(jobId, {
      status: 'processing',
      progress: 10,
      message: 'Analyse des médias...'
    })

    // 2. Analyser chaque média avec ffprobe
    const mediaList: MediaFile[] = []

    for (let i = 0; i < mediaPaths.length; i++) {
      const media = mediaPaths[i]

      // Support both string paths and {path, type} objects for flexibility
      const mediaPath = typeof media === 'string' ? media : media.path
      const mediaType = getMediaType(mediaPath)

      if (mediaType === 'unknown') {
        throw new Error(`Unknown media type for ${mediaPath}`)
      }

      const info = await probeMedia(mediaPath)

      if (mediaType === 'image') {
        // Pour les images, utiliser la durée spécifiée ou calculer automatiquement
        const duration = typeof media === 'object' && media.duration
          ? media.duration
          : calculateImageDuration(mediaPaths.length)

        mediaList.push({
          path: mediaPath,
          type: 'image',
          duration,
          hasAudio: false,
          isImage: true
        })
      } else {
        // Pour les vidéos, utiliser la durée réelle
        mediaList.push({
          path: mediaPath,
          type: 'video',
          duration: info.duration || 5,
          hasAudio: info.hasAudio,
          isImage: false
        })
      }

      jobManager.updateJob(jobId, {
        progress: 10 + (i / mediaPaths.length) * 10,
        message: `Analyse ${i + 1}/${mediaPaths.length}...`
      })
    }

    // 3. Musique (personnalisée ou prédéfinie)
    let musicPath: string | undefined

    if (customMusicPath) {
      // Utiliser la musique personnalisée uploadée
      musicPath = customMusicPath
      console.log('🎵 Utilisation de la musique personnalisée:', customMusicPath)
    } else if (musicTrackId && musicTrackId !== 'none') {
      // Gérer les musiques prédéfinies
      const selectedTrack = getMusicById(musicTrackId)
      if (selectedTrack) {
        musicPath = path.join(process.cwd(), 'public', 'music', selectedTrack.filename)
        console.log('🎵 Musique prédéfinie sélectionnée:', selectedTrack.name, '→', musicPath)
      } else {
        console.warn('⚠️ Musique prédéfinie introuvable:', musicTrackId)
      }
    }

    // 4. Déterminer la résolution de sortie
    const width = format === 'portrait' ? 1080 : 1920
    const height = format === 'portrait' ? 1920 : 1080

    // 5. Créer le montage
    const outputFileName = `montage_${jobId}.mp4`
    const outputPath = path.join(OUTPUT_DIR, outputFileName)

    await createMontage(mediaList, outputPath, {
      width,
      height,
      transition: 'fade',
      transitionDuration: 0.5,
      musicPath,
      musicVolume: 0.3,
      onProgress: (percent, message) => {
        jobManager.updateJob(jobId, {
          progress: 20 + percent * 0.7,
          message
        })
      }
    })

    // 6. Marquer le job comme terminé avec URL locale
    const videoUrl = `/api/montage/video/${outputFileName}`

    jobManager.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      message: 'Montage terminé !',
      videoUrl
    })

  } catch (error) {
    console.error(`Job ${jobId} failed:`, error)

    jobManager.updateJob(jobId, {
      status: 'failed',
      progress: 0,
      message: 'Erreur lors du traitement',
      error: error instanceof Error ? error.message : 'Unknown error'
    })

  } finally {
    // Nettoyage des fichiers temporaires (musique, etc.)
    for (const file of tempFiles) {
      try {
        await fs.unlink(file)
      } catch (err) {
        console.warn(`Failed to delete ${file}:`, err)
      }
    }

    // Note: On ne supprime PAS les fichiers médias uploadés ni la vidéo finale
    // pour permettre le téléchargement. Un cleanup séparé pourra être mis en place.
  }
}
