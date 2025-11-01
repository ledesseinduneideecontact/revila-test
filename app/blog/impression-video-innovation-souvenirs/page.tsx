'use client'

import Link from 'next/link'
import Head from 'next/head'
import { ArrowLeft, Play, Smartphone, Heart, CheckCircle, Share2 } from 'lucide-react'

export default function ImpressionVideoInnovationSouvenirs() {
  return (
    <>
      <Head>
        <title>Impression vidéo : l'innovation qui révolutionne les souvenirs | Revila</title>
        <meta name="description" content="Découvrez comment l'impression vidéo Revila transforme vos photos en souvenirs animés grâce à la technologie NFC." />
        <meta property="og:title" content="Impression vidéo : l'innovation qui révolutionne les souvenirs" />
        <meta property="og:description" content="Découvrez comment l'impression vidéo Revila transforme vos photos en souvenirs animés grâce à la technologie NFC." />
        <meta property="og:url" content="https://revila.fr/impression-video-innovation-souvenirs" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://revila.fr/frontend-pictures/association/photo-vacances.png" />
        <link rel="canonical" href="https://revila.fr/impression-video-innovation-souvenirs" />
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
              Impression vidéo : l'innovation qui révolutionne les souvenirs
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 leading-relaxed" style={{fontFamily: 'Cormorant Garamond, serif'}}>
              Imaginez tenir une photo qui s'anime sous vos yeux, comme dans Harry Potter. Avec Revila, chaque image imprimée embarque une puce NFC invisible qui déclenche la lecture d'une vidéo : vos souvenirs prennent vie instantanément.
            </p>
          </header>

          <div className="mb-12">
            <img
              src="/frontend-pictures/association/photo-vacances.png"
              alt="Impression vidéo NFC - Puce invisible intégrée dans photo"
              className="w-full h-80 object-cover rounded-2xl shadow-lg"
            />
          </div>

          <div className="prose prose-lg max-w-none">
            
            <h2 className="text-3xl font-bold text-[#806947] mb-6">Qu'est-ce que l'impression vidéo Revila ?</h2>
            
            <div className="bg-gradient-to-r from-[#806947]/5 to-[#c4b4a2]/10 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-[#806947] mb-4">Principe NFC invisible (pas de QR code)</h3>
              <p className="text-gray-700 mb-4">
                Contrairement aux QR codes visibles et peu esthétiques, la technologie NFC de Revila est complètement invisible. 
                La puce est intégrée directement dans le papier photo, préservant ainsi la beauté de votre image.
              </p>
              
              <h3 className="text-2xl font-bold text-[#806947] mb-4">Formats et qualités pris en charge</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• <strong>Taille maximale :</strong> 200 Mo par vidéo</li>
                <li>• <strong>Résolution optimale :</strong> 1080p (Full HD)</li>
                <li>• <strong>Formats supportés :</strong> MP4, MOV, AVI</li>
                <li>• <strong>Durée recommandée :</strong> 30 secondes à 3 minutes</li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-[#806947] mb-6">Les avantages par rapport à la photo classique</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <Heart className="w-12 h-12 text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-3">Émotion renforcée</h3>
                <p className="text-gray-600 text-sm">
                  Le supplément « magie » transforme un simple souvenir en expérience émotionnelle intense. 
                  L'effet de surprise décuple l'impact émotionnel.
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-3">Durabilité</h3>
                <p className="text-gray-600 text-sm">
                  Puce garantie 10 ans, vidéo accessible 4 ans (extensible). 
                  Un investissement durable pour vos souvenirs les plus précieux.
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <Play className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-xl font-bold text-gray-800 mb-3">Originalité</h3>
                <p className="text-gray-600 text-sm">
                  Exclusivité mondiale : Revila est le seul service au monde proposant 
                  l'impression vidéo NFC invisible.
                </p>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-[#806947] mb-6">Applications concrètes</h2>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Particuliers</h3>
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <ul className="text-gray-700 space-y-3">
                <li>• <strong>Souvenirs de vacances :</strong> Immortalisez vos plus beaux voyages avec des vidéos des moments forts</li>
                <li>• <strong>Naissances :</strong> Premiers pas, premiers mots, premiers sourires en vidéo</li>
                <li>• <strong>Anniversaires :</strong> Compilation des meilleurs moments de l'année écoulée</li>
                <li>• <strong>Idée cadeau originale :</strong> Le cadeau qui surprend à tous les coups</li>
              </ul>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Professionnels</h3>
            <div className="bg-blue-50 rounded-xl p-6 mb-8">
              <ul className="text-gray-700 space-y-3">
                <li>• <strong>Photographes de mariage :</strong> Offrez un service premium avec des photos animées</li>
                <li>• <strong>Entreprises d'expérience :</strong> Plongée, saut en parachute, sports extrêmes</li>
                <li>• <strong>Marketeurs événementiels :</strong> Créez des souvenirs mémorables pour vos événements</li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-[#806947] mb-6">Comment commander votre première Revila</h2>
            
            <div className="bg-gradient-to-br from-[#806947]/5 to-[#c4b4a2]/10 rounded-2xl p-8 mb-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="bg-[#806947] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">1</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Rendez-vous sur revila.fr</h4>
                    <p className="text-gray-600 text-sm">Interface simple et intuitive pour créer votre première impression vidéo</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-[#806947] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">2</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Uploadez votre photo et vidéo</h4>
                    <p className="text-gray-600 text-sm">Formats acceptés : JPG, PNG pour les photos / MP4, MOV pour les vidéos</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="bg-[#806947] text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">3</div>
                  <div>
                    <h4 className="font-bold text-gray-800 mb-2">Recevez votre Revila en 5–7 jours</h4>
                    <p className="text-gray-600 text-sm">Livraison soignée avec instructions d'utilisation incluses</p>
                  </div>
                </div>
              </div>
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
                <Link href="/blog/guide-cadeaux-innovants-2025" className="group block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <h4 className="text-lg font-semibold text-[#806947] mb-2 group-hover:underline">Guide des cadeaux innovants 2025</h4>
                  <p className="text-gray-600 text-sm">Découvrez les 5 catégories de cadeaux qui feront sensation cette année.</p>
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

