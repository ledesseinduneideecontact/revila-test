'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Frame, Square, Search } from 'lucide-react'

interface StepFormatProps {
  onSelect: (format: '10x15' | '20x30' | '30x45') => void
}

import { BASE_PRICES_TTC } from '@/lib/pricing'

const formats = [
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

// Images pour le carousel mariage
const mariageCarouselImages = [
  "/frontend-pictures/modele-mariage/mariage/modele-1.png",
  "/frontend-pictures/modele-mariage/mariage/modele-2.png",
  "/frontend-pictures/modele-mariage/mariage/modele-3.png",
  "/frontend-pictures/modele-mariage/mariage/mariage-modele-5/1.png",
  "/frontend-pictures/modele-mariage/mariage/mariage-modele-6.png",
  "/frontend-pictures/modele-mariage/mariage/mariage-modele-7/1.png"
]

// Images pour le carousel naissance
const naissanceCarouselImages = [
  "/frontend-pictures/modele-naissance/faire-part-1/gabriel-recto.png",
  "/frontend-pictures/modele-naissance/faire-part-2/camilla-recto.png",
  "/frontend-pictures/modele-naissance/faire-part-3/agathe-recto.png",
  "/frontend-pictures/modele-naissance/agathe-recto.png"
]

export default function StepFormat({ onSelect }: StepFormatProps) {
  const [selected, setSelected] = useState<string | null>(null)

  // États pour les carousels
  const [currentMariageImageIndex, setCurrentMariageImageIndex] = useState(0)
  const [currentNaissanceImageIndex, setCurrentNaissanceImageIndex] = useState(0)
  const [mariageDelay] = useState(() => Math.random() * 3000)
  const [naissanceDelay] = useState(() => Math.random() * 3000)

  const handleSelect = (format: '10x15' | '20x30' | '30x45') => {
    setSelected(format)
    setTimeout(() => onSelect(format), 300) // Petit délai pour voir la sélection
  }

  // Rotation automatique du carousel mariage (toutes les 6 secondes)
  useEffect(() => {
    let interval: NodeJS.Timeout
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setCurrentMariageImageIndex((prev) => {
          // Infinite scroll: revenir à 0 après la dernière image
          return prev === mariageCarouselImages.length ? 0 : prev + 1
        })
      }, 6000)
    }, mariageDelay)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [mariageDelay])

  // Rotation automatique du carousel naissance (toutes les 6 secondes)
  useEffect(() => {
    let interval: NodeJS.Timeout
    const timeout = setTimeout(() => {
      interval = setInterval(() => {
        setCurrentNaissanceImageIndex((prev) => {
          // Infinite scroll: revenir à 0 après la dernière image
          return prev === naissanceCarouselImages.length ? 0 : prev + 1
        })
      }, 6000)
    }, naissanceDelay)

    return () => {
      clearTimeout(timeout)
      if (interval) clearInterval(interval)
    }
  }, [naissanceDelay])

  return (
    <div className="space-y-8">
      {/* Titre et description */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choisissez votre format</h2>
      </div>

      {/* Grille de sélection - Formats disponibles */}
      <div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {formats.map((format) => (
            <button
              key={`${format.size}`}
              onClick={() => handleSelect(format.size as '10x15' | '20x30' | '30x45')}
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
                        width: `${Math.min(format.width * 4, 150)}px`,
                        height: `${Math.min(format.height * 4, 100)}px`,
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

      {/* Section Modèles de faire-part */}
      <div className="mt-12 space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Besoin d'inspiration ?</h3>
          <p className="text-gray-600">Découvrez nos modèles gratuits</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Carousel Mariage */}
          <Link
            href="/modele-mariage"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden">
              <div className="h-52 px-4 py-6 relative overflow-hidden">
                <div
                  className="flex ease-in-out"
                  style={{
                    transform: `translateX(-${currentMariageImageIndex * 100}%)`,
                    transition: currentMariageImageIndex === 0 ? 'none' : 'transform 1000ms ease-in-out'
                  }}
                >
                  {[...mariageCarouselImages, mariageCarouselImages[0]].map((src, idx) => (
                    <div key={idx} className="flex-shrink-0 w-full h-full flex items-center justify-center">
                      <Image
                        src={src}
                        alt={`Modèle mariage ${idx + 1}`}
                        width={300}
                        height={200}
                        className="object-contain max-h-40"
                      />
                    </div>
                  ))}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-3">
                    <Search className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-b from-white to-pink-50">
                <h4 className="font-semibold text-gray-900 text-center">Mariage</h4>
                <p className="text-sm text-gray-600 text-center mt-1">Cliquez pour découvrir nos modèles</p>
              </div>
            </div>
          </Link>

          {/* Carousel Naissance */}
          <Link
            href="/modele-naissance"
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden">
              <div className="h-52 px-4 py-6 relative overflow-hidden">
                <div
                  className="flex ease-in-out"
                  style={{
                    transform: `translateX(-${currentNaissanceImageIndex * 100}%)`,
                    transition: currentNaissanceImageIndex === 0 ? 'none' : 'transform 1000ms ease-in-out'
                  }}
                >
                  {[...naissanceCarouselImages, naissanceCarouselImages[0]].map((src, idx) => (
                    <div key={idx} className="flex-shrink-0 w-full h-full flex items-center justify-center">
                      <Image
                        src={src}
                        alt={`Modèle naissance ${idx + 1}`}
                        width={300}
                        height={200}
                        className="object-contain max-h-40"
                      />
                    </div>
                  ))}
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-3">
                    <Search className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gradient-to-b from-white to-blue-50">
                <h4 className="font-semibold text-gray-900 text-center">Naissance</h4>
                <p className="text-sm text-gray-600 text-center mt-1">Cliquez pour découvrir nos modèles</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}