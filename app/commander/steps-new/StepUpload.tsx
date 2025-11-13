'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, Image as ImageIcon, Video, MessageSquare, Sparkles, Crop, RotateCw, ChevronDown, ChevronUp, Eye, X, Play, Film, Check, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PhotoCropper from '@/components/PhotoCropper'
import VideoFrameExtractor from '@/components/VideoFrameExtractor'
import MontageWizard from '@/components/MontageWizard'
import type { PhotoItem } from '../CommanderWizardNew'
import {
  generateVideoMockup,
  generatePhotoAndVideoMockup,
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
  const mockupImgRef = useRef<HTMLImageElement>(null)
  // Dimensions du mockup par défaut (phone-portrait-card-landscape: 1500x1500)
  const [mockupDimensions, setMockupDimensions] = useState<{ width: number; height: number }>({ width: 1500, height: 1500 })
  const [showMessage, setShowMessage] = useState(false) // État pour le toggle du message (par défaut fermé)
  const [showFrameExtractor, setShowFrameExtractor] = useState(false) // État pour le modal d'extraction de frame
  const [showMontageWizard, setShowMontageWizard] = useState(false) // État pour le modal de création de montage
  const [montageCreating, setMontageCreating] = useState(false) // État pour la création du montage
  const [montageProgress, setMontageProgress] = useState(0) // Progression du montage (0-100)
  const [currentAnecdote, setCurrentAnecdote] = useState(0) // Index de l'anecdote actuelle
  const [videoSectionCollapsed, setVideoSectionCollapsed] = useState(false) // État pour collapse du bloc vidéo

  // États pour le mockup combiné (vidéo + photo)
  const [isCombinedVideoPlaying, setIsCombinedVideoPlaying] = useState(false)
  const combinedVideoRef = useRef<HTMLVideoElement>(null)
  const [combinedMockupPreview, setCombinedMockupPreview] = useState<string | null>(null)
  const [combinedMockupLoading, setCombinedMockupLoading] = useState(false)
  const [combinedMockupError, setCombinedMockupError] = useState<string | null>(null)
  const [photoSectionCollapsed, setPhotoSectionCollapsed] = useState(false)
  const [messageSectionCollapsed, setMessageSectionCollapsed] = useState(true) // Fermé par défaut
  const [tutoSectionCollapsed, setTutoSectionCollapsed] = useState(false) // Ouvert par défaut

  // États pour la vidéo tutoriel
  const [tutoVideoProgress, setTutoVideoProgress] = useState(0) // 0-100%
  const [tutoVideoEnded, setTutoVideoEnded] = useState(false)
  const tutoVideoRef = useRef<HTMLVideoElement>(null)

  const mockupRef = useRef<HTMLDivElement>(null)

  // Anecdotes sur l'histoire de la photographie et de la vidéo
  const anecdotes = [
    "📸 La première photographie a été prise en 1826 par Nicéphore Niépce. Le temps d'exposition était de 8 heures !",
    "🎬 Le premier film de l'histoire, 'La Sortie de l'usine Lumière', ne durait que 46 secondes (1895).",
    "🌈 La première photo couleur a été prise en 1861 par James Clerk Maxwell, physicien écossais.",
    "🎥 Les frères Lumière ont organisé la première projection publique de cinéma le 28 décembre 1895 à Paris.",
    "📷 Le mot 'photographie' vient du grec 'photos' (lumière) et 'graphein' (écrire).",
    "🎞️ Le premier long-métrage de l'histoire était 'L'Histoire de Kelly Gang' (1906), il durait 60 minutes.",
    "⚡ L'appareil photo Polaroid a été inventé en 1948, révolutionnant la photographie instantanée.",
    "🎬 Le film 'Avatar' (2009) a popularisé la technologie 3D moderne au cinéma.",
    "📸 La photo la plus chère vendue aux enchères est 'Rhein II' d'Andreas Gursky : 4,3 millions de dollars !",
    "🎥 Le premier film parlant, 'Le Chanteur de Jazz', est sorti en 1927.",
    "📷 Instagram a été lancé en 2010 et compte aujourd'hui plus de 2 milliards d'utilisateurs.",
    "🎞️ Le film le plus long jamais réalisé dure 857 heures (35 jours) : 'Logistics' (2012).",
    "📸 Le premier selfie de l'histoire a été pris en 1839 par Robert Cornelius à Philadelphie.",
    "🎬 Le cinéma muet était accompagné de musiciens en direct pour créer l'ambiance.",
    "📷 Le format JPEG a été créé en 1992 et reste le plus utilisé pour les photos numériques.",
    "🎥 La première vidéo sur YouTube a été uploadée le 23 avril 2005 : 'Me at the zoo'.",
    "📸 George Eastman a inventé le premier appareil Kodak en 1888 avec le slogan 'You press the button, we do the rest'.",
    "🎬 Le film 'Star Wars' (1977) a révolutionné les effets spéciaux au cinéma.",
    "📷 En 2023, plus de 1,8 trillion de photos sont prises chaque année dans le monde !",
    "🎥 La caméra GoPro a été inventée en 2002 par un surfeur californien, Nick Woodman."
  ]

  // États pour les orientations détectées
  const [videoOrientation, setVideoOrientation] = useState<'portrait' | 'landscape' | null>(null)
  const [photoOrientation, setPhotoOrientation] = useState<'portrait' | 'landscape' | null>(null)

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

  // Auto-play video when isVideoPlaying becomes true
  useEffect(() => {
    if (isVideoPlaying && videoRef.current) {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.play().catch((error) => {
            console.error('Erreur lors de la lecture de la vidéo:', error)
            setIsVideoPlaying(false)
          })
        }
      })
    }
  }, [isVideoPlaying])

  // Auto-play combined video when isCombinedVideoPlaying becomes true
  useEffect(() => {
    if (isCombinedVideoPlaying && combinedVideoRef.current) {
      combinedVideoRef.current.play().catch((error) => {
        console.error('Erreur lors de la lecture de la vidéo combinée:', error)
        setIsCombinedVideoPlaying(false)
      })
    }
  }, [isCombinedVideoPlaying])

  // Changer l'anecdote toutes les 5 secondes pendant la création du montage
  useEffect(() => {
    if (montageCreating) {
      const interval = setInterval(() => {
        setCurrentAnecdote((prev) => (prev + 1) % anecdotes.length)
      }, 5000)

      return () => clearInterval(interval)
    }
  }, [montageCreating, anecdotes.length])

  // Handlers pour la vidéo tutoriel
  const handleTutoVideoTimeUpdate = () => {
    if (tutoVideoRef.current) {
      const progress = (tutoVideoRef.current.currentTime / tutoVideoRef.current.duration) * 100
      setTutoVideoProgress(progress)
    }
  }

  const handleTutoVideoEnded = () => {
    setTutoVideoEnded(true)
    setTutoVideoProgress(100)
  }

  const handleTutoVideoReplay = () => {
    if (tutoVideoRef.current) {
      tutoVideoRef.current.currentTime = 0
      tutoVideoRef.current.play()
      setTutoVideoEnded(false)
      setTutoVideoProgress(0)
    }
  }

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

      // Réinitialiser la config de crop précédente pour permettre une nouvelle détection
      setCropConfig(null)

      // Détecter l'orientation de l'image avant d'ouvrir le cropper
      const img = new Image()
      img.onload = () => {
        // Déterminer l'orientation selon les dimensions
        const detectedOrientation: 'portrait' | 'landscape' = img.height > img.width ? 'portrait' : 'landscape'
        console.log('🔍 Image dimensions:', { width: img.width, height: img.height })
        console.log('🔍 Detected orientation:', detectedOrientation)
        setPhotoOrientation(detectedOrientation)
        setShowCropper(true)
      }
      img.src = url
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

  const handleFrameExtracted = (imageFile: File) => {
    setShowFrameExtractor(false)
    // Traiter l'image extraite comme un upload normal
    handleFile(imageFile)
  }

  const handleMontageCreated = async (montageData: {
    mediaFiles: Array<{ id: string; file: File; type: 'photo' | 'video'; preview: string; duration?: number; orientation?: 'portrait' | 'landscape' }>
    musicTrackId: string | null
    format: 'portrait' | 'landscape'
    customMusicFile?: File
  }) => {
    setShowMontageWizard(false)
    setMontageCreating(true)
    setMontageProgress(0)

    console.log(`📐 Format du montage détecté/choisi: ${montageData.format}`)

    try {
      // Étape 1: Upload des médias vers Supabase
      setMontageProgress(5)
      const formData = new FormData()
      montageData.mediaFiles.forEach((media) => {
        formData.append('media', media.file)
      })

      // Ajouter la musique personnalisée si fournie
      if (montageData.customMusicFile) {
        formData.append('music', montageData.customMusicFile)
        console.log('🎵 Ajout de la musique personnalisée:', montageData.customMusicFile.name)
      }

      const uploadResponse = await fetch('/api/montage/upload-multiple', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Erreur lors de l\'upload des médias')
      }

      const uploadData = await uploadResponse.json()
      setMontageProgress(15)

      // Étape 2: Créer le montage avec le backend FFmpeg
      const createResponse = await fetch('/api/montage/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaPaths: uploadData.media.map((media: any, index: number) => ({
            path: media.path,
            type: media.type,
            duration: montageData.mediaFiles[index].duration
          })),
          musicTrackId: montageData.musicTrackId,
          musicPath: uploadData.musicPath || undefined, // Chemin de la musique uploadée
          format: montageData.format // Utilise le format détecté/choisi depuis le wizard
        }),
      })

      if (!createResponse.ok) {
        throw new Error('Erreur lors de la création du montage')
      }

      const { jobId, progressUrl } = await createResponse.json()
      setMontageProgress(20)

      // Étape 3: Suivre la progression via SSE avec retry automatique
      let retryCount = 0
      const maxRetries = 5
      let currentEventSource: EventSource | null = null

      const connectToProgressStream = () => {
        console.log(`🔌 Tentative de connexion SSE (${retryCount + 1}/${maxRetries + 1})...`)
        currentEventSource = new EventSource(progressUrl)

        currentEventSource.onmessage = (event) => {
          const data = JSON.parse(event.data)
          console.log('📊 Progression reçue:', data.progress + '%')

          setMontageProgress(data.progress)

          if (data.status === 'completed' && data.videoUrl) {
            currentEventSource?.close()
            setMontageCreating(false)

            // Télécharger la vidéo finale
            fetch(data.videoUrl)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], `montage-${Date.now()}.mp4`, { type: 'video/mp4' })

                // Nettoyer l'ancien preview si nécessaire
                if (videoPreview) {
                  URL.revokeObjectURL(videoPreview)
                }
                if (videoMockupPreview) {
                  revokeMockupPreviewUrl(videoMockupPreview)
                  setVideoMockupPreview(null)
                }

                // Mettre à jour la vidéo avec le montage créé
                setVideoFile(file)
                const videoUrl = data.videoUrl
                setVideoPreview(videoUrl)

                // Détecter l'orientation de la vidéo créée
                const video = document.createElement('video')
                video.src = videoUrl
                video.onloadedmetadata = async () => {
                  const orientation = video.videoHeight > video.videoWidth ? 'portrait' : 'landscape'
                  setVideoOrientation(orientation)
                  console.log(`📱 Montage créé: ${orientation} (${video.videoWidth}×${video.videoHeight})`)

                  // Si une photo existe déjà, régénérer le mockup combiné avec le montage
                  if (croppedFile && photoOrientation) {
                    setCombinedMockupLoading(true)
                    setCombinedMockupError(null)

                    try {
                      console.log('🎨 Régénération du mockup combiné avec le montage...')
                      const mockupBlob = await generatePhotoAndVideoMockup(
                        file,
                        croppedFile
                      )

                      // Nettoyer l'ancien mockup combiné
                      if (combinedMockupPreview) {
                        revokeMockupPreviewUrl(combinedMockupPreview)
                      }

                      const mockupUrl = createMockupPreviewUrl(mockupBlob)
                      setCombinedMockupPreview(mockupUrl)
                      console.log('✅ Mockup combiné régénéré avec le montage')
                    } catch (error) {
                      console.error('❌ Erreur régénération mockup combiné:', error)
                      setCombinedMockupError('Impossible de générer l\'aperçu. Le mockup sera affiché normalement.')
                    } finally {
                      setCombinedMockupLoading(false)
                    }
                  }
                }

                // Auto-collapse video section after montage creation
                setVideoSectionCollapsed(true)

                // Générer le mockup vidéo
                setVideoMockupLoading(true)
                generateVideoMockup(file)
                  .then(mockupBlob => {
                    const mockupUrl = createMockupPreviewUrl(mockupBlob)
                    setVideoMockupPreview(mockupUrl)
                    console.log('✅ Mockup vidéo généré pour le montage')
                  })
                  .catch(error => {
                    console.error('❌ Erreur génération mockup vidéo:', error)
                    setVideoMockupError('Impossible de générer l\'aperçu.')
                  })
                  .finally(() => {
                    setVideoMockupLoading(false)
                  })
              })
              .catch(err => {
                console.error('Erreur lors du téléchargement du montage:', err)
                setMontageCreating(false)
                alert('Montage créé, mais impossible de le charger')
              })
          } else if (data.status === 'failed') {
            currentEventSource?.close()
            setMontageCreating(false)
            alert('Erreur lors de la création du montage: ' + (data.error || 'Erreur inconnue'))
          }
        }

        currentEventSource.onerror = () => {
          console.warn('⚠️ Erreur SSE, tentative:', retryCount + 1)
          currentEventSource?.close()

          // Réessayer après 1 seconde si on n'a pas dépassé le nombre max de tentatives
          if (retryCount < maxRetries) {
            retryCount++
            setTimeout(() => {
              connectToProgressStream()
            }, 1000)
          } else {
            console.error('❌ Échec de connexion SSE après', maxRetries + 1, 'tentatives')
            setMontageCreating(false)
            alert('Erreur de connexion au serveur. Le montage est peut-être en cours de création. Veuillez rafraîchir la page.')
          }
        }
      }

      // Démarrer la connexion SSE
      connectToProgressStream()

    } catch (error) {
      console.error('Erreur lors de la création du montage:', error)
      setMontageCreating(false)
      alert('Erreur lors de la création du montage')
    }
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
      const videoUrl = URL.createObjectURL(file)
      setVideoPreview(videoUrl)

      // Detect video orientation and generate mockups
      const video = document.createElement('video')
      video.src = videoUrl
      video.onloadedmetadata = async () => {
        const orientation = video.videoHeight > video.videoWidth ? 'portrait' : 'landscape'
        setVideoOrientation(orientation)
        console.log(`📱 Vidéo détectée: ${orientation} (${video.videoWidth}×${video.videoHeight})`)

        // Si une photo existe déjà, régénérer le mockup combiné avec la nouvelle vidéo
        if (croppedFile && photoOrientation) {
          setCombinedMockupLoading(true)
          setCombinedMockupError(null)

          try {
            console.log('🎨 Régénération du mockup combiné avec la nouvelle vidéo...')
            const mockupBlob = await generatePhotoAndVideoMockup(
              file,
              croppedFile,
              orientation,
              photoOrientation
            )

            // Nettoyer l'ancien mockup combiné
            if (combinedMockupPreview) {
              revokeMockupPreviewUrl(combinedMockupPreview)
            }

            const mockupUrl = createMockupPreviewUrl(mockupBlob)
            setCombinedMockupPreview(mockupUrl)
            console.log('✅ Mockup combiné régénéré avec la nouvelle vidéo')
          } catch (error) {
            console.error('❌ Erreur régénération mockup combiné:', error)
            setCombinedMockupError('Impossible de générer l\'aperçu. Le mockup sera affiché normalement.')
          } finally {
            setCombinedMockupLoading(false)
          }
        }
      }

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

      // Auto-collapse video section after adding video
      setVideoSectionCollapsed(true)
    }
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  // Calculer les positions de la zone téléphone (screen interior) en pourcentages (mockup modulaire: fond bois 1500×1500)
  const getPhoneZoneStyle = () => {
    // Déterminer les coordonnées selon l'orientation de la vidéo
    let PHONE_ZONE_PX = { x: 113, y: 232, width: 477, height: 1037 } // Default: portrait
    let borderRadiusPercent = 0.04 // 4% pour portrait

    if (videoOrientation === 'landscape') {
      // Pour landscape: utiliser les coordonnées landscape
      PHONE_ZONE_PX = { x: 231, y: 113, width: 1037, height: 477 }
      borderRadiusPercent = 0.015 // 1.5% pour landscape (zone plus large)
    }

    // Calculer le borderRadius en fonction de la largeur de la zone
    const borderRadiusPx = Math.round(PHONE_ZONE_PX.width * borderRadiusPercent)

    if (!mockupDimensions) {
      // Valeurs par défaut si dimensions pas encore chargées (pourcentages)
      const left = (PHONE_ZONE_PX.x / 1500) * 100
      const top = (PHONE_ZONE_PX.y / 1500) * 100
      const width = (PHONE_ZONE_PX.width / 1500) * 100
      const height = (PHONE_ZONE_PX.height / 1500) * 100
      return {
        left: `${left}%`,
        top: `${top}%`,
        width: `${width}%`,
        height: `${height}%`,
        borderRadius: `clamp(15px, ${borderRadiusPx * 0.1}vw, ${borderRadiusPx}px)`,
        transform: 'translateZ(0)',
        isolation: 'isolate',
        backfaceVisibility: 'hidden'
      }
    }

    // Convertir en pourcentages basés sur les dimensions réelles
    const left = (PHONE_ZONE_PX.x / mockupDimensions.width) * 100
    const top = (PHONE_ZONE_PX.y / mockupDimensions.height) * 100
    const width = (PHONE_ZONE_PX.width / mockupDimensions.width) * 100
    const height = (PHONE_ZONE_PX.height / mockupDimensions.height) * 100

    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`,
      borderRadius: `clamp(15px, ${borderRadiusPx * 0.1}vw, ${borderRadiusPx}px)`,
      transform: 'translateZ(0)',
      isolation: 'isolate',
      backfaceVisibility: 'hidden'
    }
  }

  // Note: La fonction getPhoneMockupFrameStyle() a été supprimée car nous utilisons maintenant
  // des mockups complets (phone + card + fond bois) sans rotation

  // Calculer les positions de la zone carte photo en pourcentages (pour mockup combiné)
  const getCardZoneStyle = () => {
    // Déterminer les coordonnées selon l'orientation
    let CARD_ZONE_PX = { x: 677, y: 188, width: 750, height: 1124 } // Default: portrait + portrait

    if (videoOrientation && photoOrientation) {
      if (videoOrientation === 'portrait' && photoOrientation === 'portrait') {
        // 1️⃣ PHONE-PORTRAIT + CARD-PORTRAIT
        CARD_ZONE_PX = { x: 677, y: 188, width: 750, height: 1124 }
      } else if (videoOrientation === 'portrait' && photoOrientation === 'landscape') {
        // 2️⃣ PHONE-PORTRAIT + CARD-LANDSCAPE (carte à droite)
        CARD_ZONE_PX = { x: 533, y: 441, width: 928, height: 618 }
      } else if (videoOrientation === 'landscape' && photoOrientation === 'portrait') {
        // 3️⃣ PHONE-LANDSCAPE + CARD-PORTRAIT (carte en bas)
        CARD_ZONE_PX = { x: 451, y: 544, width: 598, height: 897 }
      } else {
        // 4️⃣ PHONE-LANDSCAPE + CARD-LANDSCAPE (carte en bas)
        CARD_ZONE_PX = { x: 188, y: 677, width: 1124, height: 750 }
      }
    }

    // Convertir en pourcentages (les mockups font tous 1500x1500px)
    const left = (CARD_ZONE_PX.x / 1500) * 100
    const top = (CARD_ZONE_PX.y / 1500) * 100
    const width = (CARD_ZONE_PX.width / 1500) * 100
    const height = (CARD_ZONE_PX.height / 1500) * 100

    // Border radius pour la carte photo (4% de la largeur comme le canvas)
    const borderRadius = 'clamp(12px, 1.5vw, 16px)'

    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`,
      borderRadius,
      transform: 'translateZ(0)',
      isolation: 'isolate',
      backfaceVisibility: 'hidden'
    }
  }

  // Calculer le style pour la zone téléphone dans le mockup combiné
  const getCombinedPhoneZoneStyle = () => {
    // Déterminer les coordonnées selon l'orientation (DOIT correspondre à mockup-generator.ts)
    let PHONE_ZONE_PX = { x: 113, y: 232, width: 477, height: 1037 } // Default: portrait + portrait

    if (videoOrientation && photoOrientation) {
      if (videoOrientation === 'portrait' && photoOrientation === 'portrait') {
        // 1️⃣ PHONE-PORTRAIT + CARD-PORTRAIT
        PHONE_ZONE_PX = { x: 113, y: 232, width: 477, height: 1037 }
      } else if (videoOrientation === 'portrait' && photoOrientation === 'landscape') {
        // 2️⃣ PHONE-PORTRAIT + CARD-LANDSCAPE
        PHONE_ZONE_PX = { x: 72, y: 323, width: 394, height: 855 }
      } else if (videoOrientation === 'landscape' && photoOrientation === 'portrait') {
        // 3️⃣ PHONE-LANDSCAPE + CARD-PORTRAIT
        PHONE_ZONE_PX = { x: 336, y: 90, width: 827, height: 381 }
      } else {
        // 4️⃣ PHONE-LANDSCAPE + CARD-LANDSCAPE
        PHONE_ZONE_PX = { x: 231, y: 113, width: 1037, height: 477 }
      }
    }

    // Convertir en pourcentages (les mockups font tous 1500x1500px)
    const left = (PHONE_ZONE_PX.x / 1500) * 100
    const top = (PHONE_ZONE_PX.y / 1500) * 100
    const width = (PHONE_ZONE_PX.width / 1500) * 100
    const height = (PHONE_ZONE_PX.height / 1500) * 100

    // Calculer le border-radius adaptatif basé sur la largeur de la zone
    const borderRadiusPercent = videoOrientation === 'portrait' ? 0.04 : 0.015
    const borderRadiusPx = Math.round(PHONE_ZONE_PX.width * borderRadiusPercent)

    return {
      left: `${left}%`,
      top: `${top}%`,
      width: `${width}%`,
      height: `${height}%`,
      borderRadius: `clamp(15px, ${borderRadiusPx * 0.1}vw, ${borderRadiusPx}px)`,
      transform: 'translateZ(0)',
      isolation: 'isolate',
      backfaceVisibility: 'hidden'
    }
  }

  const handleCropComplete = async (croppedFileData: File, meta: any) => {
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

    // Detect photo orientation
    const photoOrientation = meta.orientation === 'portrait' ? 'portrait' : 'landscape'
    setPhotoOrientation(photoOrientation)
    console.log(`🖼️ Photo détectée: ${photoOrientation}`)

    // Générer le mockup combiné (vidéo + photo)
    if (videoFile && videoOrientation) {
      setCombinedMockupLoading(true)
      setCombinedMockupError(null)
      try {
        console.log('🎨 Génération du mockup combiné...')
        const mockupBlob = await generatePhotoAndVideoMockup(
          videoFile,
          croppedFileData,
          videoOrientation,
          photoOrientation
        )

        // Nettoyer l'ancien mockup
        if (combinedMockupPreview) {
          revokeMockupPreviewUrl(combinedMockupPreview)
        }

        const mockupUrl = createMockupPreviewUrl(mockupBlob)
        setCombinedMockupPreview(mockupUrl)
        console.log('✅ Mockup combiné généré et affiché')

        // Auto-collapse la section photo après génération
        setPhotoSectionCollapsed(true)

        // Scroll vers le mockup après un court délai pour l'animation
        setTimeout(() => {
          mockupRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 300)
      } catch (error) {
        console.error('❌ Erreur génération mockup combiné:', error)
        setCombinedMockupError('Impossible de générer l\'aperçu. Le mockup sera affiché normalement.')
      } finally {
        setCombinedMockupLoading(false)
      }
    }

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
      quantity: 1,
      isGift: false
    }

    onComplete(photo)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-3 sm:space-y-6">
      {/* Étape 1: Zone d'upload vidéo */}
      {currentStep === 1 && (
        <>
        {/* Mockup en haut (vide ou avec vidéo) */}
        {!videoPreview ? (
          <div className={`bg-white rounded-xl shadow-lg ${tutoSectionCollapsed ? 'p-3' : 'p-6'}`}>
            {/* Toggle Header avec bouton X */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setTutoSectionCollapsed(!tutoSectionCollapsed)}
                className={`flex-1 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${tutoSectionCollapsed ? '-m-3 p-3' : '-m-6 p-6'} rounded-tl-xl transition-colors`}
              >
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Film className="w-5 h-5 text-orange-500" />
                  TUTO
                </h3>
                {tutoSectionCollapsed && (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </button>

              {/* Bouton X - visible seulement quand ouvert */}
              {!tutoSectionCollapsed && (
                <button
                  onClick={() => setTutoSectionCollapsed(true)}
                  className="p-3 hover:bg-gray-100 rounded-tr-xl transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              )}
            </div>

            {/* Contenu collapsible */}
            {!tutoSectionCollapsed && (
              <div className="mt-4">
                <div className="relative w-full max-w-lg mx-auto">
                  {/* Vidéo */}
                  <video
                    ref={tutoVideoRef}
                    src="/frontend-pictures/commander/video-animation.mp4"
                    className="w-full h-auto rounded-xl"
                    autoPlay
                    muted
                    playsInline
                    onTimeUpdate={handleTutoVideoTimeUpdate}
                    onEnded={handleTutoVideoEnded}
                  />

                  {/* Barre de progression */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/30 rounded-b-xl overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-200"
                      style={{ width: `${tutoVideoProgress}%` }}
                    />
                  </div>

                  {/* Bouton replay (affiché quand la vidéo est terminée) */}
                  {tutoVideoEnded && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
                      <button
                        onClick={handleTutoVideoReplay}
                        className="bg-white/95 hover:bg-white rounded-full p-4 hover:scale-110 transition-all shadow-xl group"
                        aria-label="Rejouer la vidéo"
                      >
                        <RotateCw className="w-8 h-8 text-orange-600 group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="relative w-full max-w-2xl mx-auto">
              {/* Mockup image de fond */}
              <img
                src={
                  videoOrientation === 'portrait'
                    ? '/frontend-pictures/commander/phone-portrait-card-portrait.png'
                    : '/frontend-pictures/commander/phone-landscape-card-landscape.png'
                }
                alt="Mockup téléphone"
                className="w-full h-auto"
                onLoad={(e) => {
                  const img = e.currentTarget
                  setMockupDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                  })
                }}
              />

              {/* Conteneur avec overflow-hidden pour arrondir les bords */}
              <div
                className="absolute overflow-hidden"
                style={getPhoneZoneStyle()}
              >
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  controls={isVideoPlaying}
                  onEnded={() => setIsVideoPlaying(false)}
                  onPause={() => setIsVideoPlaying(false)}
                />
              </div>

              {/* Bouton play centré sur la zone téléphone (caché quand vidéo en lecture) */}
              {!isVideoPlaying && (
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="absolute flex items-center justify-center"
                  style={getPhoneZoneStyle()}
                >
                  <div className="bg-white/90 rounded-full p-6 hover:scale-110 transition-transform shadow-xl">
                    <Play className="w-12 h-12 text-orange-600" fill="currentColor" />
                  </div>
                </button>
              )}
            </div>
            <p className="text-xs text-center text-gray-500">
              {isVideoPlaying ? 'Vidéo en lecture' : 'Cliquez pour lire la vidéo'}
            </p>
          </div>
        )}

        {/* Bloc vidéo */}
        <div className={`bg-white rounded-xl shadow-lg ${videoSectionCollapsed ? 'p-3' : 'p-6'}`}>
          <button
            onClick={() => setVideoSectionCollapsed(!videoSectionCollapsed)}
            className={`w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 ${videoSectionCollapsed ? '-m-3 p-3' : '-m-6 p-6'} rounded-t-xl transition-colors`}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Video className="w-5 h-5 text-orange-500" />
              {!videoPreview ? 'Ajouter votre vidéo' : 'Vidéo ajoutée'} <span className="text-red-500">*</span>
              {videoPreview && <Check className="w-5 h-5 text-green-500 ml-1" />}
            </h3>
            {videoSectionCollapsed ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {!videoSectionCollapsed && (
            <>
              {!videoPreview ? (
                <div className="space-y-3 mt-4">
                  {/* Section Upload vidéo avec icône et drag & drop */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transform transition-all hover:scale-105 hover:shadow-lg ${
                      dragActive ? 'border-orange-500 bg-orange-50 scale-105' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => videoInputRef.current?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setDragActive(false)
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        const file = e.dataTransfer.files[0]
                        if (file.type.startsWith('video/')) {
                          handleVideoChange({ target: { files: [file] } } as any)
                        }
                      }
                    }}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">Ajoutez votre vidéo</p>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={handleVideoChange}
                    />
                  </div>

                  {/* Séparateur OU */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500 font-medium">OU</span>
                    </div>
                  </div>

                  {/* Section Montage automatique avec nouvelle présentation */}
                  <button
                    onClick={() => setShowMontageWizard(true)}
                    className="w-full bg-orange-500 border border-orange-500 rounded-lg p-4 hover:bg-orange-600 transform transition-all hover:scale-105 hover:shadow-md cursor-pointer flex items-center gap-4"
                  >
                    <img
                      src="/frontend-pictures/commander/montage-video-icone.png"
                      alt="Montage vidéo"
                      className="w-16 h-16 flex-shrink-0"
                    />
                    <div className="text-left flex-1">
                      <p className="text-lg font-semibold text-white">
                        Faire un montage de plusieurs photos et/ou vidéos
                      </p>
                      <p className="text-sm text-white mt-1">
                        Utilisez notre outil gratuit et immédiat
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 mt-4">
                  <Button
                    onClick={() => {
                      // Nettoyer les previews vidéo
                      if (videoPreview) {
                        URL.revokeObjectURL(videoPreview)
                      }
                      if (videoMockupPreview) {
                        revokeMockupPreviewUrl(videoMockupPreview)
                      }

                      // Nettoyer le mockup combiné si existant
                      if (combinedMockupPreview) {
                        revokeMockupPreviewUrl(combinedMockupPreview)
                      }

                      // Réinitialiser tous les états vidéo
                      setVideoFile(null)
                      setVideoPreview('')
                      setVideoMockupPreview(null)
                      setVideoMockupError(null)
                      setIsVideoPlaying(false)
                      setMockupDimensions(null)
                      setVideoOrientation(null)

                      // Réinitialiser le mockup combiné
                      setCombinedMockupPreview(null)
                      setCombinedMockupError(null)
                      setIsCombinedVideoPlaying(false)

                      // Ouvrir la section vidéo pour permettre un nouveau choix
                      setVideoSectionCollapsed(false)
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Changer la vidéo
                  </Button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={handleVideoChange}
                  />
                </div>
              )}
            </>
          )}
        </div>

      {/* Bouton Suivant à droite, en dehors du bloc */}
      <div className="flex justify-end">
        <Button
          onClick={() => setCurrentStep(2)}
          disabled={!videoFile}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {!videoFile ? 'Veuillez ajouter une vidéo' : 'Suivant'}
        </Button>
      </div>
      </>
    )}

    {/* Étape 2: Zone d'upload photo */}
    {currentStep === 2 && (
      <>
        {/* Mockup en haut (vidéo seule ou vidéo + photo) */}
        <div ref={mockupRef} className="space-y-2">
          {combinedMockupLoading ? (
            // Loading spinner pendant génération du mockup
            <div className="relative w-full max-w-2xl mx-auto aspect-square bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Génération du mockup en cours...</p>
              </div>
            </div>
          ) : combinedMockupPreview ? (
            // Mockup combiné généré (vidéo + photo) avec transition - AVEC VIDÉO PLAYABLE
            <div className="relative w-full max-w-2xl mx-auto transition-opacity duration-500 ease-in-out">
              {/* Mockup image de fond */}
              <img
                src={
                  videoOrientation === 'portrait' && photoOrientation === 'portrait'
                    ? '/frontend-pictures/commander/phone-portrait-card-portrait.png'
                    : videoOrientation === 'portrait' && photoOrientation === 'landscape'
                    ? '/frontend-pictures/commander/phone-portrait-card-landscape.png'
                    : videoOrientation === 'landscape' && photoOrientation === 'portrait'
                    ? '/frontend-pictures/commander/phone-landscape-card-portrait.png'
                    : '/frontend-pictures/commander/phone-landscape-card-landscape.png'
                }
                alt="Mockup téléphone et carte"
                className="w-full h-auto"
                ref={mockupImgRef}
                onLoad={(e) => {
                  const img = e.currentTarget
                  setMockupDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                  })
                }}
              />

              {/* Zone vidéo (téléphone) avec overflow-hidden */}
              <div
                className="absolute overflow-hidden"
                style={getCombinedPhoneZoneStyle()}
              >
                <video
                  ref={combinedVideoRef}
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  controls={isCombinedVideoPlaying}
                  onEnded={() => setIsCombinedVideoPlaying(false)}
                  onPause={() => setIsCombinedVideoPlaying(false)}
                />
              </div>

              {/* Zone photo (carte) avec overflow-hidden */}
              <div
                className="absolute overflow-hidden"
                style={getCardZoneStyle()}
              >
                <img
                  src={croppedPreview}
                  alt="Photo recadrée"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Bouton play centré sur la zone téléphone (caché quand vidéo en lecture) */}
              {!isCombinedVideoPlaying && (
                <button
                  onClick={() => setIsCombinedVideoPlaying(true)}
                  className="absolute flex items-center justify-center"
                  style={getCombinedPhoneZoneStyle()}
                >
                  <div className="bg-white/90 rounded-full p-6 hover:scale-110 transition-transform shadow-xl">
                    <Play className="w-12 h-12 text-orange-600" fill="currentColor" />
                  </div>
                </button>
              )}
            </div>
          ) : (
            // Mockup vidéo seule (avant upload photo)
            <div className="relative w-full max-w-2xl mx-auto transition-opacity duration-500 ease-in-out">
              {/* Mockup image de fond */}
              <img
                src={
                  videoOrientation === 'portrait'
                    ? '/frontend-pictures/commander/phone-portrait-card-portrait.png'
                    : '/frontend-pictures/commander/phone-landscape-card-landscape.png'
                }
                alt="Mockup téléphone"
                className="w-full h-auto"
                ref={mockupImgRef}
                onLoad={(e) => {
                  const img = e.currentTarget
                  setMockupDimensions({
                    width: img.naturalWidth,
                    height: img.naturalHeight
                  })
                }}
              />

              {/* Conteneur avec overflow-hidden pour arrondir les bords */}
              <div
                className="absolute overflow-hidden"
                style={getPhoneZoneStyle()}
              >
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  controls={isVideoPlaying}
                  onEnded={() => setIsVideoPlaying(false)}
                  onPause={() => setIsVideoPlaying(false)}
                />
              </div>

              {/* Bouton play centré sur la zone téléphone (caché quand vidéo en lecture) */}
              {!isVideoPlaying && (
                <button
                  onClick={() => setIsVideoPlaying(true)}
                  className="absolute flex items-center justify-center"
                  style={getPhoneZoneStyle()}
                >
                  <div className="bg-white/90 rounded-full p-6 hover:scale-110 transition-transform shadow-xl">
                    <Play className="w-12 h-12 text-orange-600" fill="currentColor" />
                  </div>
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-center text-gray-500">
            {combinedMockupLoading
              ? 'Préparation de votre mockup...'
              : combinedMockupPreview
              ? 'Aperçu de votre création magique'
              : isVideoPlaying
              ? 'Vidéo en lecture'
              : 'Cliquez pour lire la vidéo'}
          </p>
          {combinedMockupError && (
            <p className="text-xs text-center text-orange-600">{combinedMockupError}</p>
          )}
        </div>

        {/* Bloc vidéo (collapsed par défaut à l'étape 2) */}
        <div className={`bg-white rounded-xl shadow-lg ${videoSectionCollapsed ? 'p-3' : 'p-6'}`}>
          <button
            onClick={() => setVideoSectionCollapsed(!videoSectionCollapsed)}
            className={`w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 ${videoSectionCollapsed ? '-m-3 p-3' : '-m-6 p-6'} rounded-t-xl transition-colors`}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Video className="w-5 h-5 text-orange-500" />
              Vidéo ajoutée <span className="text-red-500">*</span>
              {videoPreview && <Check className="w-5 h-5 text-green-500 ml-1" />}
            </h3>
            {videoSectionCollapsed ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {!videoSectionCollapsed && (
            <div className="space-y-4 mt-4">
              <Button
                onClick={() => {
                  // Nettoyer les previews
                  if (videoPreview) {
                    URL.revokeObjectURL(videoPreview)
                  }
                  if (videoMockupPreview) {
                    revokeMockupPreviewUrl(videoMockupPreview)
                  }
                  // Réinitialiser tous les états
                  setVideoFile(null)
                  setVideoPreview('')
                  setVideoMockupPreview(null)
                  setVideoMockupError(null)
                  setIsVideoPlaying(false)
                  setMockupDimensions(null)
                  // Revenir à l'étape 1
                  setCurrentStep(1)
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Changer la vidéo
              </Button>
            </div>
          )}
        </div>

        {/* Bloc photo */}
        <div className={`bg-white rounded-xl shadow-lg ${photoSectionCollapsed ? 'p-3' : 'p-6'}`}>
          <button
            onClick={() => setPhotoSectionCollapsed(!photoSectionCollapsed)}
            className={`w-full flex items-center justify-between cursor-pointer hover:bg-gray-50 ${photoSectionCollapsed ? '-m-3 p-3' : '-m-6 p-6'} rounded-t-xl transition-colors`}
          >
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-orange-500" />
              {!croppedPreview ? 'Votre photo' : 'Photo ajoutée'} <span className="text-red-500">*</span>
              {croppedPreview && <Check className="w-5 h-5 text-green-500 ml-1" />}
            </h3>
            {photoSectionCollapsed ? (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            )}
          </button>

          {!photoSectionCollapsed && (
            <>
              {!croppedPreview ? (
                <div className="space-y-4">
                  {/* Option 1: Extraction depuis vidéo */}
                  {videoFile && (
                    <>
                      <button
                        onClick={() => setShowFrameExtractor(true)}
                        className="w-full bg-orange-500 border border-orange-500 rounded-lg p-4 hover:bg-orange-600 transform transition-all hover:scale-105 hover:shadow-md cursor-pointer flex items-center gap-4"
                      >
                        <img
                          src="/frontend-pictures/commander/capture-ecran-icone.png"
                          alt="Extraire une image"
                          className="w-16 h-16 flex-shrink-0"
                        />
                        <div className="text-left flex-1">
                          <p className="text-white font-semibold text-lg">
                            Extraire une image de votre vidéo
                          </p>
                        </div>
                      </button>

                      {/* Séparateur "OU" */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-2 bg-white text-gray-500 font-medium">OU</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Option 2: Upload direct */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transform transition-all hover:scale-105 hover:shadow-lg ${
                      dragActive ? 'border-orange-500 bg-orange-50 scale-105' : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-2">Ajoutez votre photo</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Boutons de contrôle pour la photo */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        // Nettoyer les previews
                        if (croppedPreview) {
                          URL.revokeObjectURL(croppedPreview)
                        }
                        if (originalImageSrc) {
                          URL.revokeObjectURL(originalImageSrc)
                        }
                        if (combinedMockupPreview) {
                          revokeMockupPreviewUrl(combinedMockupPreview)
                        }

                        // Réinitialiser tous les états de la photo
                        setOriginalFile(null)
                        setCroppedFile(null)
                        setCroppedPreview('')
                        setOriginalImageSrc('')
                        setCropConfig(null)
                        setPhotoOrientation(null)
                        setCombinedMockupPreview(null)
                        setCombinedMockupError(null)
                        setIsCombinedVideoPlaying(false)

                        // Garder le toggle ouvert
                        setPhotoSectionCollapsed(false)
                      }}
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
                    {isCombinedVideoPlaying && (
                      <Button
                        onClick={() => {
                          if (combinedVideoRef.current) {
                            combinedVideoRef.current.pause()
                            combinedVideoRef.current.currentTime = 0
                            setIsCombinedVideoPlaying(false)
                          }
                        }}
                        variant="outline"
                        size="icon"
                        title="Arrêter la vidéo"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
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
            </>
          )}
        </div>

        {/* Bloc message personnalisé - N'apparaît que si vidéo ET photo sont présentes */}
        {croppedFile && videoFile && (
          <div className={`bg-white rounded-xl shadow-lg ${messageSectionCollapsed ? 'p-3' : 'p-6'}`}>
            {/* Toggle pour expand/collapse du bloc message */}
            <button
              onClick={() => setMessageSectionCollapsed(!messageSectionCollapsed)}
              className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
            >
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                Message personnalisé (facultatif)
              </h3>
              {messageSectionCollapsed ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {/* Contenu du message (visible seulement si non collapsed) */}
            {!messageSectionCollapsed && (
              <div className="mt-6 space-y-6">
                {/* Toggle Non/Oui pour activer le message */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Ajouter un message sur la carte photo ?
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMessage(false)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        !showMessage
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Non
                    </button>
                    <button
                      onClick={() => setShowMessage(true)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        showMessage
                          ? 'bg-orange-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Oui
                    </button>
                  </div>
                </div>

                {/* Zone de saisie du message (visible seulement si showMessage = true) */}
                {showMessage && (
                  <div className="mt-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Mockup de l'étiquette Revila avec zone de texte */}
                    <div
                      className="relative w-full max-w-md mx-auto"
                      style={{
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    >
                      {/* Image de fond de l'étiquette */}
                      <img
                        src="/frontend-pictures/commander/JE suis une Revila-rounded.png"
                        alt="Étiquette Revila"
                        className="w-full h-auto rounded-2xl shadow-2xl"
                        style={{
                          aspectRatio: '1201 / 1792',
                          display: 'block'
                        }}
                      />

                      {/* Zone de texte superposée avec textarea */}
                      <textarea
                        value={message}
                        onChange={(e) => {
                          // Protection contre les injections XSS
                          const sanitizedValue = e.target.value
                            .replace(/<[^>]*>/g, '') // Retire tous les tags HTML
                            .replace(/[<>]/g, '') // Retire les chevrons restants
                            .replace(/javascript:/gi, '') // Retire les protocoles javascript:
                            .replace(/on\w+=/gi, '') // Retire les attributs d'événements (onclick, onerror, etc.)
                            .substring(0, 500) // Limite stricte de caractères
                          setMessage(sanitizedValue)
                        }}
                        placeholder="Écrivez votre message ici..."
                        className="absolute bg-transparent border-none outline-none resize-none"
                        style={{
                          left: `${(118 / 1181) * 100}%`,
                          top: `${(118 / 1772) * 100}%`,
                          width: `${(945 / 1181) * 100}%`,
                          height: `${(1229 / 1772) * 100}%`,
                          fontFamily: 'Garet, sans-serif',
                          fontSize: '20px',
                          lineHeight: '1.5',
                          textAlign: 'center',
                          padding: '35% 10px 10px 10px',
                          color: 'black',
                        }}
                        maxLength={500}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Bouton navigation étape 2 - En dehors du toggle photo */}
        <div className="mt-6">
          <Button
            onClick={handleValidate}
            disabled={!croppedFile || !videoFile}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {!croppedFile ? 'Veuillez ajouter une photo' : 'Valider et continuer'}
          </Button>
        </div>
      </>
    )}

    {/* Modal de recadrage */}
    {showCropper && originalImageSrc && (
      <PhotoCropper
        imageSrc={originalImageSrc}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
        initialOrientation={photoOrientation || cropConfig?.orientation || 'portrait'}
        initialConfig={cropConfig}
        format={format}
      />
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

      {/* Modal d'extraction de frame vidéo */}
      {videoFile && videoPreview && (
        <VideoFrameExtractor
          videoFile={videoFile}
          videoPreview={videoPreview}
          isOpen={showFrameExtractor}
          onClose={() => setShowFrameExtractor(false)}
          onFrameSelected={handleFrameExtracted}
        />
      )}

      {/* Modal de création de montage vidéo */}
      <MontageWizard
        isOpen={showMontageWizard}
        onClose={() => setShowMontageWizard(false)}
        onMontageCreated={handleMontageCreated}
        initialVideoFile={videoFile || undefined}
      />

      {/* Overlay de progression du montage */}
      {montageCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Création de votre montage en cours...
            </h3>
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-orange-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${montageProgress}%` }}
                />
              </div>
              <p className="text-center text-gray-600 text-lg font-medium">
                {Math.round(montageProgress)}%
              </p>
              <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-center text-gray-700 text-sm leading-relaxed min-h-[3rem] flex items-center justify-center">
                  {anecdotes[currentAnecdote]}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}