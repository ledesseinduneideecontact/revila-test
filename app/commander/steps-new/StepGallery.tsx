'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Minus, Gift, User, Copy, Trash2, Info, Play, MessageSquare, X, Edit, Tag, TrendingUp, Sparkles, Crop, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ConfirmationModal from './ConfirmationModal'
import PhotoCropper from '@/components/PhotoCropper'
import type { PhotoItem } from '../CommanderWizardNew'
import { calculateOrderPricing, getPhotoPrice, CartItemPricing, PhotoFormat, DISCOUNT_TIERS } from '@/lib/pricing'

interface StepGalleryProps {
  photos: PhotoItem[]
  format: 'carre' | '10x15' | '20x30' | '30x45'
  cart?: Array<{ format: string; photos: PhotoItem[] }>
  editingFormatIndex?: number | null
  onUpdate: (photos: PhotoItem[]) => void
  onNext: () => void
  onAddPhoto: () => void
  onEditPhoto: (photoId: string) => void
}

interface EditModalProps {
  photo: PhotoItem | null
  isOpen: boolean
  onClose: () => void
  onSave: (updates: Partial<PhotoItem>) => void
}

interface PreviewModalProps {
  photo: PhotoItem | null
  isOpen: boolean
  onClose: () => void
  onEdit?: () => void
}

interface GiftModalProps {
  photo: PhotoItem
  isOpen: boolean
  onClose: () => void
  onSave: (giftInfo: Partial<PhotoItem>) => void
}

function GiftModal({ photo, isOpen, onClose, onSave }: GiftModalProps) {
  const [firstName, setFirstName] = useState(photo?.giftFirstName || '')
  const [lastName, setLastName] = useState(photo?.giftLastName || '')
  const [address, setAddress] = useState(photo?.giftAddress || '')
  const [postalCode, setPostalCode] = useState(photo?.giftPostalCode || '')
  const [city, setCity] = useState(photo?.giftCity || '')

  const handleSave = () => {
    onSave({
      isGift: true,
      giftFirstName: firstName,
      giftLastName: lastName,
      giftAddress: address,
      giftPostalCode: postalCode,
      giftCity: city
    })
    onClose()
  }

  if (!isOpen || !photo) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-xl font-semibold mb-4">Adresse de livraison du cadeau</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border rounded-lg"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code postal</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 border rounded-lg"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              onClick={handleSave}
              className="bg-orange-500 hover:bg-orange-600"
              disabled={!firstName || !lastName || !address || !postalCode || !city}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function EditModal({ photo, isOpen, onClose, onSave }: EditModalProps) {
  const [message, setMessage] = useState('')
  const [signature, setSignature] = useState('')
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState('')
  const [showCropper, setShowCropper] = useState(false)
  const [originalImageSrc, setOriginalImageSrc] = useState<string>('')
  const [cropConfig, setCropConfig] = useState<any>(null)
  const [originalPhotoFile, setOriginalPhotoFile] = useState<File | null>(null)

  useEffect(() => {
    if (photo) {
      setMessage(photo.message || '')
      setSignature(photo.signature || '')
      setPhotoPreview(photo.photoPreview || '')
      setVideoPreview(photo.videoPreview || '')
      setPhotoFile(photo.photoFile || null)
      setOriginalPhotoFile(photo.photoFile || null)
      setCropConfig((photo as any).cropConfig || null)
    }
  }, [photo])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setOriginalImageSrc(url)
      setShowCropper(true)
    }
    e.target.value = ''
  }

  const handleCropComplete = (croppedFileData: File, meta: any) => {
    setPhotoFile(croppedFileData)
    setCropConfig(meta) // Sauvegarder toute la configuration
    if (photoPreview && photoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(photoPreview)
    }
    const newPreview = URL.createObjectURL(croppedFileData)
    setPhotoPreview(newPreview)
    setShowCropper(false)
    
    if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(originalImageSrc)
      setOriginalImageSrc('')
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    if (originalImageSrc) {
      URL.revokeObjectURL(originalImageSrc)
      setOriginalImageSrc('')
    }
  }

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = () => {
    onSave({
      message,
      signature,
      photoFile: photoFile || photo?.photoFile,
      photoPreview: photoPreview || photo?.photoPreview,
      videoFile: videoFile || photo?.videoFile,
      videoPreview: videoPreview || photo?.videoPreview,
      cropConfig: cropConfig // Sauvegarder la configuration de recadrage
    } as any)
    onClose()
  }

  if (!isOpen || !photo) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">Modifier la photo</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Photo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Photo principale
            </label>
            {photoPreview ? (
              <div className="space-y-2">
                <div className="relative group">
                  <div 
                    className="w-full bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                    style={{ 
                      aspectRatio: photo?.format === 'carre' ? '1 / 1' : (cropConfig?.orientation === 'landscape' ? '1.5 / 1' : '1 / 1.5')
                    }}
                    onClick={() => photoInputRef.current?.click()}
                  >
                    <img
                      src={photoPreview}
                      alt="Aperçu"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {/* Overlay au survol pour recadrer */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation()
                      // Utiliser le fichier original pour recadrage
                      if (originalPhotoFile || photoFile || photo?.photoFile) {
                        const fileToUse = originalPhotoFile || photoFile || photo?.photoFile
                        const imageUrl = URL.createObjectURL(fileToUse!)
                        setOriginalImageSrc(imageUrl)
                        setShowCropper(true)
                      } else if (photoPreview) {
                        setOriginalImageSrc(photoPreview)
                        setShowCropper(true)
                      }
                    }}
                    className="absolute inset-0 bg-black/0 hover:bg-black/20 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer"
                  >
                    <div className="bg-white/90 rounded-lg px-3 py-2 flex items-center gap-2">
                      <Crop className="w-4 h-4" />
                      <span className="text-lg font-medium">Recadrer</span>
                    </div>
                  </div>
                  
                  {/* Bouton réinitialiser si modifications */}
                  {cropConfig && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setCropConfig(null)
                        if (originalPhotoFile) {
                          // Nettoyer l'ancien preview
                          if (photoPreview && photoPreview.startsWith('blob:')) {
                            URL.revokeObjectURL(photoPreview)
                          }
                          const resetPreview = URL.createObjectURL(originalPhotoFile)
                          setPhotoPreview(resetPreview)
                          setPhotoFile(originalPhotoFile)
                        }
                      }}
                      className="absolute bottom-2 right-2 bg-red-500/90 hover:bg-red-600 text-white text-xs px-2 py-1 rounded-lg z-10"
                    >
                      <RotateCw className="w-3 h-3 inline mr-1" />
                      Réinitialiser
                    </button>
                  )}
                </div>
                <Button
                  onClick={() => photoInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Changer la photo
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => photoInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                Ajouter une photo
              </Button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>

          {/* Vidéo */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vidéo associée
            </label>
            {videoPreview ? (
              <div className="space-y-2">
                <video
                  src={videoPreview}
                  controls
                  className="w-full h-32 object-contain bg-gray-100 rounded-lg"
                />
                <Button
                  onClick={() => videoInputRef.current?.click()}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Changer la vidéo
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => videoInputRef.current?.click()}
                variant="outline"
                size="sm"
              >
                Ajouter une vidéo
              </Button>
            )}
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoChange}
            />
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message personnalisé
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none"
              rows={3}
              maxLength={150}
            />
            <p className="text-xs text-gray-500 mt-1">{message.length}/150 caractères</p>
          </div>

          {/* Signature */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signature
            </label>
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Votre nom..."
              className="w-full p-3 border border-gray-300 rounded-lg"
              maxLength={50}
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="bg-orange-500 hover:bg-orange-600">
              Enregistrer
            </Button>
          </div>
        </div>
      </div>
      
      {/* Modal de recadrage */}
      {showCropper && originalImageSrc && photo && (
        <PhotoCropper
          imageSrc={originalImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          initialConfig={cropConfig}
          format={photo.format}
        />
      )}
    </div>
  )
}

function PreviewModal({ photo, isOpen, onClose, onEdit }: PreviewModalProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)

  if (!isOpen || !photo) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 pb-24">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xl font-semibold">Aperçu de votre création</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Photo preview */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Photo</h4>
              <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
                {photo.photoPreview && (
                  <img
                    src={photo.photoPreview}
                    alt="Photo preview"
                    className="w-full h-auto"
                  />
                )}
                {photo.videoPreview && !isVideoPlaying && (
                  <button
                    onClick={() => setIsVideoPlaying(true)}
                    className="absolute bottom-2 right-2 bg-white/90 rounded-full p-2 hover:bg-white transition-colors"
                  >
                    <Play className="w-4 h-4 text-gray-700" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Video preview */}
            {photo.videoPreview && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Vidéo associée</h4>
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  {isVideoPlaying ? (
                    <video
                      src={photo.videoPreview}
                      controls
                      autoPlay
                      className="w-full h-auto"
                      onEnded={() => setIsVideoPlaying(false)}
                    />
                  ) : (
                    <div className="aspect-video flex items-center justify-center">
                      <button
                        onClick={() => setIsVideoPlaying(true)}
                        className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        Lire la vidéo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Message preview */}
          {(photo.message || photo.signature) && (
            <div className="mt-6 p-4 bg-pink-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-pink-500" />
                Message personnalisé
              </h4>
              {photo.message && (
                <p className="text-gray-800 italic mb-2">"{photo.message}"</p>
              )}
              {photo.signature && (
                <p className="text-gray-600 text-sm">- {photo.signature}</p>
              )}
            </div>
          )}
          
          {/* Format info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            <p>Quantité: <strong>{photo.quantity}</strong></p>
            {photo.isGift && (
              <p className="text-purple-600 mt-1">
                <Gift className="w-4 h-4 inline mr-1" />
                Envoi cadeau à {photo.giftFirstName} {photo.giftLastName}
              </p>
            )}
          </div>
        </div>
        
        {/* Bouton fermer en bas */}
        <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="w-full"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function StepGallery({ photos, format, cart = [], editingFormatIndex = null, onUpdate, onNext, onAddPhoto, onEditPhoto }: StepGalleryProps) {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null)
  const [showGiftModal, setShowGiftModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [photoToDelete, setPhotoToDelete] = useState<string | null>(null)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<PhotoItem | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editPhoto, setEditPhoto] = useState<PhotoItem | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [cropPhoto, setCropPhoto] = useState<PhotoItem | null>(null)
  const [originalImageSrc, setOriginalImageSrc] = useState<string>('')

  const updateQuantity = (id: string, delta: number) => {
    const updated = photos.map(photo => 
      photo.id === id 
        ? { ...photo, quantity: Math.max(1, photo.quantity + delta) }
        : photo
    )
    onUpdate(updated)
  }

  const duplicatePhoto = (id: string) => {
    const photo = photos.find(p => p.id === id)
    if (!photo) return
    
    const duplicate = {
      ...photo,
      id: `photo-${Date.now()}`,
      quantity: 1,
      isGift: false,
      giftFirstName: '',
      giftLastName: '',
      giftAddress: '',
      giftPostalCode: '',
      giftCity: '',
      // Conserver aussi l'originalPhotoFile lors de la duplication
      originalPhotoFile: (photo as any).originalPhotoFile
    }
    
    onUpdate([...photos, duplicate])
  }

  const deletePhoto = (id: string) => {
    setPhotoToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDeletePhoto = () => {
    if (photoToDelete) {
      onUpdate(photos.filter(p => p.id !== photoToDelete))
      setPhotoToDelete(null)
    }
    setShowDeleteModal(false)
  }

  const cancelDeletePhoto = () => {
    setPhotoToDelete(null)
    setShowDeleteModal(false)
  }

  const toggleGift = (id: string) => {
    const photo = photos.find(p => p.id === id)
    if (!photo) return

    if (!photo.isGift) {
      setSelectedPhotoId(id)
      setShowGiftModal(true)
    } else {
      const updated = photos.map(p => 
        p.id === id 
          ? { 
              ...p, 
              isGift: false,
              giftFirstName: '',
              giftLastName: '',
              giftAddress: '',
              giftPostalCode: '',
              giftCity: ''
            }
          : p
      )
      onUpdate(updated)
    }
  }

  const handleGiftSave = (giftInfo: Partial<PhotoItem>) => {
    const updated = photos.map(p => 
      p.id === selectedPhotoId 
        ? { ...p, ...giftInfo }
        : p
    )
    onUpdate(updated)
  }

  const handleEditSave = (updates: Partial<PhotoItem>) => {
    const updated = photos.map(p => 
      p.id === editPhoto?.id 
        ? { ...p, ...updates }
        : p
    )
    onUpdate(updated)
  }

  const handlePhotoClick = async (photo: PhotoItem) => {
    // Utiliser le fichier original s'il existe, sinon le fichier recadré
    const fileToUse = (photo as any).originalPhotoFile || photo.photoFile
    if (fileToUse) {
      const imageUrl = URL.createObjectURL(fileToUse)
      setCropPhoto(photo)
      setOriginalImageSrc(imageUrl)
      setShowCropper(true)
    }
  }

  const handleCropComplete = (croppedFileData: File, meta: any) => {
    if (cropPhoto) {
      // Nettoyer l'ancien preview s'il existe
      if (cropPhoto.photoPreview && cropPhoto.photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(cropPhoto.photoPreview)
      }
      
      // Créer un nouveau preview pour la photo recadrée
      const newPreview = URL.createObjectURL(croppedFileData)
      
      // Mettre à jour la photo avec le nouveau fichier et preview
      const updated = photos.map(p => 
        p.id === cropPhoto.id 
          ? { 
              ...p, 
              photoFile: croppedFileData,
              photoPreview: newPreview,
              // Conserver le fichier original (ou le définir si c'est le premier recadrage)
              originalPhotoFile: (p as any).originalPhotoFile || p.photoFile,
              cropConfig: meta.cropConfig || meta // Sauvegarder la configuration de recadrage
            }
          : p
      )
      onUpdate(updated)
    }
    
    setShowCropper(false)
    setCropPhoto(null)
    if (originalImageSrc && originalImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(originalImageSrc)
      setOriginalImageSrc('')
    }
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    setCropPhoto(null)
    if (originalImageSrc) {
      URL.revokeObjectURL(originalImageSrc)
      setOriginalImageSrc('')
    }
  }

  const addNewPhoto = () => {
    // Retourner à l'étape d'upload pour ajouter une nouvelle photo
    onAddPhoto()
  }

  // Calculer le total des photos dans le panier, en excluant le format en cours d'édition
  const cartTotalPhotos = cart.reduce((total, formatGroup, index) => {
    // Si on est en train d'éditer ce format, on ne le compte pas (il sera remplacé par currentFormatPhotos)
    if (editingFormatIndex !== null && index === editingFormatIndex) {
      return total
    }
    return total + formatGroup.photos.reduce((sum, photo) => sum + photo.quantity, 0)
  }, 0)
  
  // Photos dans la galerie actuelle
  const currentFormatPhotos = photos.reduce((acc, p) => acc + p.quantity, 0)
  
  // Total pour le calcul des paliers (panier sans le format édité + galerie actuelle)
  const totalPhotosForTiers = cartTotalPhotos + currentFormatPhotos
  
  const countForMe = currentFormatPhotos
  const countGift = 0 // Plus de cadeaux
  
  // Calculer le prix total temporaire et les réductions
  const prepareCartItems = (): CartItemPricing[] => {
    const items: CartItemPricing[] = []
    
    photos.forEach(photo => {
      const priceInfo = getPhotoPrice(format as PhotoFormat, photo.withFrame)
      items.push({
        format: format as PhotoFormat,
        withFrame: photo.withFrame,
        quantity: photo.quantity,
        basePrice: priceInfo.photoPrice,
        discountedPrice: priceInfo.photoPrice,
        framePrice: priceInfo.framePrice,
        isGift: photo.isGift  // Ajout de l'information cadeau
      })
    })
    
    return items
  }
  
  const pricingData = calculateOrderPricing(prepareCartItems())
  const totalPhotos = countForMe + countGift
  
  // Calculer le nombre total de photos dans tout le panier + galerie actuelle
  const totalPhotosInOrder = cartTotalPhotos + currentFormatPhotos
  
  // Déterminer le prochain palier basé sur le total du panier complet
  const getNextTier = () => {
    const tiers = [2, 5, 10, 50, 100]
    for (const tier of tiers) {
      if (totalPhotosForTiers < tier) {
        return tier
      }
    }
    return null
  }
  
  const nextTier = getNextTier()
  const photosToNextTier = nextTier ? nextTier - totalPhotosForTiers : 0
  
  // Obtenir le pourcentage de réduction du prochain palier
  const getNextTierDiscount = () => {
    if (!nextTier) return 0
    if (nextTier === 2) return 50 // Offre duo
    if (nextTier === 5) return 15 // Tier 1
    if (nextTier === 10) return 25 // Tier 2
    if (nextTier === 50) return 35 // Tier 3
    if (nextTier === 100) return 45 // Tier 4
    return 0
  }
  
  const nextTierDiscount = getNextTierDiscount()

  return (
    <div className="space-y-6">
      {/* Titre de la galerie avec le format */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Galerie • Format {format === 'carre' ? '10×10 cm Polaroid' : format.replace('x', '×') + ' cm'}
        </h2>
      </div>

      {/* Galerie de photos */}
      <div className="w-[90vw] md:w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {photos.map((photo) => (
          <div key={photo.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Preview with photo and video indicator */}
            <div 
              className={`relative group ${format === 'carre' ? 'bg-white p-3 pb-8' : 'aspect-square bg-gray-100'}`}
            >
              {photo.photoPreview && (
                <>
                  {format === 'carre' ? (
                    // Style Polaroid pour le format carré
                    <div className="aspect-square bg-gray-100">
                      <img 
                        src={photo.photoPreview} 
                        alt="Photo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    // Style normal pour les autres formats - respecter le ratio
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      <img 
                        src={photo.photoPreview} 
                        alt="Photo"
                        className="max-w-full max-h-full object-contain"
                        style={{
                          aspectRatio: photo.cropConfig?.orientation === 'landscape' ? '1.5 / 1' : '1 / 1.5'
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Eye icon for preview only */}
                  <button
                    onClick={() => {
                      setPreviewPhoto(photo)
                      setShowPreviewModal(true)
                    }}
                    className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors"
                    title="Aperçu"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-gray-700">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </button>
                  
                  {/* Message indicator - removed from photo overlay */}
                </>
              )}
            </div>

            {/* Infos et contrôles - hauteur fixe pour alignement */}
            <div className="p-4 space-y-3" style={{ minHeight: '200px' }}>
              {/* Message si présent - avec icône à gauche */}
              {photo.message && (
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-gray-600 italic flex-1">
                    "{photo.message}"
                    {photo.signature && <span className="block mt-1">- {photo.signature}</span>}
                  </div>
                </div>
              )}


              {/* Quantité */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quantité :</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(photo.id, -1)}
                    className="w-8 h-8 rounded-full border hover:bg-gray-100 flex items-center justify-center"
                    disabled={photo.quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{photo.quantity}</span>
                  <button
                    onClick={() => updateQuantity(photo.id, 1)}
                    className="w-8 h-8 rounded-full border hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Actions - sans cadeau */}
              <div className="flex gap-2">
                <Button
                  onClick={() => onEditPhoto(photo.id)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Modifier
                </Button>
                <Button
                  onClick={() => duplicatePhoto(photo.id)}
                  variant="outline"
                  size="sm"
                  title="Dupliquer"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => deletePhoto(photo.id)}
                  variant="outline"
                  size="sm"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

            </div>
          </div>
        ))}

        {/* Bouton ajouter une photo avec offre Duo */}
        <button
          onClick={addNewPhoto}
          className={`bg-white rounded-xl shadow-lg overflow-hidden border-2 border-dashed transition-all min-h-[300px] flex flex-col items-center justify-center gap-3 ${
            totalPhotosInOrder === 1 
              ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-yellow-50 hover:from-orange-100 hover:to-yellow-100' 
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50'
          }`}
        >
          {totalPhotosInOrder === 1 ? (
            <>
              <Tag className="w-10 h-10 text-orange-600" />
              <div className="text-center px-4">
                <p className="font-bold text-orange-900 text-lg">-50% sur la 2ème photo !</p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Plus className="w-5 h-5 text-orange-600" />
                <span className="text-orange-800 font-medium">Ajouter maintenant</span>
              </div>
              <span className="text-xs text-gray-600 mt-1">Format {format === 'carre' ? '10×10' : format.replace('x', '×')} cm</span>
            </>
          ) : (
            <>
              <Plus className="w-12 h-12 text-gray-400" />
              <span className="text-gray-600 font-medium">Ajouter une photo</span>
              <span className="text-xs text-gray-500">Format {format === 'carre' ? '10×10' : format.replace('x', '×')} cm</span>
            </>
          )}
        </button>
      </div>

      {/* Résumé en bas avec prix */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="space-y-4">
          {/* Récapitulatif des quantités - sans cadeau */}
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold">
                {editingFormatIndex !== null ? (
                  // En mode édition
                  <>
                    Format en cours : {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} • 
                    Total panier : {totalPhotosForTiers} photo{totalPhotosForTiers !== 1 ? 's' : ''}
                  </>
                ) : cartTotalPhotos > 0 ? (
                  // Ajout d'un nouveau format avec déjà des items dans le panier
                  <>
                    Nouveau format : {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''} • 
                    Total panier : {totalPhotosForTiers} photo{totalPhotosForTiers !== 1 ? 's' : ''}
                  </>
                ) : (
                  // Premier format ajouté
                  <>Total : {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}</>
                )}
              </span>
            </div>
          </div>
          
          {/* Bannière de progression vers le prochain palier AVANT le prix */}
          {nextTier && photosToNextTier > 0 && nextTier > 2 && (
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-purple-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-purple-900">
                    Plus que {photosToNextTier} photo{photosToNextTier > 1 ? 's' : ''} pour atteindre le palier {nextTier} photos !
                  </p>
                  <p className="text-sm text-purple-700 mt-1">
                    Bénéficiez de <span className="font-bold">-{nextTierDiscount}%</span> de réduction sur votre commande
                  </p>
                  {/* Barre de progression */}
                  <div className="mt-2 bg-purple-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                      style={{ width: `${(totalPhotosForTiers / nextTier) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Prix avec réductions visibles */}
          <div className="border-t pt-4">
            {(pricingData.duoDiscount > 0 || pricingData.tierDiscount > 0) ? (
              <>
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="text-gray-600">Prix initial</span>
                  <span className="text-gray-600 line-through">
                    {pricingData.subtotal.toFixed(2)}€
                  </span>
                </div>
                {pricingData.duoDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-green-600">Réduction Duo (-50%)</span>
                    <span className="text-green-600">-{pricingData.duoDiscount.toFixed(2)}€</span>
                  </div>
                )}
                {pricingData.tierDiscount > 0 && (
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-green-600">{pricingData.appliedTier}</span>
                    <span className="text-green-600">-{pricingData.tierDiscount.toFixed(2)}€</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="font-semibold text-lg">Sous-total</span>
                  <div className="text-right">
                    <span className="font-bold text-xl text-orange-600">
                      {(pricingData.subtotal - pricingData.duoDiscount - pricingData.tierDiscount).toFixed(2)}€
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Sous-total</span>
                <span className="font-bold text-xl text-orange-600">
                  {pricingData.subtotal.toFixed(2)}€
                </span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1 text-right">hors frais de livraison</p>
          </div>
          
          {/* Bouton continuer */}
          <Button
            onClick={onNext}
            className="w-full bg-orange-500 hover:bg-orange-600 py-3"
            disabled={photos.length === 0}
          >
            Continuer vers le récapitulatif
          </Button>
        </div>
      </div>
      


      {/* Modal de confirmation de suppression */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        title="Confirmation de suppression"
        message="Êtes-vous sûr de vouloir supprimer cette photo ?"
        onConfirm={confirmDeletePhoto}
        onCancel={cancelDeletePhoto}
        confirmText="Supprimer"
        cancelText="Annuler"
        confirmVariant="destructive"
      />
      
      {/* Modal de prévisualisation */}
      <PreviewModal
        photo={previewPhoto}
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false)
          setPreviewPhoto(null)
        }}
      />
      
      {/* Modal d'édition */}
      <EditModal
        photo={editPhoto}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditPhoto(null)
        }}
        onSave={handleEditSave}
      />
      
      {/* Modal de recadrage principale */}
      {showCropper && originalImageSrc && cropPhoto && (
        <PhotoCropper
          imageSrc={originalImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          format={cropPhoto.format}
        />
      )}
    </div>
  )
}