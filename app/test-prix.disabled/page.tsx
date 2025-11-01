'use client'

import { useState } from 'react'
import { calculateOrderPricing, CartItemPricing, PhotoFormat, BASE_PRICES_TTC, BASE_PRICES_HT, PRODUCTION_COSTS, DISCOUNT_TIERS, SHIPPING_COSTS } from '@/lib/pricing'
import { Plus, Minus, Tag, Package, Euro, Percent } from 'lucide-react'

export default function TestPrix() {
  const [items, setItems] = useState<CartItemPricing[]>([])
  const [showDetails, setShowDetails] = useState(true)
  
  const addItem = (format: PhotoFormat, withFrame: boolean) => {
    const basePrice = BASE_PRICES_TTC.photos[format]
    const framePrice = withFrame && format !== 'carre' ? BASE_PRICES_TTC.frames[format as keyof typeof BASE_PRICES_TTC.frames] : undefined
    
    setItems([...items, {
      format,
      withFrame,
      quantity: 1,
      basePrice,
      discountedPrice: basePrice,
      framePrice
    }])
  }
  
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }
  
  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return
    const newItems = [...items]
    newItems[index].quantity = newQuantity
    setItems(newItems)
  }
  
  const pricing = items.length > 0 ? calculateOrderPricing(items) : null
  
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">📊 Système de Prix Complet - REVIVE</h1>
        
        {/* Tableaux de référence */}
        <div className="mb-8 space-y-6">
          {/* Prix de base */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Euro className="w-5 h-5" />
              Prix de Base (TTC)
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 text-blue-600">📸 Photos</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Format</th>
                      <th className="text-right p-2">Prix HT</th>
                      <th className="text-right p-2">Prix TTC</th>
                      <th className="text-right p-2">Coût prod.</th>
                      <th className="text-right p-2">Marge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(BASE_PRICES_TTC.photos).map(([format, priceTTC]) => {
                      const priceHT = BASE_PRICES_HT.photos[format as PhotoFormat]
                      const cost = PRODUCTION_COSTS.photos[format as PhotoFormat]
                      const margin = ((priceHT - cost) / priceHT * 100).toFixed(0)
                      return (
                        <tr key={format} className="border-b">
                          <td className="p-2">{format === 'carre' ? 'Carrée' : format}</td>
                          <td className="text-right p-2">{priceHT.toFixed(2)}€</td>
                          <td className="text-right p-2 font-semibold">{priceTTC.toFixed(2)}€</td>
                          <td className="text-right p-2 text-gray-500">{cost.toFixed(2)}€</td>
                          <td className="text-right p-2 text-green-600">{margin}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              <div>
                <h3 className="font-medium mb-2 text-purple-600">🖼️ Cadres</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2">Format</th>
                      <th className="text-right p-2">Prix TTC</th>
                      <th className="text-right p-2">Coût</th>
                      <th className="text-right p-2">Marge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(BASE_PRICES_TTC.frames).map(([format, price]) => {
                      const cost = PRODUCTION_COSTS.frames[format as keyof typeof PRODUCTION_COSTS.frames]
                      const margin = ((price - cost) / price * 100).toFixed(0)
                      return (
                        <tr key={format} className="border-b">
                          <td className="p-2">{format}</td>
                          <td className="text-right p-2 font-semibold">{price.toFixed(2)}€</td>
                          <td className="text-right p-2 text-gray-500">{cost.toFixed(2)}€</td>
                          <td className="text-right p-2 text-green-600">{margin}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          {/* Paliers de réduction */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Percent className="w-5 h-5" />
              Paliers de Réduction
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-3 text-orange-600">🎯 Offre Spéciale</h3>
                <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">2ème photo identique</span>
                    <span className="text-2xl font-bold text-orange-600">-50%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Appliqué par format (ex: 2 photos 10x15 = 2ème à -50%)
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-3 text-green-600">📈 Réductions Volume</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span>5-9 unités</span>
                    <span className="font-semibold text-green-600">-{(DISCOUNT_TIERS.tier1 * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span>10-49 unités</span>
                    <span className="font-semibold text-green-600">-{(DISCOUNT_TIERS.tier2 * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span>50-99 unités</span>
                    <span className="font-semibold text-green-600">-{(DISCOUNT_TIERS.tier3 * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between p-2 bg-green-50 rounded">
                    <span>100+ unités</span>
                    <span className="font-semibold text-green-600">-{(DISCOUNT_TIERS.tier4 * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  ⚠️ Appliqué sur le total (photos + cadres) après l'offre duo
                </p>
              </div>
            </div>
          </div>
          
          {/* Frais de livraison */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Frais de Livraison
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Frais fixes</h3>
                <p className="text-2xl font-bold text-blue-600">{SHIPPING_COSTS.fixed}€</p>
                <p className="text-sm text-gray-600">Pour toute commande</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Lettres</h3>
                <ul className="text-sm space-y-1">
                  <li>≤20g: {SHIPPING_COSTS.letter.under20g}€</li>
                  <li>≤100g: {SHIPPING_COSTS.letter.under100g}€</li>
                </ul>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium mb-2">Colis</h3>
                <ul className="text-sm space-y-1">
                  <li>Base: {SHIPPING_COSTS.parcel.base}€</li>
                  <li>≤500g: {SHIPPING_COSTS.parcel.under500g}€</li>
                  <li>≤1kg: {SHIPPING_COSTS.parcel.under1kg}€</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Simulateur */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Ajout de produits */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">🛒 Simulateur de Commande</h2>
            
            <div className="space-y-4">
              {Object.entries(BASE_PRICES_TTC.photos).map(([format, price]) => (
                <div key={format} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">
                      {format === 'carre' ? 'Photo Carrée' : `Photo ${format}`}
                    </span>
                    <span className="text-gray-600">{price.toFixed(2)}€</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addItem(format as PhotoFormat, false)}
                      className="flex-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                    >
                      Sans cadre
                    </button>
                    {format !== 'carre' && (
                      <button
                        onClick={() => addItem(format as PhotoFormat, true)}
                        className="flex-1 bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 text-sm"
                      >
                        Avec cadre (+{BASE_PRICES_TTC.frames[format as keyof typeof BASE_PRICES_TTC.frames]}€)
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Panier et calculs */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">💳 Calcul en Temps Réel</h2>
            
            {items.length === 0 ? (
              <p className="text-gray-500">Ajoutez des photos pour voir les calculs</p>
            ) : (
              <>
                {/* Liste des articles */}
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border rounded p-2">
                      <div className="flex-1">
                        <span className="font-medium">
                          {item.format === 'carre' ? 'Carrée' : item.format}
                        </span>
                        {item.withFrame && <span className="ml-2 text-sm text-purple-600">+cadre</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeItem(index)}
                          className="ml-2 text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Calculs détaillés */}
                {pricing && (
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Quantité totale:</span>
                      <span className="font-semibold">{pricing.totalQuantity} photos</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Sous-total original:</span>
                      <span>{pricing.subtotal.toFixed(2)}€</span>
                    </div>
                    
                    {pricing.duoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          Offre Duo (2ème à -50%)
                        </span>
                        <span className="font-semibold">-{pricing.duoDiscount.toFixed(2)}€</span>
                      </div>
                    )}
                    
                    {pricing.tierDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {pricing.appliedTier}
                        </span>
                        <span className="font-semibold">-{pricing.tierDiscount.toFixed(2)}€</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="flex flex-col">
                        <span>Livraison:</span>
                        <span className="text-xs text-gray-500">{pricing.shippingDetails}</span>
                      </span>
                      <span>{pricing.shipping.toFixed(2)}€</span>
                    </div>
                    
                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                      <span>Total TTC:</span>
                      <span className="text-orange-600">{pricing.total.toFixed(2)}€</span>
                    </div>
                    
                    {(pricing.duoDiscount + pricing.tierDiscount) > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                        <span className="text-green-700 font-semibold">
                          💰 Économie totale: {(pricing.duoDiscount + pricing.tierDiscount).toFixed(2)}€
                        </span>
                        <div className="text-xs text-gray-600 mt-1">
                          soit {((pricing.duoDiscount + pricing.tierDiscount) / pricing.subtotal * 100).toFixed(0)}% de réduction
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Exemples de scénarios */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📝 Exemples de Calculs</h2>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 bg-orange-50">
              <h3 className="font-medium mb-2 text-orange-600">Offre Duo Simple</h3>
              <p className="text-sm text-gray-600 mb-2">2x Photo 10x15 sans cadre</p>
              <ul className="text-sm space-y-1">
                <li>1ère: 11.40€</li>
                <li className="text-green-600">2ème: 5.70€ (-50%)</li>
                <li className="border-t pt-1 font-semibold">Total: 20.09€</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4 bg-purple-50">
              <h3 className="font-medium mb-2 text-purple-600">Duo + Cadres</h3>
              <p className="text-sm text-gray-600 mb-2">2x 10x15 avec cadre</p>
              <ul className="text-sm space-y-1">
                <li>1er: 27.50€</li>
                <li className="text-green-600">2ème: 13.75€ (-50%)</li>
                <li>Livraison: 7.35€ (colis)</li>
                <li className="border-t pt-1 font-semibold">Total: 48.60€</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="font-medium mb-2 text-green-600">Volume Moyen</h3>
              <p className="text-sm text-gray-600 mb-2">10 photos mixtes</p>
              <ul className="text-sm space-y-1">
                <li>Offre duo appliquée</li>
                <li className="text-green-600">-25% sur tout</li>
                <li className="border-t pt-1 font-semibold">Économie ~30-40%</li>
              </ul>
            </div>
            
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="font-medium mb-2 text-blue-600">Gros Volume</h3>
              <p className="text-sm text-gray-600 mb-2">100+ photos</p>
              <ul className="text-sm space-y-1">
                <li>Offre duo sur paires</li>
                <li className="text-green-600">-45% supplémentaire</li>
                <li className="border-t pt-1 font-semibold">Prix ultra compétitif</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
            <p className="text-sm">
              <strong>💡 Stratégie de prix:</strong> L'offre duo incite à l'achat de 2 photos minimum. 
              Les paliers de volume s'appliquent sur le total (photos + cadres) après l'offre duo, 
              maximisant l'attractivité tout en préservant les marges.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}