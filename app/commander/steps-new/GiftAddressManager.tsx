'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Check, X, MapPin, User } from 'lucide-react'
import AddressForm, { AddressData, AddressErrors } from '../../../components/AddressForm'

export interface GiftAddress {
  id: string
  firstName: string
  lastName: string
  address: string
  postalCode: string
  city: string
  country: string
}

interface GiftAddressManagerProps {
  addresses: GiftAddress[]
  onAddAddress: (address: Omit<GiftAddress, 'id'>) => void
  onEditAddress: (id: string, address: Omit<GiftAddress, 'id'>) => void
  onDeleteAddress: (id: string) => void
}

export default function GiftAddressManager({
  addresses,
  onAddAddress,
  onEditAddress,
  onDeleteAddress
}: GiftAddressManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AddressData>({
    firstName: '',
    lastName: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'FRANCE'
  })
  const [errors, setErrors] = useState<AddressErrors>({})

  const validateForm = (): boolean => {
    const newErrors: AddressErrors = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est obligatoire'
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est obligatoire'
    }
    if (!formData.address.trim()) {
      newErrors.address = 'L\'adresse est obligatoire'
    }
    if (!formData.postalCode.trim()) {
      newErrors.postalCode = 'Le code postal est obligatoire'
    } else if (!/^\d{5}$/.test(formData.postalCode)) {
      newErrors.postalCode = 'Code postal invalide (5 chiffres)'
    }
    if (!formData.city.trim()) {
      newErrors.city = 'La ville est obligatoire'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof AddressData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field as keyof AddressErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleAdd = () => {
    if (!validateForm()) return

    onAddAddress(formData)
    resetForm()
  }

  const handleEdit = (id: string) => {
    if (!validateForm()) return

    onEditAddress(id, formData)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      address: '',
      postalCode: '',
      city: '',
      country: 'FRANCE'
    })
    setErrors({})
    setIsAdding(false)
    setEditingId(null)
  }

  const startEdit = (address: GiftAddress) => {
    setFormData({
      firstName: address.firstName,
      lastName: address.lastName,
      address: address.address,
      postalCode: address.postalCode,
      city: address.city,
      country: address.country
    })
    setEditingId(address.id)
    setIsAdding(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
      onDeleteAddress(id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Liste des adresses existantes */}
      {addresses.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Adresses enregistrées</h4>
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`border rounded-lg p-4 ${
                editingId === addr.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
              }`}
            >
              {editingId === addr.id ? (
                // Formulaire d'édition
                <div className="space-y-4">
                  <AddressForm
                    data={formData}
                    errors={errors}
                    onChange={handleChange}
                    showCountryInfo={false}
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => handleEdit(addr.id)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Enregistrer
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                // Affichage de l'adresse
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold text-gray-900">
                        {addr.firstName} {addr.lastName}
                      </span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{addr.address}</p>
                        <p>{addr.postalCode} {addr.city}</p>
                        <p className="text-xs text-gray-500">{addr.country}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEdit(addr)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bouton d'ajout / Formulaire d'ajout */}
      {!editingId && (
        <>
          {!isAdding ? (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full py-3 px-4 border-2 border-dashed border-orange-300 rounded-lg text-orange-600 hover:bg-orange-50 hover:border-orange-400 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Ajouter une adresse de livraison en cadeau (différente de la mienne)
            </button>
          ) : (
            <div className="border-2 border-orange-300 rounded-lg p-4 bg-orange-50">
              <h4 className="font-semibold text-gray-900 mb-4">Nouvelle adresse cadeau</h4>
              <div className="space-y-4">
                <AddressForm
                  data={formData}
                  errors={errors}
                  onChange={handleChange}
                  showCountryInfo={true}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Ajouter cette adresse
                  </button>
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
