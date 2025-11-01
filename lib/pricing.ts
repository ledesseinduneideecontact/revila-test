// Configuration complète des prix et coûts

// Prix de base HT (avant réduction)
export const BASE_PRICES_HT = {
  photos: {
    '10x15': 7.92,  // 9.50€ TTC / 1.20 = 7.92€ HT
    '20x30': 15.42, // 18.50€ TTC / 1.20 = 15.42€ HT
    '30x45': 20.42  // 24.50€ TTC / 1.20 = 20.42€ HT
  },
  frames: {
    '10x15': 10.75,  // 12.90€ TTC / 1.20 = 10.75€ HT
    '20x30': 14.08,  // 16.90€ TTC / 1.20 = 14.08€ HT
    '30x45': 16.58,  // 19.90€ TTC / 1.20 = 16.58€ HT
    multi: 13.33     // 16€ TTC / 1.20 = 13.33€ HT
  }
} as const

// Prix TTC (avec TVA 20%)
export const BASE_PRICES_TTC = {
  photos: {
    '10x15': 9.50,
    '20x30': 18.50,
    '30x45': 24.50
  },
  frames: {
    '10x15': 12.90,
    '20x30': 16.90,
    '30x45': 19.90,
    multi: 16.00
  }
} as const

// Coûts de production
export const PRODUCTION_COSTS = {
  photos: {
    '10x15': 0.23,
    '20x30': 7.10,
    '30x45': 9.10
  },
  nfc: {
    chip: 0.20,
    label: 0.25,
    addressLabel: 0.025
  },
  frames: {
    '10x15': 2.27,
    '20x30': 3.59,
    '30x45': 9.78,
    multi: 6.00
  }
} as const

// Paliers de réduction
export const DISCOUNT_TIERS = {
  duo: 0.50,      // 2ème photo à -50%
  tier1: 0.15,    // 5-9 unités: -15%
  tier2: 0.25,    // 10-49 unités: -25%
  tier3: 0.35,    // 50-99 unités: -35%
  tier4: 0.45     // 100+ unités: -45%
} as const

// Frais de livraison
export const SHIPPING_COSTS = {
  // Sans cadre
  noFrame: {
    standard: 2.99,      // Photos 10x10, 10x15, 20x30
    largePhoto: 5.90     // Si au moins une photo 30x45
  },
  // Avec cadres (basé sur le nombre de cadres)
  withFrames: {
    one: 5.90,           // 1 cadre
    twoToFive: 7.95,     // 2 à 5 cadres
    sixToTen: 12.95,     // 6 à 10 cadres
    moreThanTen: 25.00   // Plus de 10 cadres
  },
  // Legacy (pour compatibilité)
  fixed: 2.99,
  letter: {
    under20g: 1.59,
    under100g: 3.00
  },
  parcel: {
    base: 1.20,
    under500g: 7.35,
    under750g: 8.65,
    under1kg: 9.40,
    under2kg: 10.70
  }
} as const

// Poids des éléments (en grammes)
export const ITEM_WEIGHTS = {
  photos: {
    '10x15': 5,
    '20x30': 25,
    '30x45': 40
  },
  nfc: {
    chip: 2,
    label: 1
  },
  frames: {
    '10x15': 200,
    '20x30': 500,
    '30x45': 800,
    multi: 150
  }
} as const

// Types
export type PhotoFormat = keyof typeof BASE_PRICES_TTC.photos
export type FrameFormat = keyof typeof BASE_PRICES_TTC.frames

export interface CartItemPricing {
  format: PhotoFormat
  withFrame: boolean
  quantity: number
  basePrice: number
  discountedPrice: number
  framePrice?: number
  isGift?: boolean  // Ajout pour identifier les photos cadeaux
}

/**
 * Calcule le prix d'un groupe d'articles du même format
 * Applique l'offre "2ème à -50%" UNIQUEMENT sur la 2ème photo (PAS sur le cadre)
 */
function calculateDuoDiscount(items: CartItemPricing[]): CartItemPricing[] {
  // Grouper par format et type (avec/sans cadre)
  const groupedByFormat = items.reduce((acc, item) => {
    const key = `${item.format}-${item.withFrame}`
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {} as Record<string, CartItemPricing[]>)

  // Appliquer la réduction duo pour chaque groupe
  const processed: CartItemPricing[] = []
  
  Object.values(groupedByFormat).forEach(group => {
    let count = 0
    group.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        count++
        // La réduction s'applique UNIQUEMENT sur la 2ème photo (count === 2)
        const isSecondPhoto = count === 2
        const discount = isSecondPhoto ? DISCOUNT_TIERS.duo : 0
        
        // IMPORTANT: La réduction s'applique UNIQUEMENT sur le prix de la photo, PAS sur le cadre
        const discountedPhotoPrice = item.basePrice * (1 - discount)
        
        processed.push({
          ...item,
          quantity: 1,
          discountedPrice: discountedPhotoPrice,
          framePrice: item.framePrice // Le prix du cadre reste TOUJOURS le même
        })
      }
    })
  })

  return processed
}

/**
 * Calcule le palier de réduction en fonction de la quantité totale
 */
function getTierDiscount(totalQuantity: number): number {
  if (totalQuantity >= 100) return DISCOUNT_TIERS.tier4
  if (totalQuantity >= 50) return DISCOUNT_TIERS.tier3
  if (totalQuantity >= 10) return DISCOUNT_TIERS.tier2
  if (totalQuantity >= 5) return DISCOUNT_TIERS.tier1
  return 0
}

/**
 * Calcule le prix total d'une commande avec toutes les réductions
 */
export function calculateOrderPricing(items: CartItemPricing[]): {
  items: CartItemPricing[]
  subtotal: number
  duoDiscount: number
  tierDiscount: number
  shipping: number
  total: number
  totalQuantity: number
  appliedTier: string
  totalWeight: number
  shippingDetails: string
} {
  // Étape 1: Appliquer l'offre duo (2ème à -50%)
  const itemsWithDuo = calculateDuoDiscount(items)
  
  // Séparer les prix des photos et des cadres
  const subtotalPhotosAfterDuo = itemsWithDuo.reduce((sum, item) => {
    return sum + (item.discountedPrice * item.quantity)
  }, 0)
  
  const subtotalFrames = itemsWithDuo.reduce((sum, item) => {
    const framePrice = item.withFrame && item.framePrice ? item.framePrice * item.quantity : 0
    return sum + framePrice
  }, 0)
  
  const subtotalAfterDuo = subtotalPhotosAfterDuo + subtotalFrames
  
  // Calculer le prix original (sans réductions)
  const originalSubtotal = items.reduce((sum, item) => {
    const photoPrice = item.basePrice * item.quantity
    const framePrice = item.withFrame && item.framePrice ? item.framePrice * item.quantity : 0
    return sum + photoPrice + framePrice
  }, 0)
  
  // Étape 2: Appliquer le palier de réduction UNIQUEMENT sur les photos (JAMAIS sur les cadres)
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const tierDiscountRate = getTierDiscount(totalQuantity)
  // IMPORTANT: La réduction de palier s'applique UNIQUEMENT sur le prix des photos après Duo
  const tierDiscountAmount = subtotalPhotosAfterDuo * tierDiscountRate
  
  // Étape 3: Calculer les frais de livraison avec les nouvelles règles
  // Compter le nombre total de cadres
  const frameCount = items.filter(item => item.withFrame).reduce((sum, item) => sum + item.quantity, 0)
  
  // Vérifier s'il y a au moins une photo 30x45
  const hasLargePhoto = items.some(item => item.format === '30x45')
  
  // Calculer les frais de livraison selon les nouvelles règles simples
  const shipping = calculateShippingCost(frameCount, hasLargePhoto)
  
  // Pour compatibilité avec l'ancien système
  const totalWeight = calculateTotalWeight(items)
  const hasFrames = frameCount > 0
  
  // Déterminer le type de livraison
  let shippingDetails = ''
  if (frameCount > 0) {
    if (frameCount === 1) {
      shippingDetails = `1 cadre`
    } else if (frameCount >= 2 && frameCount <= 5) {
      shippingDetails = `${frameCount} cadres`
    } else if (frameCount >= 6 && frameCount <= 10) {
      shippingDetails = `${frameCount} cadres`
    } else {
      shippingDetails = `${frameCount} cadres (>10)`
    }
  } else if (hasLargePhoto) {
    shippingDetails = `Photos avec format 30x45`
  } else {
    shippingDetails = `Photos sans cadre`
  }
  
  // Calculer le total final
  // Photos avec toutes les réductions + Cadres sans aucune réduction
  const finalSubtotal = (subtotalPhotosAfterDuo - tierDiscountAmount) + subtotalFrames
  
  // Déterminer le palier appliqué
  let appliedTier = 'Aucun'
  if (totalQuantity >= 100) appliedTier = '100+ unités (-45%)'
  else if (totalQuantity >= 50) appliedTier = '50-99 unités (-35%)'
  else if (totalQuantity >= 10) appliedTier = '10-49 unités (-25%)'
  else if (totalQuantity >= 5) appliedTier = '5-9 unités (-15%)'
  else if (totalQuantity === 2) appliedTier = '2 unités (2ème à -50%)'
  
  return {
    items: itemsWithDuo,
    subtotal: originalSubtotal,
    duoDiscount: originalSubtotal - subtotalAfterDuo,
    tierDiscount: tierDiscountAmount,
    shipping,
    total: finalSubtotal + shipping,
    totalQuantity,
    appliedTier,
    totalWeight,
    shippingDetails
  }
}

/**
 * Fonction helper pour obtenir le prix d'une photo avec son format
 */
export function getPhotoPrice(format: PhotoFormat, withFrame: boolean = false): {
  photoPrice: number
  framePrice?: number
  total: number
} {
  const photoPrice = BASE_PRICES_TTC.photos[format]
  const framePrice = withFrame ? BASE_PRICES_TTC.frames[format as keyof typeof BASE_PRICES_TTC.frames] : undefined

  return {
    photoPrice,
    framePrice,
    total: photoPrice + (framePrice || 0)
  }
}

/**
 * Fonction pour calculer le poids total d'une commande
 */
export function calculateTotalWeight(items: { format: PhotoFormat, withFrame: boolean, quantity: number }[]): number {
  return items.reduce((total, item) => {
    const photoWeight = ITEM_WEIGHTS.photos[item.format] * item.quantity
    const nfcWeight = (ITEM_WEIGHTS.nfc.chip + ITEM_WEIGHTS.nfc.label) * item.quantity
    const frameWeight = item.withFrame
      ? ITEM_WEIGHTS.frames[item.format as keyof typeof ITEM_WEIGHTS.frames] * item.quantity
      : 0

    return total + photoWeight + nfcWeight + frameWeight
  }, 0)
}

/**
 * Détermine les frais de livraison basés sur le nombre de cadres et le format des photos
 * @param frameCount Nombre total de cadres commandés
 * @param hasLargePhoto Si au moins une photo 30x45 est présente
 */
export function calculateShippingCost(frameCount: number = 0, hasLargePhoto: boolean = false): number {
  // Si il y a des cadres, le tarif dépend uniquement du nombre de cadres
  if (frameCount > 0) {
    if (frameCount === 1) {
      return SHIPPING_COSTS.withFrames.one
    } else if (frameCount >= 2 && frameCount <= 5) {
      return SHIPPING_COSTS.withFrames.twoToFive
    } else if (frameCount >= 6 && frameCount <= 10) {
      return SHIPPING_COSTS.withFrames.sixToTen
    } else {
      return SHIPPING_COSTS.withFrames.moreThanTen
    }
  }
  
  // Sans cadre : dépend du format des photos
  if (hasLargePhoto) {
    return SHIPPING_COSTS.noFrame.largePhoto // 5.90€ si au moins une photo 30x45
  } else {
    return SHIPPING_COSTS.noFrame.standard // 2.99€ pour les autres formats
  }
}

/**
 * Ancienne fonction pour compatibilité - DEPRECATED
 */
export function calculateShippingCostByWeight(weightInGrams: number, hasFrames: boolean = false): number {
  // Si il y a des cadres, c'est forcément un colis
  if (hasFrames || weightInGrams > 100) {
    if (weightInGrams <= 500) {
      return SHIPPING_COSTS.parcel.under500g
    } else if (weightInGrams <= 750) {
      return SHIPPING_COSTS.parcel.under750g
    } else if (weightInGrams <= 1000) {
      return SHIPPING_COSTS.parcel.under1kg
    } else {
      return SHIPPING_COSTS.parcel.under2kg
    }
  }
  
  // Pour les photos seules (sans cadre)
  if (weightInGrams <= 20) {
    return SHIPPING_COSTS.letter.under20g
  } else if (weightInGrams <= 100) {
    return SHIPPING_COSTS.letter.under100g
  } else {
    // Au-delà de 100g, c'est un colis
    return SHIPPING_COSTS.parcel.under500g
  }
}