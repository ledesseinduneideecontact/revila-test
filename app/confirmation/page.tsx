'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function ConfirmationContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order') || searchParams.get('orderId') // Support both params
  const isValidated = searchParams.get('validated') === 'true'
  const [orderNumber, setOrderNumber] = useState<string>('')
  const [webhookSent, setWebhookSent] = useState(false)

  useEffect(() => {
    if (orderId) {
      // Récupérer le vrai numéro de commande depuis l'API
      fetch('/api/get-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.order_number) {
            setOrderNumber(data.order_number)
            
            // 🔒 Utiliser la route de confirmation sécurisée (avec déduplication)
            if (!webhookSent) {
              console.log('🔗 Déclenchement webhook sécurisé via /api/orders/confirm pour:', orderId)
              
              fetch('/api/orders/confirm', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  orderId: orderId
                })
              })
              .then(response => response.json())
              .then(result => {
                if (result.n8nTriggered) {
                  console.log('✅ Webhook N8N envoyé avec succès via route sécurisée')
                  console.log(`   Première fois: ${result.isFirstTime}`)
                  setWebhookSent(true)
                } else if (result.duplicate) {
                  console.log('ℹ️  Webhook déjà traité (dédupliqué)')
                  setWebhookSent(true)
                } else {
                  console.warn('⚠️ Webhook N8N a échoué via route sécurisée')
                }
              })
              .catch(error => {
                console.error('❌ Erreur route de confirmation sécurisée:', error)
              })
            }
          }
        })
        .catch(err => {
          console.error('Erreur lors de la récupération du numéro de commande:', err)
          // Fallback en cas d'erreur
          setOrderNumber('REV-ERROR')
        })
    }
  }, [orderId, webhookSent])

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      {/* Animation de confettis */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 animate-bounce delay-100">
          <span className="text-6xl">🎉</span>
        </div>
        <div className="absolute top-0 right-1/4 animate-bounce delay-300">
          <span className="text-5xl">✨</span>
        </div>
        <div className="absolute top-0 left-1/3 animate-bounce delay-500">
          <span className="text-4xl">🎊</span>
        </div>
      </div>

      <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-green-50 via-white to-emerald-50">
        {/* Bandeau de succès */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>
        
        <CardHeader className="pb-0">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500 rounded-full blur-xl opacity-30 animate-pulse"></div>
              <CheckCircle className="h-24 w-24 text-green-500 relative z-10" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            {isValidated ? 'Commande validée !' : 'Félicitations !'}
          </CardTitle>
          <p className="text-xl text-gray-700 mt-2">
            Votre commande a été confirmée avec succès
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8 pt-8">
          {/* Numéro de commande */}
          {orderNumber && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200 shadow-inner">
              <p className="text-sm text-gray-600 uppercase tracking-wide font-semibold">Numéro de commande</p>
              <p className="text-2xl font-bold mt-1 font-mono">{orderNumber}</p>
              <p className="text-xs text-gray-500 mt-2">Conservez ce numéro pour le suivi de votre commande</p>
            </div>
          )}

          {/* Prochaines étapes */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-800">Les prochaines étapes :</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Email de confirmation</p>
                  <p className="text-sm text-gray-600">Vous allez recevoir un email récapitulatif dans quelques minutes</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Préparation de votre commande</p>
                  <p className="text-sm text-gray-600">Nos équipes vont préparer vos photos magiques avec soin</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Livraison</p>
                  <p className="text-sm text-gray-600">Réception sous 7 à 10 jours ouvrés directement dans votre boîte aux lettres</p>
                </div>
              </div>
            </div>
          </div>

          {/* Message de remerciement */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-6 rounded-2xl border border-blue-200">
            <p className="text-center text-gray-700">
              <span className="text-2xl mb-2 block">💌</span>
              <span className="font-medium">Merci pour votre confiance !</span><br/>
              <span className="text-sm">Vos proches vont adorer découvrir leurs souvenirs qui prennent vie</span>
            </p>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button asChild size="lg" variant="outline" className="border-2">
              <Link href="/">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Retour à l'accueil
              </Link>
            </Button>
            <Button asChild size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
              <Link href="/commander">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nouvelle commande
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informations supplémentaires */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>Une question ? Contactez-nous à <a href="mailto:contact@revila.fr" className="text-blue-600 hover:underline">contact@revila.fr</a></p>
      </div>
    </div>
  )
}

export default function Confirmation() {
  useEffect(() => {
    // Nettoyer complètement le sessionStorage et localStorage après confirmation
    sessionStorage.clear();
    
    // Nettoyer aussi les données du localStorage (au cas où)
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cart_')) {
        localStorage.removeItem(key);
      }
    });
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-emerald-50">
      {/* Header */}
      <header className="bg-white py-8 shadow-xl border-b border-border-light">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-5xl font-black text-accent-primary tracking-tight">
              REVILA
            </h1>
            <p className="text-text-secondary mt-3 font-semibold text-lg">Photos magiques qui prennent vie</p>
          </div>
        </div>
      </header>

      <Suspense fallback={
        <div className="container mx-auto max-w-2xl px-4 py-16 text-center">
          <div>Chargement...</div>
        </div>
      }>
        <ConfirmationContent />
      </Suspense>
    </div>
  )
}