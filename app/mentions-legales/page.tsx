import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header simple */}
      <header className="bg-white py-6 shadow-md border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-4xl font-black text-orange-500 hover:text-orange-600 transition-colors">
              REVILA
            </Link>
            <Button asChild variant="outline" size="sm">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Retour à l'accueil
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu des mentions légales */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          Mentions légales
        </h1>

        <div className="prose prose-lg max-w-none space-y-8">
          {/* Éditeur du site */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Éditeur du site</h2>
            <p className="text-gray-600 leading-relaxed">
              Le site <strong>revila.fr</strong> est édité par la société <strong>ALOA SAS</strong>, 
              au capital de 1 000 € (susceptible d'évoluer), immatriculée au Registre du Commerce 
              et des Sociétés d'Angers sous le numéro <strong>901 420 836</strong>.
            </p>
            <div className="mt-4 space-y-2 text-gray-600">
              <p><strong>Siège social :</strong> 267 rue haute des Banchais, 49000 Angers, France</p>
              <p><strong>Directeur de la publication :</strong> Henri Barraya, en qualité de Directeur Général</p>
              <p><strong>Email :</strong> <a href="mailto:contact@revila.fr" className="text-orange-500 hover:text-orange-600">contact@revila.fr</a></p>
            </div>
          </section>

          {/* Hébergeur */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Hébergeur technique</h2>
            <div className="text-gray-600 space-y-2">
              <p><strong>Railway Corporation</strong></p>
              <p>548 Market St PMB 68956</p>
              <p>San Francisco, CA 94104, USA</p>
            </div>
          </section>

          {/* Nom de domaine */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Enregistrement du nom de domaine</h2>
            <p className="text-gray-600 leading-relaxed">
              Le nom de domaine <strong>revila.fr</strong> a été enregistré via <strong>Gandi SAS</strong>
            </p>
            <div className="mt-4 space-y-2 text-gray-600">
              <p>63-65 boulevard Masséna, 75013 Paris, France</p>
              <p>RCS Paris n° 423 093 459</p>
              <p>TVA intracommunautaire FR81423093459</p>
            </div>
          </section>

          {/* Propriété intellectuelle */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Propriété intellectuelle</h2>
            <p className="text-gray-600 leading-relaxed">
              Le contenu du site (textes, images, logos, visuels, charte graphique, etc.) est protégé 
              par la législation française et internationale sur le droit d'auteur et la propriété 
              intellectuelle. Toute reproduction, représentation, modification ou utilisation, en tout 
              ou partie, sans l'autorisation expresse de ALOA SAS (Revila) est interdite et engage 
              la responsabilité de son auteur.
            </p>
          </section>

          {/* Données personnelles */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Données personnelles (RGPD)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              En utilisant le site revila.fr, vous consentez au traitement de vos données personnelles 
              par ALOA SAS, notamment dans les cas suivants :
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
              <li>Création de compte, traitement des commandes, communication (via Supabase)</li>
              <li>Stockage sécurisé des données (photos, informations de commande) sur Google Cloud Storage</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-4">
              Ces données ne sont utilisées que pour la gestion des commandes, la relation client ou 
              des obligations légales. Elles ne sont pas revendues à des tiers.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Vous bénéficiez des droits suivants : accéder, rectifier, supprimer vos données ou vous 
              opposer à leur traitement, selon le RGPD. Pour exercer ces droits, adressez une demande à 
              <a href="mailto:contact@revila.fr" className="text-orange-500 hover:text-orange-600 ml-1">contact@revila.fr</a>.
            </p>
            <p className="text-gray-600 mt-4">
              Un responsable de traitement (DPO) n'a pas été désigné pour l'instant.
            </p>
          </section>

          {/* Cookies */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Cookies et traceurs</h2>
            <p className="text-gray-600 leading-relaxed">
              Actuellement, aucun cookie de suivi (type Google Analytics ou pixels publicitaires) 
              n'est mis en place. Des cookies techniques peuvent être utilisés pour le bon 
              fonctionnement du panier ou de la session utilisateur, mais aucune utilisation 
              de traceurs à des fins publicitaires n'est effectuée pour l'instant.
            </p>
          </section>

          {/* Médiation */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Médiation de la consommation</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Conformément au Code de la consommation, en cas de litige, le Client est invité à 
              contacter ALOA SAS (Revila) en priorité pour tenter de régler le différend à l'amiable.
            </p>
            <p className="text-gray-600 leading-relaxed">
              À défaut d'accord, le consommateur peut recourir à un médiateur de la consommation. 
              Un médiateur territorial pertinent est le Médiateur de la Consommation du Maine-et-Loire 
              ou équivalent (Angers).
            </p>
          </section>

          {/* Droit applicable */}
          <section className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Droit applicable</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes mentions légales sont régies par la loi française. Tout litige relevant 
              de l'interprétation ou de l'exécution des présentes sera de la compétence des 
              juridictions françaises.
            </p>
          </section>
        </div>

        {/* Bouton retour */}
        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white">
            <Link href="/">
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer simple */}
      <footer className="bg-white border-t mt-20 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">© 2024 REVILA - Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
}