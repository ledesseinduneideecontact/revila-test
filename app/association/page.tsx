'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Calendar, Heart, Gift, X, Menu, TrendingUp, Star, GraduationCap, Banknote, HandHeart } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AssociationPage() {
  const [isMobile, setIsMobile] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  const slideImages = [
    '/frontend-pictures/association/photo-famille.png',
    '/frontend-pictures/association/photo-idee-cadeau.png',
    '/frontend-pictures/association/photo-vacances.png'
  ]

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

  // Effet pour le slide automatique
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length)
    }, 3000) // Change d'image toutes les 3 secondes
    
    return () => clearInterval(slideInterval)
  }, [slideImages.length])

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
            backgroundImage: 'url(/frontend-pictures/association/main-picture-association.png)',
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
                Une opportunité unique
              </h2>
              <p 
                className="text-lg md:text-xl text-gray-700 leading-relaxed"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Votre association peut désormais proposer un produit innovant à vos membres et leur entourage. 
                Revila transforme leurs souvenirs en photos magiques qui prennent vie d'un simple geste.
              </p>
              <p 
                className="text-lg md:text-xl text-gray-700 leading-relaxed mt-4"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                <strong className="text-[#806947]">Le plus ?</strong> Chaque vente vous rapporte une commission attractive 
                pour financer vos projets associatifs !
              </p>
              <div className="flex items-center gap-4 mt-8">
                <div className="bg-[#e0865f]/10 p-4 rounded-full">
                  <Banknote className="h-8 w-8 text-[#e0865f]" />
                </div>
                <div>
                  <p className="font-bold text-[#806947]">Revenus garantis</p>
                  <p className="text-sm text-gray-600">Commission sur chaque vente réalisée</p>
                </div>
              </div>
            </div>
            <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Slider automatique */}
              <div className="relative w-full h-full">
                {slideImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-opacity duration-1000 ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Exemple photo magique ${index + 1}`}
                      className="w-full h-full object-contain p-4"
                      loading="eager"
                    />
                  </div>
                ))}
                
                {/* Indicateurs de slide */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {slideImages.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                        index === currentSlide ? 'bg-[#806947]' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Bouton Découvrir le concept */}
          <div className="mt-12 text-center">
            <Link href="/" target="_blank">
              <button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-[#806947] hover:bg-[#6a5638] text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold px-8 py-3 text-base md:text-lg"
              >
                Découvrir le concept
              </button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Bandeau Triple Bénéfice pour Associations */}
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
                <Banknote className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Boston Angel, serif' }}>
                Financez vos projets
              </h3>
              <p className="text-white/90" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                <strong>Commission attractive</strong> sur chaque vente pour alimenter la trésorerie de votre association
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
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Boston Angel, serif' }}>
                Parfait pour les étudiants
              </h3>
              <p className="text-white/90" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Un produit tendance qui plaît aux jeunes et à leurs familles
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
                <HandHeart className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Boston Angel, serif' }}>
                Zéro contrainte
              </h3>
              <p className="text-white/90" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Pas de stock, pas de logistique. Nous gérons tout, vous encaissez !
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section spécifique Associations étudiantes */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <motion.div 
          className="container mx-auto max-w-6xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-16">
            <h2 
              className="text-4xl md:text-5xl font-bold mb-6 text-[#806947]"
              style={{ fontFamily: 'Boston Angel, serif' }}
            >
              Idéal pour toutes les associations
            </h2>
            <p 
              className="text-xl text-gray-700 max-w-3xl mx-auto"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              Que vous soyez une asso étudiante, sportive, culturelle ou caritative, 
              Revila s'adapte à vos besoins et à votre communauté.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Association étudiante */}
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <GraduationCap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Associations étudiantes</h3>
              <p className="text-gray-700 text-sm">
                Parfait pour financer vos soirées, voyages d'études et événements
              </p>
            </div>

            {/* Association sportive */}
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Clubs sportifs</h3>
              <p className="text-gray-700 text-sm">
                Immortalisez les victoires et financez l'équipement sportif
              </p>
            </div>

            {/* Association culturelle */}
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Associations culturelles</h3>
              <p className="text-gray-700 text-sm">
                Créez des souvenirs magiques de vos spectacles et événements
              </p>
            </div>

            {/* Association caritative */}
            <div className="text-center p-6 bg-white rounded-xl shadow-lg">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900">Associations caritatives</h3>
              <p className="text-gray-700 text-sm">
                Collectez des fonds pour vos causes importantes
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section Commission détaillée */}
      <section className="py-20 px-4 bg-white">
        <motion.div 
          className="container mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-gradient-to-br from-[#806947]/5 to-[#c4b4a2]/10 rounded-2xl p-8 md:p-12">
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Banknote className="h-16 w-16 mx-auto mb-6 text-[#806947]" />
            </motion.div>
            
            <h2 
              className="text-3xl md:text-4xl font-bold mb-6 text-[#806947]"
              style={{ fontFamily: 'Boston Angel, serif' }}
            >
              Comment ça marche ?
            </h2>
            
            <div className="text-left max-w-2xl mx-auto space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#806947] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">1</div>
                <p className="text-lg text-gray-700">
                  <strong>Votre code partenaire :</strong> Nous vous attribuons un code unique à partager à vos membres
                </p>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#806947] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">2</div>
                <p className="text-lg text-gray-700">
                  <strong>Chaque commande :</strong> Commission attractive directement versée à votre association
                </p>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-[#806947] text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1">3</div>
                <p className="text-lg text-gray-700">
                  <strong>Aucun effort :</strong> Nous gérons la production, l'expédition et le service client
                </p>
              </div>
            </div>
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
            <Users className="h-16 w-16 mx-auto mb-6 text-white/80" />
          </motion.div>
          
          <h2 
            className="text-4xl md:text-5xl font-bold mb-6"
            style={{ fontFamily: 'Boston Angel, serif' }}
          >
            Prêts à générer<br/>
            vos premiers revenus ?
          </h2>
          
          <p 
            className="text-xl mb-10 max-w-2xl mx-auto"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Discutons ensemble des modalités de partenariat et des opportunités 
            spécifiques à votre association.
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

          <div className="mt-6">
            <Link href="https://tally.so/r/me4L0l" target="_blank">
              <button 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/10 hover:bg-white/20 text-white border-2 border-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-bold px-8 py-3 text-base md:text-lg"
              >
                S'inscrire directement
              </button>
            </Link>
          </div>

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
