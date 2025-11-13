'use client'

import { useState, useRef, useEffect } from 'react'
import { X, SkipBack, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { extractVideoFrame } from '@/lib/mockup-generator'

interface VideoFrameExtractorProps {
  videoFile: File
  videoPreview: string
  isOpen: boolean
  onClose: () => void
  onFrameSelected: (imageFile: File) => void
}

export default function VideoFrameExtractor({
  videoFile,
  videoPreview,
  isOpen,
  onClose,
  onFrameSelected
}: VideoFrameExtractorProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCurrentTime(0)
      setError(null)
    }
  }, [isOpen])

  // Mettre à jour la durée quand la vidéo est chargée
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
      // Positionner à la première seconde
      videoRef.current.currentTime = 0.5
      setCurrentTime(0.5)
    }
  }

  // Mettre à jour le temps actuel
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  // Changer le temps avec le slider
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // Navigation rapide/lente
  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  // Extraire la frame actuelle
  const handleExtractFrame = async () => {
    if (!videoRef.current) return

    setIsExtracting(true)
    setError(null)

    try {
      const imageFile = await extractVideoFrame(videoRef.current, currentTime)
      onFrameSelected(imageFile)
    } catch (err) {
      console.error('Erreur lors de l\'extraction de la frame:', err)
      setError('Impossible d\'extraire l\'image. Veuillez réessayer.')
    } finally {
      setIsExtracting(false)
    }
  }

  // Formater le temps en mm:ss.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const milliseconds = Math.floor((time % 1) * 100)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Extraire une image de la vidéo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Video Preview */}
        <div className="relative h-64 md:h-96 bg-black flex items-center justify-center p-4 overflow-hidden">
          <video
            ref={videoRef}
            src={videoPreview}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            className="max-w-full max-h-full object-contain rounded-lg"
            style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
            playsInline
          />
        </div>

        {/* Controls */}
        <div className="p-6 space-y-4 border-t border-gray-200">
          {/* Timeline */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span className="font-mono">{formatTime(duration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.033" // ~1 frame à 30fps
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
            />
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => skipTime(-1)}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Reculer de 1 seconde"
            >
              <SkipBack className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => skipTime(-0.033)}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Reculer d'une frame (~0.033s)"
            >
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => skipTime(0.033)}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Avancer d'une frame (~0.033s)"
            >
              <ChevronRight className="w-5 h-5 text-gray-700" />
            </button>
            <button
              onClick={() => skipTime(1)}
              className="p-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Avancer de 1 seconde"
            >
              <SkipForward className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 py-6 text-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleExtractFrame}
              disabled={isExtracting}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
            >
              {isExtracting ? 'Extraction...' : 'Sélectionner cette image'}
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center">
            Utilisez le curseur ou les boutons pour naviguer dans la vidéo, puis cliquez sur "Sélectionner cette image"
          </p>
        </div>
      </div>
    </div>
  )
}
