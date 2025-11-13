'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Home, MapPin, Plus, Minus, Trash2, Check } from 'lucide-react'
import { GiftAddress } from './GiftAddressManager'
import { AddressDistribution } from '@/types'

interface PhotoAddressDistributorProps {
  instanceKey: string  // Unique key for this photo instance (with/without frame)
  totalQuantity: number
  currentDistributions: AddressDistribution[]
  availableAddresses: GiftAddress[]
  onDistribute: (distributions: AddressDistribution[]) => void
  disabled?: boolean
}

export default function PhotoAddressDistributor({
  instanceKey,
  totalQuantity,
  currentDistributions,
  availableAddresses,
  onDistribute,
  disabled = false
}: PhotoAddressDistributorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [balanceError, setBalanceError] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Initialiser les distributions si vide
  useEffect(() => {
    if (currentDistributions.length === 0) {
      // Par défaut, tout est livré à mon adresse
      onDistribute([{ addressId: null, quantity: totalQuantity }])
    }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Vérifier l'équilibre avant de fermer
        const totalDistributed = currentDistributions.reduce((sum, dist) => sum + dist.quantity, 0)

        if (totalDistributed !== totalQuantity) {
          // Afficher l'erreur et empêcher la fermeture
          setBalanceError(`Distribution déséquilibrée : ${totalDistributed}/${totalQuantity}. Veuillez équilibrer les quantités.`)
        } else {
          // Fermer et effacer l'erreur
          setBalanceError(null)
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, currentDistributions, totalQuantity])

  // Calculer le total distribué
  const totalDistributed = currentDistributions.reduce((sum, dist) => sum + dist.quantity, 0)

  // Obtenir la quantité pour "mon adresse"
  const homeQuantity = currentDistributions.find(dist => dist.addressId === null)?.quantity || 0

  // Obtenir toutes les distributions d'adresses cadeaux
  const giftDistributions = currentDistributions.filter(dist => dist.addressId !== null)

  // Générer le texte d'affichage pour le bouton
  const getDisplayText = () => {
    if (homeQuantity === totalQuantity) {
      return `Mon adresse ${totalQuantity > 1 ? totalQuantity : ''}`
    }

    const parts: string[] = []
    if (homeQuantity > 0) {
      parts.push(`Mon adresse ${homeQuantity}`)
    }

    giftDistributions.forEach(dist => {
      const address = availableAddresses.find(addr => addr.id === dist.addressId)
      if (address) {
        parts.push(`${address.firstName} ${dist.quantity}`)
      }
    })

    return parts.join(', ')
  }

  // Gérer le changement de quantité pour une adresse (sans ajuster les autres)
  const handleQuantityChange = (addressId: string | null, delta: number) => {
    // Effacer l'erreur quand l'utilisateur fait des changements
    setBalanceError(null)

    const newDistributions = [...currentDistributions]
    const index = newDistributions.findIndex(dist => dist.addressId === addressId)

    if (index === -1) return

    const newQuantity = newDistributions[index].quantity + delta

    // Ne pas permettre de passer en dessous de 0
    if (newQuantity < 0) return

    // Si la quantité atteint 0, supprimer cette distribution
    if (newQuantity === 0) {
      newDistributions.splice(index, 1)
    } else {
      newDistributions[index] = { ...newDistributions[index], quantity: newQuantity }
    }

    // Ne pas ajuster les autres adresses - laisser le total déséquilibré
    onDistribute(newDistributions)
  }

  // Ajouter une nouvelle adresse à la distribution (ou "mon adresse")
  const handleAddAddress = (addressId: string | null) => {
    // Effacer l'erreur
    setBalanceError(null)

    // Vérifier si l'adresse est déjà dans la distribution
    if (currentDistributions.some(dist => dist.addressId === addressId)) return

    const newDistributions = [...currentDistributions]

    // Ajouter la nouvelle adresse avec quantité 1
    newDistributions.push({ addressId, quantity: 1 })

    // Retirer 1 aléatoirement d'une autre adresse
    const otherDistributions = newDistributions.filter(
      dist => dist.addressId !== addressId && dist.quantity > 1
    )

    if (otherDistributions.length > 0) {
      // Choisir aléatoirement
      const randomIndex = Math.floor(Math.random() * otherDistributions.length)
      const selectedDist = otherDistributions[randomIndex]
      const index = newDistributions.findIndex(dist => dist.addressId === selectedDist.addressId)
      newDistributions[index].quantity -= 1
    } else {
      // Sinon, retirer de "mon adresse" si elle existe et a plus de 1
      const homeIndex = newDistributions.findIndex(dist => dist.addressId === null)
      if (homeIndex !== -1 && newDistributions[homeIndex].quantity > 1) {
        newDistributions[homeIndex].quantity -= 1
      }
    }

    onDistribute(newDistributions)
  }

  // Supprimer une distribution
  const handleRemoveDistribution = (addressId: string | null) => {
    const newDistributions = currentDistributions.filter(dist => dist.addressId !== addressId)

    // Ajouter la quantité supprimée à "mon adresse"
    const removedDist = currentDistributions.find(dist => dist.addressId === addressId)
    if (removedDist) {
      const homeIndex = newDistributions.findIndex(dist => dist.addressId === null)
      if (homeIndex !== -1) {
        newDistributions[homeIndex].quantity += removedDist.quantity
      } else {
        newDistributions.push({ addressId: null, quantity: removedDist.quantity })
      }
    }

    onDistribute(newDistributions)
  }

  // Vérifier si toutes les adresses disponibles sont déjà dans la distribution
  const allAddressesUsed = availableAddresses.every(addr =>
    currentDistributions.some(dist => dist.addressId === addr.id)
  )

  // Ne rien afficher s'il n'y a pas d'adresses cadeaux enregistrées
  if (availableAddresses.length === 0) {
    return null
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          if (!disabled) {
            setBalanceError(null)
            setIsOpen(!isOpen)
          }
        }}
        disabled={disabled}
        className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs transition-colors ${
          disabled
            ? 'cursor-not-allowed text-gray-400'
            : giftDistributions.length > 0
            ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
        }`}
        title={disabled ? 'Aucune adresse cadeau disponible' : 'Gérer la distribution'}
      >
        {giftDistributions.length > 0 ? (
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
        ) : (
          <Home className="w-3.5 h-3.5 flex-shrink-0" />
        )}
        <span className="truncate max-w-[150px]">{getDisplayText()}</span>
        {!disabled && (
          <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full min-w-[250px] bg-white border border-gray-200 rounded-lg shadow-lg py-1 max-h-80 overflow-y-auto">
          {/* Message d'erreur */}
          {balanceError && (
            <div className="mx-3 mt-2 mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600 font-medium">{balanceError}</p>
            </div>
          )}

          {/* Distribution actuelle */}
          <div className="px-3 py-2 border-b border-gray-100">
            <div className={`text-xs font-medium mb-2 ${
              totalDistributed !== totalQuantity ? 'text-red-500' : 'text-gray-500'
            }`}>
              Distribution ({totalDistributed}/{totalQuantity})
            </div>

            {/* Mon adresse */}
            {homeQuantity > 0 && (
              <div className="flex items-center justify-between mb-2 bg-gray-50 rounded-lg p-2">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-900">Mon adresse</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleQuantityChange(null, -1)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    title="Réduire"
                  >
                    {homeQuantity === 1 ? (
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-gray-600" />
                    )}
                  </button>
                  <span className="text-sm font-medium text-gray-900 w-6 text-center">
                    {homeQuantity}
                  </span>
                  <button
                    onClick={() => handleQuantityChange(null, 1)}
                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                    disabled={totalDistributed >= totalQuantity}
                    title="Augmenter"
                  >
                    <Plus className="w-3.5 h-3.5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}

            {/* Adresses cadeaux */}
            {giftDistributions.map((dist) => {
              const address = availableAddresses.find(addr => addr.id === dist.addressId)
              if (!address) return null

              return (
                <div
                  key={dist.addressId}
                  className="flex items-center justify-between mb-2 bg-purple-50 rounded-lg p-2"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm text-gray-900 truncate">
                        {address.firstName} {address.lastName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {address.city}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <button
                      onClick={() => handleQuantityChange(dist.addressId, -1)}
                      className="p-1 hover:bg-purple-100 rounded transition-colors"
                      title="Réduire"
                    >
                      {dist.quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Minus className="w-3.5 h-3.5 text-purple-600" />
                      )}
                    </button>
                    <span className="text-sm font-medium text-purple-900 w-6 text-center">
                      {dist.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(dist.addressId, 1)}
                      className="p-1 hover:bg-purple-100 rounded transition-colors"
                      disabled={totalDistributed >= totalQuantity}
                      title="Augmenter"
                    >
                      <Plus className="w-3.5 h-3.5 text-purple-600" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Adresses disponibles non utilisées */}
          {(homeQuantity === 0 || !allAddressesUsed) && (
            <>
              <div className="px-3 py-2 text-xs font-medium text-gray-500">
                Ajouter à la distribution
              </div>

              {/* Option "Mon adresse" si elle n'existe pas */}
              {homeQuantity === 0 && (
                <button
                  onClick={() => handleAddAddress(null)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Home className="w-4 h-4 text-gray-600" />
                    <span className="text-gray-900">Mon adresse</span>
                  </div>
                  <Plus className="w-4 h-4 text-gray-600 flex-shrink-0 ml-2" />
                </button>
              )}

              {/* Adresses cadeaux disponibles */}
              {availableAddresses
                .filter(addr => !currentDistributions.some(dist => dist.addressId === addr.id))
                .map((address) => (
                  <button
                    key={address.id}
                    onClick={() => handleAddAddress(address.id)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 truncate">
                          {address.firstName} {address.lastName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {address.city}
                        </div>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-purple-600 flex-shrink-0 ml-2" />
                  </button>
                ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
