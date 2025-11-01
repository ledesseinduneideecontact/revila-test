'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Frame, Square } from 'lucide-react'

interface StepFormatProps {
  onSelect: (format: 'carre' | '10x15' | '20x30' | '30x45') => void
}

import { BASE_PRICES_TTC } from '@/lib/pricing'

const formats = [
  { 
    size: 'carre', 
    displayName: 'Style rétro',
    description: '10×10 cm',
    width: 10, 
    height: 10, 
    scale: 1,
    isPolaroid: true,
    hasFrame: false,
    icon: Square
  },
  { 
    size: '10x15', 
    displayName: 'Classique',
    description: '10×15 cm',
    width: 15, 
    height: 10, 
    scale: 1,
    isPolaroid: false,
    hasFrame: true,
    icon: null
  },
  { 
    size: '20x30', 
    displayName: 'Moyen',
    description: '20×30 cm',
    width: 30, 
    height: 20, 
    scale: 1.2,
    isPolaroid: false,
    hasFrame: true,
    icon: null
  },
  { 
    size: '30x45', 
    displayName: 'Grand',
    description: '30×45 cm',
    width: 45, 
    height: 30, 
    scale: 1.5,
    isPolaroid: false,
    hasFrame: true,
    icon: null
  }
]

const prices = {
  'carre': { 
    withoutFrame: BASE_PRICES_TTC.photos['carre'], 
    withFrame: BASE_PRICES_TTC.photos['carre'] // Pas de cadre pour le format carré
  },
  '10x15': { 
    withoutFrame: BASE_PRICES_TTC.photos['10x15'], 
    withFrame: BASE_PRICES_TTC.photos['10x15'] + BASE_PRICES_TTC.frames['10x15'] 
  },
  '20x30': { 
    withoutFrame: BASE_PRICES_TTC.photos['20x30'], 
    withFrame: BASE_PRICES_TTC.photos['20x30'] + BASE_PRICES_TTC.frames['20x30'] 
  },
  '30x45': { 
    withoutFrame: BASE_PRICES_TTC.photos['30x45'], 
    withFrame: BASE_PRICES_TTC.photos['30x45'] + BASE_PRICES_TTC.frames['30x45'] 
  }
}

export default function StepFormat({ onSelect }: StepFormatProps) {
  const [selected, setSelected] = useState<string | null>(null)

  const handleSelect = (format: 'carre' | '10x15' | '20x30' | '30x45') => {
    setSelected(format)
    setTimeout(() => onSelect(format), 300) // Petit délai pour voir la sélection
  }

  return (
    <div className="space-y-8">
      {/* Titre et description */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choisissez votre format</h2>
      </div>

      {/* Grille de sélection - Formats disponibles */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {formats.map((format) => (
            <button
              key={`${format.size}`}
              onClick={() => handleSelect(format.size as 'carre' | '10x15' | '20x30' | '30x45')}
              className={`group relative bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 hover:-translate-y-1 ${
                selected === format.size ? 'ring-2 ring-orange-500 shadow-orange-200' : ''
              }`}
            >
              {/* Badge sélection */}
              {selected === format.size && (
                <div className="absolute -top-2 -right-2 z-10 bg-orange-500 rounded-full p-1.5 shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* Zone image avec hauteur fixe */}
              <div className="h-40 px-8 py-6 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-t-xl relative overflow-visible">
                <div className="relative">
                  {format.isPolaroid ? (
                    // Style Polaroid pour le format carré
                    <div 
                      className="bg-white shadow-md transition-transform group-hover:scale-105" 
                      style={{ 
                        padding: '6px 6px 18px 6px',
                        width: `${80 * format.scale}px`
                      }}
                    >
                      <div 
                        className="bg-gray-200"
                        style={{
                          width: `${68 * format.scale}px`,
                          height: `${68 * format.scale}px`,
                          backgroundImage: 'url(/image-montagne.webp)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      />
                    </div>
                  ) : (
                    // Style normal pour les autres formats
                    <div 
                      className="bg-gray-200 shadow-sm transition-transform group-hover:scale-105"
                      style={{
                        width: `${Math.min(format.width * 3, 120)}px`,
                        height: `${Math.min(format.height * 3, 80)}px`,
                        backgroundImage: 'url(/image-montagne.webp)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                  )}
                  
                  {/* Cotations - largeur (horizontale) */}
                  <div className="absolute -top-7 left-0 right-0 text-center">
                    <span className="text-xs text-gray-500 bg-white/90 px-1.5 py-0.5 rounded shadow-sm">
                      {format.width} cm
                    </span>
                  </div>
                  
                  {/* Cotations - hauteur (verticale) */}
                  {!format.isPolaroid && (
                    <div className="absolute top-1/2 -translate-y-1/2 -left-10">
                      <span className="text-xs text-gray-500 bg-white/90 px-1.5 py-0.5 rounded shadow-sm inline-block -rotate-90 origin-center">
                        {format.height} cm
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Informations avec hauteur fixe */}
              <div className="p-4 border-t bg-gradient-to-b from-white to-blue-50 rounded-b-xl">
                <h4 className="font-semibold text-gray-900 flex items-center justify-center gap-1">
                  {format.displayName}
                </h4>
                <p className="text-xs text-gray-600 mt-0.5">{format.description}</p>
                <div className="mt-2">
                  <p className="text-lg font-bold text-orange-600">
                    {prices[format.size as keyof typeof prices].withoutFrame.toFixed(2)}€
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}