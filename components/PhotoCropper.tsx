'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { X, Check, RotateCw } from 'lucide-react'
import { getCroppedImg } from '@/lib/cropImage'

interface CropConfig {
  zoom: number
  rotation: number
  crop: { x: number; y: number }
  orientation: 'portrait' | 'landscape'
}

interface PhotoCropperProps {
  imageSrc: string
  onCropComplete: (croppedImage: File, meta: { orientation: 'portrait' | 'landscape', cropConfig: CropConfig }) => void
  onCancel: () => void
  initialOrientation?: 'portrait' | 'landscape'
  initialConfig?: CropConfig | null
  format?: 'carre' | '10x15' | '20x30' | '30x45'
}

interface Point {
  x: number
  y: number
}

interface Area {
  x: number
  y: number
  width: number
  height: number
}

export default function PhotoCropper({ imageSrc, onCropComplete, onCancel, initialOrientation = 'portrait', initialConfig, format = '10x15' }: PhotoCropperProps) {
  const [crop, setCrop] = useState<Point>(initialConfig?.crop || { x: 0, y: 0 })
  const [zoom, setZoom] = useState(initialConfig?.zoom || 1)
  const [rotation, setRotation] = useState(initialConfig?.rotation || 0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Ratio selon le format choisi
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialConfig?.orientation || initialOrientation)
  // Format carré = ratio 1:1, autres formats = ratio 1:1.5 (10x15, 20x30, 30x45)
  const PHOTO_ASPECT_RATIO = format === 'carre' ? 1 : (orientation === 'portrait' ? 1 / 1.5 : 1.5 / 1)

  const onCropCompleteCallback = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels)
    },
    []
  )

  const createCroppedImage = useCallback(async () => {
    if (!croppedAreaPixels) return

    setIsProcessing(true)
    
    try {
      // Utiliser la fonction helper qui gère correctement la rotation et le recadrage
      const croppedImageBlob = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        rotation
      )

      if (croppedImageBlob) {
        // Créer un canvas pour redimensionner au format d'impression
        const img = new Image()
        const imgUrl = URL.createObjectURL(croppedImageBlob)
        
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = imgUrl
        })

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) throw new Error('Impossible de créer le contexte')

        // Dimensions finales pour l'impression
        const longSide = 1800
        let targetWidth, targetHeight
        
        if (format === 'carre') {
          // Format carré : dimensions égales
          targetWidth = 1200
          targetHeight = 1200
        } else {
          // Formats rectangulaires avec rapport exact 1:1.5
          if (orientation === 'portrait') {
            // Portrait : largeur = longSide / 1.5
            targetWidth = 1200  // 1800 / 1.5 = 1200
            targetHeight = 1800 // côté long
          } else {
            // Paysage : hauteur = longSide / 1.5
            targetWidth = 1800  // côté long
            targetHeight = 1200 // 1800 / 1.5 = 1200
          }
        }
        
        canvas.width = targetWidth
        canvas.height = targetHeight

        // Dessiner l'image recadrée redimensionnée
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        // Nettoyer l'URL temporaire
        URL.revokeObjectURL(imgUrl)

        // Convertir en File
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedFile = new File([blob], 'cropped-photo.jpg', {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            
            // Envoyer la config actuelle avec le fichier
            const cropConfig: CropConfig = {
              zoom,
              rotation,
              crop,
              orientation
            }
            
            onCropComplete(croppedFile, { orientation, cropConfig })
          }
          setIsProcessing(false)
        }, 'image/jpeg', 0.95)
      } else {
        setIsProcessing(false)
      }

    } catch (error) {
      console.error('Erreur lors du recadrage:', error)
      setIsProcessing(false)
    }
  }, [croppedAreaPixels, imageSrc, rotation, zoom, crop, orientation, onCropComplete])

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800">Recadrer votre photo</h3>
            <p className="text-xs md:text-sm text-gray-600">Format d'impression {format === 'carre' ? 'Carré 10×10' : format.replace('x', '×')} cm</p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zone de recadrage */}
        <div className="relative h-64 md:h-96 bg-gray-100 rounded-lg overflow-hidden mb-4 md:mb-6">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={PHOTO_ASPECT_RATIO}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropCompleteCallback}
            showGrid={false}
            style={{
              containerStyle: {
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
              },
            }}
          />
        </div>

        {/* Contrôles */}
        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
          {/* Orientation - Cacher pour le format carré */}
          {format !== 'carre' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <span className="text-xs md:text-sm font-medium text-gray-700">Orientation:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`px-3 md:px-4 py-2 md:py-1 rounded border text-sm md:text-sm ${orientation==='portrait' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Portrait
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`px-3 md:px-4 py-2 md:py-1 rounded border text-sm md:text-sm ${orientation==='landscape' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Paysage
                </button>
              </div>
            </div>
          )}
          
          {/* Zoom */}
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-1 md:mb-2">
              Zoom: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-2 md:gap-4">
            <label className="text-xs md:text-sm font-medium text-gray-700 whitespace-nowrap">
              Rotation: {rotation}°
            </label>
            <input
              type="range"
              min={-180}
              max={180}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <button
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full p-1 md:p-2 transition-colors"
              title="Rotation 90°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 md:gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 md:px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm md:text-base"
          >
            Annuler
          </button>
          <button
            onClick={createCroppedImage}
            disabled={isProcessing || !croppedAreaPixels}
            className="px-4 md:px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium flex items-center gap-2 text-sm md:text-base"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="hidden sm:inline">Traitement...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Valider le recadrage</span>
                <span className="sm:hidden">Valider</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
} 