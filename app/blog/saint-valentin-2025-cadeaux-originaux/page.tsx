'use client'

import Link from 'next/link'
import Head from 'next/head'
import { ArrowLeft, Heart, Star, Gift, Share2 } from 'lucide-react'

export default function SaintValentin2025CadeauxOriginaux() {
  return (
    <>
      <Head>
        <title>Saint-Valentin 2025 : 10 cadeaux qui vont faire fondre | Revila</title>
        <meta name="description" content="Découvrez 10 cadeaux originaux pour la Saint-Valentin 2025, dont l'impression vidéo qui émerveille à chaque contact." />
        <meta property="og:title" content="Saint-Valentin 2025 : 10 cadeaux qui vont faire fondre" />
        <meta property="og:description" content="Découvrez 10 cadeaux originaux pour la Saint-Valentin 2025, dont l'impression vidéo qui émerveille à chaque contact." />
        <meta property="og:url" content="https://revila.fr/saint-valentin-2025-cadeaux-originaux" />
        <meta property="og:type" content="article" />
        <meta property="og:image" content="https://revila.fr/frontend-pictures/association/photo-famille.png" />
        <link rel="canonical" href="https://revila.fr/saint-valentin-2025-cadeaux-originaux" />
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
              Saint-Valentin 2025 : 10 cadeaux qui vont faire fondre votre moitié
            </h1>
            
            <p className="text-xl text-gray-700 mb-8 leading-relaxed" style={{fontFamily: 'Cormorant Garamond, serif'}}>
              La Saint-Valentin, c'est l'occasion parfaite pour démontrer votre amour autrement : oubliez la boîte de chocolats, 
              misez sur une expérience émotive. Voici nos <strong>10 sélections</strong> dont l'immanquable : la Revila animée.
            </p>
          </header>

          <div className="mb-12">
            <img
              src="/frontend-pictures/association/photo-famille.png"
              alt="Saint-Valentin 2025 cadeaux originaux - Visuel romantique couple"
              className="w-full h-80 object-cover rounded-2xl shadow-lg"
            />
          </div>

          <div className="prose prose-lg max-w-none">
            
            <h2 className="text-3xl font-bold text-[#806947] mb-6">Comment choisir l'originalité cette année</h2>
            
            <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-8 mb-8">
              <ul className="text-gray-700 space-y-3">
                <li>• <strong>Ras-le-bol des cadeaux clichés :</strong> Roses rouges et chocolats ne surprennent plus personne</li>
                <li>• <strong>Effet de surprise garanti :</strong> L'originalité crée des souvenirs durables</li>
                <li>• <strong>Durabilité émotionnelle :</strong> Un cadeau unique marque les esprits pour longtemps</li>
              </ul>
            </div>

            <h2 className="text-3xl font-bold text-[#806947] mb-6">Top 10 des cadeaux</h2>
            
            <div className="overflow-x-auto mb-8">
              <table className="w-full border-collapse border border-gray-300 bg-white rounded-lg shadow-sm">
                <thead>
                  <tr className="bg-[#806947] text-white">
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold">N°</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold">Cadeau</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold">Description rapide</th>
                    <th className="border border-gray-300 px-4 py-3 text-left font-bold">Lien</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">1</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Impression vidéo Revila</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Photo animée à chaque contact NFC</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://revila.fr" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Revila</a>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">2</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Bijou connecté gravé</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Message secret en NFC</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://www.joylink.fr" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Joylink</a>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">3</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Love box AR</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Carte pop-up en réalité augmentée</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://boutique.lovebox.love" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Lovebox</a>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">4</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Playlist vinyle personnalisée</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Vos chansons d'amour sur vrai disque</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://www.vinylacy.com/fr" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Vinylacy</a>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">5</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Carte du ciel étoilé</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Configuration des étoiles de votre rencontre</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://mundi.shop/fr/carte-du-ciel-et-des-etoiles-personnalisee" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Mundi</a>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">6</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Livre photo interactif</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Album avec vidéos cachées</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://www.pixum.fr/livre-photo/conseils/integrer-video-livre-photo" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Pixum</a>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">7</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Parfum personnalisé</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Fragrance unique créée pour vous deux</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://mon-parfum-personnalise.fr" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Mon Parfum</a>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">8</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Expérience VR romantique</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Voyage virtuel dans vos lieux favoris</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://paris.virtual-room.com" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Virtual Room</a>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">9</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Coffret dégustation surprise</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Saveurs du monde avec messages cachés</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://www.lagourmetbox.com/fr/cadeau.html" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Gourmet Box</a>
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-3 font-bold text-[#806947]">10</td>
                    <td className="border border-gray-300 px-4 py-3 font-medium">Atelier création couple</td>
                    <td className="border border-gray-300 px-4 py-3 text-sm">Cours privé poterie, peinture ou cuisine</td>
                    <td className="border border-gray-300 px-4 py-3">
                      <a href="https://wecandoo.fr/ateliers/cadeau-couple" target="_blank" rel="noopener noreferrer" className="text-[#806947] hover:underline font-medium">Voir Wecandoo</a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h2 className="text-3xl font-bold text-[#806947] mb-6">Comment commander une Revila pour la Saint-Valentin</h2>
            
            <div className="bg-gradient-to-br from-[#806947]/5 to-[#c4b4a2]/10 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-[#806947] mb-4">Choix du format et du design</h3>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>• <strong>Formats disponibles :</strong> 10x15cm, 13x18cm, 20x30cm</li>
                <li>• <strong>Finitions :</strong> Mat, brillant, texture premium</li>
                <li>• <strong>Designs spéciaux :</strong> Bordures cœur, cadres romantiques</li>
              </ul>
              
              <h3 className="text-2xl font-bold text-[#806947] mb-4">Upload simplifié de photo et vidéo</h3>
              <ul className="text-gray-700 space-y-2 mb-6">
                <li>• <strong>Interface intuitive :</strong> Glisser-déposer vos fichiers</li>
                <li>• <strong>Prévisualisation :</strong> Voir le rendu avant validation</li>
                <li>• <strong>Optimisation automatique :</strong> Qualité garantie</li>
              </ul>
              
              <h3 className="text-2xl font-bold text-[#806947] mb-4">Livraison express garantie avant le 14 février</h3>
              <ul className="text-gray-700 space-y-2">
                <li>• <strong>Commande avant le 10 février :</strong> Livraison garantie</li>
                <li>• <strong>Emballage cadeau inclus :</strong> Écrin romantique</li>
                <li>• <strong>Suivi en temps réel :</strong> Notifications SMS</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-pink-50 to-red-50 rounded-2xl p-8 mb-8">
              <h3 className="text-2xl font-bold text-pink-800 mb-4">Conclusion</h3>
              <p className="text-gray-700 mb-6">
                Offrez un cadeau qui fait parler le cœur et la technologie. Cette Saint-Valentin 2025, 
                créez un souvenir qui durera bien au-delà du 14 février.
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
                <Link href="/blog/guide-cadeaux-innovants-2025" className="group block p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <h4 className="text-lg font-semibold text-[#806947] mb-2 group-hover:underline">Guide des cadeaux innovants 2025</h4>
                  <p className="text-gray-600 text-sm">Découvrez les 5 catégories de cadeaux qui feront sensation cette année.</p>
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

