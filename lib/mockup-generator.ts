/**
 * Générateur de mockups pour cadres photos
 * Utilise HTML5 Canvas pour insérer des photos dans des cadres mockup
 */

export type FrameFormat = '10x15' | '20x30' | '30x45'
export type PhotoOrientation = 'portrait' | 'landscape'

interface MockupConfig {
  frameImagePath: string
  whiteThreshold: number // Seuil pour détecter la zone blanche (0-255)
}

const MOCKUP_CONFIGS: Record<FrameFormat, MockupConfig> = {
  '10x15': {
    frameImagePath: '/frontend-pictures/commander/cadre-10x15-portrait-mockup.png',
    whiteThreshold: 250
  },
  '20x30': {
    frameImagePath: '/frontend-pictures/commander/cadre-20x30-portrait-mockup.png',
    whiteThreshold: 250
  },
  '30x45': {
    frameImagePath: '/frontend-pictures/commander/cadre-30x45-portrait-mockup.png',
    whiteThreshold: 250
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
  const config = MOCKUP_CONFIGS[frameFormat]

  try {
    // 1. Charger le cadre mockup
    const frameImg = await loadImage(config.frameImagePath)

    // 2. Charger la photo de l'utilisateur
    const photoImg = await blobToImage(photoBlob)

    // 3. Créer un canvas pour le cadre
    const frameCanvas = document.createElement('canvas')
    const frameWidth = frameImg.width
    const frameHeight = frameImg.height

    // Si l'orientation est paysage, on doit pivoter le mockup
    const needsRotation = orientation === 'landscape'

    if (needsRotation) {
      // Inverser largeur et hauteur pour la rotation
      frameCanvas.width = frameHeight
      frameCanvas.height = frameWidth
    } else {
      frameCanvas.width = frameWidth
      frameCanvas.height = frameHeight
    }

    const ctx = frameCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas')
    }

    if (needsRotation) {
      // Appliquer une rotation de 90° (sens horaire)
      ctx.save()
      ctx.translate(frameHeight, 0)
      ctx.rotate(Math.PI / 2)
      ctx.drawImage(frameImg, 0, 0, frameWidth, frameHeight)
      ctx.restore()
    } else {
      // Dessiner le cadre normalement
      ctx.drawImage(frameImg, 0, 0, frameWidth, frameHeight)
    }

    // 4. Détecter la zone blanche du cadre
    const imageData = ctx.getImageData(0, 0, frameCanvas.width, frameCanvas.height)
    const innerZone = detectInnerZone(imageData, config.whiteThreshold)

    if (!innerZone) {
      console.warn('Zone blanche non détectée, retour de la photo originale')
      return photoBlob
    }

    console.log(`[${frameFormat}] Cadre: ${frameCanvas.width}x${frameCanvas.height}`)
    console.log(`[${frameFormat}] Zone détectée:`, innerZone)
    console.log(`[${frameFormat}] Ratio zone: ${(innerZone.width / innerZone.height).toFixed(3)}`)

    // 5. Créer un canvas pour la photo
    const photoCanvas = document.createElement('canvas')
    photoCanvas.width = photoImg.width
    photoCanvas.height = photoImg.height
    const photoCtx = photoCanvas.getContext('2d', { willReadFrequently: true })
    if (!photoCtx) {
      throw new Error('Impossible de créer le contexte canvas pour la photo')
    }
    photoCtx.drawImage(photoImg, 0, 0)

    // 6. Redimensionner et recadrer la photo en mode "cover"
    const resizedPhoto = resizeAndCropCover(
      photoCanvas,
      innerZone.width,
      innerZone.height
    )

    // 7. Insérer la photo dans le cadre
    ctx.drawImage(
      resizedPhoto,
      innerZone.x,
      innerZone.y,
      innerZone.width,
      innerZone.height
    )

    // 8. Convertir le canvas en Blob
    return new Promise((resolve, reject) => {
      frameCanvas.toBlob(
        (blob) => {
          if (blob) {
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
 * Génère un mockup avec une vidéo insérée dans un écran de téléphone
 *
 * @param videoBlob - La vidéo de l'utilisateur (File ou Blob)
 * @returns Un Blob de l'image composite (première frame dans le téléphone)
 */
export async function generateVideoMockup(videoBlob: Blob): Promise<Blob> {
  const MOCKUP_PATH = '/frontend-pictures/commander/phone-and-picture-portrait-mockup.png'

  // Coordonnées exactes de la zone téléphone
  const PHONE_ZONE = {
    x: 285,
    y: 303,
    width: 477,
    height: 1037,
    radius: 45 // Réduit de 63 à 45 pour éviter les bords blancs
  }

  try {
    // 1. Charger le mockup de fond avec téléphone
    const mockupImg = await loadImage(MOCKUP_PATH)

    // 2. Extraire la première frame de la vidéo
    const video = await blobToVideoFrame(videoBlob)

    // 3. Créer le canvas final aux dimensions du mockup
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = mockupImg.width
    finalCanvas.height = mockupImg.height
    const ctx = finalCanvas.getContext('2d', { willReadFrequently: true })

    if (!ctx) {
      throw new Error('Impossible de créer le contexte canvas')
    }

    // 4. Dessiner le fond (image avec téléphone et cadre)
    ctx.drawImage(mockupImg, 0, 0)

    // 5. Créer un canvas temporaire pour la vidéo
    const videoCanvas = document.createElement('canvas')
    videoCanvas.width = video.videoWidth
    videoCanvas.height = video.videoHeight
    const videoCtx = videoCanvas.getContext('2d', { willReadFrequently: true })

    if (!videoCtx) {
      throw new Error('Impossible de créer le contexte canvas pour la vidéo')
    }

    // Dessiner la frame vidéo
    videoCtx.drawImage(video, 0, 0)

    // 6. Redimensionner la vidéo en mode "cover" pour remplir l'écran du téléphone
    const resizedVideo = resizeAndCropCover(
      videoCanvas,
      PHONE_ZONE.width,
      PHONE_ZONE.height
    )

    // 7. Appliquer le masque arrondi et dessiner la vidéo dans le téléphone
    ctx.save()

    // Créer le chemin du masque arrondi
    createRoundedRectMask(
      ctx,
      PHONE_ZONE.x,
      PHONE_ZONE.y,
      PHONE_ZONE.width,
      PHONE_ZONE.height,
      PHONE_ZONE.radius
    )

    // Appliquer le clipping
    ctx.clip()

    // Dessiner la vidéo redimensionnée
    ctx.drawImage(
      resizedVideo,
      PHONE_ZONE.x,
      PHONE_ZONE.y,
      PHONE_ZONE.width,
      PHONE_ZONE.height
    )

    ctx.restore()

    // 8. Convertir le canvas en Blob
    return new Promise((resolve, reject) => {
      finalCanvas.toBlob(
        (blob) => {
          if (blob) {
            console.log('✅ Mockup vidéo généré avec succès')
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
    throw error // On ne peut pas fallback sur un blob vidéo comme image
  }
}
