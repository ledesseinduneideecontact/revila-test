'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Frame, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import type { CartFormat } from '../CommanderWizardNew'

interface StepOptionsProps {
  cart: CartFormat[]
  onUpdateFrames: (frames: FrameSelection) => void
  onNext: () => void
}

export interface FrameSelection {
  '10x15': number
  '20x30': number
  '30x45': number
}

const FRAME_PRICES = {
  '10x15': 12.90,
  '20x30': 16.90,
  '30x45': 19.90
}

export default function StepOptions({ cart, onUpdateFrames, onNext }: StepOptionsProps) {
  const [frameQuantities, setFrameQuantities] = useState<FrameSelection>({
    '10x15': 0,
    '20x30': 0,
    '30x45': 0
  })

  // Calculer le nombre de photos par format (sans compter le carré)
  const photosByFormat = cart.reduce((acc, format) => {
    if (format.format !== 'carre') {
      const totalPhotos = format.photos.reduce((sum, photo) => sum + photo.quantity, 0)
      acc[format.format] = (acc[format.format] || 0) + totalPhotos
    }
    return acc
  }, {} as Record<string, number>)

  const hasSquareFormat = cart.some(f => f.format === 'carre')

  const updateQuantity = (format: keyof FrameSelection, delta: number) => {
    setFrameQuantities(prev => ({
      ...prev,
      [format]: Math.max(0, prev[format] + delta)
    }))
  }

  const calculateTotal = () => {
    return Object.entries(frameQuantities).reduce((total, [format, quantity]) => {
      const price = FRAME_PRICES[format as keyof typeof FRAME_PRICES] || 0
      return total + (price * quantity)
    }, 0)
  }

  const handleContinue = () => {
    onUpdateFrames(frameQuantities)
    onNext()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Sélection des cadres par format */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-center">Sublimez vos photos avec un cadre</h3>
        
        {/* Format 10x10 - Non disponible */}
        {hasSquareFormat && (
          <div className="bg-gray-50 rounded-xl p-6 text-center">
            <p className="text-gray-600">
              Format 10×10 cm : {cart.filter(f => f.format === 'carre').reduce((sum, f) => 
                sum + f.photos.reduce((s, p) => s + p.quantity, 0), 0
              )} photo(s)
            </p>
            <p className="text-sm text-gray-500 italic mt-2">Option cadre non disponible pour ce format</p>
          </div>
        )}

        {/* Grille des formats avec cadres */}
        <div className="w-[90vw] md:w-full mx-auto grid md:grid-cols-3 gap-6">
          {/* Format 10x15 */}
          {photosByFormat['10x15'] && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                <img 
                  src="/images/cadre-10x15-new.png"
                  alt="Cadre 10×15 cm"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Image exemple
                </div>
                <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded">
                  <span className="text-sm font-semibold">10×15 cm</span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">12.90€</div>
                </div>
                
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Cadre noir, sobre et élégant</li>
                  <li>✓ Vitre protectrice</li>
                  <li>✓ S'accroche ou se pose facilement</li>
                </ul>
                
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-600 text-center mb-2">
                    {photosByFormat['10x15']} photo(s) disponible(s)
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => updateQuantity('10x15', -1)}
                      disabled={frameQuantities['10x15'] === 0}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-12 text-center text-xl font-bold">
                      {frameQuantities['10x15']}
                    </span>
                    <button
                      onClick={() => updateQuantity('10x15', 1)}
                      className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Format 20x30 */}
          {photosByFormat['20x30'] && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                <img 
                  src="/images/cadre-20x30.png"
                  alt="Cadre 20×30 cm"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Image exemple
                </div>
                <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded">
                  <span className="text-sm font-semibold">20×30 cm</span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">16.90€</div>
                </div>
                
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Cadre noir, sobre et élégant</li>
                  <li>✓ Vitre protectrice</li>
                  <li>✓ S'accroche ou se pose facilement</li>
                </ul>
                
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-600 text-center mb-2">
                    {photosByFormat['20x30']} photo(s) disponible(s)
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => updateQuantity('20x30', -1)}
                      disabled={frameQuantities['20x30'] === 0}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-12 text-center text-xl font-bold">
                      {frameQuantities['20x30']}
                    </span>
                    <button
                      onClick={() => updateQuantity('20x30', 1)}
                      className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Format 30x45 */}
          {photosByFormat['30x45'] && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                <img 
                  src="/images/cadre-30x45.png"
                  alt="Cadre 30×45 cm"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  Image exemple
                </div>
                <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded">
                  <span className="text-sm font-semibold">30×45 cm</span>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">19.90€</div>
                </div>
                
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ Cadre noir, sobre et élégant</li>
                  <li>✓ Vitre protectrice</li>
                  <li>✓ S'accroche ou se pose facilement</li>
                </ul>
                
                <div className="border-t pt-3">
                  <div className="text-sm text-gray-600 text-center mb-2">
                    {photosByFormat['30x45']} photo(s) disponible(s)
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => updateQuantity('30x45', -1)}
                      disabled={frameQuantities['30x45'] === 0}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="w-12 text-center text-xl font-bold">
                      {frameQuantities['30x45']}
                    </span>
                    <button
                      onClick={() => updateQuantity('30x45', 1)}
                      className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Bouton continuer */}
      <div className="flex justify-center">
        <Button
          onClick={handleContinue}
          className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-lg"
        >
          Continuer vers le panier
        </Button>
      </div>
    </div>
  )
}