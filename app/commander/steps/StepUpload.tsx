'use client'

import { useRef, useState } from 'react'
import { Image, Video, Upload, Check, Play, X, Crop, AlertTriangle } from 'lucide-react'
import PhotoCropperAdvanced from '@/components/PhotoCropperAdvanced'
import type { PhotoItem } from '../CommanderWizard'

interface StepUploadProps {
  format: '10x15' | '20x30' | '30x45'
  photo?: Partial<PhotoItem>
  onUpdate: (updates: Partial<PhotoItem>) => void
}

export default function StepUpload({ format, photo, onUpdate }: StepUploadProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [originalImageSrc, setOriginalImageSrc] = useState<string>('')
  const [imageQuality, setImageQuality] = useState<'low' | 'medium' | 'high'>('medium')

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      setOriginalImageSrc(preview)
      setShowCropper(true)
    }
  }

  const handleCropComplete = (croppedFile: File, metadata: { orientation: 'portrait' | 'landscape', quality: 'low' | 'medium' | 'high' }) => {
    const preview = URL.createObjectURL(croppedFile)
    onUpdate({ photoFile: croppedFile, photoPreview: preview })
    setImageQuality(metadata.quality)
    setShowCropper(false)
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const preview = URL.createObjectURL(file)
      onUpdate({ videoFile: file, videoPreview: preview })
    }
  }

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file)
      setOriginalImageSrc(preview)
      setShowCropper(true)
    }
  }

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      const preview = URL.createObjectURL(file)
      onUpdate({ videoFile: file, videoPreview: preview })
    }
  }

  const formatDisplay = format === '10x15' ? '10×15 cm' : 
                        format === '20x30' ? '20×30 cm' : '30×45 cm'

  return (
    <div className="space-y-8">
      {/* Rappel du format choisi */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
        <p className="text-lg font-medium text-orange-700">
          Format sélectionné : <strong>{formatDisplay}</strong>
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Preview à gauche */}
        {(photo?.photoPreview || photo?.videoPreview) && (
          <div className="order-2 md:order-1">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">Aperçu</h3>
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="relative rounded-lg overflow-hidden shadow-lg bg-white">
                {isPreviewPlaying && photo?.videoPreview ? (
                  <video 
                    src={photo.videoPreview} 
                    className="w-full h-auto"
                    autoPlay 
                    controls 
                    onEnded={() => setIsPreviewPlaying(false)}
                  />
                ) : (
                  <>
                    {photo?.photoPreview && (
                      <img 
                        src={photo.photoPreview} 
                        alt="Aperçu" 
                        className="w-full h-auto"
                      />
                    )}
                    {photo?.videoPreview && (
                      <button
                        onClick={() => setIsPreviewPlaying(true)}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                      >
                        <div className="bg-white/90 rounded-full p-4">
                          <Play className="w-8 h-8 text-orange-500" />
                        </div>
                      </button>
                    )}
                  </>
                )}
              </div>
              {photo?.photoPreview && photo?.videoPreview && (
                <div className="mt-4 flex items-center justify-center gap-2 text-green-600">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Photo et vidéo prêtes !</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload à droite */}
        <div className="order-1 md:order-2 space-y-6">
          {/* Upload Photo */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-700">
              📸 Votre photo
            </label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            {photo?.photoPreview ? (
              <div className="relative group">
                <div className="w-full h-48 bg-gray-50 rounded-xl border-2 border-green-500 overflow-hidden">
                  <img 
                    src={photo.photoPreview} 
                    alt="Photo uploadée" 
                    className="w-full h-full object-contain"
                  />
                  {/* Indicateur de qualité */}
                  <div className="absolute top-2 left-2">
                    {imageQuality === 'low' && (
                      <div className="bg-amber-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Qualité faible
                      </div>
                    )}
                    {imageQuality === 'medium' && (
                      <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Qualité OK
                      </div>
                    )}
                    {imageQuality === 'high' && (
                      <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Haute qualité
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
                  >
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (photo.photoPreview) {
                        setOriginalImageSrc(photo.photoPreview)
                        setShowCropper(true)
                      }
                    }}
                    className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 flex items-center gap-1"
                  >
                    <Crop className="w-4 h-4" />
                    Recadrer
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ photoFile: undefined, photoPreview: undefined })}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handlePhotoDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => photoInputRef.current?.click()}
                className="w-full h-48 border-3 border-dashed border-orange-300 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all cursor-pointer flex flex-col items-center justify-center text-gray-600 bg-white"
              >
                <Image className="w-12 h-12 mb-3 text-orange-400" />
                <span className="text-lg font-medium">Glissez votre photo ici</span>
                <span className="text-sm text-gray-500 mt-1">ou cliquez pour parcourir</span>
                <span className="text-xs text-orange-600 mt-2 font-medium">
                  Format {formatDisplay}
                </span>
              </div>
            )}
          </div>

          {/* Upload Vidéo */}
          <div className="space-y-3">
            <label className="block text-lg font-semibold text-gray-700">
              🎬 Votre vidéo souvenir
            </label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
            />
            {photo?.videoPreview ? (
              <div className="relative group">
                <div className="w-full h-48 bg-gray-50 rounded-xl border-2 border-green-500 overflow-hidden flex items-center justify-center">
                  <video 
                    src={photo.videoPreview} 
                    className="max-w-full max-h-full"
                  />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="bg-white text-gray-800 px-4 py-2 rounded-lg font-medium hover:bg-gray-100"
                  >
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdate({ videoFile: undefined, videoPreview: undefined })}
                    className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handleVideoDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => videoInputRef.current?.click()}
                className="w-full h-48 border-3 border-dashed border-purple-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all cursor-pointer flex flex-col items-center justify-center text-gray-600 bg-white"
              >
                <Video className="w-12 h-12 mb-3 text-purple-400" />
                <span className="text-lg font-medium">Glissez votre vidéo ici</span>
                <span className="text-sm text-gray-500 mt-1">ou cliquez pour parcourir</span>
                <span className="text-xs text-purple-600 mt-2">MP4, WebM, MOV (max 50 MB)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-700">
          <strong>💡 Comment ça marche ?</strong> La vidéo se lancera automatiquement quand 
          quelqu'un posera son téléphone sur la photo imprimée grâce à la puce NFC intégrée.
        </p>
      </div>

      {/* Cropper modal */}
      {showCropper && (
        <PhotoCropperAdvanced
          imageSrc={originalImageSrc}
          targetFormat={format}
          onCropComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
          initialOrientation="portrait"
        />
      )}
    </div>
  )
}