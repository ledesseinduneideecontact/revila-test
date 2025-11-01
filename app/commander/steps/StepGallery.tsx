'use client'

import { Plus, Edit2, Trash2, Play } from 'lucide-react'
import type { PhotoItem } from '../CommanderWizard'

interface StepGalleryProps {
  photos: PhotoItem[]
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onAddNew: () => void
}

export default function StepGallery({ photos, onEdit, onDelete, onAddNew }: StepGalleryProps) {
  const getFormatDisplay = (format: string) => {
    switch(format) {
      case '10x15': return '10×15 cm'
      case '20x30': return '20×30 cm'
      case '30x45': return '30×45 cm'
      default: return format
    }
  }

  const getFormatPrice = (format: string) => {
    switch(format) {
      case '10x15': return 29.90
      case '20x30': return 39.90
      case '30x45': return 49.90
      default: return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Titre et stats */}
      <div className="text-center">
        <p className="text-lg text-gray-600">
          Vous avez <span className="font-bold text-orange-500">{photos.length}</span> photo{photos.length > 1 ? 's' : ''} magique{photos.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Grille de photos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div 
            key={photo.id}
            className="relative group bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
                  <Play className="w-8 h-8" />
                </div>
              )}
              
              {/* Overlay avec actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  onClick={() => onEdit(photo.id)}
                  className="bg-white text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Modifier"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
                      onDelete(photo.id)
                    }
                  }}
                  className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                  title="Supprimer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Badge vidéo */}
              {photo.videoPreview && (
                <div className="absolute top-2 right-2">
                  <div className="bg-purple-500 text-white p-1 rounded-full">
                    <Play className="w-4 h-4" />
                  </div>
                </div>
              )}
            </div>

            {/* Infos */}
            <div className="p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {getFormatDisplay(photo.format)}
                </span>
                <span className="text-sm font-bold text-orange-500">
                  {getFormatPrice(photo.format).toFixed(2)} €
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Photo #{index + 1}</p>
            </div>
          </div>
        ))}

        {/* Bouton ajouter */}
        <button
          onClick={onAddNew}
          className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl border-3 border-dashed border-orange-400 hover:border-orange-500 hover:from-orange-200 hover:to-orange-300 transition-all duration-300 flex flex-col items-center justify-center text-orange-600 hover:text-orange-700 group"
        >
          <Plus className="w-12 h-12 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-medium">Ajouter</span>
          <span className="text-xs">une photo</span>
        </button>
      </div>

      {/* Résumé */}
      {photos.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Résumé de vos photos</h3>
          <div className="space-y-2">
            {['10x15', '20x30', '30x45'].map(format => {
              const count = photos.filter(p => p.format === format).length
              if (count === 0) return null
              return (
                <div key={format} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {count} × {getFormatDisplay(format)}
                  </span>
                  <span className="text-sm font-medium text-gray-800">
                    {(count * getFormatPrice(format)).toFixed(2)} €
                  </span>
                </div>
              )
            })}
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Sous-total photos</span>
                <span className="font-bold text-orange-500 text-lg">
                  {photos.reduce((sum, p) => sum + getFormatPrice(p.format), 0).toFixed(2)} €
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Message si pas de photos */}
      {photos.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Aucune photo ajoutée pour le moment</p>
          <button
            onClick={onAddNew}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Ajouter votre première photo
          </button>
        </div>
      )}
    </div>
  )
}