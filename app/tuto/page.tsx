'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Gift, Users, Heart, Calendar, Briefcase, PartyPopper, Camera, Smartphone, ChevronDown, Plus, Minus, CheckCircle, AlertCircle, Info, Menu, X, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TutoPage() {
  const [phoneType, setPhoneType] = useState<string | null>(null)
  const [showIphoneList, setShowIphoneList] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  // Video search states
  const [shortId, setShortId] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('')
  const [lastSearchTime, setLastSearchTime] = useState(0)
  const [failedAttempts, setFailedAttempts] = useState(0)

  const applePhones = [
    { name: 'iPhone 7 / 7 Plus', year: '2016', background: false, app: true, notes: 'Lecteur NFC via Centre de contrôle' },
    { name: 'iPhone 8 / 8 Plus', year: '2017', background: false, app: true, notes: 'Idem iPhone 7' },
    { name: 'iPhone X', year: '2017', background: false, app: true, notes: 'Pas de background scanning' },
    { name: 'iPhone XR', year: '2018', background: true, app: false, notes: 'Première génération lecture auto' },
    { name: 'iPhone XS / XS Max', year: '2018', background: true, app: false, notes: '' },
    { name: 'iPhone 11 (toute la gamme)', year: '2019', background: true, app: false, notes: '' },
    { name: 'iPhone SE (2ᵉ gén.)', year: '2020', background: true, app: false, notes: 'Basé sur A13' },
    { name: 'iPhone 12 mini/12/12 Pro/12 Pro Max', year: '2020', background: true, app: false, notes: '' },
    { name: 'iPhone 13 mini/13/13 Pro/13 Pro Max', year: '2021', background: true, app: false, notes: '' },
    { name: 'iPhone SE (3ᵉ gén.)', year: '2022', background: true, app: false, notes: '' },
    { name: 'iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max', year: '2022', background: true, app: false, notes: '' },
    { name: 'iPhone 15 famille', year: '2023', background: true, app: false, notes: '' },
    { name: 'iPhone 16 famille', year: '2024', background: true, app: false, notes: '' }
  ]

  // Video search function
  const handleVideoSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Reset previous messages
    setSearchMessage('')
    setMessageType('')
    
    // Validate input format
    const trimmedId = shortId.trim()
    if (!trimmedId) {
      setSearchMessage('Veuillez entrer un numéro de série')
      setMessageType('error')
      return
    }
    
    // Client-side validation
    const pattern = /^[a-zA-Z0-9]{6,20}$/
    if (!pattern.test(trimmedId)) {
      setSearchMessage('Code non valide')
      setMessageType('error')
      return
    }
    
    // Progressive delay based on failed attempts
    const now = Date.now()
    const delays = [0, 2000, 5000, 10000] // 0s, 2s, 5s, 10s
    const delay = delays[Math.min(failedAttempts, delays.length - 1)]
    
    if (now - lastSearchTime < delay) {
      const remainingTime = Math.ceil((delay - (now - lastSearchTime)) / 1000)
      setSearchMessage(`Veuillez attendre ${remainingTime} seconde(s) avant de réessayer`)
      setMessageType('error')
      return
    }
    
    setIsSearching(true)
    setLastSearchTime(now)
    
    try {
      const response = await fetch('/api/video-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shortId: trimmedId }),
      })
      
      const data = await response.json()
      
      if (response.ok && data.success && data.videoUrl) {
        setSearchMessage('Vidéo trouvée ! Ouverture en cours...')
        setMessageType('success')
        setFailedAttempts(0) // Reset failed attempts on success
        
        // Open video in new tab securely
        window.open(data.videoUrl, '_blank', 'noopener,noreferrer')
        
        // Clear form after success
        setTimeout(() => {
          setShortId('')
          setSearchMessage('')
          setMessageType('')
        }, 3000)
      } else {
        setSearchMessage(data.error || 'Code non valide')
        setMessageType('error')
        setFailedAttempts(prev => prev + 1) // Increment failed attempts
      }
    } catch (error) {
      console.error('Search error:', error)
      setSearchMessage('Erreur de connexion. Veuillez réessayer.')
      setMessageType('error')
      setFailedAttempts(prev => prev + 1) // Increment failed attempts on error
    } finally {
      setIsSearching(false)
    }
  }

  const androidPhones = [
    { brand: 'Samsung', models: 'Galaxy S2 → S25, Note 2 → Note 20 Ultra, Z Flip/Fold, séries A/M/F, XCover, Tab Active/Pro' },
    { brand: 'Google', models: 'Nexus S/4/5/6/7/9/10/5X/6P, Pixel 1 → 9, Pixel a (3a/4a/5a/6a/7a/8a)' },
    { brand: 'OnePlus', models: 'One, 3/3T, 5/5T, 6/6T, 7/7 Pro/T, 8 → 13 séries (CE/Pro/Ultra)' },
    { brand: 'Xiaomi/Redmi/POCO', models: 'Mi 3 → 14 Pro, Mi Mix 1 → 4/Fold 1 → 3, 11/12/13 familles, Black Shark 4 → 5 Pro, Redmi K20/K30/K40/K60, Redmi Note 8T/9/10X Pro, Poco X3 NFC' },
    { brand: 'Huawei/Honor', models: 'Ascend P2/P7 → Mate 50 Pro, Mate 8 → 40 Pro+, P9 → P60, Nova 5T → Nova 12, Honor 8 → Magic 4/5 et séries View/X/V' },
    { brand: 'Sony', models: 'Xperia Z → Z5 Premium, XA → XA2/Ultra, XZ → XZ3, Xperia 1 (I → V), Xperia 5 (I → V), Xperia 10 (I → V)' },
    { brand: 'LG', models: 'Optimus L5/L7/L9 II, G2 → G8X ThinQ, V10 → V60 ThinQ, Velvet, Wing, Q 6 → Q92, K 10/40/61/92' },
    { brand: 'Motorola/Lenovo', models: 'Moto X/X30/X40, Moto G (2014) → G 86, Moto E4 → E13, Edge (20/30/40/60 Pro), Razr 2019/5G, ThinkPhone, Legion Phone Duel' },
    { brand: 'OPPO/Realme/vivo', models: 'OPPO Find X → X7, Reno 2 → 10 Pro, Ace 2, K 5–10 Pro, Realme GT/9/10/11 Pro+, vivo X51 5G, X Fold → X Fold 3 Pro, iQOO Neo → 10' },
    { brand: 'ASUS', models: 'Zenfone 4 → 10, ROG Phone 1 → 7 Ultimate, Padfone 2/Infinity' },
    { brand: 'Nokia (HMD)', models: '3 → 9 PureView, XR 20/21, X 10/20/30, G 11/20/60/300, Lumia gamme NFC (610 → 950 XL)' },
    { brand: 'Autres marques', models: 'Acer Liquid/CloudMobile, Alcatel Idol/1–5/V, BlackBerry KEYone → Key 2 LE, ZTE Axon 7 → 50 Ultra, Sharp Aquos, Meizu 16s → 18s Pro, Wiko View (2 → 3 Pro), Sunmi M2 Max, TCL 10/20' }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header transparent avec navigation */}
      <header className="absolute top-0 left-0 right-0 z-50 py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Menu mobile (trois points) */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#806947] hover:text-[#6a5638] transition-colors"
                aria-label="Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center space-x-4 md:space-x-6">
              <Link 
                href="/#principe"
                className="text-[#806947] hover:text-[#6a5638] font-medium transition-colors text-sm md:text-base"
              >
                Concept
              </Link>
              <Link 
                href="/tuto"
                className="text-[#806947] hover:text-[#6a5638] font-medium transition-colors text-sm md:text-base"
              >
                Guide
              </Link>
              <Link 
                href="/mariage"
                className="text-[#806947] hover:text-[#6a5638] font-medium transition-colors text-sm md:text-base"
              >
                Mariage
              </Link>
            </nav>
            
            {/* Logo REVILA au centre */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-3xl md:text-4xl font-black text-[#806947] hover:text-[#6a5638] tracking-tight transition-colors cursor-pointer" style={{fontFamily: 'Boston Angel, serif'}}>
                Revila
              </h1>
            </Link>
            
            {/* Bouton Commander à droite - responsive */}
            <div>
              <Link 
                href="/commander"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold px-2 xs:px-3 sm:px-4 py-1 xs:py-1.5 sm:py-2 text-[10px] xs:text-xs sm:text-sm md:text-base"
              >
                Je commande
              </Link>
            </div>
          </div>

          {/* Menu déroulant mobile plein écran */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 bg-[#c4b4a2] z-[60] flex flex-col">
              {/* Header du menu mobile avec croix */}
              <div className="flex justify-between items-center p-4 border-b border-white/20">
                <h2 className="text-2xl font-bold text-white">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-white hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Navigation mobile */}
              <nav className="flex-1 flex flex-col justify-center px-8 space-y-8 bg-[#c4b4a2]">
                <Link 
                  href="/#principe"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white text-2xl font-semibold text-center hover:text-gray-200 transition-colors"
                >
                  Concept
                </Link>
                <Link 
                  href="/tuto"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white text-2xl font-semibold text-center hover:text-gray-200 transition-colors"
                >
                  Guide
                </Link>
                <Link 
                  href="/mariage"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-white text-2xl font-semibold text-center hover:text-gray-200 transition-colors"
                >
                  Mariage
                </Link>
                <Link 
                  href="/commander"
                  onClick={() => setMobileMenuOpen(false)}
                  className="bg-white text-[#806947] rounded-full px-8 py-4 text-xl font-bold text-center hover:bg-gray-100 transition-colors"
                >
                  Je commande
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      

      {/* Section Compatibilité téléphones */}
      <section className="pt-32 pb-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          {/* Titre + boutons centrés verticalement */}
          <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 uppercase tracking-tight">tuto</h2>
            <div className="flex justify-center">
              <div className="bg-gray-200 rounded-full p-2 flex gap-2">
                <button
                  onClick={() => setPhoneType(phoneType === 'apple' ? null : 'apple')}
                  className={`px-8 py-4 rounded-full text-lg font-semibold transition-all ${
                    phoneType === 'apple' 
                      ? 'bg-white shadow-md text-gray-900' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">🍎</span> Apple
                </button>
                <button
                  onClick={() => setPhoneType(phoneType === 'android' ? null : 'android')}
                  className={`px-8 py-4 rounded-full text-lg font-semibold transition-all ${
                    phoneType === 'android' 
                      ? 'bg-white shadow-md text-gray-900' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <span className="mr-3">🤖</span> Android
                </button>
              </div>
            </div>
          </div>

          {/* Contenu selon le type de téléphone */}
          {phoneType === 'apple' && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              {/* Vidéo tutorielle iPhone */}
              <div className="mb-8">
                <div className="aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
                  <video className="w-full h-full" controls>
                    <source src="/frontend-pictures/Guide Revila Apple.mp4" type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                </div>
              </div>

              {/* Description iPhone */}
              <div className="max-w-3xl mx-auto text-left text-gray-800 space-y-4 mb-10">
                <h4 className="text-xl font-semibold">Vérifiez l’éligibilité de votre iPhone</h4>
                <p>Consultez la liste des modèles compatibles.</p>
                <p>
                  Pour les modèles non éligibles, téléchargez gratuitement l’application « NFC Tag Info »
                  :
                  {" "}
                  <a
                    href="https://apps.apple.com/fr/app/nfc-taginfo-by-nxp/id1246142101"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 underline"
                  >
                    Lien App Store
                  </a>
                </p>

                <h4 className="text-xl font-semibold">Repérage des capteurs / puces NFC</h4>
                <img src="/frontend-pictures/tuto/iphone-capteur-nfc.png" alt="Repérage capteurs NFC iPhone" className="w-full max-w-md mx-auto my-4 rounded-lg shadow-md" />
                <p>Le capteur NFC de votre iPhone se situe sur la partie supérieure de l'appareil.</p>
                <p>La puce NFC intégrée à la photo se situe au centre de celle-ci.</p>

                <h4 className="text-xl font-semibold">Posez et glissez</h4>
                <img src="/frontend-pictures/tuto/iphone-posez-glissez.png" alt="Posez et glissez iPhone" className="w-full max-w-md mx-auto my-4 rounded-lg shadow-md" />
                <p>
                  Placez votre téléphone à plat sur la photo, puis faites-le glisser vers le bas jusqu'à ce que
                  votre capteur se superpose avec la puce. Une notification apparaîtra alors.
                </p>

                <h4 className="text-xl font-semibold">Revivez votre moment</h4>
                <img src="/frontend-pictures/tuto/iphone-revivez.png" alt="Revivez votre moment iPhone" className="w-full max-w-md mx-auto my-4 rounded-lg shadow-md" />
                <p>
                  Cliquez sur la notification, et votre souvenir vidéo se déclenche immédiatement.
                </p>
              </div>

              {/* Liste des iPhones compatibles */}
              <div className="border-t pt-6">
                <button
                  onClick={() => setShowIphoneList(!showIphoneList)}
                  className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900">Voir la liste complète des iPhones compatibles</span>
                  <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showIphoneList ? 'rotate-180' : ''}`} />
                </button>
                
                {showIphoneList && (
                  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    {applePhones.map((phone, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Smartphone className="w-5 h-5 text-green-500 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{phone.name}</span>
                              <span className="text-sm text-gray-500">({phone.year})</span>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              {phone.background && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Lecture auto</span>
                              )}
                              {phone.app && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">App requise</span>
                              )}
                            </div>
                            {phone.notes && (
                              <p className="text-xs text-gray-600 mt-1">{phone.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {phoneType === 'android' && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-12">
              {/* Vidéo tutorielle Android */}
              <div className="mb-8">
                <div className="aspect-video max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
                  <video className="w-full h-full" controls>
                    <source src="/frontend-pictures/Guide Revila Android.mp4" type="video/mp4" />
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                </div>
              </div>

              {/* Description Android */}
              <div className="max-w-3xl mx-auto text-left text-gray-800 space-y-4 mb-10">
                <h4 className="text-xl font-semibold">Vérifiez l’éligibilité de votre Android</h4>
                <p>Consultez la liste des modèles compatibles.</p>

                <h4 className="text-xl font-semibold">Repérage des capteurs / puces NFC</h4>
                <img src="/frontend-pictures/tuto/android-capteur-nfc.png" alt="Repérage capteurs NFC Android" className="w-full max-w-md mx-auto my-4 rounded-lg shadow-md" />
                <p>
                  Le capteur NFC des téléphones Android se situe généralement au centre ou sur la partie supérieure
                  du téléphone.
                </p>
                <p>La puce NFC intégrée à la photo se trouve au centre de celle-ci.</p>

                <h4 className="text-xl font-semibold">Posez et glissez</h4>
                <img src="/frontend-pictures/tuto/android-posez-glissez.png" alt="Posez et glissez Android" className="w-full max-w-md mx-auto my-4 rounded-lg shadow-md" />
                <p>
                  Placez votre téléphone à plat sur la photo, puis faites-le glisser vers le bas jusqu'à ce que votre
                  capteur se superpose avec la puce. Une notification apparaîtra alors.
                </p>

                <h4 className="text-xl font-semibold">Revivez votre moment</h4>
                <p>
                  Cliquez sur la notification, et votre souvenir vidéo se déclenche immédiatement.
                </p>
              </div>

              {/* Liste des marques Android compatibles */}
              <div className="border-t pt-6">
                <button
                  onClick={() => setShowIphoneList(!showIphoneList)}
                  className="flex items-center justify-between w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="font-semibold text-gray-900">Voir la liste complète des marques Android compatibles</span>
                  <ChevronDown className={`w-5 h-5 text-gray-600 transition-transform ${showIphoneList ? 'rotate-180' : ''}`} />
                </button>
                
                {showIphoneList && (
                  <div className="mt-4 space-y-2 max-h-96 overflow-y-auto">
                    {androidPhones.map((brand, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Smartphone className="w-5 h-5 text-green-500 mt-1" />
                          <div className="flex-1">
                            <span className="font-medium text-gray-900">{brand.brand}</span>
                            <p className="text-sm text-gray-600 mt-1">{brand.models}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section recherche vidéo */}
          <div className="mt-12 p-6 bg-blue-50 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Retrouvez votre vidéo grâce au numéro de série
            </h3>
            
            <form onSubmit={handleVideoSearch} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <input
                    type="text"
                    value={shortId}
                    onChange={(e) => setShortId(e.target.value)}
                    placeholder="Entrez votre numéro de série"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    pattern="[a-zA-Z0-9]{6,20}"
                    maxLength={20}
                    disabled={isSearching}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !shortId.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Rechercher
                    </>
                  )}
                </button>
              </div>
              
              {searchMessage && (
                <div className={`mt-3 p-3 rounded-lg text-sm ${
                  messageType === 'success' 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-red-100 text-red-800 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {messageType === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {searchMessage}
                  </div>
                </div>
              )}
            </form>
            
            <p className="text-xs text-gray-600 text-center mt-3">
              Le numéro de série se trouve sur votre photo Revila ou dans votre email de confirmation
            </p>
          </div>

          {/* Section contact SAV */}
          <div className="mt-8 p-6 bg-orange-50 rounded-xl text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Besoin d'aide ?</h3>
            <p className="text-gray-700">
              Contactez notre service après-vente : 
              <a href="mailto:contact@revila.fr" className="ml-2 text-orange-600 hover:text-orange-700 font-medium underline">
                contact@revila.fr
              </a>
            </p>
          </div>

        </div>
      </section>

      {/* Footer principal (comme page d'accueil) */}
      <footer className="bg-white border-t relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex items-center justify-between h-32 md:h-48">
            {/* Image gauche - cachée sur mobile */}
            <img 
              src="/70.png" 
              alt="Décoration" 
              className="hidden md:block h-full w-auto object-contain"
            />
            
            {/* Contenu central - prend toute la largeur sur mobile */}
            <div className="text-center py-8 md:py-12 flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">REVILA</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">Photos magiques qui prennent vie</p>
              <a href="/mentions-legales" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 underline">
                Mentions légales
              </a>
            </div>
            
            {/* Image droite - cachée sur mobile */}
            <img 
              src="/69.png" 
              alt="Décoration" 
              className="hidden md:block h-full w-auto object-contain"
            />
          </div>
        </div>
      </footer>
    </div>
  )
} 