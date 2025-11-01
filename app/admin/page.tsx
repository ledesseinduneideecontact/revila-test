'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Eye, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Order } from '@/types'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders')
      const data = await response.json()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminée', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-800' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">REVIVE - Tableau de bord</h1>
            <Button asChild variant="ghost">
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold mb-6">Commandes en cours</h2>

        {loading ? (
          <div className="text-center py-8">Chargement...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune commande pour le moment
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order: any) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold text-lg">
                          {order.order_number}
                        </h3>
                        {getStatusBadge(order.order_status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          Client: {order.customers?.first_name} {order.customers?.last_name}
                        </p>
                        <p>Email: {order.customers?.email}</p>
                        <p>
                          Date: {new Date(order.created_at).toLocaleDateString('fr-FR')}
                        </p>
                        <p className="font-medium">
                          Total: {parseFloat(order.total_amount).toFixed(2)}€
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.order_items && order.order_items.length > 0 && (
                        <div className="flex -space-x-2 mr-4">
                          {order.order_items.slice(0, 3).map((item: any, index: number) => (
                            <div
                              key={item.id}
                              className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium"
                            >
                              P{item.item_number}
                            </div>
                          ))}
                          {order.order_items.length > 3 && (
                            <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                              +{order.order_items.length - 3}
                            </div>
                          )}
                        </div>
                      )}

                      <Button asChild size="sm">
                        <Link href={`/admin/commande/${order.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="mr-2 h-4 w-4" />
                        Modifier
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}