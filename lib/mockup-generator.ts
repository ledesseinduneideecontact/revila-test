/**
 * Générateur de mockups pour cadres photos
 * Utilise HTML5 Canvas pour insérer des photos dans des cadres mockup
 */

export type FrameFormat = '10x15' | '20x30' | '30x45'
export type PhotoOrientation = 'portrait' | 'landscape'

interface MockupConfig {
  frameImagePath: string
  whiteThreshold: number // Seuil pour détecter la zone blanche (0-255)
  position: { x: number; y: number }
  dimensions: { width: number; height: number }
  imageResolution: { width: number; height: number }
}

// Coordonnées précises basées sur mockup-cadres
const MOCKUP_CONFIGS: Record<FrameFormat, Record<PhotoOrientation, MockupConfig>> = {
  '10x15': {
    portrait: {
      frameImagePath: '/frontend-pictures/commander/cadre-10x15-portrait-mockup.png',
      whiteThreshold: 250,
      position: { x: 334, y: 583 },
      dimensions: { width: 347, height: 519 },
      imageResolution: { width: 1024, height: 1658 }
    },
    landscape: {
      frameImagePath: '/frontend-pictures/commander/cadre-10x15-paysage-mockup.png',
      whiteThreshold: 250,
      position: { x: 556, y: 334 },
      dimensions: { width: 519, height: 347 },
      imageResolution: { width: 1658, height: 1024 }
    }
  },
  '20x30': {
    portrait: {
      frameImagePath: '/frontend-pictures/commander/cadre-20x30-portrait-mockup.png',
      whiteThreshold: 250,
      position: { x: 480, y: 345 },
      dimensions: { width: 676, height: 955 },
      imageResolution: { width: 1654, height: 1654 }
    },
    landscape: {
      frameImagePath: '/frontend-pictures/commander/cadre-20x30-paysage-mockup.png',
      whiteThreshold: 250,
      position: { x: 354, y: 480 },
      dimensions: { width: 955, height: 676 },
      imageResolution: { width: 1654, height: 1654 }
    }
  },
  '30x45': {
    portrait: {
      frameImagePath: '/frontend-pictures/commander/cadre-30x45-portrait-mockup.png',
      whiteThreshold: 250,
      position: { x: 443, y: 295 },
      dimensions: { width: 772, height: 1091 },
      imageResolution: { width: 1654, height: 1654 }
    },
    landscape: {
      frameImagePath: '/frontend-pictures/commander/cadre-30x45-paysage-mockup.png',
      whiteThreshold: 250,
      position: { x: 268, y: 443 },
      dimensions: { width: 1091, height: 772 },
      imageResolution: { width: 1654, height: 1654 }
    }
  }
}

/**
 * Détecte la zone intérieure transparente ou blanche du cadre
 */
function detectInnerZone(
  imageData: ImageData,
  threshold: number
): { x: number; y: number; width: number; height: number } | null {
  const { data, width, height } = imageData

  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let foundTargetPixel = false

  // Parcourir tous les pixels pour trouver la zone transparente ou blanche
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      // Vérifier si le pixel est transparent (alpha < 10) OU blanc (RGB > threshold)
      const isTransparent = a < 10
      const isWhite = r > threshold && g > threshold && b > threshold

      if (isTransparent || isWhite) {
        foundTargetPixel = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (!foundTargetPixel) {
    console.warn('Aucune zone transparente/blanche détectée dans le mockup')
    return null
  }

  // Ajouter une petite marge (2% de chaque côté) pour éviter que l'image déborde
  const marginX = Math.floor((maxX - minX) * 0.02)
  const marginY = Math.floor((maxY - minY) * 0.02)

  return {
    x: minX + marginX,
    y: minY + marginY,
    width: (maxX - minX) - (marginX * 2),
    height: (maxY - minY) - (marginY * 2)
  }
}

/**
 * Redimensionne et recadre une image en mode "cover"
 * Remplit toute la zone sans déformation
 */
function resizeAndCropCover(
  sourceCanvas: HTMLCanvasElement,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const sourceWidth = sourceCanvas.width
  const sourceHeight = sourceCanvas.height

  const sourceRatio = sourceWidth / sourceHeight
  const targetRatio = targetWidth / targetHeight

  let drawWidth: number
  let drawHeight: number
  let offsetX = 0
  let offsetY = 0

  if (sourceRatio > targetRatio) {
    // Image source plus large : ajuster en hauteur
    drawHeight = targetHeight
    drawWidth = sourceWidth * (targetHeight / sourceHeight)
    offsetX = (drawWidth - targetWidth) / 2
  } else {
    // Image source plus haute : ajuster en largeur
    drawWidth = targetWidth
    drawHeight = sourceHeight * (targetWidth / sourceWidth)
    offsetY = (drawHeight - targetHeight) / 2
  }

  // Créer un canvas temporaire pour le redimensionnement
  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = targetWidth
  tempCanvas.height = targetHeight
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true })

  if (!tempCtx) {
    throw new Error('Impossible de créer le contexte canvas')
  }

  // Dessiner l'image redimensionnée et recadrée
  tempCtx.drawImage(
    sourceCanvas,
    -offsetX,
    -offsetY,
    drawWidth,
    drawHeight
  )

  return tempCanvas
}

/**
 * Charge une image et retourne un HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous' // Pour éviter les erreurs CORS
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Impossible de charger l'image: ${src}`))
    img.src = src
  })
}

/**
 * Convertit un Blob/File en HTMLImageElement
 */
function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url) // Libérer la mémoire
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de charger le blob en image'))
    }
    img.src = url
  })
}

/**
 * Génère un mockup avec une photo insérée dans un cadre
 *
 * @param photoBlob - La photo de l'utilisateur (File ou Blob)
 * @param frameFormat - Le format du cadre (10x15, 20x30, 30x45)
 * @param orientation - L'orientation de la photo ('portrait' ou 'landscape')
 * @returns Un Blob de l'image composite
 */
export async function generateFrameMockup(
  photoBlob: Blob,
  frameFormat: FrameFormat,
  orientation: PhotoOrientation = 'portrait'
): Promise<Blob> {
  // Utiliser les coordonnées précises
  const config = MOCKUP_CONFIGS[frameFormat][orientation]

  try {
    console.log(`🖼️ Génération mockup ${frameFormat} ${orientation}`)
    console.log(`📐 Config:`, {
      position: config.position,
      dimensions: config.dimensions,
      mockup: config.frameImagePath
    })

    // 1. Charger le cadre mockup
    const frameImg = await loadImage(config.frameImagePath)

    // 2. Charger la photo de l'utilisateur
    const photoImg = await blobToImage(photoBlob)

    // 3. Créer un canvas pour le cadre avec la résolution exacte
    const frameCanvas = document.createElement('canvas')
    frameCanvas.width = config.imageResolution.width
    frameCanvas.height = config.imageResolution.height

    const ctx = frameCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas')
    }

    // 4. Dessiner le cadre mockup
    ctx.drawImage(frameImg, 0, 0, frameCanvas.width, frameCanvas.height)

    // 5. Créer un canvas pour la photo
    const photoCanvas = document.createElement('canvas')
    photoCanvas.width = photoImg.width
    photoCanvas.height = photoImg.height
    const photoCtx = photoCanvas.getContext('2d', { willReadFrequently: true })
    if (!photoCtx) {
      throw new Error('Impossible de créer le contexte canvas pour la photo')
    }
    photoCtx.drawImage(photoImg, 0, 0)

    // 6. Redimensionner et recadrer la photo en mode "cover" avec les dimensions exactes
    const resizedPhoto = resizeAndCropCover(
      photoCanvas,
      config.dimensions.width,
      config.dimensions.height
    )

    console.log(`✅ Photo redimensionnée: ${config.dimensions.width}x${config.dimensions.height}`)
    console.log(`✅ Position dans le cadre: (${config.position.x}, ${config.position.y})`)

    // 7. Insérer la photo dans le cadre aux coordonnées exactes
    ctx.drawImage(
      resizedPhoto,
      config.position.x,
      config.position.y,
      config.dimensions.width,
      config.dimensions.height
    )

    // 8. Convertir le canvas en Blob
    return new Promise((resolve, reject) => {
      frameCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`✅ Mockup généré avec succès pour ${frameFormat} ${orientation}`)
            resolve(blob)
          } else {
            reject(new Error('Impossible de générer le blob du mockup'))
          }
        },
        'image/png',
        1.0 // Qualité maximale
      )
    })

  } catch (error) {
    console.error('Erreur lors de la génération du mockup:', error)
    // En cas d'erreur, retourner la photo originale
    return photoBlob
  }
}

/**
 * Génère une URL de prévisualisation depuis un Blob
 */
export function createMockupPreviewUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/**
 * Libère une URL de prévisualisation
 */
export function revokeMockupPreviewUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

/**
 * Convertit un Blob vidéo en HTMLVideoElement et extrait la première frame
 */
function blobToVideoFrame(blob: Blob): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true

    video.onloadeddata = () => {
      // Chercher la première frame valide
      video.currentTime = 0.1 // 100ms pour éviter les frames noires

      video.onseeked = () => {
        URL.revokeObjectURL(url) // Libérer la mémoire
        resolve(video)
      }
    }

    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Impossible de charger la vidéo'))
    }

    video.src = url
    video.load()
  })
}

/**
 * Extrait une frame d'une vidéo à un timestamp spécifique
 * @param video - L'élément vidéo HTML5
 * @param timestamp - Le temps en secondes où extraire la frame
 * @returns Un File contenant l'image de la frame
 */
export async function extractVideoFrame(
  video: HTMLVideoElement,
  timestamp: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Positionner la vidéo au timestamp souhaité
    video.currentTime = timestamp

    video.onseeked = async () => {
      try {
        // Créer un canvas aux dimensions de la vidéo
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')

        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'))
          return
        }

        // Dessiner la frame actuelle sur le canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convertir le canvas en Blob
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Impossible de créer le blob'))
            return
          }

          // Créer un File à partir du Blob avec un nom descriptif
          const timestamp_formatted = timestamp.toFixed(2).replace('.', '_')
          const file = new File(
            [blob],
            `video-frame-${timestamp_formatted}s.jpg`,
            { type: 'image/jpeg' }
          )

          resolve(file)
        }, 'image/jpeg', 0.95) // Qualité JPEG à 95%
      } catch (error) {
        reject(error)
      }
    }

    video.onerror = () => {
      reject(new Error('Erreur lors du positionnement de la vidéo'))
    }
  })
}

/**
 * Crée un masque avec coins arrondis
 */
function createRoundedRectMask(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.lineTo(x + width - radius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
  ctx.lineTo(x + width, y + height - radius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
  ctx.lineTo(x + radius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
  ctx.lineTo(x, y + radius)
  ctx.quadraticCurveTo(x, y, x + radius, y)
  ctx.closePath()
}

/**
 * Génère un mockup combiné avec une vidéo dans le téléphone ET une photo dans le cadre
 *
 * @param videoBlob - La vidéo de l'utilisateur (File ou Blob)
 * @param photoBlob - La photo de l'utilisateur (File ou Blob)
 * @returns Un Blob de l'image composite (vidéo + photo dans le mockup)
 */
export async function generatePhotoAndVideoMockup(
  videoBlob: Blob,
  photoBlob: Blob
): Promise<Blob> {
  try {
    // 1. Extraire la première frame de la vidéo
    const video = await blobToVideoFrame(videoBlob)

    // 2. Charger la photo de l'utilisateur
    const photoImg = await blobToImage(photoBlob)

    // 3. Détecter les orientations
    const videoIsPortrait = video.videoHeight > video.videoWidth
    const photoIsPortrait = photoImg.height > photoImg.width

    console.log(`📱 Vidéo: ${videoIsPortrait ? 'Portrait' : 'Landscape'} (${video.videoWidth}×${video.videoHeight})`)
    console.log(`🖼️ Photo: ${photoIsPortrait ? 'Portrait' : 'Landscape'} (${photoImg.width}×${photoImg.height})`)

    // 4. Sélectionner le mockup complet approprié selon les 4 configurations
    let mockupPath: string
    let PHONE_ZONE: { x: number; y: number; width: number; height: number }
    let CARD_ZONE: { x: number; y: number; width: number; height: number }

    if (videoIsPortrait && photoIsPortrait) {
      // 1️⃣ PHONE-PORTRAIT + CARD-PORTRAIT
      console.log('📐 Configuration: PHONE-PORTRAIT + CARD-PORTRAIT')
      mockupPath = '/frontend-pictures/commander/phone-portrait-card-portrait.png'
      PHONE_ZONE = { x: 113, y: 232, width: 477, height: 1037 }
      CARD_ZONE = { x: 677, y: 188, width: 750, height: 1124 }
    } else if (videoIsPortrait && !photoIsPortrait) {
      // 2️⃣ PHONE-PORTRAIT + CARD-LANDSCAPE
      console.log('📐 Configuration: PHONE-PORTRAIT + CARD-LANDSCAPE')
      mockupPath = '/frontend-pictures/commander/phone-portrait-card-landscape.png'
      PHONE_ZONE = { x: 72, y: 323, width: 394, height: 855 }
      CARD_ZONE = { x: 533, y: 441, width: 928, height: 618 }
    } else if (!videoIsPortrait && photoIsPortrait) {
      // 3️⃣ PHONE-LANDSCAPE + CARD-PORTRAIT
      console.log('📐 Configuration: PHONE-LANDSCAPE + CARD-PORTRAIT')
      mockupPath = '/frontend-pictures/commander/phone-landscape-card-portrait.png'
      PHONE_ZONE = { x: 336, y: 90, width: 827, height: 381 }
      CARD_ZONE = { x: 451, y: 544, width: 598, height: 897 }
    } else {
      // 4️⃣ PHONE-LANDSCAPE + CARD-LANDSCAPE
      console.log('📐 Configuration: PHONE-LANDSCAPE + CARD-LANDSCAPE')
      mockupPath = '/frontend-pictures/commander/phone-landscape-card-landscape.png'
      PHONE_ZONE = { x: 231, y: 113, width: 1037, height: 477 }
      CARD_ZONE = { x: 188, y: 677, width: 1124, height: 750 }
    }

    // 5. Charger le mockup complet
    const mockupImg = await loadImage(mockupPath)

    // 6. Créer le canvas final (1500×1500)
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = 1500
    finalCanvas.height = 1500
    const ctx = finalCanvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas')
    }

    // 7. Dessiner le mockup complet en arrière-plan
    ctx.drawImage(mockupImg, 0, 0)

    // 8. Traiter la vidéo pour la zone téléphone (mode "cover")
    const videoCanvas = document.createElement('canvas')
    videoCanvas.width = video.videoWidth
    videoCanvas.height = video.videoHeight
    const videoCtx = videoCanvas.getContext('2d', { willReadFrequently: true })

    if (!videoCtx) {
      throw new Error('Impossible de créer le contexte canvas pour la vidéo')
    }

    videoCtx.drawImage(video, 0, 0)

    // Redimensionner la vidéo en mode "cover" pour la zone téléphone
    const resizedVideo = resizeAndCropCover(
      videoCanvas,
      PHONE_ZONE.width,
      PHONE_ZONE.height
    )

    // 9. Dessiner la vidéo dans la zone téléphone avec bords arrondis
    // Utiliser des valeurs adaptées au canvas 1500x1500px (plus grandes que le CSS)
    const phoneIsPortrait = PHONE_ZONE.width < PHONE_ZONE.height
    const phoneRadius = phoneIsPortrait
      ? Math.round(PHONE_ZONE.width * 0.10)  // 10% pour portrait → ~48px pour 477px
      : Math.round(PHONE_ZONE.width * 0.04)  // 4% pour landscape → ~41px pour 1037px

    ctx.save()
    createRoundedRectMask(
      ctx,
      PHONE_ZONE.x,
      PHONE_ZONE.y,
      PHONE_ZONE.width,
      PHONE_ZONE.height,
      phoneRadius
    )
    ctx.clip()
    ctx.drawImage(
      resizedVideo,
      PHONE_ZONE.x,
      PHONE_ZONE.y,
      PHONE_ZONE.width,
      PHONE_ZONE.height
    )
    ctx.restore()

    // 10. Traiter la photo pour la zone carte (mode "cover")
    const photoCanvas = document.createElement('canvas')
    photoCanvas.width = photoImg.width
    photoCanvas.height = photoImg.height
    const photoCtx = photoCanvas.getContext('2d', { willReadFrequently: true })

    if (!photoCtx) {
      throw new Error('Impossible de créer le contexte canvas pour la photo')
    }

    photoCtx.drawImage(photoImg, 0, 0)

    // Redimensionner la photo en mode "cover" pour la zone carte
    const resizedPhoto = resizeAndCropCover(
      photoCanvas,
      CARD_ZONE.width,
      CARD_ZONE.height
    )

    // 11. Dessiner la photo dans la zone carte avec bords arrondis
    // Utiliser des valeurs adaptées au canvas 1500x1500px (proportionnelles à la largeur)
    const cardRadius = Math.round(CARD_ZONE.width * 0.04)  // 4% de la largeur

    ctx.save()
    createRoundedRectMask(
      ctx,
      CARD_ZONE.x,
      CARD_ZONE.y,
      CARD_ZONE.width,
      CARD_ZONE.height,
      cardRadius
    )
    ctx.clip()
    ctx.drawImage(
      resizedPhoto,
      CARD_ZONE.x,
      CARD_ZONE.y,
      CARD_ZONE.width,
      CARD_ZONE.height
    )
    ctx.restore()

    // 12. Convertir le canvas en Blob
    return new Promise((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('✅ Mockup combiné (vidéo + photo) généré avec succès (approche template)')
            resolve(blob)
          } else {
            reject(new Error('Impossible de générer le blob du mockup combiné'))
          }
        },
        'image/png',
        1.0 // Qualité maximale
      )
    })

  } catch (error) {
    console.error('Erreur lors de la génération du mockup combiné:', error)
    throw error
  }
}

/**
 * Génère un mockup avec une vidéo insérée dans un écran de téléphone
 * Approche modulaire : Fond bois + Phone mockup + Vidéo
 *
 * @param videoBlob - La vidéo de l'utilisateur (File ou Blob)
 * @returns Un Blob de l'image composite (première frame dans le téléphone sur fond bois)
 */
export async function generateVideoMockup(videoBlob: Blob): Promise<Blob> {
  try {
    // 1. Extraire la première frame de la vidéo
    const video = await blobToVideoFrame(videoBlob)

    // 2. Détecter l'orientation de la vidéo
    const videoIsPortrait = video.videoHeight > video.videoWidth
    console.log(`📱 Vidéo: ${videoIsPortrait ? 'Portrait' : 'Landscape'} (${video.videoWidth}×${video.videoHeight})`)

    // 3. Sélectionner le mockup complet approprié
    const mockupPath = videoIsPortrait
      ? '/frontend-pictures/commander/phone-portrait-card-portrait.png'
      : '/frontend-pictures/commander/phone-landscape-card-landscape.png'

    // 4. Charger le mockup complet
    const mockupImg = await loadImage(mockupPath)
    console.log(`📐 Mockup sélectionné: ${videoIsPortrait ? 'phone-portrait-card-portrait' : 'phone-landscape-card-landscape'}`)

    // 5. Définir les zones selon l'orientation de la vidéo
    const PHONE_ZONE = videoIsPortrait
      ? { x: 113, y: 232, width: 477, height: 1037 }
      : { x: 231, y: 113, width: 1037, height: 477 }

    const CARD_ZONE = videoIsPortrait
      ? { x: 677, y: 188, width: 750, height: 1124 }
      : { x: 188, y: 677, width: 1124, height: 750 }

    // 6. Créer le canvas final (1500×1500)
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = 1500
    finalCanvas.height = 1500
    const ctx = finalCanvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas')
    }

    // 7. Dessiner le mockup complet en arrière-plan
    ctx.drawImage(mockupImg, 0, 0)

    // 8. Traiter la vidéo pour la zone téléphone (mode "cover")
    const videoCanvas = document.createElement('canvas')
    videoCanvas.width = video.videoWidth
    videoCanvas.height = video.videoHeight
    const videoCtx = videoCanvas.getContext('2d', { willReadFrequently: true })

    if (!videoCtx) {
      throw new Error('Impossible de créer le contexte canvas pour la vidéo')
    }

    videoCtx.drawImage(video, 0, 0)

    // 9. Redimensionner la vidéo en mode "cover" pour la zone téléphone
    const resizedVideo = resizeAndCropCover(
      videoCanvas,
      PHONE_ZONE.width,
      PHONE_ZONE.height
    )

    // 10. Dessiner la vidéo dans la zone téléphone avec bords arrondis
    // Utiliser des valeurs adaptées au canvas 1500x1500px (plus grandes que le CSS)
    const phoneIsPortrait = PHONE_ZONE.width < PHONE_ZONE.height
    const phoneRadius = phoneIsPortrait
      ? Math.round(PHONE_ZONE.width * 0.10)  // 10% pour portrait → ~48px pour 477px
      : Math.round(PHONE_ZONE.width * 0.04)  // 4% pour landscape → ~41px pour 1037px

    ctx.save()
    createRoundedRectMask(
      ctx,
      PHONE_ZONE.x,
      PHONE_ZONE.y,
      PHONE_ZONE.width,
      PHONE_ZONE.height,
      phoneRadius
    )
    ctx.clip()
    ctx.drawImage(
      resizedVideo,
      PHONE_ZONE.x,
      PHONE_ZONE.y,
      PHONE_ZONE.width,
      PHONE_ZONE.height
    )
    ctx.restore()

    // 11. Dessiner un rectangle blanc dans la zone carte avec bords arrondis
    // Utiliser des valeurs adaptées au canvas 1500x1500px (proportionnelles à la largeur)
    const cardRadius = Math.round(CARD_ZONE.width * 0.04)  // 4% de la largeur

    ctx.save()
    createRoundedRectMask(
      ctx,
      CARD_ZONE.x,
      CARD_ZONE.y,
      CARD_ZONE.width,
      CARD_ZONE.height,
      cardRadius
    )
    ctx.clip()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(
      CARD_ZONE.x,
      CARD_ZONE.y,
      CARD_ZONE.width,
      CARD_ZONE.height
    )
    ctx.restore()

    // 12. Convertir le canvas en Blob
    return new Promise((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('✅ Mockup vidéo généré avec succès (approche template)')
            resolve(blob)
          } else {
            reject(new Error('Impossible de générer le blob du mockup vidéo'))
          }
        },
        'image/png',
        1.0 // Qualité maximale
      )
    })

  } catch (error) {
    console.error('Erreur lors de la génération du mockup vidéo:', error)
    throw error
  }
}
