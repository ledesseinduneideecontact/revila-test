'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { X, Upload, GripVertical, Image as ImageIcon, Video, Music, Trash2, Play, Pause, Volume2, Heart, Smile, Zap, Radio, Piano, Film, Coffee, Church } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { MUSIC_LIBRARY, getMusicsByCategory, MUSIC_CATEGORIES } from '@/lib/music-library'
import { generateUUID } from '@/lib/uuid'

interface MediaFile {
  id: string
  file: File
  type: 'photo' | 'video'
  preview: string
  duration?: number // Pour les photos, on définira une durée par défaut
  orientation?: 'portrait' | 'landscape' // Orientation détectée
}

interface MontageWizardProps {
  isOpen: boolean
  onClose: () => void
  onMontageCreated: (montageData: {
    mediaFiles: MediaFile[]
    musicTrackId: string | null
    customMusicFile: File | null
    format: 'portrait' | 'landscape' // Format du montage
  }) => void
  initialVideoFile?: File // Vidéo déjà uploadée (optionnelle)
}

// Composant pour un item de média sortable
function SortableMediaItem({
  media,
  onRemove,
  onDurationChange,
}: {
  media: MediaFile
  onRemove: (id: string) => void
  onDurationChange: (id: string, duration: number) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: media.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-orange-300 transition-colors"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Preview */}
      <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
        {media.type === 'photo' ? (
          <img
            src={media.preview}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={media.preview}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5">
          {media.type === 'photo' ? (
            <ImageIcon className="w-3 h-3 text-white" />
          ) : (
            <Video className="w-3 h-3 text-white" />
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {media.file.name}
        </p>
        <p className="text-xs text-gray-500">
          {(media.file.size / 1024 / 1024).toFixed(2)} MB
        </p>

        {/* Duration input pour les photos */}
        {media.type === 'photo' && (
          <div className="flex items-center gap-2 mt-1">
            <label className="text-xs text-gray-600">Durée:</label>
            <input
              type="number"
              min="1"
              max="10"
              step="0.5"
              defaultValue={media.duration || 2}
              onChange={(e) => onDurationChange(media.id, parseFloat(e.target.value))}
              className="w-16 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <span className="text-xs text-gray-500">sec</span>
          </div>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onRemove(media.id)}
        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title="Supprimer"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  )
}

export default function MontageWizard({
  isOpen,
  onClose,
  onMontageCreated,
  initialVideoFile,
}: MontageWizardProps) {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>(() => {
    // Ajouter la vidéo initiale si fournie
    if (initialVideoFile) {
      return [{
        id: generateUUID(),
        file: initialVideoFile,
        type: 'video',
        preview: URL.createObjectURL(initialVideoFile),
        duration: undefined, // Sera déterminé par la vidéo elle-même
        orientation: undefined, // Sera détecté
      }]
    }
    return []
  })
  const [selectedMusicId, setSelectedMusicId] = useState<string | null>(null)
  const [customMusicFile, setCustomMusicFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [hasMixedOrientations, setHasMixedOrientations] = useState(false)
  const [userChosenFormat, setUserChosenFormat] = useState<'portrait' | 'landscape' | null>(null)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Détecter l'orientation de la vidéo initiale si fournie
  useEffect(() => {
    if (initialVideoFile && mediaFiles.length > 0 && !mediaFiles[0].orientation) {
      const video = document.createElement('video')
      video.src = mediaFiles[0].preview
      video.onloadedmetadata = () => {
        const orientation = video.videoHeight > video.videoWidth ? 'portrait' : 'landscape'
        console.log(`📱 Vidéo initiale détectée: ${orientation} (${video.videoWidth}×${video.videoHeight})`)

        setMediaFiles(prev => {
          const updated = [...prev]
          updated[0] = { ...updated[0], orientation }
          return updated
        })

        // Auto-définir le format si pas mixte
        setUserChosenFormat(orientation)
      }
    }
  }, [initialVideoFile])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setMediaFiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const newMediaFiles: MediaFile[] = []

    // Détecter l'orientation de chaque fichier
    for (const file of Array.from(files)) {
      const fileType = file.type.startsWith('image/') ? 'photo' : 'video'
      const preview = URL.createObjectURL(file)

      // Détecter l'orientation
      let orientation: 'portrait' | 'landscape' | undefined

      if (fileType === 'photo') {
        // Détecter orientation pour image
        const img = new Image()
        img.src = preview
        await new Promise<void>((resolve) => {
          img.onload = () => {
            orientation = img.height > img.width ? 'portrait' : 'landscape'
            console.log(`🖼️  Image détectée: ${orientation} (${img.width}×${img.height})`)
            resolve()
          }
          img.onerror = () => {
            console.warn('⚠️  Impossible de détecter orientation de l\'image')
            resolve()
          }
        })
      } else {
        // Détecter orientation pour vidéo
        const video = document.createElement('video')
        video.src = preview
        await new Promise<void>((resolve) => {
          video.onloadedmetadata = () => {
            orientation = video.videoHeight > video.videoWidth ? 'portrait' : 'landscape'
            console.log(`📱 Vidéo détectée: ${orientation} (${video.videoWidth}×${video.videoHeight})`)
            resolve()
          }
          video.onerror = () => {
            console.warn('⚠️  Impossible de détecter orientation de la vidéo')
            resolve()
          }
        })
      }

      newMediaFiles.push({
        id: generateUUID(),
        file,
        type: fileType,
        preview,
        duration: fileType === 'photo' ? 2 : undefined,
        orientation,
      })
    }

    setMediaFiles((prev) => {
      const updatedFiles = [...prev, ...newMediaFiles]

      // Vérifier si on a des orientations mixtes
      const orientations = updatedFiles
        .map(f => f.orientation)
        .filter((o): o is 'portrait' | 'landscape' => o !== undefined)

      const hasPortrait = orientations.includes('portrait')
      const hasLandscape = orientations.includes('landscape')
      const mixed = hasPortrait && hasLandscape

      setHasMixedOrientations(mixed)

      // Si pas mixte, définir automatiquement le format
      if (!mixed && orientations.length > 0) {
        setUserChosenFormat(orientations[0])
      } else if (mixed) {
        // Reset le choix utilisateur pour forcer la sélection
        setUserChosenFormat(null)
      }

      return updatedFiles
    })

    // Reset input
    e.target.value = ''
  }, [])

  const handleRemoveMedia = (id: string) => {
    setMediaFiles((prev) => {
      const media = prev.find((m) => m.id === id)
      if (media) {
        URL.revokeObjectURL(media.preview)
      }
      return prev.filter((m) => m.id !== id)
    })
  }

  const handleDurationChange = (id: string, duration: number) => {
    setMediaFiles((prev) =>
      prev.map((m) => (m.id === id ? { ...m, duration } : m))
    )
  }

  const handleCustomMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Valider que c'est bien un fichier audio
      if (!file.type.startsWith('audio/')) {
        alert('Veuillez sélectionner un fichier audio valide (MP3, WAV, etc.)')
        e.target.value = ''
        return
      }

      setCustomMusicFile(file)
      setSelectedMusicId('custom')
    }
    e.target.value = ''
  }

  const handleRemoveCustomMusic = () => {
    setCustomMusicFile(null)
    setSelectedMusicId(null)
  }

  // Icônes par catégorie
  const getCategoryIcon = (category: string) => {
    const iconClass = "w-4 h-4"
    switch (category) {
      case 'Romantique': return <Heart className={iconClass} />
      case 'Joyeuse': return <Smile className={iconClass} />
      case 'Énergique': return <Zap className={iconClass} />
      case 'Électro': return <Radio className={iconClass} />
      case 'Classique': return <Piano className={iconClass} />
      case 'Cinématique': return <Film className={iconClass} />
      case 'Lounge': return <Coffee className={iconClass} />
      case 'Gospel': return <Church className={iconClass} />
      default: return <Music className={iconClass} />
    }
  }

  const handlePlayPause = useCallback((trackId: string, filename: string) => {
    if (playingTrackId === trackId) {
      // Pause si on joue déjà cette piste
      audioRef.current?.pause()
      setPlayingTrackId(null)
    } else {
      // Jouer cette piste
      const musicPath = `/music/${filename}`
      if (audioRef.current) {
        audioRef.current.src = musicPath
        audioRef.current.play()
        setPlayingTrackId(trackId)
      }
    }
  }, [playingTrackId])

  // Gérer la fin de lecture audio
  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      const handleEnded = () => setPlayingTrackId(null)
      audio.addEventListener('ended', handleEnded)
      return () => audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const handleCreateMontage = () => {
    if (mediaFiles.length === 0) {
      alert('Veuillez ajouter au moins un média')
      return
    }

    // Vérifier qu'un format est choisi si orientations mixtes
    if (hasMixedOrientations && !userChosenFormat) {
      alert('Veuillez choisir un format pour le montage (portrait ou paysage)')
      return
    }

    // Déterminer le format final
    const finalFormat = userChosenFormat || 'landscape' // Défaut: landscape

    console.log(`🎬 Création du montage avec format: ${finalFormat}`)
    console.log(`🎵 Musique: ${selectedMusicId}${customMusicFile ? ` (fichier personnalisé: ${customMusicFile.name})` : ''}`)

    onMontageCreated({
      mediaFiles,
      musicTrackId: selectedMusicId === 'custom' ? null : selectedMusicId,
      customMusicFile: selectedMusicId === 'custom' ? customMusicFile : null,
      format: finalFormat,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Play className="w-6 h-6 text-orange-500" />
            <h2 className="text-xl font-semibold text-gray-900">
              Créer un montage vidéo
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Upload Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              1. Ajoutez vos photos et vidéos
            </h3>
            <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-colors">
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-600 font-medium mb-1">
                Cliquez pour ajouter des photos ou vidéos
              </p>
              <p className="text-sm text-gray-500">
                Formats acceptés: JPG, PNG, MP4, MOV
              </p>
            </label>
          </div>

          {/* Media List */}
          {mediaFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                2. Organisez l'ordre de vos médias
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Glissez-déposez pour réorganiser. Les photos apparaîtront durant la durée indiquée.
              </p>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={mediaFiles.map((m) => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {mediaFiles.map((media) => (
                      <SortableMediaItem
                        key={media.id}
                        media={media}
                        onRemove={handleRemoveMedia}
                        onDurationChange={handleDurationChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}

          {/* Music Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Music className="w-5 h-5 text-orange-500" />
              3. Choisissez une musique (optionnel)
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              <label className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                <input
                  type="radio"
                  name="music"
                  value="none"
                  checked={selectedMusicId === null}
                  onChange={() => {
                    setSelectedMusicId(null)
                    setCustomMusicFile(null)
                  }}
                  className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                />
                <span className="text-gray-900 font-medium">Aucune musique</span>
              </label>

              {/* Musiques prédéfinies par catégorie */}
              {Object.entries(getMusicsByCategory()).map(([category, tracks]) => (
                <div key={category} className="space-y-2">
                  <div className="px-2 py-1 bg-gray-100 rounded text-sm font-semibold text-gray-700 mt-3 flex items-center gap-2">
                    {getCategoryIcon(category)}
                    <span>{category}</span>
                  </div>
                  {tracks.map((track) => (
                    <div
                      key={track.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg transition-colors ${
                        playingTrackId === track.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="music"
                        value={track.id}
                        checked={selectedMusicId === track.id}
                        onChange={() => {
                          setSelectedMusicId(track.id)
                          setCustomMusicFile(null)
                        }}
                        className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 font-medium">{track.name}</div>
                        {track.description && (
                          <div className="text-xs text-gray-500 mt-0.5">{track.description}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          handlePlayPause(track.id, track.filename)
                        }}
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
                        title={playingTrackId === track.id ? 'Pause' : 'Écouter un extrait'}
                      >
                        {playingTrackId === track.id ? (
                          <Pause className="w-5 h-5 text-orange-500" />
                        ) : (
                          <Play className="w-5 h-5 text-gray-600" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ))}

              {/* Custom music upload */}
              <div className="border-2 border-gray-200 rounded-lg p-3 hover:border-orange-500 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="music"
                    value="custom"
                    checked={selectedMusicId === 'custom'}
                    readOnly
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleCustomMusicUpload}
                      className="hidden"
                      id="custom-music-upload"
                    />
                    <label
                      htmlFor="custom-music-upload"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-orange-500" />
                      <span className="text-gray-900">
                        {customMusicFile ? customMusicFile.name : 'Importer ma propre musique'}
                      </span>
                    </label>
                  </label>
                  {customMusicFile && (
                    <button
                      onClick={handleRemoveCustomMusic}
                      className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      title="Supprimer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {customMusicFile && (
                  <p className="text-xs text-gray-500 mt-2 ml-7">
                    {(customMusicFile.size / 1024 / 1024).toFixed(2)} MB • La musique sera automatiquement ajustée à la durée de votre vidéo
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Format Selection (only if mixed orientations) */}
          {hasMixedOrientations && (
            <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Video className="w-5 h-5 text-orange-500" />
                4. Choisissez le format du montage <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Vos fichiers ont des orientations différentes. Veuillez choisir le format final de votre montage vidéo.
              </p>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-4 border-2 border-white bg-white rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="portrait"
                    checked={userChosenFormat === 'portrait'}
                    onChange={() => setUserChosenFormat('portrait')}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">Portrait (1080×1920)</span>
                    <p className="text-xs text-gray-500">Idéal pour Instagram Stories, TikTok, Reels</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-4 border-2 border-white bg-white rounded-lg cursor-pointer hover:border-orange-500 transition-colors">
                  <input
                    type="radio"
                    name="format"
                    value="landscape"
                    checked={userChosenFormat === 'landscape'}
                    onChange={() => setUserChosenFormat('landscape')}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium">Paysage (1920×1080)</span>
                    <p className="text-xs text-gray-500">Idéal pour YouTube, Facebook, sites web</p>
                  </div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 space-y-4">
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 py-6 text-lg"
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateMontage}
              disabled={mediaFiles.length === 0 || isUploading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-6 text-lg"
            >
              {isUploading ? 'Création en cours...' : 'Créer le montage'}
            </Button>
          </div>

          <p className="text-xs text-gray-500 text-center">
            Votre montage sera créé automatiquement avec tous les médias dans l'ordre affiché
          </p>
        </div>
      </div>

      {/* Élément audio pour la prévisualisation */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
