'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Archive, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function OrderDetail() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchOrderDetail(params.id as string)
    }
  }, [params.id])

  const fetchOrderDetail = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (status: string) => {
    try {
      await fetch(`/api/orders/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      setOrder({ ...order, status })
    } catch (error) {
      console.error('Error updating order:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div>Commande introuvable</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="/admin">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              <h1 className="text-2xl font-bold">Commande {order.order_number}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Télécharger
              </Button>
              <Button variant="outline" size="sm">
                <Archive className="mr-2 h-4 w-4" />
                Archiver
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="mr-2 h-4 w-4" />
                Dupliquer
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photos et vidéos */}
            {order.order_items && order.order_items.map((item: any, index: number) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle>Photo {item.item_number}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2">Photo</h4>
                      <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                        {item.photo_public_url ? (
                          <img 
                            src={item.photo_public_url} 
                            alt={`Photo ${item.item_number}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback si l'image ne charge pas
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `<div class="flex items-center justify-center h-full"><span class="text-gray-400">${item.photo_filename}</span></div>`
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-400">
                              {item.photo_filename}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.photo_filename}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Vidéo</h4>
                      <div className="aspect-square bg-gray-100 rounded-md overflow-hidden">
                        {item.video_public_url ? (
                          <video 
                            src={item.video_public_url} 
                            controls
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback si la vidéo ne charge pas
                              const target = e.target as HTMLVideoElement
                              target.style.display = 'none'
                              const parent = target.parentElement
                              if (parent) {
                                parent.innerHTML = `<div class="flex items-center justify-center h-full"><span class="text-gray-400">${item.video_filename}</span></div>`
                              }
                            }}
                          >
                            Votre navigateur ne supporte pas la vidéo.
                          </video>
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <span className="text-gray-400">
                              {item.video_filename}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{item.video_filename}</p>
                    </div>
                  </div>
                  {(item.message_text || item.message_signature) && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md">
                      <h4 className="font-medium mb-2">Message personnalisé</h4>
                      {item.message_text && (
                        <p className="text-gray-700 mb-2">{item.message_text}</p>
                      )}
                      {item.message_signature && (
                        <p className="text-sm text-gray-500">— {item.message_signature}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Statut */}
            <Card>
              <CardHeader>
                <CardTitle>Statut de la commande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {['pending', 'processing', 'completed'].map((status) => (
                    <label key={status} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="status"
                        value={status}
                        checked={order.status === status}
                        onChange={() => updateOrderStatus(status)}
                        className="text-orange focus:ring-orange"
                      />
                      <span className="capitalize">
                        {status === 'pending' && 'En attente'}
                        {status === 'processing' && 'En cours'}
                        {status === 'completed' && 'Terminée'}
                      </span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Informations client */}
            <Card>
              <CardHeader>
                <CardTitle>Informations client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Nom:</span> {order.customers?.first_name} {order.customers?.last_name}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {order.customers?.email}
                </p>
                {order.customers?.phone && (
                  <p>
                    <span className="font-medium">Téléphone:</span> {order.customers?.phone}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Adresse de livraison */}
            <Card>
              <CardHeader>
                <CardTitle>Adresse de livraison</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p>{order.shipping_address}</p>
                <p>{order.shipping_postal_code} {order.shipping_city}</p>
                <p>{order.shipping_country}</p>
              </CardContent>
            </Card>

            {/* Informations de paiement */}
            <Card>
              <CardHeader>
                <CardTitle>Paiement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="font-medium">Montant total:</span> {parseFloat(order.total_amount).toFixed(2)}€
                </p>
                <p>
                  <span className="font-medium">Date:</span> {new Date(order.created_at).toLocaleDateString('fr-FR')}
                </p>
                {order.stripe_payment_intent_id && (
                  <p className="text-xs text-gray-500">
                    ID Stripe: {order.stripe_payment_intent_id}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}