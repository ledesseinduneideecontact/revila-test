'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export default function ModeleNaissance() {
  const images = [
    {
      id: 'modele1',
      src: '/frontend-pictures/modele-naissance/faire-part-1/gabriel-recto.png',
      srcBack: '/frontend-pictures/modele-naissance/faire-part-1/gabriel-verso.png',
      alt: 'Modèle 1 - Gabriel',
      link: 'https://www.canva.com/design/DAG2U6uE-YM/8IwvhC5yizrj980-lI4mBQ/view?utm_content=DAG2U6uE-YM&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
      hasFlip: true
    },
    {
      id: 'modele2',
      src: '/frontend-pictures/modele-naissance/faire-part-2/camilla-recto.png',
      srcBack: '/frontend-pictures/modele-naissance/faire-part-2/camilla-verso.png',
      alt: 'Modèle 2 - Camilla',
      link: 'https://www.canva.com/design/DAG2U2qE63A/Fpxug4Mo7KkiWvB5HslLvw/view?utm_content=DAG2U2qE63A&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
      hasFlip: true
    },
    {
      id: 'modele3',
      src: '/frontend-pictures/modele-naissance/faire-part-3/agathe-recto.png',
      srcBack: '/frontend-pictures/modele-naissance/faire-part-3/agathe-verso.png',
      alt: 'Modèle 3 - Agathe',
      link: 'https://www.canva.com/design/DAG2U6m-AC4/4pHuPmXdzqUszGNMvoCiGA/view?utm_content=DAG2U6m-AC4&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
      hasFlip: true
    },
    {
      id: 'modele4',
      src: '/frontend-pictures/modele-naissance/faire-part-4/agathe-recto.png',
      srcBack: '/frontend-pictures/modele-naissance/faire-part-4/agathe-verso.png',
      alt: 'Modèle 4 - Agathe',
      link: 'https://www.canva.com/design/DAG2U7Oshak/nQCs9KiHP2x6iJXpKTdb6w/view?utm_content=DAG2U7Oshak&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
      hasFlip: true
    },
    {
      id: 'modele5',
      src: '/frontend-pictures/modele-naissance/juliette.png',
      alt: 'Modèle 5 - Juliette',
      link: 'https://www.canva.com/design/DAG2U4qHOEs/wPppNlVJl65ZhRM0ws-rBw/view?utm_content=DAG2U4qHOEs&utm_campaign=designshare&utm_medium=link&utm_source=publishsharelink&mode=preview',
      hasFlip: false
    }
  ]

  const [selected, setSelected] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [flippedImages, setFlippedImages] = useState<{[key: string]: boolean}>({})
  const [hoverTimeouts, setHoverTimeouts] = useState<{[key: string]: NodeJS.Timeout}>({})

  // Hover handlers for flip effect
  const handleMouseEnter = (imageId: string) => {
    // Clear any existing timeout for this image
    if (hoverTimeouts[imageId]) {
      clearTimeout(hoverTimeouts[imageId])
    }

    // Set a new timeout to flip after 0.8 seconds
    const timeout = setTimeout(() => {
      setFlippedImages(prev => ({
        ...prev,
        [imageId]: true
      }))
    }, 800)

    setHoverTimeouts(prev => ({
      ...prev,
      [imageId]: timeout
    }))
  }

  const handleMouseLeave = (imageId: string) => {
    // Clear the timeout if user leaves before 2 seconds
    if (hoverTimeouts[imageId]) {
      clearTimeout(hoverTimeouts[imageId])
    }

    // Immediately return to recto
    setFlippedImages(prev => ({
      ...prev,
      [imageId]: false
    }))
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(hoverTimeouts).forEach(timeout => clearTimeout(timeout))
    }
  }, [hoverTimeouts])

  const handleImageClick = (image: typeof images[0]) => {
    if (image.link) {
      window.open(image.link, '_blank')
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#faf8f5]">
      {/* Menu du site (header) */}
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
              <button
                onClick={() => document.getElementById('principe')?.scrollIntoView({ behavior: 'smooth' })}
                className="text-[#806947] hover:text-[#6a5638] font-medium transition-colors text-sm md:text-base"
              >
                Concept
              </button>
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
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold px-2 xs:px-3 sm:px-4 py-2 xs:py-2.5 sm:py-2 text-[10px] xs:text-xs sm:text-sm md:text-base"
              >
                Commander
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
                <button
                  onClick={() => {
                    document.getElementById('principe')?.scrollIntoView({ behavior: 'smooth' })
                    setMobileMenuOpen(false)
                  }}
                  className="text-2xl text-white hover:text-gray-200 font-medium transition-colors text-center py-4"
                >
                  Concept
                </button>
                <Link
                  href="/tuto"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl text-white hover:text-gray-200 font-medium transition-colors text-center py-4"
                >
                  Guide
                </Link>
                <Link
                  href="/mariage"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl text-white hover:text-gray-200 font-medium transition-colors text-center py-4"
                >
                  Mariage
                </Link>
                <Link
                  href="/commander"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-2xl text-white hover:text-gray-200 font-medium transition-colors text-center py-4 border-t border-white/20 pt-8"
                >
                  Commander
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>
      {/* Espace sous le header */}
      <div className="pt-32 md:pt-40" />

      {/* Section galerie */}
      <main className="flex-1">
        <section className="py-16 md:py-24 bg-gradient-to-br from-white via-gray-50/30 to-white">
          <div className="container mx-auto px-4 mb-12">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">
                Modèles de naissance
              </h2>
              <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
                Découvrez notre collection exclusive de faire-part pour célébrer l'arrivée de bébé
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-[#806947] to-[#c4b4a2] mx-auto mt-6 rounded-full"></div>
            </div>

          </div>

          {/* Call to action avant la galerie */}
          <div className="text-center mb-8 px-4">
            <p className="text-xl md:text-2xl font-semibold text-gray-800 mb-2">
              👇 Cliquez sur un modèle pour commencer
            </p>
            <p className="text-sm md:text-base text-gray-600">
              Personnalisez-le gratuitement en quelques minutes
            </p>
          </div>

          <div className="px-2 md:px-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1 md:gap-2 max-w-7xl mx-auto">
              {images.map((image, idx) => (
                <button
                  key={image.id}
                  className="group relative focus:outline-none overflow-hidden rounded-lg shadow-sm hover:shadow-xl transition-all duration-500 transform hover:scale-[1.02] hover:z-10 cursor-pointer"
                  onClick={() => handleImageClick(image)}
                  onMouseEnter={() => handleMouseEnter(image.id)}
                  onMouseLeave={() => handleMouseLeave(image.id)}
                >
                  <div className="relative overflow-hidden bg-gray-100">
                    {/* Container for slide effect */}
                    <div
                      className="flex transition-transform ease-in-out"
                      style={{
                        transform: image.hasFlip && flippedImages[image.id] ? 'translateX(-100%)' : 'translateX(0)',
                        transitionDuration: '1400ms'
                      }}
                    >
                      {/* Recto image */}
                      <img
                        src={image.src}
                        alt={`${image.alt} - Recto`}
                        className="block w-full h-auto flex-shrink-0"
                        loading="lazy"
                      />
                      {/* Verso image */}
                      {image.hasFlip && (
                        <img
                          src={image.srcBack}
                          alt={`${image.alt} - Verso`}
                          className="block w-full h-auto flex-shrink-0"
                          loading="lazy"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform scale-75 group-hover:scale-100 transition-transform duration-300">
                        <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>
                    {image.hasFlip && (
                      <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded text-xs">
                        Recto/Verso
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section explicative Canva - APRÈS la galerie */}
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-5xl mx-auto bg-gradient-to-br from-white to-gray-50 rounded-3xl shadow-2xl p-8 md:p-12 border border-gray-200">
              {/* Badge GRATUIT */}
              <div className="flex justify-center mb-6">
                <span className="inline-flex items-center px-4 py-2 bg-green-500 text-white font-bold rounded-full text-sm md:text-base shadow-lg">
                  ✓ 100% GRATUIT
                </span>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <img
                    src="https://www.canva.com/favicon.ico"
                    alt="Canva logo"
                    className="w-20 h-20 md:w-24 md:h-24"
                  />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                    Comment personnaliser votre modèle ?
                  </h3>

                  {/* Étapes numérotées */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-[#806947] text-white rounded-full flex items-center justify-center font-bold">1</span>
                      <p className="text-base md:text-lg text-gray-700 pt-1">
                        <span className="font-semibold">Cliquez sur un modèle</span> ci-dessus pour l'ouvrir dans Canva
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-[#806947] text-white rounded-full flex items-center justify-center font-bold">2</span>
                      <p className="text-base md:text-lg text-gray-700 pt-1">
                        <span className="font-semibold">Personnalisez</span> textes, couleurs, photos - 100% modifiable
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-[#806947] text-white rounded-full flex items-center justify-center font-bold">3</span>
                      <p className="text-base md:text-lg text-gray-700 pt-1">
                        <span className="font-semibold">Téléchargez en PNG</span> (haute qualité recommandée)
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-8 h-8 bg-[#806947] text-white rounded-full flex items-center justify-center font-bold">4</span>
                      <p className="text-base md:text-lg text-gray-700 pt-1">
                        <span className="font-semibold">Revenez commander</span> l'impression avec technologie NFC
                      </p>
                    </div>
                  </div>

                  {/* Avantages */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center justify-center md:justify-start gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-medium">Rapide (5-10 min)</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-medium">Sans compte</span>
                    </div>
                    <div className="flex items-center justify-center md:justify-start gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                      <span className="font-medium">100% gratuit</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                    <Link
                      href="/commander"
                      className="inline-flex items-center justify-center px-8 py-4 bg-[#806947] hover:bg-[#6a5638] text-white font-bold rounded-full transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      Commander l'impression
                    </Link>
                    <button
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-gray-50 text-[#806947] font-semibold rounded-full transition-all duration-300 shadow-md hover:shadow-lg border-2 border-[#806947]"
                    >
                      ↑ Voir les modèles
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Lightbox améliorée */}
        {selected && (
          <div
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setSelected(null)}
          >
            <div className="relative max-w-[85vw] max-h-[80vh] animate-in zoom-in-95 duration-300">
              <img
                src={selected}
                alt="Aperçu"
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              />
              <button
                onClick={() => setSelected(null)}
                className="absolute -top-4 -right-4 bg-white/90 backdrop-blur-sm hover:bg-white text-gray-800 rounded-full p-2 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm">
                Cliquez pour fermer
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-32 md:h-48">
            <img src="/70.png" alt="Décoration" className="hidden md:block h-full w-auto object-contain" />
            <div className="text-center py-8 md:py-12 flex-1">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">REVILA</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">Photos magiques qui prennent vie</p>
              <Link href="/mentions-legales" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 underline">Mentions légales</Link>
            </div>
            <img src="/69.png" alt="Décoration" className="hidden md:block h-full w-auto object-contain" />
          </div>
        </div>
      </footer>
    </div>
  )
}
