import ffmpeg from 'fluent-ffmpeg'
import ffmpegStatic from 'ffmpeg-static'
import ffprobeStatic from 'ffprobe-static'
import path from 'path'
import fs from 'fs/promises'
import { existsSync } from 'fs'

// Configuration FFmpeg avec chemins absolus
let ffmpegPath: string | null = null
let ffprobePath: string | null = null

// Extraire le chemin FFmpeg (peut être string ou objet)
if (typeof ffmpegStatic === 'string') {
  ffmpegPath = path.resolve(ffmpegStatic)
} else if (ffmpegStatic && typeof ffmpegStatic === 'object') {
  ffmpegPath = path.resolve((ffmpegStatic as any).path || '')
}

// Extraire le chemin FFprobe
if (ffprobeStatic && ffprobeStatic.path) {
  ffprobePath = path.resolve(ffprobeStatic.path)
}

console.log('🎬 FFmpeg configuration:')
console.log('  - FFmpeg path:', ffmpegPath)
console.log('  - FFmpeg exists:', ffmpegPath ? existsSync(ffmpegPath) : false)
console.log('  - FFprobe path:', ffprobePath)
console.log('  - FFprobe exists:', ffprobePath ? existsSync(ffprobePath) : false)

if (ffmpegPath && existsSync(ffmpegPath)) {
  ffmpeg.setFfmpegPath(ffmpegPath)
  console.log('  ✅ FFmpeg configured successfully')
} else {
  console.error('  ❌ FFmpeg binary not found at:', ffmpegPath)
  throw new Error(`FFmpeg binary not found at: ${ffmpegPath}`)
}

if (ffprobePath && existsSync(ffprobePath)) {
  ffmpeg.setFfprobePath(ffprobePath)
  console.log('  ✅ FFprobe configured successfully')
} else {
  console.error('  ❌ FFprobe binary not found at:', ffprobePath)
  throw new Error(`FFprobe binary not found at: ${ffprobePath}`)
}

export interface MediaInfo {
  duration: number | null
  hasAudio: boolean
  width?: number
  height?: number
}

export interface MediaFile {
  path: string
  type: 'image' | 'video'
  duration: number  // Pour les images, c'est la durée souhaitée du clip
  hasAudio: boolean
  isImage: boolean
}

export interface MontageOptions {
  width: number      // Résolution de sortie
  height: number
  transition?: 'fade' | 'dissolve' | 'wipeleft' | 'wiperight'
  transitionDuration?: number
  musicPath?: string
  musicVolume?: number
  onProgress?: (percent: number, message: string) => void
}

/**
 * Analyse un fichier média avec ffprobe
 */
export async function probeMedia(filePath: string): Promise<MediaInfo> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('ffprobe error:', err)
        resolve({ duration: null, hasAudio: false })
        return
      }

      const duration = metadata.format?.duration || null
      const hasAudio = metadata.streams?.some(s => s.codec_type === 'audio') || false
      const videoStream = metadata.streams?.find(s => s.codec_type === 'video')

      resolve({
        duration: duration ? parseFloat(duration.toString()) : null,
        hasAudio,
        width: videoStream?.width,
        height: videoStream?.height
      })
    })
  })
}

/**
 * Détecte le type de média (image ou vidéo)
 */
export function getMediaType(filePath: string): 'image' | 'video' | 'unknown' {
  const ext = path.extname(filePath).toLowerCase()

  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif']
  const videoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.mpg', '.mpeg', '.ogv']

  if (imageExts.includes(ext)) return 'image'
  if (videoExts.includes(ext)) return 'video'

  return 'unknown'
}

/**
 * Optimise un média (vidéo ou image) en le réduisant à 1080p max
 * Améliore considérablement les performances et la fiabilité
 */
async function optimizeMediaForProcessing(
  inputPath: string,
  outputPath: string,
  format: 'portrait' | 'landscape'
): Promise<string> {
  const maxDimension = 1920 // 1080p max (1920×1080 ou 1080×1920)

  console.log(`🔧 Optimizing media: ${path.basename(inputPath)}`)
  console.log(`   Target: ${format} (max ${maxDimension}px)`)

  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      // Scale to max 1920px on longest dimension, maintaining aspect ratio
      // IMPORTANT: -2 forces the dimension to be divisible by 2 (required for H.264)
      // The -2 tells FFmpeg to calculate the other dimension while maintaining aspect ratio
      // and ensuring it's divisible by 2
      // Note: backslash escapes comma in min() function
      .videoFilters(`scale=min(${maxDimension}\\,iw):-2`)
      .outputOptions([
        '-preset', 'veryfast',   // Rapide
        '-crf', '23',            // Qualité constante
        '-maxrate', '5M',        // Limite le bitrate à 5 Mbps
        '-bufsize', '10M',       // Buffer de 10MB pour éviter les pics
        '-pix_fmt', 'yuv420p',   // Compatibilité universelle
        '-r', '30'               // 30 fps standard
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log(`   🚀 Optimization command: ${cmd.substring(0, 100)}...`)
      })
      .on('progress', (progress) => {
        if (progress.percent && progress.percent > 0) {
          console.log(`   ⏳ Optimizing: ${progress.percent.toFixed(1)}%`)
        }
      })
      .on('end', () => {
        console.log(`   ✅ Optimized: ${path.basename(outputPath)}`)
        resolve(outputPath)
      })
      .on('error', (err, stdout, stderr) => {
        console.error(`   ❌ Optimization failed: ${err.message}`)
        console.error(`   📋 Stderr: ${stderr}`)
        reject(new Error(`Optimization failed: ${err.message}`))
      })
      .run()
  })
}

/**
 * Convertit une image en clip vidéo
 */
export async function imageToVideo(
  imagePath: string,
  outputPath: string,
  duration: number = 3,
  addFade: boolean = true
): Promise<string> {
  console.log(`🖼️  Converting image to video: ${imagePath}`)
  console.log(`   Output: ${outputPath}`)
  console.log(`   Duration: ${duration}s, Fade: ${addFade}`)

  return new Promise((resolve, reject) => {
    let command = ffmpeg(imagePath)
      .loop(duration)
      .fps(30)
      .duration(duration)
      .videoCodec('libx264')
      .outputOptions([
        '-pix_fmt yuv420p',
        '-preset fast',
        '-crf 23'
      ])

    // Build video filters array
    const filters: string[] = []

    // IMPORTANT: Ensure dimensions are even numbers (divisible by 2) for H.264 encoding
    // Formula: trunc(iw/2)*2:trunc(ih/2)*2 rounds down to nearest even number
    filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2')

    if (addFade) {
      const fadeInDuration = 0.5
      const fadeOutStart = duration - 0.5
      filters.push(`fade=t=in:st=0:d=${fadeInDuration}`)
      filters.push(`fade=t=out:st=${fadeOutStart}:d=0.5`)
    }

    command.videoFilters(filters)

    command
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('🎬 Image->Video FFmpeg command:', commandLine)
      })
      .on('progress', (progress) => {
        if (progress.percent) {
          console.log(`   Progress: ${progress.percent.toFixed(1)}%`)
        }
      })
      .on('end', () => {
        console.log(`✅ Image converted successfully: ${outputPath}`)
        resolve(outputPath)
      })
      .on('error', (err, stdout, stderr) => {
        console.error('❌ Image->Video FFmpeg error:', err.message)
        console.error('📋 FFmpeg stdout:', stdout)
        console.error('📋 FFmpeg stderr:', stderr)
        reject(new Error(`Image conversion failed: ${err.message}\nStderr: ${stderr}`))
      })
      .run()
  })
}

/**
 * Crée un montage vidéo à partir de plusieurs médias
 */
export async function createMontage(
  mediaList: MediaFile[],
  outputPath: string,
  options: MontageOptions
): Promise<void> {
  console.log('🎬 ========== STARTING MONTAGE CREATION ==========')
  console.log(`📁 Output path: ${outputPath}`)
  console.log(`📊 Media count: ${mediaList.length}`)
  console.log(`📐 Resolution: ${options.width}x${options.height}`)
  console.log(`🎵 Music: ${options.musicPath || 'None'}`)

  const {
    width,
    height,
    transition = 'fade',
    transitionDuration = 0.5,
    musicPath,
    musicVolume = 0.3,
    onProgress
  } = options

  if (mediaList.length === 0) {
    throw new Error('No media files provided')
  }

  // Log media details
  console.log('📋 Media list:')
  mediaList.forEach((media, i) => {
    console.log(`  [${i}] ${media.isImage ? '🖼️ ' : '🎥'} ${media.path}`)
    console.log(`      Type: ${media.type}, Duration: ${media.duration}s, Audio: ${media.hasAudio}`)
  })

  // Fichiers temporaires pour les images converties et optimisations
  const tempFiles: string[] = []

  try {
    // Étape 0: Optimiser TOUS les médias à 1080p max pour améliorer performances
    console.log('\n🔧 Step 0: Optimizing all media to 1080p max...')
    onProgress?.(2, 'Optimisation des médias...')

    const optimizedMediaList: MediaFile[] = []
    const format = width > height ? 'landscape' : 'portrait'

    for (let i = 0; i < mediaList.length; i++) {
      const media = mediaList[i]

      if (!media.isImage) {
        // Optimiser les vidéos
        console.log(`\n🎥 Optimizing video ${i + 1}/${mediaList.length}: ${path.basename(media.path)}`)
        const optimizedPath = path.join(
          path.dirname(outputPath),
          `optimized_${Date.now()}_${i}.mp4`
        )

        await optimizeMediaForProcessing(media.path, optimizedPath, format)
        tempFiles.push(optimizedPath)

        optimizedMediaList.push({
          ...media,
          path: optimizedPath
        })

        onProgress?.(2 + (i / mediaList.length) * 18, `Vidéo ${i + 1}/${mediaList.length} optimisée`)
      } else {
        // Les images seront converties dans l'étape suivante
        optimizedMediaList.push(media)
      }
    }

    // Étape 1: Convertir les images en vidéos temporaires
    console.log('\n📸 Step 1: Converting images to video clips...')
    onProgress?.(20, 'Conversion des photos en clips vidéo...')

    const processedMediaList: MediaFile[] = []

    for (let i = 0; i < optimizedMediaList.length; i++) {
      const media = optimizedMediaList[i]

      if (media.isImage) {
        console.log(`\n🖼️  Processing image ${i + 1}/${optimizedMediaList.length}: ${path.basename(media.path)}`)
        const tempVideoPath = path.join(
          path.dirname(outputPath),
          `temp_img_${Date.now()}_${i}.mp4`
        )

        await imageToVideo(media.path, tempVideoPath, media.duration, true)
        tempFiles.push(tempVideoPath)

        processedMediaList.push({
          ...media,
          path: tempVideoPath,
          type: 'video',
          isImage: false
        })

        onProgress?.(20 + (i / optimizedMediaList.length) * 15, `Photo ${i + 1}/${optimizedMediaList.length} convertie`)
      } else {
        console.log(`\n🎥 Using optimized video ${i + 1}/${optimizedMediaList.length}: ${path.basename(media.path)}`)
        processedMediaList.push(media)
      }
    }

    console.log('\n✅ All images converted successfully')
    console.log(`📋 Processed media count: ${processedMediaList.length}`)
    console.log('\n🎬 Step 2: Assembling montage...')
    onProgress?.(35, 'Préparation du montage...')

    // Étape 2: Créer le montage avec FFmpeg
    await assembleMontage(processedMediaList, outputPath, {
      width,
      height,
      transition,
      transitionDuration,
      musicPath,
      musicVolume,
      onProgress: (p, msg) => onProgress?.(35 + p * 0.6, msg)
    })

    onProgress?.(95, 'Finalisation...')

  } finally {
    // Nettoyage des fichiers temporaires
    for (const tempFile of tempFiles) {
      try {
        await fs.unlink(tempFile)
      } catch (err) {
        console.warn(`Failed to delete temp file: ${tempFile}`, err)
      }
    }
  }

  onProgress?.(100, 'Montage terminé !')
}

/**
 * Assemble les vidéos avec transitions et musique
 */
async function assembleMontage(
  mediaList: MediaFile[],
  outputPath: string,
  options: MontageOptions
): Promise<void> {
  console.log('🎬 ========== ASSEMBLING MONTAGE ==========')

  const {
    width,
    height,
    transition = 'fade',
    transitionDuration = 0.5,
    musicPath,
    musicVolume = 0.3,
    onProgress
  } = options

  console.log(`📐 Output resolution: ${width}x${height}`)
  console.log(`🔀 Transition: ${transition} (${transitionDuration}s)`)
  console.log(`🎵 Music: ${musicPath || 'None'}`)
  console.log(`🔊 Music volume: ${musicVolume}`)

  return new Promise((resolve, reject) => {
    const command = ffmpeg()

    console.log('\n📥 Adding inputs to FFmpeg command:')
    // Ajouter tous les inputs
    mediaList.forEach((media, i) => {
      console.log(`  [${i}] ${path.basename(media.path)}`)
      command.input(media.path)
    })

    // Ajouter la musique si fournie
    const musicIndex = musicPath ? mediaList.length : -1
    if (musicPath && existsSync(musicPath)) {
      console.log(`  [${musicIndex}] 🎵 ${path.basename(musicPath)}`)
      command.input(musicPath)
    } else if (musicPath) {
      console.warn(`⚠️  Music file not found: ${musicPath}`)
    }

    // Construire le filter graph complexe
    const filters: string[] = []

    // 1. Normaliser chaque média (vidéo + audio)
    for (let i = 0; i < mediaList.length; i++) {
      const media = mediaList[i]

      // Normalisation vidéo avec fond flou
      // IMPORTANT: Toutes les dimensions doivent être paires pour H.264
      // On ajoute scale='trunc(iw/2)*2':'trunc(ih/2)*2' après chaque scale pour forcer des dimensions paires
      filters.push(
        // Fond flou - avec dimensions forcées paires
        `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=increase,crop=${width}:${height},scale='trunc(iw/2)*2':'trunc(ih/2)*2',boxblur=20:5[bg${i}];` +
        // Image/vidéo au premier plan - avec dimensions forcées paires
        `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,scale='trunc(iw/2)*2':'trunc(ih/2)*2'[fg${i}];` +
        // Superposition
        `[bg${i}][fg${i}]overlay=(W-w)/2:(H-h)/2:format=auto,fps=30,format=yuv420p,setsar=1,setpts=PTS-STARTPTS[v${i}]`
      )

      // Normalisation audio
      if (media.hasAudio) {
        filters.push(
          `[${i}:a]aresample=48000,aformat=channel_layouts=stereo,asetpts=PTS-STARTPTS,volume=1.0[a${i}]`
        )
      } else {
        // Créer audio silencieux
        filters.push(
          `anullsrc=r=48000:cl=stereo:d=${media.duration}[a${i}]`
        )
      }
    }

    // 2. Assemblage avec transitions xfade
    let currentVideoLabel = 'v0'
    let currentAudioLabel = 'a0'
    let currentOffset = 0

    for (let i = 1; i < mediaList.length; i++) {
      const prevDuration = mediaList[i - 1].duration
      const transitionOffset = (i === 1)
        ? prevDuration - transitionDuration
        : currentOffset + prevDuration - transitionDuration

      // Video transition
      filters.push(
        `[${currentVideoLabel}][v${i}]xfade=transition=${transition}:duration=${transitionDuration}:offset=${transitionOffset}[vx${i}]`
      )

      // Audio crossfade
      filters.push(
        `[${currentAudioLabel}][a${i}]acrossfade=d=${transitionDuration}[ax${i}]`
      )

      currentVideoLabel = `vx${i}`
      currentAudioLabel = `ax${i}`
      currentOffset += prevDuration - transitionDuration
    }

    // 3. Mix audio avec musique si présente
    let finalAudioLabel: string
    if (musicIndex >= 0) {
      const totalDuration = mediaList.reduce((sum, m) => sum + m.duration, 0) - (mediaList.length - 1) * transitionDuration

      // Adapter les durées de fade en fonction de la durée totale
      // Fade-in: max 1.5s ou 20% de la durée totale
      const fadeInDuration = Math.min(1.5, totalDuration * 0.2)
      // Fade-out: max 2s ou 30% de la durée totale
      const fadeOutDuration = Math.min(2, totalDuration * 0.3)
      // S'assurer que le fade-out commence à un moment positif
      const fadeOutStart = Math.max(0, totalDuration - fadeOutDuration)

      console.log(`🎵 Musique: durée totale=${totalDuration}s, fade-in=${fadeInDuration}s, fade-out=${fadeOutDuration}s (start=${fadeOutStart}s)`)

      filters.push(
        // Boucler la musique et la fade
        `[${musicIndex}:a]aloop=loop=-1:size=2e9,afade=t=in:d=${fadeInDuration}[musicloop];` +
        `[musicloop]atrim=end=${totalDuration},afade=t=out:st=${fadeOutStart}:d=${fadeOutDuration},volume=${musicVolume}[musicfaded];` +
        // Mix avec la piste vidéo
        `[${currentAudioLabel}][musicfaded]amix=inputs=2:duration=shortest:weights='1 ${musicVolume}'[afinal]`
      )
      finalAudioLabel = 'afinal'
    } else {
      finalAudioLabel = currentAudioLabel
    }

    const filterString = filters.join(';')

    console.log('\n🔧 Filter graph:')
    console.log('─────────────────────────────────────────────────────')
    console.log(filterString)
    console.log('─────────────────────────────────────────────────────')

    console.log('\n📤 Output mappings:')
    console.log(`  Video: [${currentVideoLabel}]`)
    console.log(`  Audio: [${finalAudioLabel}]`)

    command
      .complexFilter(filterString)
      .outputOptions([
        '-map', `[${currentVideoLabel}]`,
        '-map', `[${finalAudioLabel}]`,
        '-c:v', 'libx264',
        '-preset', 'veryfast',     // Changé de 'medium' → 60% plus rapide
        '-crf', '23',
        '-maxrate', '8M',          // Limite bitrate à 8 Mbps (HD quality)
        '-bufsize', '16M',         // Buffer 16MB pour stabilité
        '-r', '30',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-ar', '48000',
        '-shortest'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        console.log('\n🚀 Starting FFmpeg montage assembly...')
        console.log('─────────────────────────────────────────────────────')
        console.log('FULL FFMPEG COMMAND:')
        console.log(commandLine)
        console.log('─────────────────────────────────────────────────────\n')
      })
      .on('progress', (progress) => {
        if (progress.percent && typeof progress.percent === 'number') {
          // Valider et limiter le pourcentage entre 0 et 100
          const validPercent = Math.min(100, Math.max(0, progress.percent))

          // Ignorer les valeurs aberrantes (trop grandes ou négatives)
          if (validPercent >= 0 && validPercent <= 100) {
            console.log(`⏳ Progress: ${validPercent.toFixed(1)}% - ${progress.timemark || ''}`)
            onProgress?.(validPercent, `Traitement du montage...`)
          }
        }
      })
      .on('end', () => {
        console.log('\n✅ ========== MONTAGE COMPLETED SUCCESSFULLY ==========\n')
        resolve()
      })
      .on('error', (err, stdout, stderr) => {
        console.error('\n❌ ========== FFMPEG ERROR ==========')
        console.error('Error message:', err.message)
        console.error('\n📋 STDOUT:')
        console.error(stdout || '(empty)')
        console.error('\n📋 STDERR:')
        console.error(stderr || '(empty)')
        console.error('\n========================================\n')
        reject(new Error(`FFmpeg montage failed: ${err.message}\n\nStderr:\n${stderr}`))
      })
      .run()
  })
}

/**
 * Calcule la durée adaptative pour les photos selon le nombre total de médias
 */
export function calculateImageDuration(totalMediaCount: number): number {
  if (totalMediaCount <= 4) {
    return 3.0
  } else if (totalMediaCount <= 10) {
    return 2.5
  } else {
    return 2.0
  }
}
