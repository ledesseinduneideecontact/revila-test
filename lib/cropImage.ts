// Fonction helper pour react-easy-crop
// Gère correctement la rotation et le recadrage

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    return null
  }

  const rotRad = getRadianAngle(rotation)

  // Calculer la taille du bounding box de l'image tournée
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // Définir la taille du canvas
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // Traduire le canvas au centre pour permettre la rotation autour du centre
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-image.width / 2, -image.height / 2)

  // Dessiner l'image tournée
  ctx.drawImage(image, 0, 0)

  // Récupérer les données de l'image tournée
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  )

  // Définir la taille du canvas à la taille du crop
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  // Coller les données de l'image recadrée au coin 0,0 du canvas
  ctx.putImageData(data, 0, 0)

  // Retourner le canvas en tant que blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (file) => {
        resolve(file)
      },
      'image/jpeg',
      0.95
    )
  })
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation)

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}