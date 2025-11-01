'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Gift, Users, Heart, Calendar, Briefcase, PartyPopper, Camera, Smartphone, ChevronDown, Plus, Minus, CheckCircle, AlertCircle, Info, MoreVertical, X, Menu, Instagram, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [faqSectionOpen, setFaqSectionOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const uploadVideoRef = useRef<HTMLVideoElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkDevice()
    window.addEventListener('resize', checkDevice)
    
    return () => {
      window.removeEventListener('resize', checkDevice)
    }
  }, [])

  useEffect(() => {
    if (uploadVideoRef.current) {
      uploadVideoRef.current.playbackRate = 2.0
    }
  }, [])

  const faqItems = [
    {
      question: "Comment fonctionne la technologie des photos magiques ?",
      answer: "Nos photos contiennent une puce NFC invisible qui se déclenche quand vous posez votre téléphone dessus. Cela ouvre automatiquement la vidéo associée."
    },
    {
      question: "Tous les téléphones sont-ils compatibles ?",
      answer: <>La plupart des smartphones récents avec NFC sont compatibles. <Link href="/tuto" className="text-orange-500 hover:text-orange-600 underline">Consultez notre liste de compatibilité complète</Link>.</>
    },
    {
      question: "Combien de temps pour recevoir ma commande ?",
      answer: "Nos photos magiques sont expédiées sous 3-5 jours ouvrés en France métropolitaine."
    },
    {
      question: "Comment sont stockées mes données ?",
      answer: (
        <>
          <Lock className="w-5 h-5 text-green-600 inline mr-2" />
          <span>Les données sont stockées via un service en ligne pour permettre à l'utilisateur qui possède la photo d'accéder à la vidéo. Toute autre personne qui n'a pas la photo ne peut pas accéder au lien de la vidéo.</span>
        </>
      )
    },
    {
      question: "Comment créer ma photo magique ?",
      answer: "Pour créer une Revila, il suffit de cliquer sur la section commander sur le site, et de nous fournir une photo et une vidéo."
    }
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

      {/* Bandeau supérieur avec image de fond */}
      <section 
        className="relative bg-white flex items-center justify-center"
        style={{ height: '100vh' }}
      >
        {/* Image de fond responsive - clickable sur mobile */}
        <img
          src={isMobile ? "/frontend-pictures/hero-mobile-new.jpg" : "/frontend-pictures/openart-a8532219d9da42fd8ce13437a13dec1a_raw.jpg"}
          alt="REVILA - Photos magiques"
          className={isMobile ? "object-cover w-full h-full cursor-pointer" : "object-cover w-[100vw] h-screen"}
          onClick={isMobile ? () => {
            const section = document.querySelector('section.py-16.px-4.bg-gradient-to-b');
            section?.scrollIntoView({ behavior: 'smooth' });
          } : undefined}
        />
      </section>

      {/* Section explicative Revila */}
      <section id="principe" className="py-8 md:py-16 px-4 bg-gradient-to-b from-white to-gray-50">
        <div className="container mx-auto max-w-4xl text-center">
          <img 
            src={isMobile ? "/frontend-pictures/decouvrir-revila-mobile.png" : "/frontend-pictures/Simple Lined Watercolor Art Mockup Facebook Post (3).png"}
            alt="Qu'est-ce que Revila ?"
            className="w-full h-auto rounded-lg shadow-lg"
          />
          {/* Vidéo déplacée ici sur mobile uniquement */}
          {isMobile && (
            <div className="mt-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center pt-8" style={{fontFamily: 'Boston Angel, serif'}}>
                Découvrez le concept en vidéo
              </h3>
              <video
                controls
                preload="metadata"
                className="w-full h-full object-cover rounded-2xl shadow-lg"
                poster="/henri-sourit-video-pub.jpg"
                playsInline
              >
                <source src="/PUB-REVILA-1.1.mp4" type="video/mp4" />
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            </div>
          )}
        </div>
      </section>

      {/* Section Cadeau parfait - Remplacée par image */}
      <section className="relative p-4 md:p-8 bg-gray-50">
        <img 
          src={isMobile ? "/frontend-pictures/cadeau-section-mobile.png" : "/frontend-pictures/cadeau-section-desktop.png"}
          alt="Le cadeau parfait pour toutes les occasions"
          className="w-full h-auto"
        />
      </section>

      {/* Section Comment ça marche */}
      <section id="comment-ca-marche" className="hidden md:block py-20 px-4 bg-gradient-to-b from-orange-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-2xl md:text-6xl font-bold text-center mb-8 md:mb-16" style={{fontFamily: 'Boston Angel, serif', color: '#806947'}}>
            Comment ça marche ?
          </h3>
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg" style={{backgroundColor: '#806947'}}>1</div>
                <h4 className="text-3xl md:text-4xl font-bold" style={{fontFamily:'Boston Angel, serif', color: '#806947'}}>Ajoute tes photos et vidéos</h4>
              </div>
              <p className="text-lg" style={{color: '#806947'}}>Upload facilement tes photos préférées et associe-leur des vidéos mémorables sur notre plateforme.</p>
            </div>
            <div className="order-1 md:order-2 hidden md:block">
              <div className="w-full md:w-[30vw] mx-auto rounded-2xl shadow-lg bg-white overflow-hidden" style={{maxWidth:'400px',aspectRatio:'1/1'}}>
                <video ref={uploadVideoRef} autoPlay loop muted playsInline className="w-full h-full object-contain bg-white">
                  <source src="/frontend-pictures/upload-square.mp4" type="video/mp4"/>
                  <img src="/Etape 1 - Image.png" alt="Interface d'ajout de photos et vidéos" className="w-full h-full object-cover"/>
                </video>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="hidden md:block">
              <div className="w-full md:w-[25vw] mx-auto rounded-2xl shadow-lg bg-white overflow-hidden">
                <img src="/frontend-pictures/enveloppe-pour-envoi.png" alt="Photos reçues chez soi" className="w-full h-full object-contain bg-white"/>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg" style={{backgroundColor: '#806947'}}>2</div>
                <h4 className="text-3xl md:text-4xl font-bold" style={{fontFamily:'Boston Angel, serif', color: '#806947'}}>Envoie les photos où tu veux !</h4>
              </div>
              <p className="text-lg" style={{color: '#806947'}}>Nous imprimons tes photos magiques et on les envoie où tu le souhaites ! Les photos dans une enveloppe design, ou un paquet cadeau personnalisé.</p>
            </div>
          </div>
          
          {/* Étape 3 - dans la même section */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg" style={{backgroundColor: '#806947'}}>
                  3
                </div>
                <h4 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Boston Angel, serif', color: '#806947' }}>
                  Pose ton téléphone sur la photo magique
                </h4>
              </div>
              <p className="text-lg" style={{color: '#806947'}}>
                La photo est associée à une vidéo souvenir.
              </p>
            </div>
            <div className="order-1 md:order-2 hidden md:block">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full md:w-[33vw] mx-auto rounded-2xl shadow-lg"
                style={{ maxWidth: '500px' }}
              >
                <source src="/phone-on-picture.mp4" type="video/mp4" />
                {/* Fallback pour les navigateurs qui ne supportent pas la vidéo */}
                <img
                  src="/20250728-155416484-3.jpg"
                  alt="Téléphone posé sur une photo"
                  className="w-full h-full object-cover"
                />
              </video>
            </div>
          </div>

          {/* Étape 4 - dans la même section */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="hidden md:block">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-full md:w-[33vw] mx-auto rounded-2xl shadow-lg"
                style={{ maxWidth: '500px' }}
              >
                <source src="/phone-play.mp4" type="video/mp4" />
                {/* Fallback pour les navigateurs qui ne supportent pas la vidéo */}
                <img
                  src="/20250728-161022410-3.jpg"
                  alt="Moment magique qui revit"
                  className="w-full h-full object-cover"
                />
              </video>
            </div>
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-2xl font-bold shadow-lg" style={{backgroundColor: '#806947'}}>
                  4
                </div>
                <h4 className="text-3xl md:text-4xl font-bold" style={{ fontFamily: 'Boston Angel, serif', color: '#806947' }}>
                  Ça y est ! Ton moment revit !
                </h4>
              </div>
              <p className="text-lg" style={{color: '#806947'}}>
                La vidéo se lance automatiquement et ton souvenir reprend vie comme par magie !
              </p>
            </div>
          </div>
        </div>
      </section>
      

      {/* Section Vidéo découverte - seulement sur desktop */}
      {!isMobile && (
        <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8" style={{fontFamily: 'Boston Angel, serif'}}>
              Découvrez REVILA en vidéo
            </h3>
            <div className="max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl bg-black">
              <video
                controls
                preload="metadata"
                className="w-full h-full object-cover"
                poster="/henri-sourit-video-pub.jpg"
                playsInline
              >
                <source src="/PUB-REVILA-1.1.mp4" type="video/mp4" />
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            </div>
          </div>
        </section>
      )}

      {/* Section Call-to-Action avec image de fond */}
      <section className="relative py-16 md:py-20" style={{backgroundColor: '#c4b4a2'}}>
        
        {/* Contenu centré */}
        <div className="relative z-10 container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 drop-shadow-lg" style={{fontFamily: 'Boston Angel, serif'}}>
              Prêt à créer vos photos magiques ?
            </h3>
            <p className="text-lg md:text-xl text-white/90 mb-8 drop-shadow">
              Transformez vos souvenirs en moments interactifs uniques
            </p>
            
            {/* Boutons stylés */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-white hover:bg-gray-100 text-gray-800 rounded-full shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 font-bold px-4 md:px-10 py-4 md:py-6 text-base md:text-2xl mx-4">
                <Link href="/commander">
                  Je commande
                </Link>
              </Button>
              
              <Button asChild size="lg" className="bg-white hover:bg-gray-100 text-gray-800 px-4 md:px-8 py-4 text-base md:text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium mx-4">
                <Link href="/mariage">
                  💍 Découvrir la formule mariage
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bandeau Partenariat Professionnel */}
      <section className="py-8 md:py-12 bg-gradient-to-r from-[#806947]/5 via-[#c4b4a2]/10 to-[#806947]/5 border-t border-[#c4b4a2]/20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl md:text-2xl font-bold text-[#806947] mb-3" style={{fontFamily: 'Boston Angel, serif'}}>
                  🤝 Vous êtes professionnel ?
                </h4>
                <p className="text-base md:text-lg text-[#6a5638]/80 leading-relaxed">
                  Nous sommes ouverts aux partenariats ! Contactez-nous pour discuter de collaboration et découvrir nos opportunités.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Button asChild className="bg-[#806947] hover:bg-[#6a5638] text-white px-6 md:px-8 py-3 md:py-4 text-base md:text-lg rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-medium">
                  <Link href="/partenaire">
                    💼 Discuter partenariat
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bandeau Salon du Mariage */}
      <section className="py-6 bg-gradient-to-r from-[#806947]/10 via-[#c4b4a2]/15 to-[#806947]/10 border-y border-[#c4b4a2]/30">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              {/* Section Salon */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#806947] rounded-full flex items-center justify-center">
                  <PartyPopper className="w-5 h-5 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-[#806947]">Salon du Mariage Paris 2025</p>
                  <p className="text-xs text-[#6a5638]/70">Innovation présentée</p>
                </div>
              </div>
              
              {/* Séparateur */}
              <div className="hidden md:block w-px h-8 bg-[#c4b4a2]/40"></div>
              
              {/* Section Visiteurs */}
              <div className="text-center">
                <p className="text-sm md:text-base text-[#6a5638] font-medium">
                  <strong className="text-[#806947]">40 000 visiteurs</strong> ont découvert nos photos magiques
                </p>
              </div>
              
              {/* Séparateur */}
              <div className="hidden md:block w-px h-8 bg-[#c4b4a2]/40"></div>
              
              {/* Section Étoiles */}
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-[#6a5638]/80 font-medium">Retours exceptionnels</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Avis Clients */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-[#806947] mb-4" style={{fontFamily: 'Boston Angel, serif'}}>
                Ce qu'ils en pensent
              </h2>
              <p className="text-gray-600">Les retours de nos visiteurs au salon</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Avis 1 */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-[#806947]">
                <p className="text-gray-700 italic text-lg leading-relaxed">"Je ne pensais même pas que ça pouvait exister"</p>
              </div>

              {/* Avis 2 */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-[#c4b4a2]">
                <p className="text-gray-700 italic text-lg leading-relaxed">"Au début, on m'a dit impression vidéo, et j'ai eu du mal à comprendre... mais sinon belle surprise !"</p>
              </div>

              {/* Avis 3 */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-[#806947]">
                <p className="text-gray-700 italic text-lg leading-relaxed">"Vous êtes deux jeunes et vous avez fait une très belle invention, bravo !"</p>
              </div>

              {/* Avis 4 */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-[#c4b4a2]">
                <p className="text-gray-700 italic text-lg leading-relaxed">"C'est tout simplement magique"</p>
              </div>

              {/* Avis 5 */}
              <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-[#806947] md:col-span-2 lg:col-span-1">
                <p className="text-gray-700 italic text-lg leading-relaxed">"Dès qu'on a compris le truc, c'est la bonne idée souvenir ou cadeau pour ses proches"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section id="faq" className="py-8 md:py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto max-w-4xl">
          
          {/* Sur mobile: titre cliquable, sur desktop: titre normal */}
          {isMobile ? (
            <button
              onClick={() => setFaqSectionOpen(!faqSectionOpen)}
              className="w-full mb-8"
            >
              <div className="flex justify-between items-center bg-white rounded-2xl shadow-md px-6 py-4 hover:bg-gray-50 transition-colors">
                <h3 className="text-2xl font-bold text-gray-900" style={{fontFamily: 'Boston Angel, serif'}}>
                  Les réponses à vos questions
                </h3>
                <div className={`transition-transform duration-300 ${faqSectionOpen ? 'rotate-180' : ''}`}>
                  <ChevronDown className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </button>
          ) : (
            <h3 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12" style={{fontFamily: 'Boston Angel, serif'}}>
              Les réponses à vos questions les plus fréquentes
            </h3>
          )}
          
          {/* Questions FAQ - avec animation sur mobile */}
          <div 
            className={`space-y-4 transition-all duration-500 ease-in-out ${
              isMobile ? (faqSectionOpen ? 'opacity-100 max-h-[2000px]' : 'opacity-0 max-h-0 overflow-hidden') : ''
            }`}
          >
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="text-lg font-semibold text-gray-900">{item.question}</span>
                  <div className={`transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}>
                    {openFaq === index ? (
                      <Minus className="w-5 h-5 text-gray-600" />
                    ) : (
                      <Plus className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    openFaq === index ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-4 pt-2">
                    <p className="text-gray-600">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer simple */}
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
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{fontFamily: 'Boston Angel, serif'}}>REVILA</h2>
              <p className="text-sm md:text-base text-gray-600 mb-4">Photos magiques qui prennent vie</p>
              <Link href="/mentions-legales" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 underline">
                Mentions légales
              </Link>
            </div>
            
            {/* Image droite - cachée sur mobile */}
            <img 
              src="/69.png" 
              alt="Décoration" 
              className="hidden md:block h-full w-auto object-contain"
            />
          </div>
          
          {/* Lien Instagram en bas à droite */}
          <div className="absolute bottom-4 right-4">
            <Link 
              href="https://www.instagram.com/revila_photo/" 
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-[#806947] hover:bg-[#6a5638] text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm font-medium border-2 border-white"
            >
              <Instagram className="w-4 h-4" />
              <span className="hidden sm:inline">Rejoignez-nous sur</span>
              <span className="sm:hidden">Insta</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}