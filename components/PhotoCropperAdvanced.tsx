'use client'

import { useState, useRef, useEffect } from 'react'
import { X, RotateCw, ZoomIn, ZoomOut, Check, AlertTriangle, Crop } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PhotoCropperAdvancedProps {
  imageSrc: string
  onCropComplete: (croppedFile: File, metadata: { 
    orientation: 'portrait' | 'landscape'
    quality: 'low' | 'medium' | 'high'
  }) => void
  onCancel: () => void
  initialOrientation?: 'portrait' | 'landscape'
  targetFormat: '10x15' | '20x30' | '30x45'
}

export default function PhotoCropperAdvanced({ 
  imageSrc, 
  onCropComplete, 
  onCancel, 
  initialOrientation = 'portrait',
  targetFormat 
}: PhotoCropperAdvancedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(initialOrientation)
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('medium')

  // Calcul de la qualité selon la résolution et le format cible
  const calculateQuality = (img: HTMLImageElement) => {
    const targetResolutions = {
      '10x15': { width: 1500, height: 1000 }, // 150 DPI minimum
      '20x30': { width: 2400, height: 1800 }, // 120 DPI minimum  
      '30x45': { width: 3600, height: 2400 }  // 120 DPI minimum
    }

    const target = targetResolutions[targetFormat]
    const minDimension = Math.min(img.width, img.height)
    const targetMin = orientation === 'portrait' 
      ? Math.min(target.width, target.height)
      : Math.max(target.width, target.height)

    if (minDimension >= targetMin * 1.5) {
      return 'high'
    } else if (minDimension >= targetMin) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
      const quality = calculateQuality(img)
      setImageQuality(quality)
      
      // Auto-ajuster le zoom initial
      if (canvasRef.current) {
        const canvas = canvasRef.current
        const scale = Math.min(
          canvas.width / img.width,
          canvas.height / img.height
        )
        setZoom(scale * 1.2) // Un peu de marge
      }
    }
    img.src = imageSrc
  }, [imageSrc])

  useEffect(() => {
    if (!image || !canvasRef.current) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw crop area background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Calculate crop area
    const cropWidth = orientation === 'portrait' ? 300 : 450
    const cropHeight = orientation === 'portrait' ? 450 : 300
    const cropX = (canvas.width - cropWidth) / 2
    const cropY = (canvas.height - cropHeight) / 2

    // Create clipping path
    ctx.save()
    ctx.beginPath()
    ctx.rect(cropX, cropY, cropWidth, cropHeight)
    ctx.clip()

    // Apply transformations
    ctx.translate(canvas.width / 2 + position.x, canvas.height / 2 + position.y)
    ctx.rotate(rotation * Math.PI / 180)
    ctx.scale(zoom, zoom)

    // Draw image
    ctx.drawImage(image, -image.width / 2, -image.height / 2)
    ctx.restore()

    // Draw crop border
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    for (let i = 1; i < 3; i++) {
      ctx.beginPath()
      ctx.moveTo(cropX + (cropWidth / 3) * i, cropY)
      ctx.lineTo(cropX + (cropWidth / 3) * i, cropY + cropHeight)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(cropX, cropY + (cropHeight / 3) * i)
      ctx.lineTo(cropX + cropWidth, cropY + (cropHeight / 3) * i)
      ctx.stroke()
    }
  }, [image, zoom, rotation, position, orientation])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY * -0.001
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleCrop = async () => {
    if (!image || !canvasRef.current) return

    const cropCanvas = document.createElement('canvas')
    const cropWidth = orientation === 'portrait' ? 300 : 450
    const cropHeight = orientation === 'portrait' ? 450 : 300
    
    cropCanvas.width = cropWidth
    cropCanvas.height = cropHeight
    
    const ctx = cropCanvas.getContext('2d')
    if (!ctx) return

    ctx.translate(cropWidth / 2 + position.x, cropHeight / 2 + position.y)
    ctx.rotate(rotation * Math.PI / 180)
    ctx.scale(zoom, zoom)
    ctx.drawImage(image, -image.width / 2, -image.height / 2)

    cropCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped-photo.jpg', { type: 'image/jpeg' })
        onCropComplete(file, { orientation, quality: imageQuality })
      }
    }, 'image/jpeg', 0.95)
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Recadrer votre photo</h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Canvas area */}
        <div className="p-4 bg-gray-100">
          <canvas
            ref={canvasRef}
            width={600}
            height={600}
            className="mx-auto cursor-move border border-gray-300 rounded-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          />
        </div>

        {/* Quality indicator */}
        <div className="px-4 py-2 bg-gray-50 border-y">
          <div className="flex items-center justify-center gap-2">
            {imageQuality === 'low' && (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="text-amber-700 font-medium">
                  Qualité faible - L'image pourrait être pixelisée à l'impression
                </span>
              </>
            )}
            {imageQuality === 'medium' && (
              <>
                <Check className="w-5 h-5 text-blue-500" />
                <span className="text-blue-700 font-medium">
                  Qualité acceptable pour l'impression
                </span>
              </>
            )}
            {imageQuality === 'high' && (
              <>
                <Check className="w-5 h-5 text-green-500" />
                <span className="text-green-700 font-medium">
                  Excellente qualité pour l'impression
                </span>
              </>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 space-y-4">
          {/* Zoom controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Zoom:</span>
              <input
                type="range"
                min="50"
                max="300"
                value={zoom * 100}
                onChange={(e) => setZoom(parseInt(e.target.value) / 100)}
                className="w-32"
              />
              <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
            </div>
            <button
              onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          {/* Other controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRotate}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCw className="w-4 h-4" />
              Rotation
            </button>
            <button
              onClick={() => setOrientation(prev => prev === 'portrait' ? 'landscape' : 'portrait')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <Crop className="w-4 h-4" />
              {orientation === 'portrait' ? 'Paysage' : 'Portrait'}
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button 
              onClick={handleCrop}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Valider le recadrage
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}