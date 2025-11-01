'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, Plus, Check, Lock, Star, Image, Video, MessageSquare, Copy, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CartItem, PRICING } from '@/types'
import CartItemBlock from './CartItemBlock'

export default function Commander() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [customerInfo, setCustomerInfo] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
  })
  const [promoCode, setPromoCode] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showRestoreMessage, setShowRestoreMessage] = useState(false)
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null)

  // --- Restauration automatique depuis sessionStorage au montage ---
  useEffect(() => {
    const saved = sessionStorage.getItem('commanderConfig')
    if (saved) {
      try {
        const { cartItems: savedCart, customerInfo: savedInfo } = JSON.parse(saved)
        if (savedCart && Array.isArray(savedCart)) setCartItems(savedCart)
        if (savedInfo) setCustomerInfo(savedInfo)
      } catch (e) {
        console.warn('Impossible de restaurer la configuration:', e)
      }
    } else {
      // Initialiser avec un premier item vide
      setCartItems([{
        id: '1',
        photoPreview: '',
        videoPreview: '',
        message: '',
        signature: '',
        showMessage: false,
          giftEnabled: false,
          orientation: 'portrait',
          photoSize: '10x15',
          withFrame: false
      }])
    }
  }, [])

  // --- Sauvegarde automatique à chaque modification ---
  useEffect(() => {
    sessionStorage.setItem('commanderConfig', JSON.stringify({ cartItems, customerInfo }))
  }, [cartItems, customerInfo])

  const addToCart = () => {
    console.log('🔘 addToCart clicked! Current items:', cartItems.length)

    const newItem: CartItem = {
      id: Date.now().toString(),
      photoPreview: '',
      videoPreview: '',
      message: '',
      signature: '',
      showMessage: false,
      giftEnabled: false,
      orientation: 'portrait',
      photoOriginalUrl: '',
      photoSize: '10x15',
      withFrame: false
    }
    const newItems = [...cartItems, newItem]
    setCartItems(newItems)
    // Replier les volets des autres items et focus sur le nouveau
    setCartItems(prev => prev.map((it, idx) => idx === prev.length - 1 ? it : { ...it, showMessage: false, giftEnabled: false }))
    setTimeout(() => {
      const el = document.getElementById(`cart-item-${newItem.id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
    console.log('✅ Item added successfully! New items:', newItems.length)
  }

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id))
  }

  const duplicateCartItem = (id: string) => {
    const itemToDuplicate = cartItems.find(item => item.id === id)
    if (!itemToDuplicate) {
      return
    }

    const newItem: CartItem = {
      id: Date.now().toString(),
      photoFile: itemToDuplicate.photoFile,
      videoFile: itemToDuplicate.videoFile,
      photoPreview: itemToDuplicate.photoPreview,
      videoPreview: itemToDuplicate.videoPreview,
      message: itemToDuplicate.message,
      signature: itemToDuplicate.signature,
      showMessage: itemToDuplicate.showMessage,
      giftEnabled: itemToDuplicate.giftEnabled ?? false,
      giftRecipient: itemToDuplicate.giftRecipient,
      giftAddress: itemToDuplicate.giftAddress,
      giftPostalCode: itemToDuplicate.giftPostalCode,
      giftCity: itemToDuplicate.giftCity,
      orientation: itemToDuplicate.orientation || 'portrait',
      photoOriginalUrl: itemToDuplicate.photoOriginalUrl,
      photoSize: itemToDuplicate.photoSize || '10x15',
      withFrame: itemToDuplicate.withFrame || false
    }
    const next = [...cartItems, newItem]
    setCartItems(next)
    setCartItems(prev => prev.map((it, idx) => idx === prev.length - 1 ? it : { ...it, showMessage: false, giftEnabled: false }))
    setTimeout(() => {
      const el = document.getElementById(`cart-item-${newItem.id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  const updateCartItem = (id: string, updates: Partial<CartItem>) => {
    console.log('🔄 updateCartItem called:', { id, updates })
    setCartItems(prevItems => prevItems.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ))
  }

  const handlePhotoUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file)
    updateCartItem(id, { photoFile: file, photoPreview: url })
  }

  const handleVideoUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file)
    updateCartItem(id, { videoFile: file, videoPreview: url })
  }

  const calculateSubtotal = () => {
    const photoCount = cartItems.length
    if (photoCount === 0) return 0

    let subtotal = 0
    
    if (photoCount === 1) {
      subtotal = PRICING.photos[1] // 9.50€
    } else if (photoCount === 2) {
      subtotal = PRICING.photos[1] + PRICING.photos[2] // 9.50€ + 7.50€ = 17€
    } else if (photoCount === 5) {
      subtotal = PRICING.photos[1] + PRICING.photos[2] + (PRICING.photos[3] * 2) + PRICING.photos[5] // 9.50€ + 7.50€ + (8.50€ * 2) + 7.50€ = 41.50€
    } else {
      // Pour 3-4 photos, utiliser le prix par photo
      const photoPrice = PRICING.photos[photoCount as keyof typeof PRICING.photos] || 8.50
      subtotal = photoPrice * photoCount
    }
    
    // Ajouter 2€ par item avec option cadeau renseignée
    const giftOptions = cartItems.reduce((sum, it) => {
      const hasGift = it.giftEnabled && (
        it.giftRecipient || it.giftAddress || it.giftPostalCode || it.giftCity
      )
      return sum + (hasGift ? 1 : 0)
    }, 0)
    return subtotal
  }

  const getGiftCompletedCount = () => {
    return cartItems.reduce((sum, it) => {
      const complete = !!(it.giftEnabled && it.giftRecipient && it.giftAddress && it.giftPostalCode && it.giftCity)
      return sum + (complete ? 1 : 0)
    }, 0)
  }

  const getShippingAmount = () => {
    if (cartItems.length === 0) return 0
    const giftCount = getGiftCompletedCount()
    if (giftCount === 0) return PRICING.shipping // 2.99€
    if (giftCount === cartItems.length) return 2 * giftCount // 2€ par photo, pas de 2.99
    return PRICING.shipping + 2 * giftCount // 2.99 + 2x
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const shipping = getShippingAmount()
    const totalWithShipping = subtotal + shipping
    const total = totalWithShipping - promoDiscount
    return Math.max(0, total)
  }

  const applyPromoCode = () => {
    const code = promoCode.trim().toUpperCase()
    
    if (code === 'NOEL') {
      const subtotal = calculateSubtotal()
      const discount = subtotal * 0.15 // 15% de réduction sur le sous-total
      setPromoDiscount(discount)
      setPromoApplied(true)
      alert('🎄 Code promo NOEL appliqué ! 15% de réduction sur votre commande.')
    } else if (code === 'PRESTIGE') {
      setPromoDiscount(0)
      setPromoApplied(true)
      alert('✨ Code PRESTIGE appliqué ! Vous recevrez des avantages exclusifs par email.')
    } else {
      setPromoDiscount(0)
      setPromoApplied(false)
      alert('❌ Code promo invalide.')
    }
  }

  const removePromoCode = () => {
    setPromoCode('')
    setPromoDiscount(0)
    setPromoApplied(false)
  }

  const validateForm = () => {
    if (cartItems.length === 0) {
      alert('Veuillez ajouter au moins une photo')
      return false
    }

    const incompleteItems = cartItems.filter(
      item => !item.photoFile || !item.videoFile
    )
    if (incompleteItems.length > 0) {
      alert('Veuillez ajouter une photo et une vidéo pour chaque élément')
      return false
    }

    if (!customerInfo.firstName || !customerInfo.lastName || !customerInfo.email || 
        !customerInfo.address || !customerInfo.postalCode || !customerInfo.city) {
      alert('Veuillez remplir tous les champs obligatoires')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔄 handleSubmit called')
    
    if (!validateForm()) {
      console.log('❌ Validation failed')
      return
    }

    setIsProcessing(true)

    try {
      const total = calculateTotal()
      const formData = new FormData()
      
      formData.append('customerInfo', JSON.stringify(customerInfo))
      formData.append('total', total.toString())
      formData.append('promoCode', promoApplied ? promoCode.toUpperCase() : '')
      formData.append('promoDiscount', promoDiscount.toString())
      
      cartItems.forEach((item, index) => {
        if (item.photoFile) {
          formData.append(`items[${index}][photo]`, item.photoFile)
        }
        if (item.videoFile) {
          formData.append(`items[${index}][video]`, item.videoFile)
        }
        formData.append(`items[${index}][message]`, item.message || '')
        formData.append(`items[${index}][signature]`, item.signature || '')
        formData.append(`items[${index}][photoSize]`, item.photoSize || '10x15')
        formData.append(`items[${index}][withFrame]`, String(item.withFrame || false))
        // Adresse cadeau optionnelle par item (si activée)
        const hasGift = item.giftEnabled && (item.giftAddress || item.giftPostalCode || item.giftCity || item.giftFirstName || item.giftLastName)
        if (hasGift) {
          formData.append(`items[${index}][adresse]`, item.giftAddress || '')
          formData.append(`items[${index}][giftFirstName]`, item.giftFirstName || '')
          formData.append(`items[${index}][giftLastName]`, item.giftLastName || '')
          formData.append(`items[${index}][giftPostalCode]`, item.giftPostalCode || '')
          formData.append(`items[${index}][giftCity]`, item.giftCity || '')
        } else {
          formData.append(`items[${index}][adresse]`, '')
          formData.append(`items[${index}][giftFirstName]`, '')
          formData.append(`items[${index}][giftLastName]`, '')
          formData.append(`items[${index}][giftPostalCode]`, '')
          formData.append(`items[${index}][giftCity]`, '')
        }
      })

      if (total <= 0) {
        formData.set('total', '0.01')
      }

      const response = await fetch('/api/orders/create-with-payment', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        // Vérifier si la réponse contient du contenu avant de parser le JSON
        const errorText = await response.text()
        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          content: errorText.substring(0, 500) // Limiter la taille pour l'affichage
        })
        
        let errorData
        try {
          errorData = errorText ? JSON.parse(errorText) : {}
        } catch (e) {
          // Si ce n'est pas du JSON, c'est probablement une page HTML d'erreur
          if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
            errorData = { 
              error: 'Erreur serveur', 
              details: 'Le serveur a retourné une page d\'erreur HTML au lieu d\'une réponse JSON. Vérifiez les variables d\'environnement et les logs du serveur.' 
            }
          } else {
            errorData = { error: 'Erreur serveur', details: errorText || 'Réponse vide' }
          }
        }
        throw new Error(errorData.details || errorData.error || 'Erreur lors de la création de la commande')
      }

      // Vérifier si la réponse contient du contenu avant de parser le JSON
      const responseText = await response.text()
      if (!responseText) {
        throw new Error('Réponse vide du serveur')
      }

      let responseData
      try {
        responseData = JSON.parse(responseText)
      } catch (e) {
        throw new Error('Réponse invalide du serveur')
      }

      const { clientSecret, orderId, orderNumber, filesUploaded } = responseData

      // Calculs détaillés pour cohérence d'affichage dans /panier
      const shipping = getShippingAmount()
      const subtotal = calculateSubtotal()

      sessionStorage.setItem('paymentData', JSON.stringify({
        clientSecret,
        orderId,
        orderNumber,
        customerInfo,
        total: total <= 0 ? 0.01 : total,
        filesUploaded,
        shipping,
        subtotal
      }))
      
      router.push('/panier')

    } catch (error) {
      console.error('❌ Erreur création commande:', error)
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      alert(`Erreur lors de la création de la commande:\n${errorMessage}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header moderne */}
      <header className="bg-white py-8 shadow-xl border-b border-border-light">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-black text-accent-primary tracking-tight">
              REVILA
            </h1>
            <p className="text-text-secondary mt-3 font-semibold text-lg">Les photos magiques qui prennent vie</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl px-4 py-12">
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Section Photos */}
          <Card className="border border-border-light shadow-light bg-gradient-to-br from-blue-50 to-purple-100 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#4F3CF6] to-[#2E7DFF] text-white py-8 shadow-lg">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Star className="w-6 h-6" />
                Vos photos magiques
              </CardTitle>
              <p className="text-white/80 mt-2">Ajoutez vos photos avec leurs vidéos correspondantes</p>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              
              {/* Affichage des items */}
              {cartItems.map((item, index) => (
                <CartItemBlock
                  key={item.id}
                  item={item}
                  index={index}
                  onPhotoUpload={handlePhotoUpload}
                  onVideoUpload={handleVideoUpload}
                  onUpdate={updateCartItem}
                  onRemove={removeFromCart}
                  onDuplicate={duplicateCartItem}
                />
              ))}

              {/* Bouton d'ajout */}
              <div className="relative">
                <button
                  type="button"
                  onClick={addToCart}
                  className="w-full py-6 border-2 border-dashed border-black text-black hover:border-gray-900 hover:bg-gray-50 rounded-2xl transition-all duration-300 flex items-center justify-center font-medium cursor-pointer"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Ajouter une photo magique
                </button>
                  
                {/* Sticker de prix - seulement quand la première photo et vidéo sont uploadées */}
                {cartItems.length === 1 && cartItems[0]?.photoFile && cartItems[0]?.videoFile && (
                  <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg transform rotate-3 animate-pulse">
                    <span className="line-through text-red-200 mr-1">9,5€</span>
                    <span className="text-white">7,5€</span>
                  </div>
                )}
              </div>
              
            </CardContent>
          </Card>

          {/* Section Informations */}
          <Card className="border border-border-light shadow-light bg-gradient-to-br from-green-50 to-emerald-100 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#009788] to-[#00BD7D] text-white py-8 shadow-lg">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <MessageSquare className="w-6 h-6" />
                Vos informations
              </CardTitle>
              <p className="text-white/80 mt-2">Pour la livraison de vos photos magiques</p>
            </CardHeader>
            <CardContent className="p-8 space-y-6 bg-white/50 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="text"
                  placeholder="Prénom *"
                  value={customerInfo.firstName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, firstName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:border-accent-primary focus:outline-none transition-all duration-300"
                  required
                />
                <input
                  type="text"
                  placeholder="Nom *"
                  value={customerInfo.lastName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, lastName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:border-accent-primary focus:outline-none transition-all duration-300"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <input
                  type="email"
                  placeholder="Email *"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:border-accent-primary focus:outline-none transition-all duration-300"
                  required
                />
                <input
                  type="tel"
                  placeholder="Téléphone"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:border-accent-primary focus:outline-none transition-all duration-300"
                />
              </div>

              <input
                type="text"
                placeholder="Adresse *"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:border-accent-primary focus:outline-none transition-all duration-300"
                required
              />

              <div className="grid md:grid-cols-3 gap-6">
                <input
                  type="text"
                  placeholder="Code postal *"
                  value={customerInfo.postalCode}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, postalCode: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:border-accent-primary focus:outline-none transition-all duration-300"
                  required
                />
                <input
                  type="text"
                  placeholder="Ville *"
                  value={customerInfo.city}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, city: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-border-light rounded-xl focus:border-accent-primary focus:outline-none transition-all duration-300"
                  required
                />
                <input
                  type="text"
                  placeholder="Pays *"
                  value="France"
                  readOnly
                  className="w-full px-4 py-3 border-2 border-border-light rounded-xl bg-gray-100 cursor-not-allowed"
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Code Promo (sobre en gris) */}
          <Card className="border border-border-light shadow-light bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gray-800 text-white py-6 shadow-lg">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <Tag className="w-5 h-5" />
                Code promo
              </CardTitle>
               {/* Indication promo retirée sur demande */}
            </CardHeader>
            <CardContent className="p-6 bg-white">
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Entrez votre code promo"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="flex-1 px-4 py-3 border-2 border-border-light rounded-xl focus:border-accent-primary focus:outline-none transition-all duration-300"
                  disabled={promoApplied}
                />
                {!promoApplied ? (
                  <Button
                    type="button"
                    onClick={applyPromoCode}
                    className="w-full md:w-auto px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-all duration-300"
                  >
                    Appliquer
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={removePromoCode}
                    className="w-full md:w-auto px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300"
                  >
                    Retirer
                  </Button>
                )}
              </div>
              {promoApplied && (
                <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                  <p className="text-green-800 font-medium">
                    🎄 Code promo NOEL appliqué ! Réduction de {promoDiscount.toFixed(2)}€
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section Récapitulatif */}
          <Card className="border border-border-light shadow-light bg-gradient-to-br from-orange-50 to-amber-100 rounded-3xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-[#F64A00] to-[#FF6B35] text-white py-8 shadow-lg">
              <CardTitle className="text-2xl font-bold flex items-center gap-3">
                <Check className="w-6 h-6" />
                Récapitulatif de votre commande
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 bg-white/50 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-border-light">
                  <span className="font-medium text-text-primary">{cartItems.length} photo(s) magique(s)</span>
                  <span className="font-semibold text-text-primary">
                    {cartItems.length > 0 ? 
                      `${(() => {
                        if (cartItems.length === 1) return PRICING.photos[1];
                        if (cartItems.length === 2) return PRICING.photos[1] + PRICING.photos[2];
                        if (cartItems.length === 5) return PRICING.photos[1] + PRICING.photos[2] + (PRICING.photos[3] * 2) + PRICING.photos[5];
                        return (PRICING.photos[cartItems.length as keyof typeof PRICING.photos] || 8.50) * cartItems.length;
                      })()}€` 
                      : '0€'
                    }
                  </span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-border-light">
                  <span className="font-medium text-text-primary">Livraison</span>
                  <span className="font-semibold text-text-primary">{getShippingAmount().toFixed(2)}€</span>
                </div>
                
                {promoApplied && (
                  <div className="flex justify-between items-center py-3 border-b border-green-300 bg-green-50 rounded-lg px-3">
                    <span className="font-medium text-green-700 flex items-center gap-2">
                      🎄 Réduction NOEL (15%)
                    </span>
                    <span className="font-semibold text-green-700">
                      -{promoDiscount.toFixed(2)}€
                    </span>
                  </div>
                )}

                <div className="bg-section-recap rounded-2xl p-6 text-text-white">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold">Total</span>
                    <div className="text-right">
                      <span className="text-3xl font-bold">
                        {calculateTotal().toFixed(2)}€
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bouton Final */}
          <div className="text-center space-y-6">
            <Button 
              type="submit" 
              size="lg" 
              disabled={isProcessing}
              className="w-full max-w-md py-6 text-lg font-bold bg-green-500 hover:bg-green-600 text-white rounded-2xl shadow-light hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Création de la commande...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Lock className="w-5 h-5" />
                  Procéder au paiement - {calculateTotal().toFixed(2)}€
                </div>
              )}
            </Button>
            <p className="text-sm text-orange-700 mt-2">Après cette étape, la commande ne pourra plus être modifiée.</p>
          </div>
        </form>
      </div>
    </div>
  )
}

