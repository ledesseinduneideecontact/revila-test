import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

const MAX_FILES = 20
const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB
const TMP_DIR = path.join(process.cwd(), 'tmp')

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/aac', 'audio/x-m4a']

// Créer le dossier tmp si nécessaire
async function ensureTmpDir() {
  if (!existsSync(TMP_DIR)) {
    await fs.mkdir(TMP_DIR, { recursive: true })
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureTmpDir()

    const formData = await request.formData()
    const files = formData.getAll('media') as File[]
    const musicFile = formData.get('music') as File | null

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files allowed` },
        { status: 400 }
      )
    }

    const uploadedMedia: Array<{
      path: string
      type: 'image' | 'video'
      originalName: string
      size: number
    }> = []

    const uploadId = Date.now()

    // Upload media files (photos and videos)
    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Validation de taille
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds maximum size of 500MB` },
          { status: 400 }
        )
      }

      // Validation de type
      const isImage = ALLOWED_IMAGE_TYPES.includes(file.type)
      const isVideo = ALLOWED_VIDEO_TYPES.includes(file.type)

      if (!isImage && !isVideo) {
        return NextResponse.json(
          { error: `File ${file.name} has unsupported type: ${file.type}` },
          { status: 400 }
        )
      }

      // Préparer le nom de fichier
      const ext = file.name.split('.').pop() || 'bin'
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `media_${uploadId}_${i}_${sanitizedName}`
      const filePath = path.join(TMP_DIR, fileName)

      // Convertir le fichier en buffer
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Sauvegarder localement
      await fs.writeFile(filePath, buffer)

      uploadedMedia.push({
        path: filePath,
        type: isImage ? 'image' : 'video',
        originalName: file.name,
        size: file.size
      })
    }

    // Upload custom music file if provided
    let musicPath: string | undefined

    if (musicFile) {
      console.log('🎵 Processing custom music file:', musicFile.name)

      // Validation de taille pour la musique
      if (musicFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `Music file ${musicFile.name} exceeds maximum size of 500MB` },
          { status: 400 }
        )
      }

      // Validation de type audio
      if (!ALLOWED_AUDIO_TYPES.includes(musicFile.type)) {
        return NextResponse.json(
          { error: `Music file ${musicFile.name} has unsupported type: ${musicFile.type}. Supported: MP3, WAV, OGG, AAC` },
          { status: 400 }
        )
      }

      // Préparer le nom du fichier audio
      const ext = musicFile.name.split('.').pop() || 'mp3'
      const sanitizedName = musicFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `music_${uploadId}_${sanitizedName}`
      musicPath = path.join(TMP_DIR, fileName)

      // Convertir le fichier en buffer
      const arrayBuffer = await musicFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Sauvegarder localement
      await fs.writeFile(musicPath, buffer)
      console.log('✅ Custom music saved:', musicPath)
    }

    return NextResponse.json({
      success: true,
      media: uploadedMedia,
      musicPath,
      uploadId
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Désactiver le body parser par défaut de Next.js
export const config = {
  api: {
    bodyParser: false,
  },
}
