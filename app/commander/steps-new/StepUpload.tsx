'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Image as ImageIcon, Video, MessageSquare, Sparkles, Crop, RotateCw, ChevronDown, ChevronUp, Eye, X, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PhotoCropper from '@/components/PhotoCropper'
import type { PhotoItem } from '../CommanderWizardNew'
import {
  generateVideoMockup,
  createMockupPreviewUrl,
  revokeMockupPreviewUrl
} from '@/lib/mockup-generator'

interface StepUploadProps {
  format: 'carre' | '10x15' | '20x30' | '30x45'
  onComplete: (photo: PhotoItem) => void
  editingPhoto?: PhotoItem
}

interface CropConfig {
  zoom: number
  rotation: number
  crop: { x: number; y: number }
  orientation: 'portrait' | 'landscape'
}

export default function StepUpload({ format, onComplete, editingPhoto }: StepUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // État de l'étape actuelle (1: vidéo, 2: photo, 3: message)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  const [originalFile, setOriginalFile] = useState<File | null>((editingPhoto as any)?.originalPhotoFile || editingPhoto?.photoFile || null) // Garde la photo originale
  const [croppedFile, setCroppedFile] = useState<File | null>(editingPhoto?.photoFile || null) // Photo recadrée
  const [videoFile, setVideoFile] = useState<File | null>(editingPhoto?.videoFile || null)
  const [croppedPreview, setCroppedPreview] = useState<string>(editingPhoto?.photoPreview || '') // Preview de la photo recadrée
  const [videoPreview, setVideoPreview] = useState<string>(editingPhoto?.videoPreview || '')
  const [message, setMessage] = useState(editingPhoto?.message || '')
  const [signature, setSignature] = useState(editingPhoto?.signature || '')
  const [dragActive, setDragActive] = useState(false)
  const [showCropper, setShowCropper] = useState(false)
  const [originalImageSrc, setOriginalImageSrc] = useState<string>('')
  const [orientation, setOrientation] = useState<'portrait' | 'paysage'>('portrait')
  const [cropConfig, setCropConfig] = useState<CropConfig | null>((editingPhoto as any)?.cropConfig || null) // Sauvegarde la config de crop

  // États pour le mockup vidéo
  const [videoMockupPreview, setVideoMockupPreview] = useState<string | null>(null)
  const [videoMockupLoading, setVideoMockupLoading] = useState(false)
  const [videoMockupError, setVideoMockupError] = useState<string | null>(null)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showMessage, setShowMessage] = useState(!!editingPhoto?.message) // État pour le toggle du message
  const [showPreview, setShowPreview] = useState(false) // État pour afficher l'aperçu de l'étiquette

  // Si on édite et qu'on a une photo, ouvrir directement le cropper avec la config sauvegardée
  useEffect(() => {
    if (editingPhoto && originalFile && !originalImageSrc && !showCropper) {
      // Préparer l'URL et ouvrir le cropper directement avec la config
      const url = URL.createObjectURL(originalFile)
      setOriginalImageSrc(url)
      // Ouvrir le cropper automatiquement si on édite
      if (editingPhoto) {
        setShowCropper(true)
      }
    }
  }, [editingPhoto, originalFile])

  // Cleanup video mockup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (videoMockupPreview) {
        revokeMockupPreviewUrl(videoMockupPreview)
      }
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview)
      }
    }
  }, [])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file: File) => {
    const MAX_SIZE = 200 * 1024 * 1024 // 200MB
    
    if (file.size > MAX_SIZE) {
      alert(`Le fichier est trop volumineux. Taille maximum : 200MB`)
      return
    }
    
    if (file.type.startsWith('image/')) {
      setOriginalFile(file) // Garde le fichier original
      const url = URL.createObjectURL(file)
      setOriginalImageSrc(url)
      setShowCropper(true)
    } else if (file.type.startsWith('video/')) {
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      handleFile(file)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      // Clean up old previews
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview)
      }
      if (videoMockupPreview) {
        revokeMockupPreviewUrl(videoMockupPreview)
        setVideoMockupPreview(null)
      }

      // Reset playing state
      setIsVideoPlaying(false)

      // Set video file and basic preview
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))

      // Generate video mockup
      setVideoMockupLoading(true)
      setVideoMockupError(null)

      try {
        const mockupBlob = await generateVideoMockup(file)
        const mockupUrl = createMockupPreviewUrl(mockupBlob)
        setVideoMockupPreview(mockupUrl)
        console.log('✅ Mockup vidéo généré et affiché')
      } catch (error) {
        console.error('❌ Erreur génération mockup vidéo:', error)
        setVideoMockupError('Impossible de générer l\'aperçu. La vidéo sera affichée normalement.')
      } finally {
        setVideoMockupLoading(false)
      }
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleCropComplete = (croppedFileData: File, meta: any) => {
    setCroppedFile(croppedFileData) // Sauvegarde la photo recadrée
    
    // Sauvegarder la configuration de crop
    if (meta.cropConfig) {
      setCropConfig(meta.cropConfig)
    }
    
    // Nettoyer l'ancienne preview
    if (croppedPreview) {
      URL.revokeObjectURL(croppedPreview)
    }
    
    // Créer nouvelle preview
    const newPreview = URL.createObjectURL(croppedFileData)
    setCroppedPreview(newPreview)
    setOrientation(meta.orientation === 'portrait' ? 'portrait' : 'paysage')
    setShowCropper(false)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    // Si pas de photo recadrée, on annule tout
    if (!croppedFile) {
      setOriginalFile(null)
      if (originalImageSrc) {
        URL.revokeObjectURL(originalImageSrc)
        setOriginalImageSrc('')
      }
    }
  }

  const openRecrop = () => {
    if (originalFile) {
      const url = URL.createObjectURL(originalFile)
      setOriginalImageSrc(url)
      setShowCropper(true)
    }
  }

  const handleValidate = () => {
    if (!croppedFile) return // On valide seulement si la photo est recadrée

    const photo: PhotoItem = {
      id: `photo-${Date.now()}`,
      format,
      withFrame: false, // Par défaut sans cadre, sera choisi dans la galerie
      photoFile: croppedFile, // Envoie la photo RECADRÉE
      originalPhotoFile: originalFile || undefined, // Conserve la photo ORIGINALE
      cropConfig: cropConfig || undefined, // Sauvegarde la configuration de recadrage
      videoFile: videoFile || undefined,
      photoPreview: croppedPreview, // Preview de la photo RECADRÉE
      videoPreview: videoPreview || undefined,
      message,
      signature,
      quantity: 1,
      isGift: false
    }

    onComplete(photo)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-6">
      {/* Indicateur de progression */}
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Étape {currentStep} sur 3</span>
          <span className="text-sm text-gray-500">
            {currentStep === 1 && 'Vidéo'}
            {currentStep === 2 && 'Photo'}
            {currentStep === 3 && 'Message (optionnel)'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-orange-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Étape 1: Zone d'upload vidéo */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Video className="w-5 h-5 text-purple-500" />
          Vidéo associée <span className="text-red-500">*</span>
        </h3>

        {!videoPreview ? (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Button
                onClick={() => videoInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                Ajouter une vidéo
              </Button>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleVideoChange}
              />
              <p className="text-xs text-gray-500 mt-2">
                MP4, WebM, MOV (max 200 MB)
              </p>
            </div>
            <p className="text-xs text-gray-600 text-center">
              💡 Vous pouvez faire un{' '}
              <a
                href="https://editeasy.up.railway.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-600 hover:text-orange-700 underline font-medium"
              >
                montage automatique de vos photos et vidéos ici
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Affichage du mockup vidéo */}
            {videoMockupLoading ? (
              <div className="w-full h-64 flex flex-col items-center justify-center bg-gray-100 rounded-lg">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-3"></div>
                <p className="text-sm text-gray-600">Génération de l'aperçu...</p>
              </div>
            ) : videoMockupError || !videoMockupPreview ? (
              /* Fallback: afficher la vidéo normale en cas d'erreur */
              <div className="space-y-2">
                {videoMockupError && (
                  <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                    {videoMockupError}
                  </p>
                )}
                <video
                  src={videoPreview}
                  controls
                  className="w-full h-40 object-contain rounded-lg bg-gray-100"
                />
              </div>
            ) : (
              /* Afficher le mockup avec vidéo jouable */
              <div className="space-y-2">
                <div className="relative w-full">
                  {/* Fond du mockup (toujours visible) */}
                  <img
                    src="/frontend-pictures/commander/phone-and-picture-portrait-mockup.png"
                    alt="Mockup téléphone"
                    className="w-full h-auto rounded-lg"
                  />

                  {/* Image de la première frame (visible quand vidéo ne joue pas) */}
                  {!isVideoPlaying && (
                    <img
                      src={videoMockupPreview}
                      alt="Première frame de la vidéo"
                      className="absolute rounded-[45px]"
                      style={{
                        left: '28.5%',
                        top: '15.8%',
                        width: '47.7%',
                        height: '54.2%',
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  {/* Vidéo (visible quand elle joue) */}
                  {isVideoPlaying && (
                    <video
                      ref={videoRef}
                      src={videoPreview}
                      className="absolute rounded-[45px]"
                      style={{
                        left: '28.5%',
                        top: '15.8%',
                        width: '47.7%',
                        height: '54.2%',
                        objectFit: 'cover'
                      }}
                      controls
                      autoPlay
                      onEnded={() => setIsVideoPlaying(false)}
                    />
                  )}

                  {/* Bouton Play centré sur l'écran du téléphone */}
                  {!isVideoPlaying && (
                    <button
                      onClick={() => {
                        setIsVideoPlaying(true)
                        setTimeout(() => videoRef.current?.play(), 100)
                      }}
                      className="absolute flex items-center justify-center hover:scale-105 transition-transform"
                      style={{
                        left: '28.5%',
                        top: '15.8%',
                        width: '47.7%',
                        height: '54.2%'
                      }}
                    >
                      <div className="bg-white/90 rounded-full p-4 hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-purple-600" fill="currentColor" />
                      </div>
                    </button>
                  )}
                </div>
                <p className="text-xs text-center text-gray-500">
                  {isVideoPlaying ? 'Vidéo en lecture' : 'Cliquez pour lire la vidéo'}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => videoInputRef.current?.click()}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Changer la vidéo
              </Button>
              {videoMockupPreview && !isVideoPlaying && (
                <Button
                  onClick={() => {
                    setIsVideoPlaying(true)
                    setTimeout(() => videoRef.current?.play(), 100)
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Lire
                </Button>
              )}
              {isVideoPlaying && (
                <Button
                  onClick={() => {
                    videoRef.current?.pause()
                    setIsVideoPlaying(false)
                  }}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Arrêter
                </Button>
              )}
            </div>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoChange}
            />
          </div>
        )}

        {/* Bouton Continuer étape 1 */}
        <Button
          onClick={() => setCurrentStep(2)}
          disabled={!videoFile}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed mt-6"
        >
          {!videoFile ? 'Veuillez ajouter une vidéo' : 'Continuer vers la photo'}
        </Button>
      </div>
      )}

      {/* Étape 2: Zone d'upload photo */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl shadow-lg p-3 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold mb-2 sm:mb-4 flex items-center gap-2">
          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
          Votre photo
        </h3>

        {!croppedPreview ? (
          <div
            className={`border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-colors ${
              dragActive ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-2">Glissez votre photo ici ou</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
            >
              Choisir une photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
            <p className="text-xs text-gray-500 mt-4">
              Formats acceptés : JPEG, PNG, WebP (max 200 MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <div
                className="w-full rounded-lg bg-gray-100 overflow-hidden"
                style={{
                  aspectRatio: format === 'carre' ? '1 / 1' : (orientation === 'portrait' ? '1 / 1.5' : '1.5 / 1')
                }}
              >
                <img
                  src={croppedPreview}
                  alt="Aperçu recadré"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                <span className="text-xs font-medium text-gray-700">
                  {orientation === 'portrait' ? 'Portrait' : 'Paysage'}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="flex-1"
              >
                Changer la photo
              </Button>
              <Button
                onClick={openRecrop}
                variant="outline"
                size="icon"
                title="Recadrer à nouveau"
              >
                <Crop className="w-4 h-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        )}

        {/* Boutons navigation étape 2 */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => setCurrentStep(1)}
            variant="outline"
            className="flex-1 py-6 text-lg"
          >
            Retour
          </Button>
          <Button
            onClick={() => setCurrentStep(3)}
            disabled={!croppedFile}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {!croppedFile ? 'Veuillez ajouter une photo' : 'Continuer au message'}
          </Button>
        </div>
      </div>
      )}

      {/* Étape 3: Message personnalisé (optionnel) */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <button
          onClick={() => setShowMessage(!showMessage)}
          className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            Ajouter un message (optionnel)
          </h3>
          {showMessage ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showMessage && (
          <div className="px-6 pb-6 space-y-4 border-t">
            <div className="pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>Aperçu étiquette</span>
                </button>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Votre message d'amour, de tendresse..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={150}
              />
              <p className="text-xs text-gray-500 mt-1">
                {message.length}/150 caractères
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Signature (optionnel)
              </label>
              <input
                type="text"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="Votre nom..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                maxLength={50}
              />
            </div>
          </div>
        )}

        {/* Boutons navigation étape 3 */}
        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => setCurrentStep(2)}
            variant="outline"
            className="flex-1 py-6 text-lg"
          >
            Retour
          </Button>
          <Button
            onClick={handleValidate}
            disabled={!croppedFile || !videoFile}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Valider et continuer
          </Button>
        </div>
      </div>
      )}

      {/* Modal de recadrage */}
      {showCropper && originalImageSrc && (
        <PhotoCropper
          imageSrc={originalImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          initialOrientation={cropConfig?.orientation || (orientation === 'portrait' ? 'portrait' : 'landscape')}
          initialConfig={cropConfig}
          format={format}
        />
      )}

      {/* Modal aperçu étiquette */}
      {showPreview && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowPreview(false)}
        >
          <div 
            className="relative max-w-lg w-full bg-white rounded-xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 bg-white/90 rounded-full p-2 hover:bg-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-4 md:p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Aperçu de l'étiquette</h3>
              <div className="max-w-md mx-auto">
                <img 
                  src="/frontend-pictures/etiquette-exemple.png"
                  alt="Exemple d'étiquette personnalisée"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
              <p className="text-sm text-gray-600 text-center mt-4">
                Voici un exemple d'étiquette qui sera ajoutée à votre photo avec votre message personnalisé
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de lecture vidéo complète */}
      {showVideoModal && videoPreview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bouton fermer */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>

            {/* Lecteur vidéo */}
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Votre vidéo</h3>
              <video
                src={videoPreview}
                controls
                autoPlay
                className="w-full h-auto rounded-lg bg-black"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}