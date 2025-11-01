'use client'

import { useRef, useState, useEffect } from 'react'
import { Caveat } from 'next/font/google'
import { Plus, X, Copy, Image, Video, Upload, Crop, ChevronDown, ChevronUp, MessageSquare, Play, XCircle, Gift } from 'lucide-react'
import { CartItem } from '@/types'
import PhotoCropper from '@/components/PhotoCropper'

const caveat = Caveat({ subsets: ['latin'], weight: ['400', '700'] })

interface CartItemBlockProps {
  item: CartItem
  index: number
  onPhotoUpload: (id: string, file: File) => void
  onVideoUpload: (id: string, file: File) => void
  onUpdate: (id: string, updates: Partial<CartItem>) => void
  onRemove: (id: string) => void
  onDuplicate: (id: string) => void
}

export default function CartItemBlock({
  item,
  index,
  onPhotoUpload,
  onVideoUpload,
  onUpdate,
  onRemove,
  onDuplicate
}: CartItemBlockProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [showMessageNudge, setShowMessageNudge] = useState(false)
  const [showSignatureNudge, setShowSignatureNudge] = useState(false)
  

  const isPreviewReady = Boolean(item.photoPreview && item.videoPreview)

  useEffect(() => {
    if (isPreviewReady && !item.message) {
      setShowMessageNudge(true)
      const t = setTimeout(() => setShowMessageNudge(false), 3000)
      return () => clearTimeout(t)
    }
  }, [isPreviewReady, item.message])

  useEffect(() => {
    if (item.message && !item.signature) {
      setShowSignatureNudge(true)
      const t = setTimeout(() => setShowSignatureNudge(false), 3000)
      return () => clearTimeout(t)
    }
  }, [item.message, item.signature])

  // Pas de flip désormais
  
  // États pour le recadrage
  const [showCropper, setShowCropper] = useState(false)
  const [originalImageSrc, setOriginalImageSrc] = useState<string>('')

  console.log('🎯 CartItemBlock rendered:', { id: item.id, showMessage: item.showMessage })

  const handlePhotoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    if (file && file.type.startsWith('image/')) {
      handlePhotoSelection(file)
    }
  }

  const handleVideoDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    const file = files[0]
    if (file && file.type.startsWith('video/')) {
      onVideoUpload(item.id, file)
    }
  }

  // Nouvelle fonction pour gérer la sélection de photo
  const handlePhotoSelection = (file: File) => {
    // Nettoyer l'ancienne source si c'était un blob
    if (item.photoOriginalUrl && item.photoOriginalUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(item.photoOriginalUrl) } catch {}
    }
    const url = URL.createObjectURL(file)
    onUpdate(item.id, { photoOriginalUrl: url })
    setOriginalImageSrc(url)
    setShowCropper(true)
  }

  // Fonction dédiée pour ouvrir le file picker photo
  const openPhotoPicker = () => {
    if (photoInputRef.current) {
      photoInputRef.current.focus();
      photoInputRef.current.click();
    } else {
      console.error('❌ Photo input ref is null!')
    }
  }

  // Gérer la validation du recadrage
  const handleCropComplete = (croppedFile: File, meta: { orientation: 'portrait' | 'landscape' }) => {
    onPhotoUpload(item.id, croppedFile)
    onUpdate(item.id, { orientation: meta.orientation })
    setShowCropper(false)
    // Ne pas révoquer ici pour garder la source disponible au re-recadrage
  }

  // Gérer l'annulation du recadrage
  const handleCropCancel = () => {
    setShowCropper(false)
    // Garder la source pour un recadrage ultérieur
  }

  return (
    <>
      <div id={`cart-item-${item.id}`} className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 space-y-6 border border-orange-200 shadow-sm">
        {/* Header avec numéro et boutons */}
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              {index + 1}
            </span>
            Photo magique #{index + 1}
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onDuplicate(item.id)}
                className="text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-full p-2 transition-colors"
                title="Dupliquer"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full p-2 transition-colors"
              title="Supprimer ce bloc"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Prévisualisation (gauche) + Uploads (droite) */}
        <div className={`grid gap-6 ${isPreviewReady ? 'md:grid-cols-2' : ''}`}>
          {/* Colonne gauche: Aperçu 10x15 */}
          {isPreviewReady && (
          <div className={`space-y-4 transition-all duration-300 ${isPreviewReady ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}`}>
            <div className="w-full max-w-[360px] mx-auto border border-gray-200 overflow-hidden bg-[#F3F3F3]">
                <div className="w-full relative" style={{ aspectRatio: item.orientation === 'landscape' ? '1.5 / 1' : '1 / 1.5' }}>
                  {!isPreviewPlaying && !!item.videoPreview && (
                    <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                      <div className="bg-black/60 text-white rounded-full px-3 py-1 flex items-center gap-2 shadow">
                        <Play className="w-4 h-4" />
                        <span className="text-xs font-medium">Cliquer pour prévisualiser</span>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { if (item.videoPreview) setIsPreviewPlaying(true) }}
                    className="w-full h-full relative group"
                    title={item.videoPreview ? 'Cliquer pour lire la vidéo' : 'Ajoutez une vidéo pour activer la lecture'}
                  >
                    {isPreviewPlaying && item.videoPreview ? (
                      <video src={item.videoPreview} className="w-full h-full object-contain" autoPlay controls muted playsInline onEnded={() => setIsPreviewPlaying(false)} />
                    ) : (
                      item.photoPreview ? (
                        <img src={item.photoPreview} alt="Aperçu 10x15" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                          <Image className="w-10 h-10 mb-2" />
                          <span className="text-sm">Aperçu 10×15</span>
                          <span className="text-xs text-gray-400">Téléversez d'abord une photo</span>
                        </div>
                      )
                    )}
                  </button>
                </div>
                {/* Bloc d'étiquette supprimé pour simplification */}
              </div>
          </div>
          )}

          {/* Colonne droite: Uploads photo/vidéo */}
          <div className={`space-y-6 transition-all duration-300 ${isPreviewReady ? 'max-w-none md:max-w-full translate-x-0' : 'max-w-md mx-auto md:col-span-2 mt-0'}`}>
          {/* Photo Upload */}
          <div className={`space-y-3 ${isPreviewReady ? '' : 'mt-0'}`}>
            <label className="block text-sm font-semibold text-gray-700">📸 Photo</label>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handlePhotoSelection(file)
                }
              }}
            />
            {item.photoPreview ? (
              <div className="relative group">
              <div className="w-full h-40 bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden flex items-center justify-center px-6">
                    <img src={item.photoPreview} alt="Aperçu photo" className="max-w-full max-h-full object-contain" />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    className="bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-medium hover:bg-white/30 transition-colors"
                  >
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                        const sourceUrl = item.photoOriginalUrl || item.photoPreview
                        if (sourceUrl) {
                          setOriginalImageSrc(sourceUrl)
                        setShowCropper(true)
                      }
                    }}
                    className="bg-blue-500/80 backdrop-blur-sm text-white px-3 py-1 rounded text-xs font-medium hover:bg-blue-600/80 transition-colors flex items-center gap-1"
                  >
                    <Crop className="w-3 h-3" />
                    Recadrer
                  </button>
                </div>
              </div>
            ) : (
              <div
                onDrop={handlePhotoDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={openPhotoPicker}
                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer flex flex-col items-center justify-center text-gray-600 px-6"
              >
                <Image className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Glissez votre photo ici</span>
                <span className="text-xs text-gray-500">ou cliquez pour parcourir</span>
                <span className="text-xs text-blue-600 mt-1">Format 10cm × 15cm</span>
              </div>
            )}
          </div>

          {/* Video Upload */}
          <div className={`space-y-3 ${isPreviewReady ? '' : 'mt-0'}`}>
            <label className="block text-sm font-semibold text-gray-700">🎬 Vidéo</label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onVideoUpload(item.id, file)
                }
              }}
            />
              {item.videoPreview ? (
                <div className="relative group">
              <div className="w-full h-40 bg-gray-50 rounded-lg border-2 border-gray-200 overflow-hidden flex items-center justify-center px-6">
                    <video src={item.videoPreview} className="max-w-full max-h-full object-contain" controls />
                  </div>
                  {/* Overlay centré pour changer la vidéo */}
                  <div className="absolute inset-0 rounded-lg bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => videoInputRef.current?.click()}
                      className="px-3 py-1 bg-white/90 text-gray-800 rounded text-xs font-medium shadow"
                    >
                      Changer la vidéo
                    </button>
                  </div>
                  {/* Bouton discret en haut à droite */}
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              ) : (
              <div
                onDrop={handleVideoDrop}
                onDragOver={(e) => e.preventDefault()}
                  onClick={() => videoInputRef.current?.click()}
                className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors cursor-pointer flex flex-col items-center justify-center text-gray-600 px-6"
              >
                <Video className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">Glissez votre vidéo ici</span>
                <span className="text-xs text-gray-500">ou cliquez pour parcourir</span>
              </div>
            )}
            </div>
          </div>
        </div>

        {/* Section Choisir le format de la photo */}
        <div className="border-t border-gray-200 pt-4">
          <div className="grid md:grid-cols-2 gap-4 items-center">
            {/* Image illustrative à gauche */}
            <div className="flex flex-col">
              <h4 className="font-medium text-gray-700 mb-3">Choisir le format de la photo</h4>
              <div className="flex justify-center">
                <img 
                  src="/assets_task_01k2q0ns4mfk6869c0ztwzyhj5_1755266722_img_1.webp" 
                  alt="Formats de photo" 
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            </div>
            {/* Options de taille à droite */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={`photoSize-${item.id}`}
                  checked={item.photoSize === '10x15' || !item.photoSize}
                  onChange={() => onUpdate(item.id, { photoSize: '10x15' })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="font-medium">10x15cm</span>
                <span className="text-sm text-gray-500">(Petit)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={`photoSize-${item.id}`}
                  checked={item.photoSize === '20x30'}
                  onChange={() => onUpdate(item.id, { photoSize: '20x30' })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="font-medium">20x30cm</span>
                <span className="text-sm text-gray-500">(Moyen)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={`photoSize-${item.id}`}
                  checked={item.photoSize === '30x45'}
                  onChange={() => onUpdate(item.id, { photoSize: '30x45' })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="font-medium">30x45cm</span>
                <span className="text-sm text-gray-500">(Grand)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section Avec ou sans cadre */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <div className="grid md:grid-cols-2 gap-4 items-center">
            {/* Image illustrative à gauche */}
            <div className="flex flex-col">
              <h4 className="font-medium text-gray-700 mb-3">Avec ou sans cadre</h4>
              <div className="flex justify-center">
                <img 
                  src="/assets_task_01k2f0m689fq6b6sk465f29tc7_1754998185_img_0.webp" 
                  alt="Photo avec cadre" 
                  className="max-w-full h-auto rounded-lg"
                  style={{ maxHeight: '200px' }}
                />
              </div>
            </div>
            {/* Options cadre à droite */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={`withFrame-${item.id}`}
                  checked={!item.withFrame}
                  onChange={() => onUpdate(item.id, { withFrame: false })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="font-medium">Sans cadre</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name={`withFrame-${item.id}`}
                  checked={item.withFrame === true}
                  onChange={() => onUpdate(item.id, { withFrame: true })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <span className="font-medium">Avec cadre</span>
              </label>
            </div>
          </div>
        </div>

        {/* Section Message personnalisé */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <button
            type="button"
            onClick={() => onUpdate(item.id, { showMessage: !item.showMessage })}
            className="flex items-center justify-between w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">+ Message personnalisé</span>
              <span className="text-xs text-gray-500 ml-2">(facultatif)</span>
            </div>
            {item.showMessage ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {item.showMessage && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Aperçu étiquette à gauche */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  {/* Bandeau haut image */}
                  <div className="w-full bg-gray-100 flex justify-center">
                    <img
                      src="/etiquette-carre.jpg"
                      alt="Etiquette haut"
                      className="w-[40vw] max-w-full h-auto object-contain"
                    />
                  </div>
                  {/* Bloc bas arrondi */}
                  <div className="p-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className={`${caveat.className} text-base text-gray-800 whitespace-pre-wrap break-words min-h-[56px]`}>
                        {item.message || '—'}
                      </div>
                      <div className="mt-3 text-right">
                        <span className={`${caveat.className} text-lg font-semibold text-gray-800 underline underline-offset-2`}>
                          {item.signature || ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Formulaire message à droite */}
                <div className="space-y-4">
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message personnalisé</label>
                    <textarea
                      value={item.message}
                      onChange={(e) => onUpdate(item.id, { message: e.target.value.slice(0, 250) })}
                      placeholder="Écrivez votre message personnalisé ici..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none break-words"
                      rows={4}
                      maxLength={250}
                    />
                    <p className="text-xs text-gray-500 mt-1">{item.message.length}/250 caractères</p>
              </div>
              <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Signature</label>
                <input
                  type="text"
                  value={item.signature}
                  onChange={(e) => onUpdate(item.id, { signature: e.target.value })}
                  placeholder="Votre signature..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={100}
                />
                    <p className="text-xs text-gray-500 mt-1">{item.signature.length}/100 caractères</p>
                  </div>
                  <div className="text-xs text-gray-600 bg-white p-3 rounded border">
                    <strong>💡 Astuce :</strong> Ces informations seront imprimées au dos de votre photo magique. Utilisez des caractères simples pour une meilleure lisibilité.
                  </div>
                </div>
              </div>

              {/* Fin panneau message */}
            </div>
          )}
        </div>

        {/* Section indépendante: Envoyer comme cadeau (toujours sous Message personnalisé) */}
        <div className="mt-4">
          <button
            type="button"
            onClick={() => onUpdate(item.id, { giftEnabled: !item.giftEnabled })}
            className="flex items-center justify-between w-full p-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
          >
            <div className="flex items-center gap-2 text-emerald-700">
              <Gift className="w-5 h-5" />
              <span className="font-medium">Envoyer comme cadeau (2€)</span>
            </div>
            {item.giftEnabled ? <ChevronUp className="w-5 h-5 text-emerald-700" /> : <ChevronDown className="w-5 h-5 text-emerald-700" />}
          </button>
          {item.giftEnabled && (
            <div className="mt-3 bg-white border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-4">
                Vous pouvez recevoir la commande chez vous, ou bien envoyer cette photo spécifiquement en cadeau où vous voulez ! 
                Si vous voulez la recevoir chez vous, ne remplissez pas ici mais plus bas, dans la section Vos informations.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Prénom"
                  value={item.giftFirstName || ''}
                  onChange={(e) => onUpdate(item.id, { giftFirstName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Nom"
                  value={item.giftLastName || ''}
                  onChange={(e) => onUpdate(item.id, { giftLastName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Adresse postale"
                  value={item.giftAddress || ''}
                  onChange={(e) => onUpdate(item.id, { giftAddress: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg md:col-span-2"
                />
                <input
                  type="text"
                  placeholder="Code postal"
                  value={item.giftPostalCode || ''}
                  onChange={(e) => onUpdate(item.id, { giftPostalCode: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Ville"
                  value={item.giftCity || ''}
                  onChange={(e) => onUpdate(item.id, { giftCity: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Pays"
                  value="France"
                  readOnly
                  className="px-3 py-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 md:col-span-2">Cette adresse sera utilisée uniquement pour cette photo magique.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal de recadrage */}
      {showCropper && (
        <PhotoCropper
          imageSrc={originalImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          initialOrientation={item.orientation || 'portrait'}
        />
      )}
    </>
  )
}