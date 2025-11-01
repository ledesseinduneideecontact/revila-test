'use client'

import { useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { ArrowRight, Clock, User, Calendar, Share2 } from 'lucide-react'

export default function BlogPage() {
  const blogPosts = [
    {
      slug: 'impression-video-innovation-souvenirs',
      title: 'Impression vidéo : l\'innovation qui révolutionne les souvenirs',
      description: 'Découvrez comment l\'impression vidéo Revila transforme vos photos en souvenirs animés grâce à la technologie NFC.',
      image: '/frontend-pictures/association/photo-vacances.png',
      category: 'Innovation',
      readTime: '5 min',
      date: '2025-01-15',
      author: 'Équipe Revila'
    },
    {
      slug: 'guide-cadeaux-innovants-2025',
      title: 'Guide des cadeaux innovants 2025',
      description: 'Votre sélection des meilleurs cadeaux innovants pour 2025 : technologie, émotions et personnalisation avec Revila.',
      image: '/frontend-pictures/association/photo-idee-cadeau.png',
      category: 'Cadeaux',
      readTime: '8 min',
      date: '2025-01-10',
      author: 'Équipe Revila'
    },
    {
      slug: 'saint-valentin-2025-cadeaux-originaux',
      title: 'Saint-Valentin 2025 : 10 cadeaux qui vont faire fondre',
      description: 'Découvrez 10 cadeaux originaux pour la Saint-Valentin 2025, dont l\'impression vidéo qui émerveille à chaque contact.',
      image: '/frontend-pictures/association/photo-famille.png',
      category: 'Saint-Valentin',
      readTime: '6 min',
      date: '2025-01-05',
      author: 'Équipe Revila'
    }
  ]

  return (
    <>
      <Head>
        <title>Blog Revila | Innovation et Cadeaux Révolutionnaires</title>
        <meta name="description" content="Découvrez l'impression vidéo NFC et les dernières innovations en matière de cadeaux personnalisés avec Revila." />
        <meta property="og:title" content="Blog Revila | Innovation et Cadeaux Révolutionnaires" />
        <meta property="og:description" content="Découvrez l'impression vidéo NFC et les dernières innovations en matière de cadeaux personnalisés." />
        <meta property="og:url" content="https://revila.fr/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://revila.fr/frontend-pictures/association/photo-idee-cadeau.png" />
        <meta property="og:site_name" content="Revila" />
        <link rel="canonical" href="https://revila.fr/blog" />
      </Head>

      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-2xl font-black text-[#806947] hover:text-[#6a5638] transition-colors" style={{fontFamily: 'Boston Angel, serif'}}>
                Revila
              </Link>
              
              <nav className="hidden md:flex items-center space-x-8">
                <Link href="/" className="text-gray-700 hover:text-[#806947] transition-colors font-medium">
                  Accueil
                </Link>
                <Link href="/blog" className="text-[#806947] font-bold">
                  Blog
                </Link>
                <Link href="/commander" className="bg-[#806947] hover:bg-[#6a5638] text-white px-6 py-3 rounded-full font-medium transition-colors">
                  Commander
                </Link>
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-[#806947]/5 via-white to-[#c4b4a2]/10 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-[#806947] mb-6" style={{fontFamily: 'Boston Angel, serif'}}>
                Blog Revila
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed" style={{fontFamily: 'Cormorant Garamond, serif'}}>
                Découvrez l'innovation qui révolutionne les souvenirs avec l'impression vidéo NFC. 
                Guides, conseils et tendances pour des cadeaux extraordinaires.
              </p>
              
              <Link 
                href="/blog/impression-video-innovation-souvenirs" 
                className="inline-flex items-center gap-2 bg-[#806947] hover:bg-[#6a5638] text-white px-8 py-4 rounded-full font-bold text-lg transition-colors shadow-lg hover:shadow-xl"
              >
                Découvrir nos articles
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </section>

        {/* Articles Section */}
        <section id="articles" className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post) => (
                <Link 
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        post.category === 'Innovation' ? 'bg-blue-100 text-blue-700' :
                        post.category === 'Cadeaux' ? 'bg-green-100 text-green-700' :
                        'bg-pink-100 text-pink-700'
                      }`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-500">{post.readTime}</span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-[#806947] transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {post.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(post.date).toLocaleDateString('fr-FR')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[#806947] to-[#9e8259] py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6" style={{fontFamily: 'Boston Angel, serif'}}>
                Prêt à Révolutionner Vos Souvenirs ?
              </h2>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Découvrez l'impression vidéo NFC et transformez vos photos en expériences magiques. 
                L'innovation qui fait la différence.
              </p>
              <Link 
                href="/commander" 
                className="inline-flex items-center gap-2 bg-white text-[#806947] px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg hover:shadow-xl"
              >
                Créer ma première Revila
                <ArrowRight className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
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