'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, ShoppingBag, ShoppingCart, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CartFormat } from '../CommanderWizardNew'
import { generateFrameMockup, revokeFrameMockupURL } from '@/lib/frameMockupGenerator'

interface StepOptionsProps {
  cart: CartFormat[]
  onUpdateFrames: (frames: FrameSelection) => void
  onNext: () => void
  onAddFormat?: () => void
  onBack?: () => void  // Retour vers Ma Galerie
  initialFrameSelections?: Record<string, number>  // Sélections existantes pour persistance
  onUpdatePhotoFrames?: (selections: Record<string, number>) => void  // Callback pour sauvegarder
}

export interface FrameSelection {
  '10x15': number
  '20x30': number
  '30x45': number
}

interface PhotoWithFrameMockup {
  photoId: string
  format: string
  frameMockupUrl: string | null
  isLoading: boolean
}

// Prix des cadres par format
const FRAME_PRICES = {
  '10x15': 12.90,
  '20x30': 16.90,
  '30x45': 19.90
}

export default function StepOptions({ cart, onNext, onAddFormat, onBack, onUpdateFrames, initialFrameSelections, onUpdatePhotoFrames }: StepOptionsProps) {
  const [frameMockups, setFrameMockups] = useState<PhotoWithFrameMockup[]>([])
  const [isGenerating, setIsGenerating] = useState(true)
  // État pour le nombre de cadres sélectionnés par photo (initialisé depuis props pour persistance)
  const [frameSelections, setFrameSelections] = useState<Record<string, number>>(initialFrameSelections || {})

  // Sauvegarder les sélections de cadres à chaque changement
  useEffect(() => {
    if (onUpdatePhotoFrames) {
      onUpdatePhotoFrames(frameSelections)
    }
  }, [frameSelections, onUpdatePhotoFrames])

  // Générer les mockups de cadres pour toutes les photos du panier
  useEffect(() => {
    const generateAllMockups = async () => {
      setIsGenerating(true)
      const mockups: PhotoWithFrameMockup[] = []

      for (const cartFormat of cart) {
        for (const photo of cartFormat.photos) {
          // Déterminer l'orientation de la photo
          const orientation = (photo as any).cropConfig?.orientation || 'portrait'

          try {
            // Générer le mockup de cadre
            const mockupUrl = await generateFrameMockup(
              photo.photoPreview,
              cartFormat.format as '10x15' | '20x30' | '30x45',
              orientation
            )

            mockups.push({
              photoId: photo.id,
              format: cartFormat.format,
              frameMockupUrl: mockupUrl,
              isLoading: false
            })
          } catch (error) {
            console.error(`Erreur lors de la génération du mockup pour photo ${photo.id}:`, error)
            mockups.push({
              photoId: photo.id,
              format: cartFormat.format,
              frameMockupUrl: null,
              isLoading: false
            })
          }
        }
      }

      setFrameMockups(mockups)
      setIsGenerating(false)
    }

    generateAllMockups()

    // Cleanup: nettoyer les Blob URLs lors du démontage du composant
    return () => {
      frameMockups.forEach(mockup => {
        if (mockup.frameMockupUrl) {
          revokeFrameMockupURL(mockup.frameMockupUrl)
        }
      })
    }
  }, [cart])

  // Regrouper les mockups par format
  const mockupsByFormat = frameMockups.reduce((acc, mockup) => {
    if (!acc[mockup.format]) {
      acc[mockup.format] = []
    }
    acc[mockup.format].push(mockup)
    return acc
  }, {} as Record<string, PhotoWithFrameMockup[]>)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Bouton retour */}
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Retour à ma galerie</span>
        </button>
      )}

      {/* Titre */}
      <div className="text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
          Aperçu de vos photos encadrées
        </h2>
        <p className="text-gray-600 mt-2">
          Découvrez le rendu de vos photos magiques dans leurs cadres
        </p>
      </div>

      {/* État de chargement */}
      {isGenerating && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600">Génération des aperçus de cadres...</p>
        </div>
      )}

      {/* Galerie des mockups par format */}
      {!isGenerating && (
        <div className="space-y-8">
          {Object.entries(mockupsByFormat).map(([format, mockups]) => (
            <div key={format} className="space-y-4">
              {/* En-tête du format */}
              <div className="border-b pb-2">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-xl font-semibold text-gray-800">
                    Format {format.replace('x', '×')} cm
                  </h3>
                  <span className="text-sm text-orange-600 font-medium">
                    {FRAME_PRICES[format as keyof typeof FRAME_PRICES]?.toFixed(2)}€/cadre
                  </span>
                </div>
              </div>

              {/* Grille des photos encadrées */}
              <div className="w-[90vw] md:w-full mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockups.map((mockup) => {
                  // Trouver la photo correspondante dans le panier
                  const photo = cart
                    .flatMap(cf => cf.photos)
                    .find(p => p.id === mockup.photoId)

                  return (
                    <div key={mockup.photoId} className="bg-white rounded-xl shadow-lg overflow-hidden">
                      {/* Aperçu du mockup de cadre */}
                      <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                        {mockup.isLoading && (
                          <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                            <p className="text-sm text-gray-500 mt-2">Chargement...</p>
                          </div>
                        )}
                        {!mockup.isLoading && mockup.frameMockupUrl && (
                          <img
                            src={mockup.frameMockupUrl}
                            alt="Photo encadrée"
                            className={
                              mockup.format === '10x15'
                                ? 'w-full h-full object-cover'
                                : 'max-w-full max-h-full object-contain'
                            }
                          />
                        )}
                        {!mockup.isLoading && !mockup.frameMockupUrl && (
                          <div className="text-center p-4">
                            <p className="text-sm text-red-500">Erreur de génération</p>
                          </div>
                        )}
                      </div>

                      {/* Informations sur la photo */}
                      <div className="p-4 space-y-3">
                        {photo?.message && (
                          <div className="text-xs text-gray-600 italic">
                            "{photo.message}"
                            {photo.signature && <span className="block mt-1">- {photo.signature}</span>}
                          </div>
                        )}

                        {/* Sélecteur de cadres */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => {
                                const currentSelection = frameSelections[mockup.photoId] || 0
                                if (currentSelection > 0) {
                                  setFrameSelections(prev => ({
                                    ...prev,
                                    [mockup.photoId]: currentSelection - 1
                                  }))
                                }
                              }}
                              disabled={(frameSelections[mockup.photoId] || 0) === 0}
                              className="w-10 h-10 rounded-full border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-300 disabled:hover:bg-transparent transition-colors"
                            >
                              <Minus className="w-5 h-5 text-gray-700" />
                            </button>

                            <div className="min-w-[80px] text-center">
                              <div className="text-2xl font-bold text-gray-900">
                                {frameSelections[mockup.photoId] || 0}/{photo?.quantity || 1}
                              </div>
                              <div className="text-xs text-gray-500">
                                cadre{((frameSelections[mockup.photoId] || 0) > 1) ? 's' : ''}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const currentSelection = frameSelections[mockup.photoId] || 0
                                const maxQuantity = photo?.quantity || 1
                                if (currentSelection < maxQuantity) {
                                  setFrameSelections(prev => ({
                                    ...prev,
                                    [mockup.photoId]: currentSelection + 1
                                  }))
                                }
                              }}
                              disabled={(frameSelections[mockup.photoId] || 0) >= (photo?.quantity || 1)}
                              className="w-10 h-10 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-orange-500 transition-colors"
                            >
                              <Plus className="w-5 h-5 text-white" />
                            </button>
                          </div>

                          {/* Badge de confirmation */}
                          {(frameSelections[mockup.photoId] || 0) > 0 && (
                            <div className="text-center">
                              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                ✓ {frameSelections[mockup.photoId]} cadre{frameSelections[mockup.photoId] > 1 ? 's' : ''} ajouté{frameSelections[mockup.photoId] > 1 ? 's' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Que souhaitez-vous faire ? */}
      <div className="max-w-2xl mx-auto mt-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Que souhaitez-vous faire ?
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Option 1: Continuer les achats */}
            <button
              onClick={() => {
                // Sauvegarder les sélections de cadres avant de retourner
                const frameTotals: FrameSelection = {
                  '10x15': 0,
                  '20x30': 0,
                  '30x45': 0
                }

                Object.entries(frameSelections).forEach(([photoId, quantity]) => {
                  const mockup = frameMockups.find(m => m.photoId === photoId)
                  if (mockup && quantity > 0) {
                    const format = mockup.format as keyof FrameSelection
                    frameTotals[format] += quantity
                  }
                })

                onUpdateFrames(frameTotals)

                // Retourner à la sélection des formats
                if (onAddFormat) onAddFormat()
              }}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-orange-400 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <ShoppingBag className="w-10 h-10 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold">Ajouter d'autres formats</h3>
                <p className="text-sm text-gray-600 text-center">
                  Continuez vos achats et ajoutez d'autres photos avec des formats différents
                </p>
              </div>
            </button>

            {/* Option 2: Valider le panier */}
            <button
              onClick={() => {
                // Calculer le total de cadres par format
                const frameTotals: FrameSelection = {
                  '10x15': 0,
                  '20x30': 0,
                  '30x45': 0
                }

                Object.entries(frameSelections).forEach(([photoId, quantity]) => {
                  const mockup = frameMockups.find(m => m.photoId === photoId)
                  if (mockup && quantity > 0) {
                    const format = mockup.format as keyof FrameSelection
                    frameTotals[format] += quantity
                  }
                })

                onUpdateFrames(frameTotals)

                // Passer à l'étape suivante
                onNext()
              }}
              disabled={isGenerating}
              className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-400 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <ShoppingCart className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Finaliser ma sélection</h3>
                <p className="text-sm text-gray-600 text-center">
                  Finalisez la sélection de vos Revilas et passez aux options
                </p>
              </div>
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              💡 Vous pourrez toujours modifier votre panier avant le paiement
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
