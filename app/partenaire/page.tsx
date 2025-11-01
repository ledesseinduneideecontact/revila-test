'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, Heart, Gift, X, Menu, TrendingUp, Star } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function PartenairePage() {
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
                Commission attractive sur chaque vente réalisée grâce à votre code partenaire
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


      {/* Nouveau bandeau d'information sur les partenariats */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-50 to-white">
        <motion.div 
          className="container mx-auto max-w-4xl text-center"
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
            <Users className="h-12 w-12 mx-auto mb-6 text-[#806947]" />
          </motion.div>
          
          <h2 
            className="text-3xl md:text-4xl font-bold mb-6 text-[#806947]"
            style={{ fontFamily: 'Boston Angel, serif' }}
          >
            Explorons ensemble toutes les possibilités
          </h2>
          
          <p 
            className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-gray-700"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Pour connaître toutes les possibilités de partenariat qui s'offrent à vous, nous sommes ouverts à échanger par visio. 
            Que ce soit pour la <span className="font-semibold text-[#806947]">commission</span>, la <span className="font-semibold text-[#806947]">redirection de site web</span>, 
            la <span className="font-semibold text-[#806947]">vente propre</span> ou d'autres modalités... 
            chaque collaboration est unique !
          </p>
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
