'use client'

import Link from 'next/link'
import Head from 'next/head'
import { ArrowLeft, Share2 } from 'lucide-react'

export default function GuideCadeauxInnovants2025() {
  return (
    <>
      <Head>
        <title>Guide des cadeaux innovants 2025 | Revila</title>
        <meta name="description" content="Votre sélection des meilleurs cadeaux innovants pour 2025 : technologie, émotions et personnalisation avec Revila." />
        <meta property="og:title" content="Guide des cadeaux innovants 2025" />
        <meta property="og:description" content="Votre sélection des meilleurs cadeaux innovants pour 2025 : technologie, émotions et personnalisation avec Revila." />
        <meta property="og:url" content="https://revila.fr/guide-cadeaux-innovants-2025" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://revila.fr/frontend-pictures/association/photo-idee-cadeau.png" />
        <link rel="canonical" href="https://revila.fr/guide-cadeaux-innovants-2025" />
      </Head>

      <div className="min-h-screen bg-white">
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/blog" className="flex items-center gap-2 text-[#806947] hover:text-[#6a5638] transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Retour au blog</span>
              </Link>
              
              <Link href="/" className="text-2xl font-black text-[#806947] hover:text-[#6a5638] transition-colors" style={{fontFamily: 'Boston Angel, serif'}}>
                Revila
              </Link>
              
              <Link 
                href="https://revila.fr"
                className="bg-[#806947] hover:bg-[#6a5638] text-white px-4 py-2 rounded-full font-medium transition-colors"
              >
                Commander
              </Link>
            </div>
          </div>
        </header>

        <article className="max-w-4xl mx-auto px-4 py-12">
          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-[#806947] mb-6" style={{fontFamily: 'Boston Angel, serif'}}>
              Guide des cadeaux innovants 2025
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 leading-relaxed" style={{fontFamily: 'Cormorant Garamond, serif'}}>
              Les cadeaux traditionnels ont fait leur temps : montres, parfums, peluches… En 2025, offrez l'inattendu ! 
              Ce guide recense les <strong>5 catégories</strong> de cadeaux innovants qui feront sensation auprès de vos proches.
            </p>
          </header>

          <div className="mb-12">
            <img
              src="/frontend-pictures/association/photo-idee-cadeau.png"
              alt="Guide cadeaux innovants 2025 - Lifestyle photo avec technologie moderne"
              className="w-full h-80 object-cover rounded-2xl shadow-lg"
            />
          </div>

          <div className="prose prose-lg max-w-none">
            
            <h2 className="text-3xl font-bold text-[#806947] mb-6">
              5. Cadeaux DIY Haut de Gamme
            </h2>
            
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl p-8 mb-8">
              <ul className="text-gray-700 space-y-3">
                <li>• <strong>Kits de développement vidéo maison :</strong> Outils professionnels pour créateurs</li>
                <li>• <strong>Cours en ligne pour créer son propre média :</strong> Formation complète avec certification</li>
                <li>• <strong>Maquettes interactives à imprimer :</strong> Projets 3D avec éléments technologiques</li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-[#806947] mb-6">
              4. Cadeaux Personnalisés
            </h2>
            
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-8 mb-8">
              <ul className="text-gray-700 space-y-3">
                <li>• <strong>Livres photo animés :</strong> Albums interactifs avec vidéos intégrées</li>
                <li>• <strong>Bijoux gravés NFC :</strong> Messages secrets accessibles par simple contact</li>
                <li>• <strong>Portraits vidéo dessinés :</strong> Art traditionnel enrichi de contenu numérique</li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-[#806947] mb-6">
              3. Cadeaux Éco-responsables
            </h2>
            
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 mb-8">
              <ul className="text-gray-700 space-y-3">
                <li>• <strong>Objets upcyclés high-tech :</strong> Accessoires tech créés à partir de matériaux recyclés</li>
                <li>• <strong>Box zéro déchet à personnaliser :</strong> Kits durables adaptés aux goûts de chacun</li>
                <li>• <strong>Papeterie intelligente rechargeable :</strong> Carnets et agendas réutilisables</li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-[#806947] mb-6">
              2. Cadeaux Expérientiels
            </h2>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-8 mb-8">
              <ul className="text-gray-700 space-y-3">
                <li>• <strong>Coffrets escape game à domicile :</strong> Aventures immersives en famille ou entre amis</li>
                <li>• <strong>Ateliers créatifs en réalité augmentée :</strong> Peinture, sculpture et art numérique</li>
                <li>• <strong>Séances photo-vidéo immersives :</strong> Studios 360° et effets spéciaux</li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-[#806947] mb-6">
              1. Cadeaux Technologiques
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 mb-8">
              <ul className="text-gray-700 space-y-3">
                <li>• <strong>Impression vidéo NFC (Revila) :</strong> La révolution des souvenirs avec photos animées</li>
                <li>• <strong>Objets connectés personnalisables :</strong> Montres, bracelets et accessoires intelligents</li>
                <li>• <strong>Gadgets intelligents pour la maison :</strong> Assistants vocaux, éclairage adaptatif</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#806947]/5 to-[#c4b4a2]/10 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-[#806947] mb-4">Conclusion</h3>
              <p className="text-gray-700 mb-6">
                Transformez votre prochain cadeau en <strong>expérience inoubliable</strong>. 
                L'innovation ne se limite plus à la technologie : elle réside dans l'émotion et la surprise que vous créez.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <span className="text-gray-600 font-medium">Partager :</span>
              <div className="flex gap-3">
                <button 
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Facebook
                </button>
                <button 
                  onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  className="flex items-center gap-2 bg-blue-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-900 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  LinkedIn
                </button>
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: document.title,
                        url: window.location.href
                      });
                    } else {
                      navigator.clipboard.writeText(window.location.href);
                      alert('Lien copié dans le presse-papiers !');
                    }
                  }}
                  className="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-pink-700 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Instagram
                </button>
              </div>
            </div>

            {/* Liens internes vers autres articles */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Articles recommandés</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <Link href="/blog/impression-video-innovation-souvenirs" className="group block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <h4 className="text-lg font-semibold text-[#806947] mb-2 group-hover:underline">Impression vidéo : l'innovation révolutionnaire</h4>
                  <p className="text-gray-600 text-sm">Découvrez comment l'impression vidéo Revila transforme vos souvenirs.</p>
                </Link>
                <Link href="/blog/saint-valentin-2025-cadeaux-originaux" className="group block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <h4 className="text-lg font-semibold text-[#806947] mb-2 group-hover:underline">Saint-Valentin 2025 : cadeaux originaux</h4>
                  <p className="text-gray-600 text-sm">10 idées de cadeaux qui vont faire fondre votre moitié.</p>
                </Link>
              </div>
            </div>

          </div>
        </article>

        <footer className="bg-white border-t">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-32 md:h-48">
              <img 
                src="/70.png" 
                alt="Décoration" 
                className="hidden md:block h-full w-auto object-contain"
              />
              
              <div className="text-center py-8 md:py-12 flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2" style={{fontFamily: 'Boston Angel, serif'}}>REVILA</h2>
                <p className="text-sm md:text-base text-gray-600 mb-4">Photos magiques qui prennent vie</p>
                <Link href="/mentions-legales" className="text-xs md:text-sm text-gray-500 hover:text-gray-700 underline">
                  Mentions légales
                </Link>
              </div>
              
              <img 
                src="/69.png" 
                alt="Décoration" 
                className="hidden md:block h-full w-auto object-contain"
              />
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

