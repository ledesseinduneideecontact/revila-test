'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Camera, Video, Users, Calendar, Code2, TrendingUp, Heart, Star, Gift, X, Menu, ChevronDown, ChevronUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function PartenariatMariagePage() {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [calculatorFormat, setCalculatorFormat] = useState('10x15')
  const [calculatorQuantity, setCalculatorQuantity] = useState(100)
  
  // Calculer les prix pour le partenaire
  const calculatePartnerPrices = () => {
    // Prix de base selon le format
    const basePrices = {
      '10x10': 7.50,
      '10x15': 9.50,
      '10x15-cadre': 22.40,
      '20x30': 28.30,
      '20x30-cadre': 45.20,
      '30x45': 51.90,
      '30x45-cadre': 71.80
    }
    
    const basePrice = basePrices[calculatorFormat] || 9.50
    let subtotal = 0
    
    // Application de la promo DUO sur la 2ème photo si format sans cadre
    const isPhotoOnly = !calculatorFormat.includes('cadre')
    
    if (isPhotoOnly && calculatorQuantity >= 2) {
      // Première photo au prix normal
      subtotal = basePrice
      // Deuxième photo à -50%
      subtotal += basePrice * 0.5
      // Photos suivantes au prix normal
      for (let i = 3; i <= calculatorQuantity; i++) {
        subtotal += basePrice
      }
    } else {
      // Pas de promo DUO pour les cadres ou quantité = 1
      subtotal = basePrice * calculatorQuantity
    }
    
    // Application des réductions par paliers
    let discountRate = 0
    if (calculatorQuantity >= 100) {
      discountRate = 0.45
    } else if (calculatorQuantity >= 50) {
      discountRate = 0.35
    } else if (calculatorQuantity >= 20) {
      discountRate = 0.25
    } else if (calculatorQuantity >= 10) {
      discountRate = 0.15
    } else if (calculatorQuantity >= 5) {
      discountRate = 0.10
    } else if (calculatorQuantity >= 3) {
      discountRate = 0.05
    }
    
    const finalPrice = subtotal * (1 - discountRate)
    const commission = finalPrice * 0.20
    
    return {
      finalPrice,
      commission
    }
  }
  
  const partnerPrices = calculatePartnerPrices()

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

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-white">
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
              <h1 className="text-3xl md:text-4xl font-black text-white hover:text-gray-200 tracking-tight transition-colors cursor-pointer" style={{fontFamily: 'Boston Angel, serif'}}>
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
                  className="text-2xl text-white hover:text-gray-200 font-medium transition-colors text-center py-4"
                >
                  Concept
                </Link>
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
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden" style={{ backgroundColor: '#c4b4a2' }}>
        {/* Background image - desktop */}
        <div 
          className="absolute inset-0 hidden md:block"
          style={{ 
            backgroundImage: 'url(/frontend-pictures/mariage/devenir-affilie-revila.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100vh',
            width: '100vw'
          }}
        />
        
        {/* Background image - mobile */}
        <div 
          className="absolute inset-0 md:hidden"
          style={{ 
            backgroundImage: 'url(/frontend-pictures/partenariat-mariage/devenir-affilié-revila-version-tel.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            height: '100vh',
            width: '100vw'
          }}
        />

        {/* Content */}
        <motion.div 
          className="relative z-10 container mx-auto px-4 text-center text-white"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Link href="https://calendly.com/contact-revila/30min" target="_blank">
              <button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold px-8 py-3 text-base md:text-lg"
              >
                <Calendar className="mr-2 h-5 w-5 flex-shrink-0" />
                Prendre rendez-vous
              </button>
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div 
            className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white/50 rounded-full mt-2" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Concept Section */}
      <section className="py-20 px-4 bg-white">
        <motion.div 
          className="container mx-auto max-w-5xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={fadeIn}
        >
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 
                className="text-4xl md:text-5xl font-bold mb-6 text-[#806947]"
                style={{ fontFamily: 'Boston Angel, serif' }}
              >
                Le Concept
              </h2>
              <p 
                className="text-lg md:text-xl text-gray-700 leading-relaxed"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Revila réinvente la photo imprimée grâce à la technologie NFC. 
                En un simple geste, vos mariés replongent dans l'émotion de leur vidéo.
              </p>
              <p 
                className="text-lg md:text-xl text-gray-700 leading-relaxed mt-4"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                En tant que partenaire, vous leur proposez une innovation exclusive… 
                et vous bénéficiez d'une rémunération attractive sur chaque commande.
              </p>
              <div className="flex items-center gap-4 mt-8">
                <div className="bg-[#e0865f]/10 p-4 rounded-full">
                  <Heart className="h-8 w-8 text-[#e0865f]" />
                </div>
                <div>
                  <p className="font-bold text-[#806947]">Innovation & Émotion</p>
                  <p className="text-sm text-gray-600">Une expérience unique pour vos clients</p>
                </div>
              </div>
            </div>
            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-50 to-gray-100">
              <img
                src="/frontend-pictures/mariage/Cream and Brown Minimalist Photo Frame Mockup Instagram Post.png"
                alt="Concept Revila - Photo magique NFC"
                className="w-full h-full object-contain p-4"
                loading="eager"
              />
            </div>
          </div>
          
          {/* Bouton Découvrir le concept */}
          <div className="mt-12 text-center">
            <Link href="/" target="_blank">
              <button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold px-8 py-3 text-base md:text-lg"
              >
                Découvrez le concept ici
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Bandeau Triple Bénéfice */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(135deg, #806947, #9e8259)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center text-white">
            {/* Bénéfice 1 */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Boston Angel, serif' }}>
                Générez de nouveaux revenus
              </h3>
              <p className="text-white/90" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                20% de commission sur chaque vente réalisée grâce à votre code partenaire
              </p>
            </motion.div>

            {/* Bénéfice 2 */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <Heart className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Boston Angel, serif' }}>
                Donnez une expérience inoubliable
              </h3>
              <p className="text-white/90" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Offrez à vos mariés un souvenir unique qui prend vie d'un simple geste
              </p>
            </motion.div>

            {/* Bénéfice 3 */}
            <motion.div 
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                <Star className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Boston Angel, serif' }}>
                Des photos françaises de qualité
              </h3>
              <p className="text-white/90" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Impression premium sur papier mat, fabrication 100% française
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pour qui Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#c4b4a2]/20 to-white">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerChildren}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-4 text-[#806947]"
            style={{ fontFamily: 'Boston Angel, serif' }}
            variants={fadeIn}
          >
            Pour qui ?
          </motion.h2>
          <motion.p 
            className="text-xl text-center mb-12 text-gray-700"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
            variants={fadeIn}
          >
            Ce programme est conçu pour les professionnels du mariage qui ont déjà la confiance des mariés
          </motion.p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Vidéastes */}
            <motion.div 
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300"
              variants={fadeIn}
              whileHover={{ y: -5 }}
            >
              <div className="bg-[#e0865f]/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Video className="h-8 w-8 text-[#e0865f]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#806947]" style={{ fontFamily: 'Boston Angel, serif' }}>
                Vidéastes
              </h3>
              <p className="text-gray-700" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Qui livrent un film et souhaitent prolonger l'expérience avec des photos magiques 
                qui révèlent les meilleurs moments en vidéo.
              </p>
              <div className="mt-6 flex items-center text-[#e0865f]">
                <Star className="h-5 w-5 mr-1" />
                <span className="text-sm font-semibold">Complément idéal au film de mariage</span>
              </div>
            </motion.div>

            {/* Photographes */}
            <motion.div 
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300"
              variants={fadeIn}
              whileHover={{ y: -5 }}
            >
              <div className="bg-[#806947]/10 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Camera className="h-8 w-8 text-[#806947]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#806947]" style={{ fontFamily: 'Boston Angel, serif' }}>
                Photographes
              </h3>
              <p className="text-gray-700" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Qui créent des souvenirs intemporels et veulent offrir un service différenciant 
                en combinant leurs plus belles photos avec des vidéos.
              </p>
              <div className="mt-6 flex items-center text-[#806947]">
                <Star className="h-5 w-5 mr-1" />
                <span className="text-sm font-semibold">Service innovant et premium</span>
              </div>
            </motion.div>

            {/* Wedding Planners */}
            <motion.div 
              className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-shadow duration-300"
              variants={fadeIn}
              whileHover={{ y: -5 }}
            >
              <div className="bg-[#c4b4a2]/30 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Users className="h-8 w-8 text-[#806947]" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#806947]" style={{ fontFamily: 'Boston Angel, serif' }}>
                Wedding Planners
              </h3>
              <p className="text-gray-700" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Qui cherchent à enrichir leur catalogue avec une touche unique et mémorable 
                pour des mariages d'exception.
              </p>
              <div className="mt-6 flex items-center text-[#c4b4a2]">
                <Star className="h-5 w-5 mr-1" />
                <span className="text-sm font-semibold text-[#806947]">Valeur ajoutée exclusive</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Comment ça marche Section */}
      <section className="py-20 px-4 bg-gray-50">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerChildren}
        >
          <motion.h2 
            className="text-4xl md:text-5xl font-bold text-center mb-12 text-[#806947]"
            style={{ fontFamily: 'Boston Angel, serif' }}
            variants={fadeIn}
          >
            Comment ça marche ?
          </motion.h2>

          <div className="max-w-3xl mx-auto space-y-12">
            {/* Étape 1 */}
            <motion.div 
              className="relative"
              variants={fadeIn}
            >
              <div className="bg-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-bold text-[#e0865f]/10">01</div>
                <div className="relative z-10 flex items-start gap-6">
                  <div className="bg-[#e0865f]/10 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
                    <Calendar className="h-7 w-7 text-[#e0865f]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-[#806947]" style={{ fontFamily: 'Boston Angel, serif' }}>
                      Rencontre
                    </h3>
                    <p className="text-gray-700" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      Un rendez-vous de 15 minutes via Calendly pour comprendre vos besoins 
                      et vous présenter le programme.
                    </p>
                  </div>
                </div>
              </div>
              <motion.div 
                className="hidden md:block mx-auto w-0.5 h-16 bg-gradient-to-b from-[#e0865f]/30 to-[#806947]/30"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
            </motion.div>

            {/* Étape 2 */}
            <motion.div 
              className="relative"
              variants={fadeIn}
            >
              <div className="bg-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-bold text-[#806947]/10">02</div>
                <div className="relative z-10 flex items-start gap-6">
                  <div className="bg-[#806947]/10 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
                    <Code2 className="h-7 w-7 text-[#806947]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-[#806947]" style={{ fontFamily: 'Boston Angel, serif' }}>
                      Votre code partenaire
                    </h3>
                    <p className="text-gray-700" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      Nous créons un code personnalisé à votre nom, à partager avec vos mariés 
                      et vos contacts. <span className="font-bold text-[#e0865f]">Vos mariés bénéficient de -5% sur leur commande</span> grâce à votre code parrainage.
                    </p>
                  </div>
                </div>
              </div>
              <motion.div 
                className="hidden md:block mx-auto w-0.5 h-16 bg-gradient-to-b from-[#806947]/30 to-[#c4b4a2]/30"
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                transition={{ delay: 0.7, duration: 0.5 }}
              />
            </motion.div>

            {/* Étape 3 */}
            <motion.div 
              className="relative"
              variants={fadeIn}
            >
              <div className="bg-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-4 right-4 text-6xl font-bold text-[#c4b4a2]/10">03</div>
                <div className="relative z-10 flex items-start gap-6">
                  <div className="bg-[#c4b4a2]/10 w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-7 w-7 text-[#c4b4a2]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3 text-[#806947]" style={{ fontFamily: 'Boston Angel, serif' }}>
                      Vos revenus
                    </h3>
                    <p className="text-gray-700" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      Chaque fois que votre code est utilisé lors d'une commande, 
                      vous touchez <span className="font-bold text-[#e0865f]">20% de commission</span>, automatiquement reversés.
                    </p>
                    <div className="mt-4 bg-[#e0865f]/10 rounded-lg p-3">
                      <p className="text-sm font-semibold text-[#806947]">Commission attractive</p>
                      <p className="text-2xl font-bold text-[#e0865f]">20%</p>
                    </div>
                  </div>
                </div>
                
                {/* Calculateur de gains */}
                <div className="mt-6 border-t pt-6">
                  <button
                    onClick={() => setShowCalculator(!showCalculator)}
                    className="flex items-center justify-between w-full text-left hover:opacity-80 transition-opacity"
                  >
                    <span className="text-lg font-semibold text-[#806947]" style={{ fontFamily: 'Boston Angel, serif' }}>
                      Estimer ses gains
                    </span>
                    {showCalculator ? (
                      <ChevronUp className="h-5 w-5 text-[#806947]" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-[#806947]" />
                    )}
                  </button>
                  
                  {showCalculator && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Format
                        </label>
                        <select
                          value={calculatorFormat}
                          onChange={(e) => setCalculatorFormat(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806947]"
                        >
                          <option value="10x10">10x10 cm</option>
                          <option value="10x15">10x15 cm</option>
                          <option value="10x15-cadre">10x15 cm avec cadre</option>
                          <option value="20x30">20x30 cm</option>
                          <option value="20x30-cadre">20x30 cm avec cadre</option>
                          <option value="30x45">30x45 cm</option>
                          <option value="30x45-cadre">30x45 cm avec cadre</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre de commandes
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={calculatorQuantity}
                          onChange={(e) => setCalculatorQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#806947]"
                        />
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Ce que votre client paye:</span>
                          <span className="font-semibold text-[#806947]">{partnerPrices.finalPrice.toFixed(2)}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Ce que vous empochez:</span>
                          <span className="font-bold text-[#e0865f] text-lg">{partnerPrices.commission.toFixed(2)}€</span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 italic mt-3">
                        * Ces chiffres sont des estimations et peuvent varier en fonction des contrats, des prix et des stocks. 
                        Nous vous conseillons de nous contacter directement lors du premier échange pour avoir une idée réelle 
                        basée sur vos volumes de vente mensuels habituels.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-white to-gray-50">
        <motion.div 
          className="container mx-auto max-w-5xl"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerChildren}
        >
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <motion.div variants={fadeIn}>
              <div className="text-5xl font-bold text-[#e0865f]" style={{ fontFamily: 'Boston Angel, serif' }}>
                20%
              </div>
              <p className="text-gray-700 mt-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Commission sur chaque vente
              </p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <div className="text-5xl font-bold text-[#806947]" style={{ fontFamily: 'Boston Angel, serif' }}>
                15min
              </div>
              <p className="text-gray-700 mt-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Pour démarrer le partenariat
              </p>
            </motion.div>
            <motion.div variants={fadeIn}>
              <div className="text-5xl font-bold text-[#c4b4a2]" style={{ fontFamily: 'Boston Angel, serif' }}>
                ∞
              </div>
              <p className="text-gray-700 mt-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Revenus récurrents
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4" style={{ background: '#806947' }}>
        <motion.div 
          className="container mx-auto max-w-4xl text-center text-white"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Gift className="h-16 w-16 mx-auto mb-6 text-white/80" />
          </motion.div>
          
          <h2 
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: 'Boston Angel, serif' }}
          >
            Rejoignez dès aujourd'hui<br/>
            le cercle des partenaires Revila
          </h2>
          
          <p 
            className="text-xl mb-10 max-w-2xl mx-auto"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Offrez une expérience unique à vos clients et développez 
            une nouvelle source de revenus sans effort supplémentaire.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="https://calendly.com/contact-revila/30min" target="_blank">
              <button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold px-8 py-3 text-base md:text-lg"
              >
                <Calendar className="mr-2 h-5 w-5 flex-shrink-0" />
                Prendre rendez-vous
              </button>
            </Link>
          </motion.div>

          <p className="mt-8 text-sm text-white/90">
            Rendez-vous de 15 minutes • Sans engagement • 100% en visio
          </p>
        </motion.div>
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
        </div>
      </footer>
    </div>
  )
}
