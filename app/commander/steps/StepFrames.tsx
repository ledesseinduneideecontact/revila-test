'use client'

import { Check, Sparkles } from 'lucide-react'
import type { PhotoItem } from '../CommanderWizard'

interface StepFramesProps {
  photos: PhotoItem[]
  onUpdate: (id: string, updates: Partial<PhotoItem>) => void
}

export default function StepFrames({ photos, onUpdate }: StepFramesProps) {
  const getFormatDisplay = (format: string) => {
    switch(format) {
      case '10x15': return '10×15 cm'
      case '20x30': return '20×30 cm'
      case '30x45': return '30×45 cm'
      default: return format
    }
  }

  return (
    <div className="space-y-8">
      {/* Image de preview */}
      <div className="flex justify-center mb-8">
        <img 
          src="/assets_task_01k2f0m689fq6b6sk465f29tc7_1754998185_img_0.webp"
          alt="Exemple de cadre pour photos magiques"
          className="max-w-full h-auto rounded-lg shadow-lg"
          style={{ maxHeight: '300px' }}
        />
      </div>

      {/* Info sur le service */}
      <div className="bg-gradient-to-r from-purple-50 to-orange-50 border border-purple-200 rounded-xl p-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-semibold text-purple-700">Sublimez vos photos magiques</h3>
        </div>
        <p className="text-purple-600">
          Optez pour un cadre élégant pour mettre en valeur vos photos. 
          Parfait pour offrir ou décorer votre intérieur.
        </p>
        <p className="text-sm text-purple-500 mt-2">
          <strong>+ 10,00 € par photo</strong>
        </p>
      </div>

      {/* Grille de photos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo, index) => (
          <div 
            key={photo.id}
            className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200"
          >
            {/* Image */}
            <div className="aspect-square relative overflow-hidden bg-gray-100">
              {photo.photoPreview ? (
                <img 
                  src={photo.photoPreview} 
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-sm">Photo {index + 1}</span>
                </div>
              )}
            </div>

            {/* Infos photo */}
            <div className="p-3 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {getFormatDisplay(photo.format)}
                </span>
                <span className="text-xs text-gray-500">
                  Photo #{index + 1}
                </span>
              </div>
            </div>

            {/* Choix du cadre */}
            <div className="p-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Cadre</h4>
              
              {/* Option sans cadre */}
              <button
                onClick={() => onUpdate(photo.id, { withFrame: false })}
                className={`
                  w-full p-3 rounded-lg border-2 transition-all duration-200
                  ${!photo.withFrame 
                    ? 'border-orange-500 bg-orange-50 text-orange-700' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Sans cadre</span>
                  {!photo.withFrame && (
                    <Check className="w-4 h-4 text-orange-500" />
                  )}
                </div>
                <div className="text-xs text-left mt-1">
                  Photo seule
                </div>
              </button>

              {/* Option avec cadre */}
              <button
                onClick={() => onUpdate(photo.id, { withFrame: true })}
                className={`
                  w-full p-3 rounded-lg border-2 transition-all duration-200
                  ${photo.withFrame 
                    ? 'border-purple-500 bg-purple-50 text-purple-700' 
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Avec cadre</span>
                  {photo.withFrame && (
                    <Check className="w-4 h-4 text-purple-500" />
                  )}
                </div>
                <div className="flex items-center justify-between text-xs mt-1">
                  <span>Cadre élégant inclus</span>
                  <span className="font-semibold text-purple-600">+10,00 €</span>
                </div>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-700 mb-4">Résumé des cadres</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {photos.filter(p => !p.withFrame).length} photo{photos.filter(p => !p.withFrame).length !== 1 ? 's' : ''} sans cadre
            </span>
            <span className="text-sm font-medium text-gray-800">
              0,00 €
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {photos.filter(p => p.withFrame).length} photo{photos.filter(p => p.withFrame).length !== 1 ? 's' : ''} avec cadre
            </span>
            <span className="text-sm font-medium text-gray-800">
              {(photos.filter(p => p.withFrame).length * 10).toFixed(2)} €
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Total cadres</span>
              <span className="font-bold text-purple-500 text-lg">
                {(photos.filter(p => p.withFrame).length * 10).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Message si pas de photos */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-2">Aucune photo disponible</p>
          <p className="text-sm text-gray-400">
            Ajoutez d'abord des photos pour choisir les cadres
          </p>
        </div>
      )}
    </div>
  )
}