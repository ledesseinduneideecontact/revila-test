'use client'

import { useState, useEffect } from 'react'
import { Cookie, Settings, X, Check, Shield, ChartBar, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true, // Toujours true, non modifiable
    analytics: false,
    marketing: false
  })

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà donné son consentement
    const consent = localStorage.getItem('cookieConsent')
    if (!consent) {
      // Petit délai pour une meilleure UX
      setTimeout(() => setShowBanner(true), 1000)
    } else {
      // Appliquer les préférences sauvegardées
      const savedPrefs = JSON.parse(consent)
      if (savedPrefs.analytics) {
        enableAnalytics()
      }
    }
  }, [])

  const enableAnalytics = () => {
    // Activer Microsoft Clarity
    if (typeof window !== 'undefined' && (window as any).clarity) {
      (window as any).clarity('consent')
    }
  }

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookieConsent', JSON.stringify(allAccepted))
    enableAnalytics()
    setShowBanner(false)
  }

  const handleAcceptSelected = () => {
    const consent = {
      ...preferences,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookieConsent', JSON.stringify(consent))
    
    if (preferences.analytics) {
      enableAnalytics()
    }
    
    setShowBanner(false)
    setShowSettings(false)
  }

  const handleRejectAll = () => {
    const rejected = {
      necessary: true, // Cookies essentiels toujours actifs
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString()
    }
    localStorage.setItem('cookieConsent', JSON.stringify(rejected))
    setShowBanner(false)
  }

  const handleShowSettings = () => {
    setIsLoadingSettings(true)
    // Délai de 5 secondes avant d'ouvrir
    setTimeout(() => {
      setShowSettings(true)
      setIsLoadingSettings(false)
    }, 5000)
  }

  if (!showBanner) return null

  return (
    <>
      {/* Bannière principale */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-white/95 backdrop-blur-lg shadow-2xl border-t border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* Icône et texte */}
            <div className="flex items-start gap-3 flex-1">
              <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-2 rounded-xl shadow-lg">
                <Cookie className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  🍪 Nous utilisons des cookies
                </h3>
                <p className="text-sm text-gray-600">
                  Pour améliorer votre expérience et analyser l'utilisation de notre site. 
                  Vous pouvez personnaliser vos préférences à tout moment.
                </p>
              </div>
            </div>

            {/* Boutons - Ordre inversé avec Accepter à droite */}
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRejectAll}
                className="order-3 sm:order-1 text-gray-600 hover:text-gray-900"
              >
                Refuser
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShowSettings}
                disabled={isLoadingSettings}
                className="order-2 sm:order-2 text-gray-600 hover:text-gray-900"
              >
                {isLoadingSettings ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-3 w-3 border-2 border-gray-400 border-t-transparent rounded-full" />
                    Chargement...
                  </span>
                ) : (
                  <>
                    <Settings className="w-4 h-4 mr-1" />
                    Personnaliser
                  </>
                )}
              </Button>

              <Button
                size="sm"
                onClick={handleAcceptAll}
                className="order-1 sm:order-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              >
                <Check className="w-4 h-4 mr-1" />
                Accepter tout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Panneau de personnalisation */}
      {showSettings && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            {/* En-tête */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-gradient-to-br from-orange-400 to-pink-500 p-2 rounded-xl">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold">Préférences de cookies</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-6">
              {/* Cookies nécessaires */}
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Cookies strictement nécessaires
                      </h3>
                      <p className="text-sm text-gray-600">
                        Essentiels au fonctionnement du site (panier, paiement, session).
                        Ces cookies ne peuvent pas être désactivés.
                      </p>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                      Toujours actif
                    </div>
                  </div>
                </div>
              </div>

              {/* Cookies analytiques */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <ChartBar className="w-5 h-5 text-blue-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Cookies analytiques
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Nous aident à comprendre comment vous utilisez le site (Microsoft Clarity).
                      </p>
                      <p className="text-xs text-gray-500">
                        Données collectées : pages visitées, clics, mouvements de souris, temps passé
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences(prev => ({ ...prev, analytics: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-pink-500"></div>
                  </label>
                </div>
              </div>

              {/* Cookies marketing */}
              <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Target className="w-5 h-5 text-purple-600 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        Cookies marketing
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        Permettent de vous proposer des publicités pertinentes.
                      </p>
                      <p className="text-xs text-gray-500">
                        Actuellement non utilisés sur ce site
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={(e) => setPreferences(prev => ({ ...prev, marketing: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-orange-500 peer-checked:to-pink-500"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Pied de page */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowSettings(false)}
                className="order-2 sm:order-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAcceptSelected}
                className="order-1 sm:order-2 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-semibold shadow-lg"
              >
                <Check className="w-4 h-4 mr-1" />
                Enregistrer mes préférences
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}