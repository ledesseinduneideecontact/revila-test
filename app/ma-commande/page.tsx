'use client'

import { useState } from 'react'
import { Search, Package, CreditCard, ShoppingBag, MapPin, Calendar, CheckCircle, Clock, X, Menu } from 'lucide-react'
import Link from 'next/link'

interface OrderItem {
  id: string
  item_number: string
  categorie: string
  quantity: number
  unit_price: number
  line_total_cents: number
  photo_gcs_url?: string
  video_gcs_url?: string
  message_text?: string
  message_signature?: string
  cadeau: boolean
  nom?: string
  adresse?: string
  code_postal?: string
  ville?: string
  pays?: string
}

interface Order {
  id: string
  order_number: string
  created_at: string
  status: string
  total_cents: number
  subtotal_cents: number
  shipping_cents: number
  discount_cents: number
  stripe_payment_intent_id?: string
  customer: {
    prenom: string
    nom: string
    email: string
    telephone: string
    adresse: string
    code_postal: string
    ville: string
    pays: string
  }
  order_items: OrderItem[]
}

export default function MaCommandePage() {
  const [searchType, setSearchType] = useState<'email' | 'order'>('email')
  const [searchValue, setSearchValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const params = new URLSearchParams()
      if (searchType === 'email') {
        params.append('email', searchValue)
      } else {
        params.append('orderNumber', searchValue)
      }

      const response = await fetch(`/api/orders/retrieve?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération de la commande')
      }

      setOrder(data.order)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4 mr-1" />
            Payée
          </span>
        )
      case 'pending':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4 mr-1" />
            En attente
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'photo-10x10': 'Photo 10x10cm',
      'photo-10x15': 'Photo 10x15cm',
      'photo-20x30': 'Photo 20x30cm',
      'photo-30x45': 'Photo 30x45cm',
      'cadre-10x15': 'Cadre 10x15cm',
      'cadre-20x30': 'Cadre 20x30cm',
      'cadre-30x45': 'Cadre 30x45cm'
    }
    return labels[category] || category
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Menu mobile */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900 font-medium">
                Accueil
              </Link>
              <Link href="/commander" className="text-gray-600 hover:text-gray-900 font-medium">
                Commander
              </Link>
            </nav>

            {/* Logo */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-2xl font-bold text-[#806947] hover:text-[#6a5638] transition-colors cursor-pointer" style={{fontFamily: 'Boston Angel, serif'}}>
                Revila
              </h1>
            </Link>

            {/* Espace droite */}
            <div className="w-10 md:w-auto"></div>
          </div>

          {/* Menu mobile */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t">
              <Link href="/" className="block py-2 text-gray-600 hover:text-gray-900">
                Accueil
              </Link>
              <Link href="/commander" className="block py-2 text-gray-600 hover:text-gray-900">
                Commander
              </Link>
            </nav>
          )}
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900" 
            style={{fontFamily: 'Boston Angel, serif'}}>
          Ma Commande
        </h1>

        {/* Formulaire de recherche */}
        {!order && (
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Retrouvez votre commande</h2>
            
            {/* Sélecteur de type de recherche */}
            <div className="flex rounded-lg border border-gray-200 mb-4">
              <button
                onClick={() => setSearchType('email')}
                className={`flex-1 py-2 px-4 rounded-l-lg font-medium transition-colors ${
                  searchType === 'email' 
                    ? 'bg-[#806947] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Par Email
              </button>
              <button
                onClick={() => setSearchType('order')}
                className={`flex-1 py-2 px-4 rounded-r-lg font-medium transition-colors ${
                  searchType === 'order' 
                    ? 'bg-[#806947] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                Par N° de commande
              </button>
            </div>

            <form onSubmit={handleSearch}>
              <div className="relative">
                <input
                  type={searchType === 'email' ? 'email' : 'text'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={
                    searchType === 'email' 
                      ? 'votre.email@exemple.com' 
                      : 'REV-XXXXX'
                  }
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#806947] focus:border-[#806947] outline-none"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-[#806947] hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Détails de la commande */}
        {order && (
          <div className="space-y-6">
            {/* En-tête de commande */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Commande {order.order_number}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  {getStatusBadge(order.status)}
                </div>
              </div>

              {/* Informations client */}
              <div className="grid md:grid-cols-2 gap-6 mt-6 pt-6 border-t">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-[#806947]" />
                    Adresse de livraison
                  </h3>
                  <p className="text-gray-700">
                    {order.customer.prenom} {order.customer.nom}<br />
                    {order.customer.adresse}<br />
                    {order.customer.code_postal} {order.customer.ville}<br />
                    {order.customer.pays}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-[#806947]" />
                    Contact
                  </h3>
                  <p className="text-gray-700">
                    Email: {order.customer.email}<br />
                    Téléphone: {order.customer.telephone}
                  </p>
                </div>
              </div>
            </div>

            {/* Articles commandés */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-2 text-[#806947]" />
                Articles commandés
              </h3>

              <div className="space-y-4">
                {order.order_items.map((item) => (
                  <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-start">
                          <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600 mr-3">
                            #{item.item_number}
                          </span>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {getCategoryLabel(item.categorie)}
                            </h4>
                            {item.message_text && (
                              <p className="text-sm text-gray-600 mt-1">
                                Message: "{item.message_text}"
                                {item.message_signature && ` - ${item.message_signature}`}
                              </p>
                            )}
                            {item.cadeau && (
                              <div className="mt-2 text-sm text-gray-600">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 text-xs font-medium">
                                  Cadeau
                                </span>
                                {item.nom && (
                                  <p className="mt-1">
                                    Pour: {item.nom}<br />
                                    {item.adresse && `${item.adresse}, `}
                                    {item.code_postal} {item.ville}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 md:mt-0 md:text-right">
                        <p className="text-sm text-gray-600">
                          {formatPrice(item.unit_price * 100)} × {item.quantity}
                        </p>
                        <p className="font-semibold text-gray-900">
                          {formatPrice(item.line_total_cents)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Récapitulatif de paiement */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <CreditCard className="w-6 h-6 mr-2 text-[#806947]" />
                Détails du paiement
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Sous-total</span>
                  <span>{formatPrice(order.subtotal_cents)}</span>
                </div>
                
                {order.discount_cents > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction</span>
                    <span>-{formatPrice(order.discount_cents)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-700">
                  <span>Frais de livraison</span>
                  <span>{formatPrice(order.shipping_cents)}</span>
                </div>
                
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(order.total_cents)}</span>
                  </div>
                </div>

                {order.stripe_payment_intent_id && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600">
                      Référence de paiement: {order.stripe_payment_intent_id}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton nouvelle recherche */}
            <div className="text-center mt-8">
              <button
                onClick={() => {
                  setOrder(null)
                  setSearchValue('')
                  setError('')
                }}
                className="inline-flex items-center px-6 py-3 bg-[#806947] text-white rounded-full hover:bg-[#6a5638] transition-colors font-medium"
              >
                <Search className="w-5 h-5 mr-2" />
                Rechercher une autre commande
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}