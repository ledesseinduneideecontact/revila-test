'use client'

import { Check } from 'lucide-react'

interface StepFormatChoiceProps {
  selectedFormat?: '10x15' | '20x30' | '30x45'
  onSelectFormat: (format: '10x15' | '20x30' | '30x45') => void
}

const FORMATS = [
  {
    id: '10x15' as const,
    title: '10×15 cm',
    subtitle: 'Petit format',
    price: '29,90 €',
    popular: false,
    description: 'Idéal pour les albums et petits espaces'
  },
  {
    id: '20x30' as const,
    title: '20×30 cm',
    subtitle: 'Format moyen',
    price: '39,90 €',
    popular: true,
    description: 'Le plus populaire, parfait pour décorer'
  },
  {
    id: '30x45' as const,
    title: '30×45 cm',
    subtitle: 'Grand format',
    price: '49,90 €',
    popular: false,
    description: 'Pour un impact visuel maximal'
  }
]

export default function StepFormatChoice({ selectedFormat, onSelectFormat }: StepFormatChoiceProps) {
  return (
    <div className="space-y-8">
      {/* Image de preview */}
      <div className="flex justify-center mb-8">
        <img 
          src="/assets_task_01k2q0ns4mfk6869c0ztwzyhj5_1755266722_img_1.webp"
          alt="Comparaison des formats"
          className="max-w-full h-auto rounded-lg shadow-lg"
          style={{ maxHeight: '250px' }}
        />
      </div>

      {/* Grille de sélection */}
      <div className="grid md:grid-cols-3 gap-4">
        {FORMATS.map((format) => (
          <button
            key={format.id}
            onClick={() => onSelectFormat(format.id)}
            className={`
              relative p-6 rounded-2xl border-2 transition-all duration-300 transform
              ${selectedFormat === format.id 
                ? 'border-orange-500 bg-orange-50 shadow-xl scale-105' 
                : 'border-gray-200 bg-white hover:border-orange-300 hover:shadow-lg hover:scale-102'}
            `}
          >
            {/* Badge populaire */}
            {format.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  Le plus choisi
                </span>
              </div>
            )}

            {/* Indicateur de sélection */}
            {selectedFormat === format.id && (
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="text-2xl font-bold text-gray-900">{format.title}</h3>
              <p className="text-sm font-medium text-gray-500">{format.subtitle}</p>
              <p className="text-3xl font-bold text-orange-500">{format.price}</p>
              <p className="text-sm text-gray-600">{format.description}</p>
            </div>

            {/* Visualisation de la taille */}
            <div className="mt-4 flex justify-center">
              <div 
                className={`
                  bg-gradient-to-br from-orange-100 to-orange-200 rounded-lg shadow-inner
                  ${format.id === '10x15' ? 'w-20 h-28' : 
                    format.id === '20x30' ? 'w-28 h-40' : 'w-36 h-48'}
                `}
              />
            </div>
          </button>
        ))}
      </div>

      {/* Info supplémentaire */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-700">
          💡 <strong>Astuce :</strong> Vous pourrez ajouter plusieurs photos de formats différents
        </p>
      </div>
    </div>
  )
}