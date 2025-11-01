'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Gift, Users, Heart, Calendar, Briefcase, PartyPopper, Camera, Smartphone, ChevronDown, Plus, Minus, CheckCircle, AlertCircle, Info, Menu, X, Play, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MariagePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [volume, setVolume] = useState(0.25)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isCarouselPaused, setIsCarouselPaused] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  
  // États pour le calculateur
  const [selectedFormat, setSelectedFormat] = useState<'10x10' | '10x15'>('10x15')
  const [quantity, setQuantity] = useState(50)
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const carouselRef = useRef<HTMLDivElement>(null)
  const carouselTrackRef = useRef<HTMLDivElement>(null)
  
  const handleImageClick = () => {
    setIsVideoPlaying(true)
    if (videoRef.current) {
      videoRef.current.volume = 0  // Toujours muet
      videoRef.current.muted = true  // Forcer le mute
      videoRef.current.play()
    }
  }
  
  const handleVideoEnded = () => {
    setIsVideoPlaying(false)
  }
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setIsMuted(newVolume === 0)
    }
  }
  
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume || 0.25
        setIsMuted(false)
      } else {
        videoRef.current.volume = 0
        setIsMuted(true)
      }
    }
  }
  
  const handleCarouselClick = (imageSrc: string) => {
    if (!isDragging) {
      setSelectedImage(imageSrc)
    }
  }
  
  const closeModal = () => {
    setSelectedImage(null)
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    setStartX(e.pageX)
    setScrollLeft(translateX)
    setIsCarouselPaused(true)
  }
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setStartX(e.touches[0].pageX)
    setScrollLeft(translateX)
    setIsCarouselPaused(true)
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const x = e.pageX
    const walk = (x - startX) * 1.5
    setTranslateX(scrollLeft + walk)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const x = e.touches[0].pageX
    const walk = (x - startX) * 2  // Augmenté pour plus de réactivité
    setTranslateX(scrollLeft + walk)
  }
  
  const handleMouseUp = () => {
    setIsDragging(false)
  }
  
  const handleTouchEnd = () => {
    setIsDragging(false)
  }
  
  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false)
    }
    setIsCarouselPaused(false)
  }
  
  // Calcul des prix pour le calculateur
  const calculatePrices = () => {
    const basePrice = selectedFormat === '10x10' ? 7.50 : 9.50
    let subtotal = 0
    let unitPrice = basePrice
    
    // Application de la promo DUO sur la 2ème photo
    if (quantity >= 2) {
      subtotal = basePrice + (basePrice * 0.5) // 1ère à 100%, 2ème à 50%
      for (let i = 3; i <= quantity; i++) {
        subtotal += basePrice // Les suivantes à 100%
      }
    } else {
      subtotal = basePrice
    }
    
    // Réductions par paliers
    if (quantity >= 100) {
      subtotal = subtotal * (1 - 0.45) // -45%
    } else if (quantity >= 50) {
      subtotal = subtotal * (1 - 0.35) // -35%
    } else if (quantity >= 10) {
      subtotal = subtotal * (1 - 0.25) // -25%
    } else if (quantity >= 5) {
      subtotal = subtotal * (1 - 0.15) // -15%
    }
    
    // Frais de livraison
    const shipping = 2.99 // Standard pour photos sans cadre
    const total = subtotal + shipping
    
    return {
      unitPrice: basePrice,
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      total: total.toFixed(2)
    }
  }
  
  const prices = calculatePrices()
  
  // Effet pour charger le widget Calendly
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://assets.calendly.com/assets/external/widget.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])
  
  // Effet pour gérer le drag global
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false)
      }
    }
    
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      e.preventDefault()
      const x = e.pageX
      const walk = (x - startX) * 1.5
      setTranslateX(scrollLeft + walk)
    }
    
    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp)
      document.addEventListener('mousemove', handleGlobalMouseMove)
    }
    
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp)
      document.removeEventListener('mousemove', handleGlobalMouseMove)
    }
  }, [isDragging, startX, scrollLeft])
  
  // Effet pour détecter si la vidéo est visible
  useEffect(() => {
    if (!isVideoPlaying) return
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isVideoPlaying) {
            // Si la vidéo n'est plus visible, on l'arrête
            if (videoRef.current) {
              videoRef.current.pause()
              setIsVideoPlaying(false)
            }
          }
        })
      },
      { threshold: 0.2 } // Se déclenche quand moins de 20% de la vidéo est visible
    )
    
    if (videoContainerRef.current) {
      observer.observe(videoContainerRef.current)
    }
    
    return () => {
      if (videoContainerRef.current) {
        observer.unobserve(videoContainerRef.current)
      }
    }
  }, [isVideoPlaying])
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.addEventListener('ended', handleVideoEnded)
      return () => {
        videoRef.current?.removeEventListener('ended', handleVideoEnded)
      }
    }
  }, [isVideoPlaying])
  
  return (
    <div className="min-h-screen bg-background">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&display=swap');
        
        @font-face {
          font-family: 'Boston Angel';
          src: url('/fonts/BostonAngel.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        .font-boston {
          font-family: 'Boston Angel', serif;
        }
        
        .font-cormorant {
          font-family: 'Cormorant Garamond', serif;
        }
        
        /* Styles pour le slider de volume horizontal élégant */
        .volume-slider-horizontal {
          -webkit-appearance: none;
          appearance: none;
          height: 4px;
          background: rgba(128, 105, 71, 0.2);
          border-radius: 2px;
          outline: none;
          transition: all 0.2s;
        }
        
        .volume-slider-horizontal:hover {
          height: 6px;
        }
        
        .volume-slider-horizontal::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          background: linear-gradient(135deg, #806947, #e0865f);
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(128, 105, 71, 0.4);
          transition: all 0.2s;
        }
        
        .volume-slider-horizontal::-webkit-slider-thumb:hover {
          width: 18px;
          height: 18px;
          box-shadow: 0 3px 12px rgba(128, 105, 71, 0.6);
        }
        
        .volume-slider-horizontal::-moz-range-thumb {
          width: 14px;
          height: 14px;
          background: linear-gradient(135deg, #806947, #e0865f);
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(128, 105, 71, 0.4);
          transition: all 0.2s;
        }
        
        .volume-slider-horizontal::-moz-range-thumb:hover {
          width: 18px;
          height: 18px;
          box-shadow: 0 3px 12px rgba(128, 105, 71, 0.6);
        }
        
        /* Styles pour le carrousel infini */
        .carousel-container {
          width: 100%;
          position: relative;
          overflow-x: auto;
          overflow-y: hidden;
          cursor: grab;
          user-select: none;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .carousel-container::-webkit-scrollbar {
          display: none;
        }
        
        .carousel-container:active {
          cursor: grabbing;
        }
        
        .carousel-track {
          display: flex;
          gap: 1.5rem;
          animation: scroll-left 25s linear infinite;
          padding: 1rem 0;
          transition: transform 0.1s ease;
          will-change: transform;
          -webkit-overflow-scrolling: touch;
        }
        
        .carousel-track.paused {
          animation-play-state: paused;
        }
        
        .carousel-track.dragging {
          animation-play-state: paused;
          transition: none;
        }
        
        .carousel-container:hover .carousel-track {
          animation-play-state: paused;
        }
        
        .carousel-image {
          width: 350px;
          height: 350px;
          object-fit: cover;
          border-radius: 1rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          flex-shrink: 0;
          cursor: pointer;
          transition: transform 0.3s ease;
          -webkit-user-drag: none;
          user-drag: none;
          pointer-events: auto;
        }
        
        .carousel-image:hover {
          transform: scale(1.05);
        }
        
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        /* Masquer la scrollbar pour la section processus */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @media (max-width: 768px) {
          .carousel-image {
            width: 200px;
            height: 200px;
          }
          
          .carousel-track {
            animation: scroll-left 15s linear infinite;
          }
        }
      `}</style>

      {/* Header transparent avec navigation */}
      <header className="absolute top-0 left-0 right-0 z-50 py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Menu mobile (trois points) */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-white hover:text-gray-200 transition-colors"
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
                className="text-white hover:text-gray-200 font-medium transition-colors text-sm md:text-base"
              >
                Concept
              </Link>
              <Link 
                href="/tuto"
                className="text-white hover:text-gray-200 font-medium transition-colors text-sm md:text-base"
              >
                Guide
              </Link>
              <Link 
                href="/mariage"
                className="text-white hover:text-gray-200 font-medium transition-colors text-sm md:text-base"
              >
                Mariage
              </Link>
            </nav>
            
            {/* Logo REVILA au centre */}
            <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
              <h1 className="text-3xl md:text-4xl font-black text-white hover:text-gray-200 tracking-tight transition-colors cursor-pointer font-boston">
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

      {/* Section Hero avec titre */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#c4b4a2' }}>
        {/* Background image - desktop */}
        <div 
          className="absolute inset-0 hidden md:block"
          style={{ 
            backgroundImage: 'url(/frontend-pictures/mariage/des-remerciements-inoubliables-bordel.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100vh',
            width: '100vw'
          }}
        />
        {/* Overlay desktop */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/30 hidden md:block" />
        
        {/* Background image - mobile */}
        <div 
          className="absolute inset-0 md:hidden"
          style={{ 
            backgroundImage: 'url(/frontend-pictures/mariage/des-remerciements-inoubliables-version-tel.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100vh',
            width: '100vw'
          }}
        />
        
        {/* Content - Empty for now since the text is removed */}
        <div className="relative z-10 container mx-auto max-w-6xl text-center px-4">
          {/* Title removed as requested */}
        </div>
      </section>

      {/* Section remerciements avec mariee-deborde */}
      <section className="py-12 md:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-5xl text-gray-900 font-cormorant font-bold">
                Offrez des remerciements VIVANTS.
              </h2>
              <p className="text-lg md:text-2xl text-gray-700 mt-6 md:mt-4 font-cormorant">
                Touchez votre carte avec votre téléphone, et votre vidéo de mariage réapparaîtra. Sans app, sans QR code. C'est ça la magie Revila.
              </p>
            </div>
            <div className="relative" ref={videoContainerRef}>
              {!isVideoPlaying ? (
                <div 
                  className="relative cursor-pointer group"
                  onClick={handleImageClick}
                >
                  <img
                    src="/frontend-pictures/mariage/photo-avant-video.jpg"
                    alt="Cliquez pour découvrir"
                    className="w-full aspect-square object-cover rounded-2xl shadow-xl transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {/* Overlay avec icône play */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 rounded-full p-6 shadow-2xl animate-pulse">
                      <Play className="w-12 h-12 text-[#806947] fill-[#806947]" />
                    </div>
                  </div>
                  {/* Indicateur de clic en bas */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white/90 px-2 md:px-4 py-1 md:py-2 rounded-full text-xs md:text-sm font-medium text-[#806947] animate-bounce whitespace-nowrap">
                    Cliquez pour découvrir
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    src="/frontend-pictures/mariage/VID_20250823160808.mp4"
                    className="w-full aspect-square object-cover rounded-2xl shadow-xl"
                    autoPlay
                    playsInline
                    muted
                    onEnded={handleVideoEnded}
                    style={{ pointerEvents: 'none', transform: 'rotate(-90deg)' }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Section processus en 3 étapes */}
      <section className="py-12 md:py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Carte 1 - Choisissez */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="/frontend-pictures/mariage/ChatGPT-Image-24-aout-2025-11_42_03.png" 
                  alt="Choisissez" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 md:p-6">
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 font-cormorant">
                  Choisissez
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  Inspirez-vous des modèles, ou laissez-nous vous aider selon vos envies
                </p>
              </div>
            </div>
            
            {/* Carte 2 - Nous imprimons */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="/frontend-pictures/mariage/ChatGPT-Image-24-aout-2025-11_47_21.png" 
                  alt="Nous imprimons" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 md:p-6">
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 font-cormorant">
                  Nous imprimons
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  Toutes les cartes de remerciement, avec un mot personnalisé au dos si vous le souhaitez !
                </p>
              </div>
            </div>
            
            {/* Carte 3 - Livré prêt à offrir */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="aspect-[4/3] overflow-hidden">
                <img 
                  src="/frontend-pictures/mariage/41.png" 
                  alt="Livré prêt à offrir" 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-3 md:p-6">
                <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 font-cormorant">
                  Livré prêt à offrir
                </h3>
                <p className="text-sm md:text-base text-gray-600 leading-relaxed">
                  Vous recevez toutes les cartes chez vous
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Carrousel horizontal infini */}
      <section className="py-12 md:py-12 bg-gradient-to-b from-white to-gray-50 overflow-hidden">
        <div className="relative">
          <div 
            className="carousel-container" 
            ref={carouselRef}
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={handleMouseLeave}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              ref={carouselTrackRef}
              className={`carousel-track ${isCarouselPaused ? 'paused' : ''} ${isDragging ? 'dragging' : ''}`}
              style={{ transform: isDragging ? `translateX(${translateX}px)` : undefined }}
            >
              {/* Premier set d'images */}
              <img 
                src="/frontend-pictures/mariage/33.png" 
                alt="Photo mariage 1" 
                className="carousel-image" 
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/33.png")}
                onDragStart={(e) => e.preventDefault()}
              />
              <img 
                src="/frontend-pictures/mariage/34.png" 
                alt="Photo mariage 2" 
                className="carousel-image"
                onDragStart={(e) => e.preventDefault()}
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/34.png")}
              />
              <img 
                src="/frontend-pictures/mariage/35.png" 
                alt="Photo mariage 3" 
                className="carousel-image"
                onDragStart={(e) => e.preventDefault()}
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/35.png")}
              />
              <img 
                src="/frontend-pictures/mariage/36.png" 
                alt="Photo mariage 4" 
                className="carousel-image"
                onDragStart={(e) => e.preventDefault()}
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/36.png")}
              />
              <img 
                src="/frontend-pictures/mariage/37.png" 
                alt="Photo mariage 5" 
                className="carousel-image"
                onDragStart={(e) => e.preventDefault()}
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/37.png")}
              />
              {/* Duplication pour l'effet infini */}
              <img 
                src="/frontend-pictures/mariage/33.png" 
                alt="Photo mariage 1" 
                className="carousel-image"
                onDragStart={(e) => e.preventDefault()}
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/33.png")}
              />
              <img 
                src="/frontend-pictures/mariage/34.png" 
                alt="Photo mariage 2" 
                className="carousel-image"
                onDragStart={(e) => e.preventDefault()}
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/34.png")}
              />
              <img 
                src="/frontend-pictures/mariage/35.png" 
                alt="Photo mariage 3" 
                className="carousel-image"
                onDragStart={(e) => e.preventDefault()}
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/35.png")}
              />
              <img 
                src="/frontend-pictures/mariage/36.png" 
                alt="Photo mariage 4" 
                className="carousel-image"
                onDragStart={(e) => e.preventDefault()}
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/36.png")}
              />
              <img 
                src="/frontend-pictures/mariage/37.png" 
                alt="Photo mariage 5" 
                className="carousel-image"
                onDragStart={(e) => e.preventDefault()}
                onClick={() => handleCarouselClick("/frontend-pictures/mariage/37.png")}
              />
            </div>
          </div>
        </div>
      </section>


      {/* Section Offres */}
      <section className="py-12 md:py-20 px-4 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Offre Standard */}
            <div className="bg-gray-50 rounded-3xl p-8 shadow-lg">
              <h3 className="text-3xl font-bold text-gray-900 mb-6 font-cormorant">
                Commandez vos cartes de remerciement dès maintenant
              </h3>
              <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    <span className="font-semibold">Formats disponibles :</span> 10x10cm ou 10x15cm
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    <span className="font-semibold">Finition :</span> Standard ou brillant
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    Toutes les cartes magiques livrées chez les mariés
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    Mot personnalisé au dos possible selon vos envies
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    Prêt à donner ou envoyer directement
                  </p>
                </div>
              </div>
              <Link href="/commander">
                <button 
                  type="button"
                  style={{ 
                    backgroundColor: '#806947',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '9999px',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#6a5638'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#806947'}
                >
                  Commander
                </button>
              </Link>
              
              {/* Calculateur de prix */}
              <div className="mt-8 p-6 bg-white rounded-2xl shadow-inner">
                <button 
                  onClick={() => setCalculatorOpen(!calculatorOpen)}
                  className="w-full flex justify-between items-center text-lg font-semibold text-gray-900 mb-4 md:cursor-default"
                >
                  <span>Estimez votre budget</span>
                  <ChevronDown className={`w-5 h-5 md:hidden transition-transform ${calculatorOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <div className={`${!calculatorOpen ? 'hidden md:block' : ''}`}>
                  {/* Sélection du format */}
                  <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Format</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSelectedFormat('10x10')}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedFormat === '10x10' 
                          ? 'border-[#806947] bg-[#806947]/10 text-[#806947]' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      10x10 cm
                    </button>
                    <button
                      onClick={() => setSelectedFormat('10x15')}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        selectedFormat === '10x15' 
                          ? 'border-[#806947] bg-[#806947]/10 text-[#806947]' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      10x15 cm
                    </button>
                  </div>
                </div>
                
                {/* Sélection de la quantité */}
                <div className="mb-4">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Nombre de cartes
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 hover:border-[#806947] flex items-center justify-center transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-[#806947] focus:outline-none"
                    />
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border-2 border-gray-200 hover:border-[#806947] flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Affichage des prix */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Prix unitaire :</span>
                    <span className="font-medium">{prices.unitPrice.toFixed(2)}€</span>
                  </div>
                  {quantity >= 2 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Offre DUO appliquée</span>
                      <span>-50% sur la 2ème</span>
                    </div>
                  )}
                  {quantity >= 5 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Réduction volume</span>
                      <span>
                        {quantity >= 100 ? '-45%' : 
                         quantity >= 50 ? '-35%' : 
                         quantity >= 10 ? '-25%' : '-15%'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sous-total :</span>
                    <span className="font-medium">{prices.subtotal}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Livraison :</span>
                    <span className="font-medium">{prices.shipping}€</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total TTC :</span>
                    <span className="text-[#806947]">{prices.total}€</span>
                  </div>
                </div>
                </div>
              </div>
            </div>
            
            {/* Options Prestige */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-8 shadow-xl border-2 border-amber-200">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-3xl font-bold text-gray-900 font-cormorant">
                  Les options Prestige
                </h3>
                <span className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  PREMIUM
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    <span className="font-semibold">Papier personnalisé :</span> format sur-mesure, brillant, mat, épaisseur et texture au choix
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    Étiquette verso personnalisée en plus du mot
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    Enveloppe personnalisée avec vos prénoms
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    <span className="font-semibold">Livraison directe chez vos invités :</span> pas de galère d'adressage manuel, rien à préparer
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-700">
                    Cachet de cire sur l'enveloppe pour une touche d'élégance
                  </p>
                </div>
              </div>
              <div className="mt-8">
                <a 
                  href="https://calendly.com/contact-revila/30min" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    width: '100%',
                    background: 'linear-gradient(to right, #d97706, #eab308)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '9999px',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    textAlign: 'center',
                    textDecoration: 'none',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #b45309, #ca8a04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'linear-gradient(to right, #d97706, #eab308)'}
                >
                  Prendre rendez-vous rapidement
                </a>
              </div>
              
              {/* Image illustrative */}
              <div className="mt-6">
                <img 
                  src="/frontend-pictures/mariage/assets_task_01k3avkny1etvrqy8e1ccx8tss_1755932438_img_1.webp"
                  alt="Service Prestige Revila"
                  className="w-full h-auto rounded-xl shadow-md"
                />
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Section Questions et Rendez-vous */}
      <section className="py-12 md:py-20 px-4 bg-gray-50">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 mb-4 font-cormorant">
              Des questions sur votre projet de mariage ?
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Prenons rendez-vous pour échanger sur vos envies et créer ensemble vos remerciements magiques
            </p>
          </div>
          
          {/* Début de widget en ligne Calendly */}
          <div 
            className="calendly-inline-widget shadow-xl rounded-2xl overflow-hidden" 
            data-url="https://calendly.com/contact-revila/30min?primary_color=806947&text_color=333333&background_color=fafafa&hide_gdpr_banner=1" 
            style={{ minWidth: '320px', height: '700px' }}
          />
          {/* Fin de widget en ligne Calendly */}
        </div>
      </section>

      {/* Section Salon du Mariage */}
      <section className="py-12 md:py-20 px-4" style={{ backgroundColor: '#806947' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Retrouvez-nous au Salon du Mariage de Paris
          </h2>
          <p className="text-2xl md:text-3xl text-white/90 font-cormorant mb-4">
            13 & 14 septembre 2025
          </p>
          <p className="text-lg md:text-xl text-white/80">
            Le plus grand salon du mariage de France
          </p>
        </div>
      </section>

      {/* Footer comme sur la page principale */}
      <footer className="bg-white py-16 border-t">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo et description */}
            <div className="md:col-span-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 font-boston">REVILA</h3>
              <p className="text-gray-600 text-sm font-cormorant">
                Transformez vos photos en souvenirs vivants avec la magie du NFC.
              </p>
            </div>
            
            {/* Navigation */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Navigation</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 hover:text-gray-900 text-sm">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="/commander" className="text-gray-600 hover:text-gray-900 text-sm">
                    Commander
                  </Link>
                </li>
                <li>
                  <Link href="/tuto" className="text-gray-600 hover:text-gray-900 text-sm">
                    Guide
                  </Link>
                </li>
                <li>
                  <Link href="/mariage" className="text-gray-600 hover:text-gray-900 text-sm">
                    Mariage
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Contact */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Contact</h4>
              <ul className="space-y-2">
                <li className="text-gray-600 text-sm">
                  contact@revila.fr
                </li>
                <li className="text-gray-600 text-sm">
                  06 12 34 56 78
                </li>
              </ul>
            </div>
            
            {/* Réseaux sociaux */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-4">Suivez-nous</h4>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-600 hover:text-gray-900">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t text-center">
            <p className="text-gray-600 text-sm">
              © 2025 REVILA. Tous droits réservés. Made with ❤️ in France
            </p>
          </div>
        </div>
      </footer>
      
      {/* Modal pour afficher l'image en grand */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center"
          onClick={closeModal}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <img 
              src={selectedImage} 
              alt="Image agrandie" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 bg-white/90 rounded-full p-2 hover:bg-white transition-colors shadow-lg"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}