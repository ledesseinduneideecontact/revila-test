'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Frame, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import type { CartFormat } from '../CommanderWizardNew'
import {
  generateFrameMockup,
  createMockupPreviewUrl,
  revokeMockupPreviewUrl,
  type FrameFormat,
  type PhotoOrientation
} from '@/lib/mockup-generator'

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

  // State for generated mockup previews
  const [mockupPreviews, setMockupPreviews] = useState<{
    '10x15': string | null
    '20x30': string | null
    '30x45': string | null
  }>({
    '10x15': null,
    '20x30': null,
    '30x45': null
  })

  // Loading states per format
  const [mockupLoading, setMockupLoading] = useState<{
    '10x15': boolean
    '20x30': boolean
    '30x45': boolean
  }>({
    '10x15': false,
    '20x30': false,
    '30x45': false
  })

  // Error states per format
  const [mockupErrors, setMockupErrors] = useState<{
    '10x15': string | null
    '20x30': string | null
    '30x45': string | null
  }>({
    '10x15': null,
    '20x30': null,
    '30x45': null
  })

  // Calculer le nombre de photos par format
  const photosByFormat = cart.reduce((acc, format) => {
    const totalPhotos = format.photos.reduce((sum, photo) => sum + photo.quantity, 0)
    acc[format.format] = (acc[format.format] || 0) + totalPhotos
    return acc
  }, {} as Record<string, number>)

  /**
   * Retrieves the first photo for a given format from the cart
   * Prefers photos with photoFile (cropped), falls back to originalPhotoFile
   */
  const getFirstPhotoForFormat = (format: FrameFormat): {
    blob: Blob | null
    orientation: PhotoOrientation
  } | null => {
    // Find the cart entry for this format
    const cartEntry = cart.find(item => item.format === format)

    if (!cartEntry || cartEntry.photos.length === 0) {
      return null
    }

    // Get the first photo
    const firstPhoto = cartEntry.photos[0]

    // Prefer cropped photo, fallback to original
    const photoBlob = firstPhoto.photoFile || firstPhoto.originalPhotoFile

    if (!photoBlob) {
      return null
    }

    // Determine orientation from cropConfig, default to portrait
    const orientation: PhotoOrientation =
      firstPhoto.cropConfig?.orientation === 'landscape' ? 'landscape' : 'portrait'

    return {
      blob: photoBlob,
      orientation
    }
  }

  const updateQuantity = (format: keyof FrameSelection, delta: number) => {
    setFrameQuantities(prev => ({
      ...prev,
      [format]: Math.max(0, prev[format] + delta)
    }))
  }

  /**
   * Generate mockups when component mounts or cart changes
   * Creates preview for first photo of each format in cart
   */
  useEffect(() => {
    const formats: FrameFormat[] = ['10x15', '20x30', '30x45']

    // Generate mockups for each format that has photos
    formats.forEach(async (format) => {
      // Skip if format has no photos
      if (!photosByFormat[format]) {
        return
      }

      // Skip if already generated successfully
      if (mockupPreviews[format]) {
        return
      }

      // Get first photo for this format
      const photoData = getFirstPhotoForFormat(format)

      if (!photoData) {
        console.warn(`No photo available for format ${format}`)
        return
      }

      // Set loading state
      setMockupLoading(prev => ({ ...prev, [format]: true }))
      setMockupErrors(prev => ({ ...prev, [format]: null }))

      try {
        // Generate the mockup
        const mockupBlob = await generateFrameMockup(
          photoData.blob,
          format,
          photoData.orientation
        )

        // Create preview URL
        const previewUrl = createMockupPreviewUrl(mockupBlob)

        // Update state
        setMockupPreviews(prev => ({ ...prev, [format]: previewUrl }))

        console.log(`✅ Mockup generated for ${format}`)
      } catch (error) {
        console.error(`Error generating mockup for ${format}:`, error)
        setMockupErrors(prev => ({
          ...prev,
          [format]: 'Impossible de générer l\'aperçu'
        }))
      } finally {
        setMockupLoading(prev => ({ ...prev, [format]: false }))
      }
    })

    // Cleanup function: revoke blob URLs when component unmounts or cart changes
    return () => {
      Object.values(mockupPreviews).forEach(url => {
        if (url) {
          revokeMockupPreviewUrl(url)
        }
      })
    }
  }, [cart, photosByFormat])

  /**
   * Cleanup blob URLs when component unmounts
   */
  useEffect(() => {
    return () => {
      // Revoke all preview URLs to free memory
      Object.values(mockupPreviews).forEach(url => {
        if (url) {
          revokeMockupPreviewUrl(url)
        }
      })
    }
  }, [])

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

        {/* Grille des formats avec cadres */}
        <div className="w-[90vw] md:w-full mx-auto grid md:grid-cols-3 gap-6">
          {/* Format 10x15 */}
          {photosByFormat['10x15'] && (
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="aspect-square bg-gray-100 relative">
                {/* Show loading state */}
                {mockupLoading['10x15'] && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  </div>
                )}

                {/* Show error state with fallback to static image */}
                {mockupErrors['10x15'] && !mockupLoading['10x15'] && (
                  <img
                    src="/images/cadre-10x15-new.png"
                    alt="Cadre 10×15 cm"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Show generated mockup */}
                {!mockupLoading['10x15'] && !mockupErrors['10x15'] && mockupPreviews['10x15'] ? (
                  <img
                    src={mockupPreviews['10x15']}
                    alt="Aperçu de votre photo encadrée 10×15 cm"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Fallback to static image while generating
                  !mockupLoading['10x15'] && (
                    <img
                      src="/images/cadre-10x15-new.png"
                      alt="Cadre 10×15 cm"
                      className="w-full h-full object-cover"
                    />
                  )
                )}

                {/* Status badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {mockupPreviews['10x15'] ? 'Votre photo' : 'Image exemple'}
                </div>

                {/* Format label */}
                <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded">
                  <span className="text-sm font-semibold">10×15 cm</span>
                </div>

                {/* Error indicator (optional) */}
                {mockupErrors['10x15'] && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Aperçu indisponible
                  </div>
                )}
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
                {/* Show loading state */}
                {mockupLoading['20x30'] && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  </div>
                )}

                {/* Show error state with fallback to static image */}
                {mockupErrors['20x30'] && !mockupLoading['20x30'] && (
                  <img
                    src="/images/cadre-20x30.png"
                    alt="Cadre 20×30 cm"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Show generated mockup */}
                {!mockupLoading['20x30'] && !mockupErrors['20x30'] && mockupPreviews['20x30'] ? (
                  <img
                    src={mockupPreviews['20x30']}
                    alt="Aperçu de votre photo encadrée 20×30 cm"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Fallback to static image while generating
                  !mockupLoading['20x30'] && (
                    <img
                      src="/images/cadre-20x30.png"
                      alt="Cadre 20×30 cm"
                      className="w-full h-full object-cover"
                    />
                  )
                )}

                {/* Status badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {mockupPreviews['20x30'] ? 'Votre photo' : 'Image exemple'}
                </div>

                {/* Format label */}
                <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded">
                  <span className="text-sm font-semibold">20×30 cm</span>
                </div>

                {/* Error indicator (optional) */}
                {mockupErrors['20x30'] && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Aperçu indisponible
                  </div>
                )}
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
                {/* Show loading state */}
                {mockupLoading['30x45'] && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                  </div>
                )}

                {/* Show error state with fallback to static image */}
                {mockupErrors['30x45'] && !mockupLoading['30x45'] && (
                  <img
                    src="/images/cadre-30x45.png"
                    alt="Cadre 30×45 cm"
                    className="w-full h-full object-cover"
                  />
                )}

                {/* Show generated mockup */}
                {!mockupLoading['30x45'] && !mockupErrors['30x45'] && mockupPreviews['30x45'] ? (
                  <img
                    src={mockupPreviews['30x45']}
                    alt="Aperçu de votre photo encadrée 30×45 cm"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  // Fallback to static image while generating
                  !mockupLoading['30x45'] && (
                    <img
                      src="/images/cadre-30x45.png"
                      alt="Cadre 30×45 cm"
                      className="w-full h-full object-cover"
                    />
                  )
                )}

                {/* Status badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                  {mockupPreviews['30x45'] ? 'Votre photo' : 'Image exemple'}
                </div>

                {/* Format label */}
                <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded">
                  <span className="text-sm font-semibold">30×45 cm</span>
                </div>

                {/* Error indicator (optional) */}
                {mockupErrors['30x45'] && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white px-2 py-1 rounded text-xs">
                    Aperçu indisponible
                  </div>
                )}
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