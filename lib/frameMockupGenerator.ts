// Utilitaire pour générer des mockups de photos dans des cadres
// Basé sur les coordonnées définies dans mockup-cadres

export interface FrameCoordinates {
  mockupPath: string
  mockupResolution: [number, number]
  position: [number, number]
  dimensions: [number, number]
  center: [number, number]
  ratio: number
}

// Coordonnées pour chaque format et orientation
export const FRAME_COORDINATES: Record<string, FrameCoordinates> = {
  '10x15_portrait': {
    mockupPath: '/frontend-pictures/commander/cadre-10x15-portrait-mockup.png',
    mockupResolution: [1024, 1658],
    position: [334, 583],
    dimensions: [347, 519],
    center: [507, 842],
    ratio: 0.669
  },
  '10x15_paysage': {
    mockupPath: '/frontend-pictures/commander/cadre-10x15-paysage-mockup.png',
    mockupResolution: [1658, 1024],
    position: [556, 334],
    dimensions: [519, 347],
    center: [815, 507],
    ratio: 1.496
  },
  '20x30_portrait': {
    mockupPath: '/frontend-pictures/commander/cadre-20x30-portrait-mockup.png',
    mockupResolution: [1654, 1654],
    position: [480, 345],
    dimensions: [676, 955],
    center: [818, 822],
    ratio: 0.708
  },
  '20x30_paysage': {
    mockupPath: '/frontend-pictures/commander/cadre-20x30-paysage-mockup.png',
    mockupResolution: [1654, 1654],
    position: [354, 480],
    dimensions: [955, 676],
    center: [831, 818],
    ratio: 1.413
  },
  '30x45_portrait': {
    mockupPath: '/frontend-pictures/commander/cadre-30x45-portrait-mockup.png',
    mockupResolution: [1654, 1654],
    position: [443, 295],
    dimensions: [772, 1091],
    center: [829, 840],
    ratio: 0.708
  },
  '30x45_paysage': {
    mockupPath: '/frontend-pictures/commander/cadre-30x45-paysage-mockup.png',
    mockupResolution: [1654, 1654],
    position: [268, 443],
    dimensions: [1091, 772],
    center: [813, 829],
    ratio: 1.413
  }
}

/**
 * Charge une image depuis une URL ou un Blob
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Génère un mockup de cadre avec la photo à l'intérieur
 *
 * @param photoSrc - URL ou Blob URL de la photo
 * @param format - Format de la photo ('10x15', '20x30', '30x45')
 * @param orientation - Orientation de la photo ('portrait' ou 'paysage')
 * @returns Promise<string> - Blob URL du mockup généré
 */
export async function generateFrameMockup(
  photoSrc: string,
  format: '10x15' | '20x30' | '30x45',
  orientation: 'portrait' | 'paysage' | 'landscape'
): Promise<string> {
  // Normaliser l'orientation
  const normalizedOrientation = orientation === 'landscape' ? 'paysage' : orientation

  // Récupérer les coordonnées pour ce format/orientation
  const key = `${format}_${normalizedOrientation}` as keyof typeof FRAME_COORDINATES
  const coords = FRAME_COORDINATES[key]

  if (!coords) {
    throw new Error(`Format inconnu: ${format}_${normalizedOrientation}`)
  }

  // Charger l'image du mockup de cadre
  const frameMockup = await loadImage(coords.mockupPath)

  // Charger la photo de l'utilisateur
  const userPhoto = await loadImage(photoSrc)

  // Créer un canvas avec les dimensions du mockup
  const canvas = document.createElement('canvas')
  canvas.width = coords.mockupResolution[0]
  canvas.height = coords.mockupResolution[1]

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('Impossible de créer le contexte Canvas')
  }

  // Dessiner d'abord le mockup de cadre
  ctx.drawImage(frameMockup, 0, 0, canvas.width, canvas.height)

  // Redimensionner et placer la photo de l'utilisateur dans la zone définie
  const [x, y] = coords.position
  const [width, height] = coords.dimensions

  // Calculer le scaling pour que la photo remplisse complètement la zone
  // tout en conservant son aspect ratio
  const scaleX = width / userPhoto.width
  const scaleY = height / userPhoto.height
  const scale = Math.max(scaleX, scaleY) // Utiliser le max pour remplir complètement

  const scaledWidth = userPhoto.width * scale
  const scaledHeight = userPhoto.height * scale

  // Centrer l'image dans la zone si elle déborde
  const offsetX = x + (width - scaledWidth) / 2
  const offsetY = y + (height - scaledHeight) / 2

  // Découper la zone pour éviter le débordement
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, width, height)
  ctx.clip()

  // Dessiner la photo de l'utilisateur
  ctx.drawImage(userPhoto, offsetX, offsetY, scaledWidth, scaledHeight)

  ctx.restore()

  // Convertir le canvas en Blob et retourner l'URL
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(URL.createObjectURL(blob))
      } else {
        reject(new Error('Impossible de créer le Blob'))
      }
    }, 'image/png', 1.0)
  })
}

/**
 * Nettoie les Blob URLs pour libérer la mémoire
 */
export function revokeFrameMockupURL(url: string) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}
