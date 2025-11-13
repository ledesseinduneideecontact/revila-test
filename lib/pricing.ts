// Configuration complète des prix et coûts

// Prix de base HT (avant réduction)
export const BASE_PRICES_HT = {
  photos: {
    '10x15': 12.42,  // 14.90€ TTC / 1.20 = 12.42€ HT
    '20x30': 24.92,  // 29.90€ TTC / 1.20 = 24.92€ HT
    '30x45': 33.25   // 39.90€ TTC / 1.20 = 33.25€ HT
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
    '10x15': 14.90,
    '20x30': 29.90,
    '30x45': 39.90
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
    '20x30': 15,
    '30x45': 25
  },
  envelopes: {
    '10x15': 3,
    '20x30': 5,
    '30x45': 5
  },
  pouches: {
    '10x15': 10,
    '20x30': 0,
    '30x45': 15
  },
  nfc: {
    chip: 2,
    label: 1
  },
  frames: {
    '10x15': 150,
    '20x30': 300,
    '30x45': 450,
    multi: 150
  }
} as const

// Tranches de livraison par poids
export const SHIPPING_BY_WEIGHT = [
  { maxWeight: 20, cost: 1.50 },
  { maxWeight: 250, cost: 5.50 },
  { maxWeight: 500, cost: 8.50 },
  { maxWeight: 5000, cost: 14.50 }
] as const

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
  // Calculer la quantité totale et le prix original
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)

  const originalSubtotal = items.reduce((sum, item) => {
    const photoPrice = item.basePrice * item.quantity
    const framePrice = item.withFrame && item.framePrice ? item.framePrice * item.quantity : 0
    return sum + photoPrice + framePrice
  }, 0)

  // Calculer le subtotal des cadres (jamais réduit)
  const subtotalFrames = items.reduce((sum, item) => {
    const framePrice = item.withFrame && item.framePrice ? item.framePrice * item.quantity : 0
    return sum + framePrice
  }, 0)

  // Calculer le subtotal des photos (avant réduction)
  const subtotalPhotosOriginal = items.reduce((sum, item) => {
    return sum + (item.basePrice * item.quantity)
  }, 0)

  // NOUVELLE LOGIQUE : Appliquer UNE SEULE offre (non cumulable)
  let finalItems: CartItemPricing[]
  let duoDiscountAmount = 0
  let tierDiscountAmount = 0
  let subtotalPhotosAfterDiscount = 0

  // Si quantité >= 5 : UNIQUEMENT palier (pas de duo)
  if (totalQuantity >= 5) {
    const tierDiscountRate = getTierDiscount(totalQuantity)
    tierDiscountAmount = subtotalPhotosOriginal * tierDiscountRate

    // Appliquer le palier sur tous les items
    finalItems = items.map(item => ({
      ...item,
      discountedPrice: item.basePrice * (1 - tierDiscountRate)
    }))

    subtotalPhotosAfterDiscount = subtotalPhotosOriginal - tierDiscountAmount
  }
  // Sinon (quantité 2-4) : UNIQUEMENT duo (pas de palier)
  else {
    const itemsWithDuo = calculateDuoDiscount(items)
    finalItems = itemsWithDuo

    subtotalPhotosAfterDiscount = itemsWithDuo.reduce((sum, item) => {
      return sum + (item.discountedPrice * item.quantity)
    }, 0)

    duoDiscountAmount = subtotalPhotosOriginal - subtotalPhotosAfterDiscount
  }
  
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
  // Photos avec réduction appliquée + Cadres sans aucune réduction
  const finalSubtotal = subtotalPhotosAfterDiscount + subtotalFrames

  // Déterminer le palier appliqué (basé sur quelle réduction a été appliquée)
  let appliedTier = 'Aucun'
  if (totalQuantity >= 5) {
    // Palier de réduction appliqué
    if (totalQuantity >= 100) appliedTier = '100+ unités (-45%)'
    else if (totalQuantity >= 50) appliedTier = '50-99 unités (-35%)'
    else if (totalQuantity >= 10) appliedTier = '10-49 unités (-25%)'
    else appliedTier = '5-9 unités (-15%)'
  } else if (duoDiscountAmount > 0) {
    // Offre duo appliquée (2-4 photos)
    appliedTier = '2ème photo à -50%'
  }

  return {
    items: finalItems,
    subtotal: originalSubtotal,
    duoDiscount: duoDiscountAmount,
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

/**
 * Interface pour une instance de photo dans le panier
 */
export interface PhotoInstance {
  instanceKey: string
  id: string
  format: PhotoFormat
  withFrame: boolean
  displayQuantity: number
}

/**
 * Interface pour une adresse cadeau
 */
export interface GiftAddress {
  id: string
  firstName: string
  lastName: string
  address: string
  postalCode: string
  city: string
  country: string
}

/**
 * Interface pour la distribution des quantités par adresse
 */
export interface AddressDistribution {
  addressId: string | null  // null = "mon adresse"
  quantity: number
}

/**
 * Interface pour les détails de livraison par adresse
 */
export interface ShippingByAddressDetail {
  addressId: string | null
  addressName: string
  weight: number
  cost: number
}

/**
 * Calcule le poids d'une photo avec son emballage
 */
function calculatePhotoPackageWeight(format: PhotoFormat, withFrame: boolean): number {
  const photoWeight = ITEM_WEIGHTS.photos[format]
  const envelopeWeight = ITEM_WEIGHTS.envelopes[format]
  const nfcWeight = ITEM_WEIGHTS.nfc.chip + ITEM_WEIGHTS.nfc.label

  if (withFrame) {
    const pouchWeight = ITEM_WEIGHTS.pouches[format]
    const frameWeight = ITEM_WEIGHTS.frames[format]
    return photoWeight + envelopeWeight + pouchWeight + frameWeight + nfcWeight
  } else {
    return photoWeight + envelopeWeight + nfcWeight
  }
}

/**
 * Détermine le coût de livraison en fonction du poids
 */
function getShippingCostForWeight(weight: number): number {
  for (const tier of SHIPPING_BY_WEIGHT) {
    if (weight <= tier.maxWeight) {
      return tier.cost
    }
  }
  // Si le poids dépasse toutes les tranches, retourner le coût maximum
  return SHIPPING_BY_WEIGHT[SHIPPING_BY_WEIGHT.length - 1].cost
}

/**
 * Calcule les frais de livraison par adresse en fonction du poids total de chaque destination
 * @param photoInstances Liste des instances de photos dans le panier
 * @param photoAddressDistributions Répartition des quantités par adresse pour chaque instance
 * @param giftAddresses Liste des adresses cadeaux enregistrées
 */
export function calculateShippingByAddress(
  photoInstances: PhotoInstance[],
  photoAddressDistributions: Record<string, AddressDistribution[]>,
  giftAddresses: GiftAddress[]
): {
  total: number
  byAddress: ShippingByAddressDetail[]
} {
  // Grouper les poids par adresse
  const weightByAddress: Record<string, number> = {}

  // Pour chaque instance de photo dans le panier
  photoInstances.forEach(instance => {
    const distributions = photoAddressDistributions[instance.instanceKey] || []
    const packageWeight = calculatePhotoPackageWeight(instance.format, instance.withFrame)

    // Pour chaque distribution de cette instance
    distributions.forEach(dist => {
      const addressKey = dist.addressId || 'home'
      const totalWeight = packageWeight * dist.quantity

      if (!weightByAddress[addressKey]) {
        weightByAddress[addressKey] = 0
      }
      weightByAddress[addressKey] += totalWeight
    })
  })

  // Calculer le coût de livraison pour chaque adresse
  const shippingDetails: ShippingByAddressDetail[] = []
  let totalShipping = 0

  Object.entries(weightByAddress).forEach(([addressKey, weight]) => {
    const cost = getShippingCostForWeight(weight)

    let addressName = 'Mon adresse'
    let addressId: string | null = null

    if (addressKey !== 'home') {
      const giftAddress = giftAddresses.find(addr => addr.id === addressKey)
      if (giftAddress) {
        addressName = `${giftAddress.firstName} ${giftAddress.lastName}`
        addressId = giftAddress.id
      }
    }

    shippingDetails.push({
      addressId,
      addressName,
      weight: Math.round(weight), // Arrondir au gramme près
      cost
    })

    totalShipping += cost
  })

  // Trier : "Mon adresse" en premier, puis par ordre alphabétique
  shippingDetails.sort((a, b) => {
    if (a.addressId === null) return -1
    if (b.addressId === null) return 1
    return a.addressName.localeCompare(b.addressName)
  })

  return {
    total: totalShipping,
    byAddress: shippingDetails
  }
}