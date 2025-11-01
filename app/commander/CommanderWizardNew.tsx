'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, ShoppingCart, Package, Camera, Image, Sparkles, User, CreditCard, CheckCircle, Settings, Home } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import StepFormat from './steps-new/StepFormat'
import StepUpload from './steps-new/StepUpload'
import StepGallery from './steps-new/StepGallery'
import StepContinueOrCheckout from './steps-new/StepContinueOrCheckout'
import StepOptions from './steps-new/StepOptions'
import CartSummary from './steps-new/CartSummary'
import StepCustomerInfo from './steps-new/StepCustomerInfo'
import StepPayment from './steps-new/StepPayment'
import type { FrameSelection } from './steps-new/StepOptions'
import { toast } from 'sonner'
import { calculateOrderPricing, CartItemPricing, PhotoFormat, calculateShippingCost, getPhotoPrice } from '@/lib/pricing'

export interface PhotoItem {
  id: string
  format: 'carre' | '10x15' | '20x30' | '30x45'
  withFrame: boolean  // Maintenant géré individuellement par photo
  photoFile?: File  // Photo recadrée finale
  originalPhotoFile?: File  // Photo originale non recadrée
  cropConfig?: any  // Configuration de recadrage (zoom, rotation, position, orientation)
  videoFile?: File
  photoPreview?: string
  videoPreview?: string
  message: string
  signature: string
  quantity: number
  isGift: boolean
  giftFirstName?: string
  giftLastName?: string
  giftAddress?: string
  giftPostalCode?: string
  giftCity?: string
}

export interface CartFormat {
  format: 'carre' | '10x15' | '20x30' | '30x45'
  withFrame: boolean
  photos: PhotoItem[]
}

// Les prix sont maintenant centralisés dans lib/pricing.ts
// pour éviter les incohérences et les erreurs de calcul

const STEPS = [
  { id: 1, title: 'Format', icon: Package, description: 'Choisissez la taille' },
  { id: 2, title: 'Upload', icon: Camera, description: 'Ajoutez vos médias' },
  { id: 3, title: 'Ma Galerie', icon: Image, description: 'Gérez vos photos' },
  { id: 4, title: 'Continuer', icon: Sparkles, description: 'Continuer ou payer' },
  { id: 5, title: 'Options', icon: Settings, description: 'Choisir les cadres' },
  { id: 6, title: 'Panier', icon: ShoppingCart, description: 'Récapitulatif' },
  { id: 7, title: 'Infos', icon: User, description: 'Vos coordonnées' },
  { id: 8, title: 'Paiement', icon: CreditCard, description: 'Finalisez' }
]

interface CommanderWizardNewProps {
  isWeddingPlanSource?: boolean
}

export default function CommanderWizardNew({ isWeddingPlanSource = false }: CommanderWizardNewProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [cart, setCart] = useState<CartFormat[]>([])
  const [currentFormat, setCurrentFormat] = useState<'carre' | '10x15' | '20x30' | '30x45' | null>(null)
  const [currentPhotos, setCurrentPhotos] = useState<PhotoItem[]>([])
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null)
  const [editingFormatIndex, setEditingFormatIndex] = useState<number | null>(null)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [frameSelection, setFrameSelection] = useState<FrameSelection>({
    '10x15': 0,
    '20x30': 0,
    '30x45': 0
  })
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: ''
  })
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)

  // Scroll en haut de la page à chaque changement d'onglet
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentStep])

  // Charger depuis sessionStorage ou localStorage
  useEffect(() => {
    // Vérifier si on a un paramètre email dans l'URL
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    
    if (emailParam) {
      // Essayer de charger depuis localStorage avec l'email
      const savedCartData = localStorage.getItem(`cart_${emailParam}`)
      if (savedCartData) {
        try {
          const data = JSON.parse(savedCartData)
          setCart(data.cart)
          setCustomerInfo(prev => ({ ...prev, email: data.email }))
          // Afficher un message de succès
          console.log('Panier restauré pour', emailParam)
          return
        } catch (err) {
          console.error('Erreur lors de la restauration du panier', err)
        }
      }
    }
    
    // Sinon charger depuis sessionStorage comme avant
    const savedCart = sessionStorage.getItem('cart')
    const savedCustomerInfo = sessionStorage.getItem('customerInfo')
    
    // Note: Les fichiers File ne peuvent pas être stockés dans sessionStorage
    // On ne sauvegarde que les métadonnées
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart)
        // Filtrer les propriétés non sérialisables
        const cleanCart = parsedCart.map((format: any) => ({
          ...format,
          photos: format.photos.map((photo: any) => ({
            ...photo,
            photoFile: undefined,
            videoFile: undefined
          }))
        }))
        setCart(cleanCart)
      } catch (e) {
        console.error('Erreur lors du chargement du panier:', e)
      }
    }
    if (savedCustomerInfo) setCustomerInfo(JSON.parse(savedCustomerInfo))
  }, [])


  // Sauvegarder dans sessionStorage (sans les fichiers)
  useEffect(() => {
    // Créer une version sérialisable du panier
    const serializableCart = cart.map(format => ({
      ...format,
      photos: format.photos.map(photo => ({
        ...photo,
        photoFile: undefined,
        videoFile: undefined
      }))
    }))
    sessionStorage.setItem('cart', JSON.stringify(serializableCart))
  }, [cart])

  useEffect(() => {
    sessionStorage.setItem('customerInfo', JSON.stringify(customerInfo))
  }, [customerInfo])

  const handleFormatSelect = (format: 'carre' | '10x15' | '20x30' | '30x45') => {
    // Maintenant on ne gère plus withFrame au niveau du format
    setCurrentFormat(format)
    setCurrentPhotos([])
    setCurrentStep(2)
  }

  const handlePhotoUpload = (photo: PhotoItem) => {
    if (editingPhotoId) {
      // Si on édite une photo, la remplacer en conservant certaines propriétés
      const updatedPhotos = currentPhotos.map(p => {
        if (p.id === editingPhotoId) {
          return { 
            ...photo, 
            id: editingPhotoId, 
            withFrame: p.withFrame, // Conserver le statut de cadre
            quantity: p.quantity, // Conserver la quantité
            originalPhotoFile: photo.originalPhotoFile || p.originalPhotoFile, // Assurer qu'on conserve l'original
            cropConfig: photo.cropConfig // Conserver la nouvelle configuration de recadrage
          }
        }
        return p
      })
      setCurrentPhotos(updatedPhotos)
      setEditingPhotoId(null)
    } else {
      // Ajouter la nouvelle photo aux photos existantes au lieu de remplacer
      // Par défaut, les photos n'ont pas de cadre
      const photoWithFrame = { ...photo, withFrame: false }
      setCurrentPhotos([...currentPhotos, photoWithFrame])
    }
    setCurrentStep(3)
  }

  const handleGalleryUpdate = (photos: PhotoItem[]) => {
    setCurrentPhotos(photos)
  }

  const handleEditPhoto = (photoId: string) => {
    // Trouver la photo à éditer
    const photoToEdit = currentPhotos.find(p => p.id === photoId)
    if (photoToEdit) {
      setEditingPhotoId(photoId)
      setCurrentStep(2) // Aller à l'étape Upload
    }
  }

  const handleAddToCart = () => {
    if (currentFormat && currentPhotos.length > 0) {
      // Regrouper les photos par statut de cadre
      const photosWithFrame = currentPhotos.filter(p => p.withFrame)
      const photosWithoutFrame = currentPhotos.filter(p => !p.withFrame)
      
      const newCartItems: CartFormat[] = []
      
      if (photosWithoutFrame.length > 0) {
        newCartItems.push({
          format: currentFormat,
          withFrame: false,
          photos: photosWithoutFrame
        })
      }
      
      if (photosWithFrame.length > 0) {
        newCartItems.push({
          format: currentFormat,
          withFrame: true,
          photos: photosWithFrame
        })
      }
      
      if (editingFormatIndex !== null) {
        // Si on édite, on remplace le format existant
        const newCart = [...cart]
        newCart.splice(editingFormatIndex, 1, ...newCartItems)
        setCart(newCart)
        setEditingFormatIndex(null)
      } else {
        // Sinon on ajoute au panier
        setCart([...cart, ...newCartItems])
      }
      
      setCurrentFormat(null)
      setCurrentPhotos([])
    }
  }

  // Fonction pour annuler l'édition et restaurer les photos originales
  const cancelEdit = () => {
    if (editingFormatIndex !== null) {
      // Réinitialiser l'état d'édition
      setEditingFormatIndex(null)
      setCurrentFormat(null)
      setCurrentPhotos([])
    }
  }

  const handleContinueShopping = () => {
    handleAddToCart()
    // Réinitialiser l'état d'édition si on continue le shopping
    setEditingFormatIndex(null)
    setCurrentStep(1)
  }

  const handleProceedToCheckout = () => {
    handleAddToCart()
    // Réinitialiser l'état d'édition avant d'aller aux options
    setEditingFormatIndex(null)
    setCurrentStep(5) // Aller aux Options
  }

  const handleEditFormat = (formatIndex: number) => {
    const formatToEdit = cart[formatIndex]
    if (formatToEdit) {
      // Charger le format et les photos à éditer
      setCurrentFormat(formatToEdit.format)
      setCurrentPhotos(formatToEdit.photos)
      setEditingFormatIndex(formatIndex)
      // NE PAS retirer du panier - on le garde jusqu'à validation
      // Aller à la galerie
      setCurrentStep(3)
    }
  }

  const handleCustomerInfoComplete = (info: typeof customerInfo) => {
    setCustomerInfo(info)
    setCurrentStep(8) // Aller au paiement
  }

  const handleUpdateFrames = (frames: FrameSelection) => {
    setFrameSelection(frames)
  }

  const handleUpdateFrameQuantity = (format: keyof FrameSelection, quantity: number) => {
    setFrameSelection(prev => ({
      ...prev,
      [format]: Math.max(0, quantity)
    }))
  }

  const handleOptionsComplete = () => {
    setCurrentStep(6) // Aller au panier
  }


  const calculateTotal = () => {
    // Préparer les items pour le calcul avec la fonction centralisée
    const items: CartItemPricing[] = []
    
    cart.forEach(format => {
      format.photos.forEach(photo => {
        // IMPORTANT: Utiliser photo.withFrame, pas format.withFrame !
        const priceInfo = getPhotoPrice(format.format as PhotoFormat, photo.withFrame)
        
        items.push({
          format: format.format as PhotoFormat,
          withFrame: photo.withFrame,  // Utiliser le withFrame de la photo individuelle
          quantity: photo.quantity,
          basePrice: priceInfo.photoPrice,  // Prix de la photo seule
          discountedPrice: priceInfo.photoPrice,
          framePrice: priceInfo.framePrice,  // Prix du cadre si applicable
          isGift: photo.isGift
        })
      })
    })
    
    // Utiliser la fonction centralisée pour calculer avec toutes les réductions
    const pricingData = calculateOrderPricing(items)
    
    // Ajouter le prix des cadres sélectionnés dans Options
    let framesTotal = 0
    let totalFrameCount = 0
    if (frameSelection) {
      const framePrices = {
        '10x15': 12.90,
        '20x30': 16.90,
        '30x45': 19.90
      }
      
      Object.entries(frameSelection).forEach(([format, quantity]) => {
        const price = framePrices[format as keyof typeof framePrices] || 0
        framesTotal += price * quantity
        totalFrameCount += quantity
      })
    }
    
    // Compter aussi les cadres du panier
    const cartFrameCount = items.filter(item => item.withFrame).reduce((sum, item) => sum + item.quantity, 0)
    totalFrameCount += cartFrameCount
    
    // Vérifier s'il y a une photo 30x45
    const hasLargePhoto = cart.some(format => format.format === '30x45')
    
    // Recalculer la livraison avec le bon nombre de cadres
    const correctShipping = calculateShippingCost(totalFrameCount, hasLargePhoto)
    
    // Retourner le total avec la bonne livraison et la réduction promo
    return (pricingData.total - pricingData.shipping) + correctShipping + framesTotal - promoDiscount
  }

  const handlePromoCodeChange = (code: string, discount: number) => {
    setPromoCode(code)
    setPromoDiscount(discount)
  }

  const getStepTitle = () => {
    switch(currentStep) {
      case 1: return "Choisissez votre format"
      case 2: return "Ajoutez votre photo"
      case 3: return "Personnalisez votre commande"
      case 4: return "Que souhaitez-vous faire ?"
      case 5: return "Choisir les options"
      case 6: return "Votre panier"
      case 7: return "Vos informations"
      case 8: return "Paiement"
      default: return ""
    }
  }

  // Empêcher le retour depuis Ma Galerie (3) vers Upload (2)
  // Empêcher le retour depuis Continuer (4) vers Ma Galerie (3)
  // Empêcher le retour depuis Options (5) vers Continuer (4)
  // Garder l'interdiction existante pour Panier (6), Infos (7) et Paiement (8)
  const canGoBack = currentStep > 1 && currentStep !== 3 && currentStep !== 4 && currentStep !== 5 && currentStep !== 6 && currentStep !== 7 && currentStep !== 8

  // Vérifier si l'utilisateur a déjà uploadé des photos
  const hasUploadedPhotos = cart.length > 0 || currentPhotos.length > 0

  const handleHomeClick = () => {
    if (hasUploadedPhotos) {
      setShowExitConfirm(true)
    } else {
      router.push('/')
    }
  }

  const confirmExit = () => {
    setShowExitConfirm(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Popup de confirmation */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Voulez-vous vraiment quitter ?</h3>
            <p className="text-gray-600 mb-6">
              Si vous quittez maintenant, votre commande en cours sera perdue et vous devrez recommencer.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setShowExitConfirm(false)}
                variant="outline"
                className="w-full sm:flex-1"
              >
                <span className="truncate">Continuer ma commande</span>
              </Button>
              <Button
                onClick={confirmExit}
                className="w-full sm:flex-1 bg-red-500 hover:bg-red-600 text-white"
              >
                <span className="truncate">Quitter quand même</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header avec panier */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
              {/* Icône Home sur mobile */}
              <button
                onClick={handleHomeClick}
                className="md:hidden flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors group"
                aria-label="Retour à l'accueil"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-house w-5 h-5 text-gray-600 group-hover:text-purple-600 transition-colors">
                  <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"></path>
                  <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
              </button>
              
              {/* Logo Revila - caché sur mobile */}
              <button
                onClick={handleHomeClick}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <h1 className="text-4xl font-black text-black tracking-tight" style={{fontFamily: 'Boston Angel, serif'}}>
                  {isWeddingPlanSource ? 'Revila x WeddingPlan' : 'Revila'}
                </h1>
                <Home className="w-4 h-4 text-gray-600 group-hover:text-purple-600 transition-colors" />
              </button>
              
              <div className="hidden md:block h-8 w-px bg-gray-300" />
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {canGoBack && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="flex items-center gap-1 md:gap-2 flex-shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Retour</span>
                  </Button>
                )}
                <h1 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 truncate">
                  {getStepTitle()}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              
              {/* Icône panier */}
              <button
                onClick={() => {
                  // Si on est en mode édition, on sauvegarde avant d'aller au panier
                  if (editingFormatIndex !== null && currentPhotos.length > 0) {
                    handleAddToCart()
                  }
                  setCurrentStep(6)
                }}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.reduce((acc, format) => acc + format.photos.length, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Icônes de progression */}
          <div className="hidden md:flex items-center justify-center mt-4 space-x-2">
            {STEPS.map((step, index) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep
              
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (step.id < currentStep || (step.id === 6 && cart.length > 0)) {
                        // Si on est en mode édition et qu'on va au panier, sauvegarder
                        if (step.id === 6 && editingFormatIndex !== null && currentPhotos.length > 0) {
                          handleAddToCart()
                        }
                        setCurrentStep(step.id)
                      }
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-orange-100 text-orange-600'
                        : isCompleted
                        ? 'bg-green-50 text-green-600 hover:bg-green-100'
                        : 'bg-gray-50 text-gray-400'
                    } ${
                      (step.id < currentStep || (step.id === 6 && cart.length > 0)) ? 'cursor-pointer' : 'cursor-not-allowed'
                    }`}
                    disabled={!(step.id < currentStep || (step.id === 6 && cart.length > 0))}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{step.title}</span>
                    {isCompleted && <CheckCircle className="w-4 h-4 ml-1" />}
                  </button>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 mx-1 text-gray-300" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8 commander-mobile-container">
        {currentStep === 1 && (
          <StepFormat onSelect={handleFormatSelect} />
        )}
        
        {currentStep === 2 && currentFormat && (
          <StepUpload 
            format={currentFormat}
            onComplete={handlePhotoUpload}
            editingPhoto={editingPhotoId ? currentPhotos.find(p => p.id === editingPhotoId) : undefined}
          />
        )}
        
        {currentStep === 3 && (
          <StepGallery
            photos={currentPhotos}
            format={currentFormat || '10x15'}
            cart={cart}
            editingFormatIndex={editingFormatIndex}
            onUpdate={handleGalleryUpdate}
            onNext={() => setCurrentStep(4)}
            onAddPhoto={() => setCurrentStep(2)}
            onEditPhoto={handleEditPhoto}
          />
        )}
        
        {currentStep === 4 && (
          <StepContinueOrCheckout
            onContinue={handleContinueShopping}
            onCheckout={handleProceedToCheckout}
          />
        )}
        
        {currentStep === 5 && (
          <StepOptions
            cart={cart}
            onUpdateFrames={handleUpdateFrames}
            onNext={handleOptionsComplete}
          />
        )}
        
        {currentStep === 6 && (
          <CartSummary
            cart={cart}
            frameSelection={frameSelection}
            onUpdateCart={setCart}
            onProceedToInfo={() => setCurrentStep(7)}
            onContinueShopping={() => {
              // Réinitialiser l'état lors du retour au shopping depuis le panier
              setCurrentFormat(null)
              setCurrentPhotos([])
              setEditingFormatIndex(null)
              setCurrentStep(1)
            }}
            onEditFormat={handleEditFormat}
            onEditFrames={() => setCurrentStep(5)}
            onUpdateFrameQuantity={handleUpdateFrameQuantity}
            promoCode={promoCode}
            promoDiscount={promoDiscount}
            onPromoCodeChange={handlePromoCodeChange}
            isWeddingPlanSource={isWeddingPlanSource}
          />
        )}
        
        {currentStep === 7 && (
          <StepCustomerInfo
            customerInfo={customerInfo}
            onComplete={handleCustomerInfoComplete}
            onBack={() => setCurrentStep(6)} // Retour au panier
          />
        )}
        
        {currentStep === 8 && (
          <StepPayment
            cart={cart}
            frameSelection={frameSelection}
            customerInfo={customerInfo}
            total={calculateTotal()}
            promoCode={promoCode}
            promoDiscount={promoDiscount}
            onBack={() => setCurrentStep(7)} // Retour aux infos
          />
        )}
      </div>
    </div>
  )
}