'use client'

import { ShoppingBag, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StepContinueOrCheckoutProps {
  onContinue: () => void
  onCheckout: () => void
}

export default function StepContinueOrCheckout({ onContinue, onCheckout }: StepContinueOrCheckoutProps) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-8">
          Que souhaitez-vous faire ?
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Option 1: Continuer les achats */}
          <button
            onClick={onContinue}
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
            onClick={onCheckout}
            className="group bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-green-400 hover:shadow-lg transition-all"
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
  )
}