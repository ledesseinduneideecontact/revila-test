'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Check, Package, Image, MessageSquare, Gift, User, CreditCard, Sparkles, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import StepFormatChoice from './steps/StepFormatChoice'
import StepUpload from './steps/StepUpload'
import StepGallery from './steps/StepGallery'
import StepFrames from './steps/StepFrames'
import StepMessages from './steps/StepMessages'
import StepGifts from './steps/StepGifts'
import StepCustomerInfo from './steps/StepCustomerInfo'
import StepRecap from './steps/StepRecap'

export interface PhotoItem {
  id: string
  photoFile?: File
  videoFile?: File
  photoPreview?: string
  videoPreview?: string
  format: '10x15' | '20x30' | '30x45'
  withFrame: boolean
  message: string
  signature: string
  isGift: boolean
  giftFirstName?: string
  giftLastName?: string
  giftAddress?: string
  giftPostalCode?: string
  giftCity?: string
}

interface WizardState {
  currentStep: number
  photos: PhotoItem[]
  currentPhoto?: Partial<PhotoItem>
  customerInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    postalCode: string
    city: string
    country: string
  }
  promoCode: string
}

const STEPS = [
  { id: 1, title: 'Format', icon: Package, description: 'Choisissez la taille' },
  { id: 2, title: 'Photos', icon: Camera, description: 'Ajoutez vos médias' },
  { id: 3, title: 'Galerie', icon: Image, description: 'Gérez vos photos' },
  { id: 4, title: 'Cadres', icon: Sparkles, description: 'Avec ou sans cadre' },
  { id: 5, title: 'Messages', icon: MessageSquare, description: 'Personnalisez' },
  { id: 6, title: 'Cadeaux', icon: Gift, description: 'Envoi en cadeau' },
  { id: 7, title: 'Infos', icon: User, description: 'Vos coordonnées' },
  { id: 8, title: 'Paiement', icon: CreditCard, description: 'Finalisez' }
]

export default function CommanderWizard() {
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    photos: [],
    customerInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      postalCode: '',
      city: '',
      country: 'France'
    },
    promoCode: ''
  })

  // Sauvegarde automatique dans sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem('wizardState')
    if (savedState) {
      setState(JSON.parse(savedState))
    }
  }, [])

  useEffect(() => {
    sessionStorage.setItem('wizardState', JSON.stringify(state))
  }, [state])

  const canGoNext = () => {
    switch (state.currentStep) {
      case 1:
        return state.currentPhoto?.format !== undefined
      case 2:
        return state.currentPhoto?.photoFile && state.currentPhoto?.videoFile
      case 3:
        return state.photos.length > 0
      case 7:
        const info = state.customerInfo
        return info.firstName && info.lastName && info.email && info.address && info.city && info.postalCode
      default:
        return true
    }
  }

  const goToStep = (step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setState(prev => ({ ...prev, currentStep: step }))
    }
  }

  const nextStep = () => {
    if (state.currentStep === 2 && state.currentPhoto) {
      // Ajouter la photo à la liste
      const newPhoto: PhotoItem = {
        id: Date.now().toString(),
        ...state.currentPhoto as PhotoItem,
        withFrame: false,
        message: '',
        signature: '',
        isGift: false
      }
      setState(prev => ({
        ...prev,
        photos: [...prev.photos, newPhoto],
        currentPhoto: undefined,
        currentStep: 3
      }))
    } else if (state.currentStep < STEPS.length) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
    }
  }

  const prevStep = () => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }))
    }
  }

  const updateCurrentPhoto = (updates: Partial<PhotoItem>) => {
    setState(prev => ({
      ...prev,
      currentPhoto: { ...prev.currentPhoto, ...updates }
    }))
  }

  const updatePhoto = (id: string, updates: Partial<PhotoItem>) => {
    setState(prev => ({
      ...prev,
      photos: prev.photos.map(p => p.id === id ? { ...p, ...updates } : p)
    }))
  }

  const deletePhoto = (id: string) => {
    setState(prev => ({
      ...prev,
      photos: prev.photos.filter(p => p.id !== id)
    }))
  }

  const updateCustomerInfo = (info: Partial<WizardState['customerInfo']>) => {
    setState(prev => ({
      ...prev,
      customerInfo: { ...prev.customerInfo, ...info }
    }))
  }

  const addNewPhoto = () => {
    setState(prev => ({
      ...prev,
      currentPhoto: undefined,
      currentStep: 1
    }))
  }

  const calculateTotal = () => {
    let total = 0
    state.photos.forEach(photo => {
      // Prix de base selon format
      const basePrice = photo.format === '10x15' ? 29.90 : 
                       photo.format === '20x30' ? 39.90 : 49.90
      // Supplément cadre
      const framePrice = photo.withFrame ? 10 : 0
      // Frais d'envoi cadeau
      const giftPrice = photo.isGift ? 2 : 0
      
      total += basePrice + framePrice + giftPrice
    })
    return total
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Header avec progression */}
      <div className="bg-white shadow-sm sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          {/* Barre de progression */}
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex-1 relative">
                <div className={`
                  h-2 rounded-full transition-all duration-500
                  ${index < state.currentStep - 1 ? 'bg-green-500' : 
                    index === state.currentStep - 1 ? 'bg-orange-500' : 'bg-gray-200'}
                `}>
                  {index < state.currentStep - 1 && (
                    <div className="h-full bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
                {index < STEPS.length - 1 && (
                  <div className="absolute top-0 right-0 w-2 h-2 -mr-1 bg-white" />
                )}
              </div>
            ))}
          </div>

          {/* Étapes avec icônes */}
          <div className="hidden md:flex items-center justify-between">
            {STEPS.map((step) => {
              const Icon = step.icon
              const isActive = step.id === state.currentStep
              const isCompleted = step.id < state.currentStep
              
              return (
                <button
                  key={step.id}
                  onClick={() => goToStep(step.id)}
                  disabled={step.id > state.currentStep && !isCompleted}
                  className={`
                    flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-all
                    ${isActive ? 'bg-orange-100 scale-105' : ''}
                    ${isCompleted ? 'cursor-pointer hover:bg-gray-50' : ''}
                    ${!isActive && !isCompleted ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center transition-all
                    ${isActive ? 'bg-orange-500 text-white shadow-lg' : 
                      isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                  `}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium ${isActive ? 'text-orange-600' : 'text-gray-600'}`}>
                    {step.title}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Version mobile - titre de l'étape actuelle */}
          <div className="md:hidden text-center">
            <h2 className="text-lg font-bold text-gray-900">
              Étape {state.currentStep} sur {STEPS.length}
            </h2>
            <p className="text-sm text-gray-600">
              {STEPS[state.currentStep - 1].title} - {STEPS[state.currentStep - 1].description}
            </p>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Titre de l'étape */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {STEPS[state.currentStep - 1].title}
            </h1>
            <p className="text-gray-600">
              {STEPS[state.currentStep - 1].description}
            </p>
          </div>

          {/* Contenu de l'étape */}
          <div className="min-h-[400px]">
            {state.currentStep === 1 && (
              <StepFormatChoice 
                selectedFormat={state.currentPhoto?.format}
                onSelectFormat={(format) => updateCurrentPhoto({ format })}
              />
            )}
            {state.currentStep === 2 && (
              <StepUpload
                format={state.currentPhoto?.format || '10x15'}
                photo={state.currentPhoto}
                onUpdate={updateCurrentPhoto}
              />
            )}
            {state.currentStep === 3 && (
              <StepGallery
                photos={state.photos}
                onEdit={(id) => {
                  const photo = state.photos.find(p => p.id === id)
                  if (photo) {
                    setState(prev => ({ ...prev, currentPhoto: photo, currentStep: 2 }))
                  }
                }}
                onDelete={deletePhoto}
                onAddNew={addNewPhoto}
              />
            )}
            {state.currentStep === 4 && (
              <StepFrames
                photos={state.photos}
                onUpdate={updatePhoto}
              />
            )}
            {state.currentStep === 5 && (
              <StepMessages
                photos={state.photos}
                onUpdate={updatePhoto}
              />
            )}
            {state.currentStep === 6 && (
              <StepGifts
                photos={state.photos}
                onUpdate={updatePhoto}
              />
            )}
            {state.currentStep === 7 && (
              <StepCustomerInfo
                customerInfo={state.customerInfo}
                onUpdate={updateCustomerInfo}
              />
            )}
            {state.currentStep === 8 && (
              <StepRecap
                photos={state.photos}
                customerInfo={state.customerInfo}
                promoCode={state.promoCode}
                onUpdatePromo={(code) => setState(prev => ({ ...prev, promoCode: code }))}
                total={calculateTotal()}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={state.currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500">Total provisoire</p>
              <p className="text-2xl font-bold text-orange-500">
                {calculateTotal().toFixed(2)} €
              </p>
            </div>

            <Button
              onClick={nextStep}
              disabled={!canGoNext()}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600"
            >
              {state.currentStep === STEPS.length ? 'Payer' : 'Suivant'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Footer sticky avec prix sur mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4 z-30">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">Total</p>
            <p className="text-xl font-bold text-orange-500">{calculateTotal().toFixed(2)} €</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={prevStep}
              disabled={state.currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={nextStep}
              disabled={!canGoNext()}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {state.currentStep === STEPS.length ? 'Payer' : 'Suivant'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}