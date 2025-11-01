'use client'

import { useState, useEffect } from 'react'
import { Lock, Eye, EyeOff, LogOut } from 'lucide-react'

export default function PartenariatWeddingPlan() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // Vérifier si l'utilisateur est déjà authentifié
  useEffect(() => {
    const authStatus = localStorage.getItem('partenariat-weddingplan-auth')
    if (authStatus === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  // Injecter les fonctions JavaScript de manière sécurisée
  useEffect(() => {
    if (!isAuthenticated) return

    // Fonctions sécurisées pour le calculateur
    const formatEuro = (value: number) => {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(value)
    }

    const updateConversion = () => {
      const prospects = parseFloat((document.getElementById('global-prospects') as HTMLInputElement)?.value || '0')
      const conversion = parseFloat((document.getElementById('global-conversion') as HTMLInputElement)?.value || '0') / 100
      const prestatairesConvaincus = Math.round(prospects * conversion)
      const element = document.getElementById('prestataires-convaincus')
      if (element) {
        element.textContent = prestatairesConvaincus.toLocaleString('fr-FR')
      }
    }

    const getPrestatairesConvaincus = () => {
      const prospects = parseFloat((document.getElementById('global-prospects') as HTMLInputElement)?.value || '0')
      const conversion = parseFloat((document.getElementById('global-conversion') as HTMLInputElement)?.value || '0') / 100
      return Math.round(prospects * conversion)
    }

    const showModel = (modelNum: number) => {
      document.querySelectorAll('.model-btn').forEach(btn => btn.classList.remove('active'))
      document.querySelectorAll('.model-card').forEach(card => card.classList.remove('active'))
      const btn = document.querySelectorAll('.model-btn')[modelNum - 1] as HTMLElement
      const card = document.getElementById('model-' + modelNum)
      if (btn) btn.classList.add('active')
      if (card) card.classList.add('active')
    }

    const calculatePricePerPhoto = (nbPhotos: number) => {
      const basePrice = 9.50
      if (nbPhotos <= 1) return basePrice
      if (nbPhotos >= 10 && nbPhotos < 50) return basePrice * 0.75
      if (nbPhotos >= 50 && nbPhotos < 100) return basePrice * 0.65
      if (nbPhotos >= 100) return basePrice * 0.55
      return basePrice
    }

    const updateM1Price = () => {
      const photos = parseFloat((document.getElementById('m1-photos') as HTMLSelectElement)?.value || '0')
      const price = calculatePricePerPhoto(photos)
      const priceInput = document.getElementById('m1-prix') as HTMLInputElement
      if (priceInput) priceInput.value = price.toFixed(2)
    }

    const calculateModel1 = () => {
      const prestataires = getPrestatairesConvaincus()
      const clientsParPrest = parseFloat((document.getElementById('global-clients') as HTMLInputElement)?.value || '0')
      const tauxAdoption = parseFloat((document.getElementById('global-taux') as HTMLInputElement)?.value || '0') / 100
      const clientsAcheteurs = clientsParPrest * tauxAdoption

      const photos = parseFloat((document.getElementById('m1-photos') as HTMLSelectElement)?.value || '0')
      const prixPhoto = parseFloat((document.getElementById('m1-prix') as HTMLInputElement)?.value || '0')

      const totalCommandes = prestataires * clientsAcheteurs
      const montantCommandeBrut = photos * prixPhoto
      const remiseClientPct = 0.05
      const remiseMontant = montantCommandeBrut * remiseClientPct
      const montantCommandeNet = montantCommandeBrut - remiseMontant
      const commissionCommande = montantCommandeNet * 0.20
      const revenuPrest = clientsAcheteurs * commissionCommande
      const totalReseau = totalCommandes * commissionCommande

      // Mise à jour sécurisée des éléments
      const updateElement = (id: string, value: string) => {
        const element = document.getElementById(id)
        if (element) element.textContent = value
      }

      updateElement('m1-total-cmd', Math.round(totalCommandes).toLocaleString('fr-FR'))
      updateElement('m1-montant-cmd-brut', formatEuro(montantCommandeBrut))
      updateElement('m1-remise-cmd', '-' + formatEuro(remiseMontant))
      updateElement('m1-montant-cmd-net', formatEuro(montantCommandeNet))
      updateElement('m1-commission-cmd', formatEuro(commissionCommande))
      updateElement('m1-revenu-prest', formatEuro(revenuPrest))
      updateElement('m1-total', formatEuro(totalReseau))

      // Détails
      updateElement('m1-total-cmd-detail', 
        `Prestataires convaincus (${prestataires.toLocaleString('fr-FR')}) × Clients acheteurs par prestataire (${clientsAcheteurs.toLocaleString('fr-FR')}) = ${Math.round(totalCommandes).toLocaleString('fr-FR')}`)
      updateElement('m1-montant-cmd-brut-detail',
        `Nombre de photos par commande (${photos}) × Prix moyen par photo (${formatEuro(prixPhoto)}) = ${formatEuro(montantCommandeBrut)}`)
      updateElement('m1-remise-cmd-detail',
        `Montant brut (${formatEuro(montantCommandeBrut)}) × 5% = ${formatEuro(remiseMontant)}`)
      updateElement('m1-montant-cmd-net-detail',
        `Montant brut (${formatEuro(montantCommandeBrut)}) − Remise (${formatEuro(remiseMontant)}) = ${formatEuro(montantCommandeNet)}`)
      updateElement('m1-commission-cmd-detail',
        `Montant net (${formatEuro(montantCommandeNet)}) × 20% = ${formatEuro(commissionCommande)}`)
      updateElement('m1-revenu-prest-detail',
        `Clients acheteurs par prestataire (${clientsAcheteurs.toLocaleString('fr-FR')}) × Commission par commande (${formatEuro(commissionCommande)}) = ${formatEuro(revenuPrest)}`)
      updateElement('m1-total-detail',
        `Total commandes (${Math.round(totalCommandes).toLocaleString('fr-FR')}) × Commission par commande (${formatEuro(commissionCommande)}) = ${formatEuro(totalReseau)}`)

      const results = document.getElementById('results-m1')
      if (results) results.classList.add('show')
    }

    const calculateModel2 = () => {
      const prestatairesConvaincus = getPrestatairesConvaincus()
      const tauxPartenaires = parseFloat((document.getElementById('m2-taux-partenaires') as HTMLInputElement)?.value || '0') / 100
      const tauxReussite = parseFloat((document.getElementById('m2-taux-reussite') as HTMLInputElement)?.value || '0') / 100
      const bonusParrain = parseFloat((document.getElementById('m2-bonus-parrain') as HTMLInputElement)?.value || '0')
      const bonusFilleul = parseFloat((document.getElementById('m2-bonus-filleul') as HTMLInputElement)?.value || '0')

      const totalFilleuls = prestatairesConvaincus * tauxPartenaires
      const parrainagesReussis = totalFilleuls * tauxReussite
      const gainsParrain = parrainagesReussis * bonusParrain
      const gainsFilleuls = parrainagesReussis * bonusFilleul

      const updateElement = (id: string, value: string) => {
        const element = document.getElementById(id)
        if (element) element.textContent = value
      }

      updateElement('m2-total-filleuls', Math.round(totalFilleuls).toLocaleString('fr-FR'))
      updateElement('m2-parrainages', Math.round(parrainagesReussis).toLocaleString('fr-FR'))
      updateElement('m2-gains-filleuls', formatEuro(gainsFilleuls))
      updateElement('m2-total', formatEuro(gainsParrain))

      updateElement('m2-total-filleuls-detail',
        `Prestataires convaincus (${prestatairesConvaincus.toLocaleString('fr-FR')}) × Taux partenaires (${(tauxPartenaires*100).toFixed(0)}%) = ${Math.round(totalFilleuls).toLocaleString('fr-FR')}`)
      updateElement('m2-parrainages-detail',
        `Filleuls (${Math.round(totalFilleuls).toLocaleString('fr-FR')}) × Taux de réussite (${(tauxReussite*100).toFixed(0)}%) = ${Math.round(parrainagesReussis).toLocaleString('fr-FR')}`)
      updateElement('m2-gains-filleuls-detail',
        `Parrainages rémunérés (${Math.round(parrainagesReussis).toLocaleString('fr-FR')}) × Bonus filleul (${formatEuro(bonusFilleul)}) = ${formatEuro(gainsFilleuls)}`)
      updateElement('m2-total-detail',
        `Parrainages rémunérés (${Math.round(parrainagesReussis).toLocaleString('fr-FR')}) × Bonus parrain (${formatEuro(bonusParrain)}) = ${formatEuro(gainsParrain)}`)

      const results = document.getElementById('results-m2')
      if (results) results.classList.add('show')
    }

    const calculateModel3 = () => {
      const prestatairesConvaincus = getPrestatairesConvaincus()
      const tauxPartage = parseFloat((document.getElementById('m3-taux-partage') as HTMLInputElement)?.value || '0')
      const commandesMoy = parseFloat((document.getElementById('m3-commandes-moy') as HTMLInputElement)?.value || '0')
      const commN1 = parseFloat((document.getElementById('m3-comm-n1') as HTMLInputElement)?.value || '0') / 100
      const commN2 = parseFloat((document.getElementById('m3-comm-n2') as HTMLInputElement)?.value || '0') / 100
      const commN3 = parseFloat((document.getElementById('m3-comm-n3') as HTMLInputElement)?.value || '0') / 100

      const niveau1Filleuls = prestatairesConvaincus
      const niveau1Commandes = niveau1Filleuls * commandesMoy
      const niveau1Commission = niveau1Commandes * commN1

      const niveau2Filleuls = niveau1Filleuls * tauxPartage
      const niveau2Commandes = niveau2Filleuls * commandesMoy
      const niveau2Commission = niveau2Commandes * commN2

      const niveau3Filleuls = niveau2Filleuls * tauxPartage
      const niveau3Commandes = niveau3Filleuls * commandesMoy
      const niveau3Commission = niveau3Commandes * commN3

      const revenuTotalParrain = niveau1Commission + niveau2Commission + niveau3Commission

      const updateElement = (id: string, value: string) => {
        const element = document.getElementById(id)
        if (element) element.textContent = value
      }

      updateElement('m3-n1-details',
        `${Math.round(niveau1Filleuls).toLocaleString('fr-FR')} filleuls × ${formatEuro(commandesMoy)} × ${(commN1*100).toFixed(1)}% = ${formatEuro(niveau1Commission)}`)
      updateElement('m3-n2-details',
        `${Math.round(niveau2Filleuls).toLocaleString('fr-FR')} filleuls × ${formatEuro(commandesMoy)} × ${(commN2*100).toFixed(1)}% = ${formatEuro(niveau2Commission)}`)
      updateElement('m3-n3-details',
        `${Math.round(niveau3Filleuls).toLocaleString('fr-FR')} filleuls × ${formatEuro(commandesMoy)} × ${(commN3*100).toFixed(1)}% = ${formatEuro(niveau3Commission)}`)

      updateElement('m3-total-parrain', formatEuro(revenuTotalParrain))
      updateElement('m3-total-parrain-detail',
        `Commission N1 (${formatEuro(niveau1Commission)}) + Commission N2 (${formatEuro(niveau2Commission)}) + Commission N3 (${formatEuro(niveau3Commission)}) = ${formatEuro(revenuTotalParrain)}`)

      const results = document.getElementById('results-m3')
      if (results) results.classList.add('show')
    }

    // Attacher les fonctions au window de manière sécurisée
    (window as any).updateConversion = updateConversion
    ;(window as any).getPrestatairesConvaincus = getPrestatairesConvaincus
    ;(window as any).showModel = showModel
    ;(window as any).updateM1Price = updateM1Price
    ;(window as any).calculateModel1 = calculateModel1
    ;(window as any).calculateModel2 = calculateModel2
    ;(window as any).calculateModel3 = calculateModel3

    // Initialisation
    updateM1Price()
    updateConversion()
    
    const globalClients = document.getElementById('global-clients') as HTMLInputElement
    const m1Clients = document.getElementById('m1-clients') as HTMLInputElement
    if (globalClients && m1Clients) {
      m1Clients.value = globalClients.value
      globalClients.addEventListener('input', (e) => { 
        m1Clients.value = (e.target as HTMLInputElement).value 
      })
    }

    // Cleanup
    return () => {
      delete (window as any).updateConversion
      delete (window as any).getPrestatairesConvaincus
      delete (window as any).showModel
      delete (window as any).updateM1Price
      delete (window as any).calculateModel1
      delete (window as any).calculateModel2
      delete (window as any).calculateModel3
    }
  }, [isAuthenticated])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === '1210') {
      setIsAuthenticated(true)
      localStorage.setItem('partenariat-weddingplan-auth', 'authenticated')
      setError('')
    } else {
      setError('Mot de passe incorrect')
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('partenariat-weddingplan-auth')
    setPassword('')
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Accès Restreint</h1>
            <p className="text-gray-600">Cette page est protégée par un mot de passe</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Entrez le mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Accéder à la page
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Icône de déconnexion en haut à droite */}
      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 z-50 p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:bg-gray-50"
        title="Se déconnecter"
      >
        <LogOut className="w-5 h-5 text-gray-600 hover:text-gray-800" />
      </button>

      {/* Contenu HTML intégré */}
      <div className="p-5">
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div 
              className="partenariat-content"
              dangerouslySetInnerHTML={{
                __html: `
                  <!DOCTYPE html>
                  <html lang="fr">
                  <head>
                    <meta charset="UTF-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1"/>
                    <title>Calculateur Partenariat Revila x WeddingPlan</title>
                    <link rel="preconnect" href="https://fonts.googleapis.com">
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
                    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
                    <style>
                      * { margin: 0; padding: 0; box-sizing: border-box; }
                      body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                        background: #f5f7fa; padding: 20px; min-height: 100vh; color: #2d3748;
                      }
                      .container { max-width: 1200px; margin: 0 auto; width: 100%; }
                      .header { text-align: center; margin-bottom: 40px; }
                      .header h1 { font-size: 2.2em; margin-bottom: 8px; font-weight: 700; color: #1a202c; }
                      .header p { font-size: 1.1em; color: #718096; }

                      .global-params {
                        background: white; border-radius: 12px; padding: 30px;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.08); margin-bottom: 30px;
                      }
                      .global-params h2 { color: #1a202c; font-size: 1.5em; margin-bottom: 25px; font-weight: 600; }
                      .params-grid {
                        display: grid; grid-template-columns: repeat(2, minmax(280px, 1fr)); gap: 20px;
                      }
                      .params-grid-single {
                        display: grid; grid-template-columns: 1fr; gap: 20px;
                      }

                      .conversion-result {
                        background: #f7fafc; border-left: 4px solid #ff6b35; padding: 15px; border-radius: 8px; margin-top: 20px;
                      }
                      .conversion-result .label { font-size: 0.9em; color: #718096; margin-bottom: 5px; }
                      .conversion-result .value { font-size: 1.5em; font-weight: 700; color: #ff6b35; }

                      .models-nav {
                        display: flex; justify-content: center; gap: 12px; margin-bottom: 30px; flex-wrap: wrap;
                      }
                      .model-btn {
                        padding: 12px 24px; background: white; color: #4a5568; border: 2px solid #e2e8f0;
                        border-radius: 8px; font-size: 1em; font-weight: 600; cursor: pointer; transition: all 0.2s;
                      }
                      .model-btn:hover { border-color: #cbd5e0; background: #f7fafc; }
                      .model-btn.active { background: #ff6b35; color: white; border-color: #ff6b35; }

                      .model-card {
                        background: white; border-radius: 12px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); display: none;
                      }
                      .model-card.active { display: block; }

                      .model-header { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
                      .model-header h2 { color: #1a202c; font-size: 1.6em; margin-bottom: 12px; font-weight: 700; }

                      .model-description { background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; line-height: 1.6; }
                      .model-description h3 { color: #2d3748; font-size: 1em; margin-bottom: 12px; font-weight: 600; }
                      .model-description p { color: #4a5568; margin-bottom: 8px; }
                      .model-description ol { margin: 10px 0 10px 20px; color: #4a5568; }
                      .model-description li { margin: 6px 0; }
                      .model-description a { color: #ff6b35; text-decoration: none; }
                      .model-description a:hover { text-decoration: underline; }

                      .input-group { margin-bottom: 20px; }
                      .input-group label {
                        display: block; margin-bottom: 8px; color: #2d3748; font-weight: 500; font-size: 0.95em;
                      }
                      .input-group input, .input-group select {
                        width: 100%; padding: 12px; border: 2px solid #e2e8f0; background: white; color: #2d3748;
                        border-radius: 8px; font-size: 1em; transition: border-color 0.2s;
                      }
                      .input-group input:focus, .input-group select:focus { outline: none; border-color: #ff6b35; }
                      .input-group input[readonly] { background: #f7fafc; cursor: not-allowed; color: #718096; }
                      .input-group small { display: block; color: #718096; margin-top: 5px; font-size: 0.85em; }

                      .calculate-btn {
                        width: 100%; padding: 14px; background: #ff6b35; color: white; border: none; border-radius: 8px;
                        font-size: 1.05em; font-weight: 600; cursor: pointer; margin-top: 20px; transition: all 0.2s;
                      }
                      .calculate-btn:hover {
                        background: #f7631e; transform: translateY(-1px);
                        box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
                      }

                      .results { margin-top: 30px; padding: 25px; background: #f7fafc; border-radius: 10px; display: none; }
                      .results.show { display: block; }
                      .result-item { padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
                      .result-item:last-child { border-bottom: none; }
                      .result-label { color: #718096; font-size: 0.9em; margin-bottom: 5px; }
                      .result-value { color: #1a202c; font-size: 1.2em; font-weight: 600; word-break: break-word; }
                      .result-detail { color: #718096; font-size: 0.85em; margin-top: 4px; word-break: break-word; }

                      .result-total {
                        background: #ff6b35; color: white; padding: 20px; border-radius: 10px; margin-top: 20px; text-align: center;
                      }
                      .result-total .label { font-size: 0.95em; opacity: 0.95; margin-bottom: 8px; font-weight: 500; }
                      .result-total .value { font-size: 2.2em; font-weight: 700; }
                      .result-total + .result-detail { text-align: center; margin-top: 8px; color: #718096; opacity: 0.9; }

                      .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }

                      /* Footer Banner */
                      .footer-banner {
                        background: white;
                        margin-top: 60px;
                        padding: 40px 20px;
                        border-top: 1px solid #e2e8f0;
                      }
                      .footer-banner-link {
                        display: block;
                        text-decoration: none;
                        cursor: pointer;
                        transition: opacity 0.2s;
                      }
                      .footer-banner-link:hover {
                        opacity: 0.9;
                      }
                      .footer-content {
                        max-width: 1200px;
                        margin: 0 auto;
                        display: grid;
                        grid-template-columns: 1fr auto 1fr;
                        align-items: center;
                        gap: 40px;
                      }
                      .footer-left, .footer-right {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                      }
                      .footer-left img, .footer-right img {
                        width: 150px;
                        height: 150px;
                        object-fit: contain;
                      }
                      .footer-center {
                        text-align: center;
                        padding: 0 20px;
                      }
                      .footer-center h2 {
                        font-family: 'Playfair Display', serif;
                        font-size: 2.5em;
                        font-weight: 700;
                        color: #1a202c;
                        margin-bottom: 8px;
                      }
                      .footer-center p {
                        font-family: 'Montserrat', sans-serif;
                        font-size: 1em;
                        color: #718096;
                        font-weight: 400;
                      }

                      /* Responsive */
                      @media (max-width: 900px) {
                        .params-grid { grid-template-columns: 1fr; }
                        .input-row { grid-template-columns: 1fr; }
                        .header h1 { font-size: 1.8em; }
                        .model-description { padding: 16px; }
                        .model-btn { width: 100%; }
                        .result-total .value { font-size: 1.8em; }
                        .footer-content {
                          grid-template-columns: 1fr;
                          gap: 30px;
                        }
                        .footer-center h2 { font-size: 2em; }
                        .footer-left img, .footer-right img {
                          width: 120px;
                          height: 120px;
                        }
                      }
                      @media (max-width: 480px) {
                        body { padding: 14px; }
                        .global-params, .model-card { padding: 18px; }
                        .calculate-btn { padding: 12px; }
                        .footer-center h2 { font-size: 1.8em; }
                        .footer-left img, .footer-right img {
                          width: 100px;
                          height: 100px;
                        }
                      }
                    </style>
                  </head>
                  <body>
                    <div class="container">
                      <div class="header">
                        <h1>🤝 Calculateur Partenariat</h1>
                        <p>Revila x WeddingPlan - Simulez vos revenus</p>
                      </div>

                      <!-- Paramètres globaux -->
                      <div class="global-params">
                        <h2>⚙️ Paramètres généraux</h2>
                        
                        <!-- Premier groupe: Prospects et Taux de conversion -->
                        <div class="params-grid">
                          <div class="input-group">
                            <label>Nombre de prospects sur WeddingPlan</label>
                            <input type="number" id="global-prospects" value="80000" onchange="updateConversion()">
                          </div>
                          <div class="input-group">
                            <label>Taux de conversion des prestataires de WeddingPlan pour Revila (%)</label>
                            <input type="number" step="0.1" id="global-conversion" value="1" onchange="updateConversion()">
                          </div>
                        </div>

                        <!-- Résultat intermédiaire -->
                        <div class="conversion-result">
                          <div class="label">→ Nombre de prestataires actifs sur WeddingPlan convaincus par Revila</div>
                          <div class="value" id="prestataires-convaincus">800</div>
                        </div>

                        <!-- Second groupe: Clients et Taux d'adoption -->
                        <div class="params-grid" style="margin-top: 20px;">
                          <div class="input-group">
                            <label>Clients par prestataire par an</label>
                            <input type="number" id="global-clients" value="20">
                          </div>
                          <div class="input-group">
                            <label>Taux d'adoption Revila de leurs clients (%)</label>
                            <input type="number" id="global-taux" value="20">
                          </div>
                        </div>
                      </div>

                      <!-- Navigation modèles -->
                      <div class="models-nav">
                        <button class="model-btn active" onclick="showModel(1)">Modèle 1</button>
                        <button class="model-btn" onclick="showModel(2)">Modèle 2</button>
                        <button class="model-btn" onclick="showModel(3)">Modèle 3</button>
                      </div>

                      <!-- Modèle 1 -->
                      <div class="model-card active" id="model-1">
                        <div class="model-header">
                          <h2>💻 Modèle 1 — Commission sur chaque commande via votre site</h2>
                        </div>

                        <div class="model-description">
                          <h3>🔧 Principe</h3>
                          <p>Toute commande faite grâce à la redirection depuis <a href="https://www.weddingplan.fr/" target="_blank" rel="noopener">https://www.weddingplan.fr/</a> permet à WeddingPlan d'obtenir 20 % du CA de chaque commande passée ainsi, et le client qui paye obtient 5 % de réduction sur sa commande grâce à ce principe.</p>
                          <p><strong>Ce modèle peut s'implanter de plusieurs manières :</strong></p>
                          <ol>
                            <li>
                              <strong>Bouton de redirection (recommandé)</strong><br>
                              Un bouton « Commander » amène sur un lien tracé qui montre une version de la boutique optimisée qui ne permet pas à l'utilisateur de rentrer de code promo, car le code WEDDINGPLAN -5 % est directement appliqué et non modifiable. Nous serons ainsi en mesure de suivre le parcours client, et de comptabiliser les visites sur le site depuis le lien du bouton présent sur le site weddingplan.fr. Cela permettra d'avoir le taux de conversion et l'optimisation de l'UX avec suivi du parcours client.
                            </li>
                            <li>
                              <strong>Intégration de la boutique sur weddingplan.fr</strong><br>
                              Il serait possible d'intégrer l'onglet commande directement sur le site, mais cela demande plus de travail technique et de suivi (mises à jour) si c'est une intégration autonome. C'est une option si l'on souhaite que les utilisateurs achètent directement sur la page, mais ne semble pas dérangeant car on a l'habitude que quand on clique sur « Commander », ça nous redirige vers un onglet boutique.
                            </li>
                          </ol>
                        </div>

                        <div class="input-group">
                          <label>Nombre de clients par prestataire par an</label>
                          <input type="number" id="m1-clients" value="20" readonly>
                          <small>Utilise le paramètre global ci-dessus (synchronisé automatiquement)</small>
                        </div>

                        <div class="input-group">
                          <label>Nombre de photos par commande</label>
                          <select id="m1-photos" onchange="updateM1Price()">
                            <option value="1">1 photo</option>
                            <option value="10">10 photos</option>
                            <option value="20">20 photos</option>
                            <option value="50">50 photos</option>
                            <option value="100" selected>100 photos</option>
                            <option value="150">150 photos</option>
                            <option value="200">200 photos</option>
                          </select>
                          <small>Prix dégressif : 1 photo = 9,50€ | 10 photos = -25% | 50 photos = -35% | 100 photos = -45%</small>
                        </div>

                        <div class="input-group">
                          <label>Prix moyen par photo (€ TTC)</label>
                          <input type="number" step="0.01" id="m1-prix" value="5.23" readonly>
                          <small>Calculé automatiquement selon le nombre de photos</small>
                        </div>

                        <button class="calculate-btn" onclick="calculateModel1()">Calculer</button>

                        <div class="results" id="results-m1">
                          <div class="result-item">
                            <div class="result-label">Total commandes potentielles / an</div>
                            <div class="result-value" id="m1-total-cmd"></div>
                            <div class="result-detail" id="m1-total-cmd-detail"></div>
                          </div>
                          <div class="result-item">
                            <div class="result-label">Montant moyen par commande (brut)</div>
                            <div class="result-value" id="m1-montant-cmd-brut"></div>
                            <div class="result-detail" id="m1-montant-cmd-brut-detail"></div>
                          </div>
                          <div class="result-item">
                            <div class="result-label">Remise client appliquée (-5%)</div>
                            <div class="result-value" id="m1-remise-cmd"></div>
                            <div class="result-detail" id="m1-remise-cmd-detail"></div>
                          </div>
                          <div class="result-item">
                            <div class="result-label">Montant moyen par commande (net)</div>
                            <div class="result-value" id="m1-montant-cmd-net"></div>
                            <div class="result-detail" id="m1-montant-cmd-net-detail"></div>
                          </div>
                          <div class="result-item">
                            <div class="result-label">Commission de WeddingPlan par commande (20% sur net)</div>
                            <div class="result-value" id="m1-commission-cmd"></div>
                            <div class="result-detail" id="m1-commission-cmd-detail"></div>
                          </div>
                          <div class="result-item">
                            <div class="result-label">Revenu de commission de WeddingPlan par prestataire / an</div>
                            <div class="result-value" id="m1-revenu-prest"></div>
                            <div class="result-detail" id="m1-revenu-prest-detail"></div>
                          </div>
                          <div class="result-total">
                            <div class="label">Potentiel total réseau / an</div>
                            <div class="value" id="m1-total"></div>
                          </div>
                          <div class="result-detail" id="m1-total-detail"></div>
                        </div>
                      </div>

                      <!-- Modèle 2 -->
                      <div class="model-card" id="model-2">
                        <div class="model-header">
                          <h2>🤝 Modèle 2 — Parrainage classique</h2>
                        </div>

                        <div class="model-description">
                          <h3>🔧 Principe</h3>
                          <p>Sur la section dédiée à Revila sur weddingplan.fr, les clients peuvent cliquer sur « Commander » (modèle 1). Ils peuvent également voir en dessous un programme de parrainage, où s'ils s'inscrivent (formulaire ou bien par email sur sélection), alors ils ont un code qu'ils peuvent mettre pour avoir les avantages du modèle de partenariat, et quand ils atteignent 100 commandes cumulées, alors le parrain (WeddingPlan) gagne 100€ et le client (filleul) gagne 50€.</p>
                          <p><strong>Complémentaire au modèle 1 mais non cumulable avec celui-ci.</strong></p>
                        </div>

                        <div class="input-group">
                          <label>Taux de conversion des prestataires convaincus qui deviennent partenaires (%)</label>
                          <input type="number" id="m2-taux-partenaires" value="50">
                          <small>Parmi les prestataires convaincus par Revila, combien acceptent le partenariat ?</small>
                        </div>

                        <div class="input-group">
                          <label>% de partenaires atteignant 100 photos</label>
                          <input type="number" id="m2-taux-reussite" value="50">
                        </div>

                        <div class="input-row">
                          <div class="input-group">
                            <label>Bonus parrain (€)</label>
                            <input type="number" id="m2-bonus-parrain" value="100">
                          </div>
                          <div class="input-group">
                            <label>Bonus filleul (€)</label>
                            <input type="number" id="m2-bonus-filleul" value="50">
                          </div>
                        </div>

                        <button class="calculate-btn" onclick="calculateModel2()">Calculer</button>

                        <div class="results" id="results-m2">
                          <div class="result-item">
                            <div class="result-label">Nombre total de filleuls</div>
                            <div class="result-value" id="m2-total-filleuls"></div>
                            <div class="result-detail" id="m2-total-filleuls-detail"></div>
                          </div>
                          <div class="result-item">
                            <div class="result-label">Parrainages rémunérés</div>
                            <div class="result-value" id="m2-parrainages"></div>
                            <div class="result-detail" id="m2-parrainages-detail"></div>
                          </div>
                          <div class="result-item">
                            <div class="result-label">Total gains filleuls</div>
                            <div class="result-value" id="m2-gains-filleuls"></div>
                            <div class="result-detail" id="m2-gains-filleuls-detail"></div>
                          </div>
                          <div class="result-total">
                            <div class="label">Total gains pour WeddingPlan</div>
                            <div class="value" id="m2-total"></div>
                          </div>
                          <div class="result-detail" id="m2-total-detail"></div>
                        </div>
                      </div>

                      <!-- Modèle 3 -->
                      <div class="model-card" id="model-3">
                        <div class="model-header">
                          <h2>💎 Modèle 3 — Parrainage – Commission cascade</h2>
                        </div>

                        <div class="model-description">
                          <h3>🔧 Principe</h3>
                          <p>Chaque prestataire touche un pourcentage sur les commandes de ses filleuls jusqu'au 3e niveau :</p>
                          <p>→ 3 % pour niveau 1<br>
                          → 2 % pour niveau 2<br>
                          → 1 % pour niveau 3</p>
                          <p><strong>Cumulable avec le modèle 2.</strong></p>
                        </div>

                        <div class="input-group">
                          <label>Taux de partage (nombre de personnes par filleul)</label>
                          <input type="number" step="0.1" id="m3-taux-partage" value="2">
                          <small>En moyenne, combien de personnes un filleul recommande-t-il ?</small>
                        </div>

                        <div class="input-group">
                          <label>Commandes moyennes par prestataire (€)</label>
                          <input type="number" id="m3-commandes-moy" value="1000">
                        </div>

                        <div class="input-row">
                          <div class="input-group">
                            <label>Commission Niveau 1 (%)</label>
                            <input type="number" step="0.1" id="m3-comm-n1" value="3">
                          </div>
                          <div class="input-group">
                            <label>Commission Niveau 2 (%)</label>
                            <input type="number" step="0.1" id="m3-comm-n2" value="2">
                          </div>
                        </div>

                        <div class="input-group">
                          <label>Commission Niveau 3 (%)</label>
                          <input type="number" step="0.1" id="m3-comm-n3" value="1">
                        </div>

                        <button class="calculate-btn" onclick="calculateModel3()">Calculer</button>

                        <div class="results" id="results-m3">
                          <div class="result-item">
                            <div class="result-label">Niveau 1 - Filleuls directs</div>
                            <div class="result-value" id="m3-n1-details"></div>
                          </div>
                          <div class="result-item">
                            <div class="result-label">Niveau 2 - Filleuls indirects</div>
                            <div class="result-value" id="m3-n2-details"></div>
                          </div>
                          <div class="result-item">
                            <div class="result-label">Niveau 3 - Filleuls niveau 3</div>
                            <div class="result-value" id="m3-n3-details"></div>
                          </div>
                          <div class="result-total">
                            <div class="label">Revenu total pour WeddingPlan / an</div>
                            <div class="value" id="m3-total-parrain"></div>
                          </div>
                          <div class="result-detail" id="m3-total-parrain-detail"></div>
                        </div>
                      </div>
                    </div>

                    <!-- Footer Banner -->
                    <div class="footer-banner">
                      <a href="https://revila.fr" target="_blank" rel="noopener noreferrer" class="footer-banner-link">
                        <div class="footer-content">
                          <div class="footer-left">
                            <img src="https://storage.googleapis.com/revila/partenariat/70.png" alt="Innovation Française">
                          </div>
                          <div class="footer-center">
                            <h2>REVILA</h2>
                            <p>Photos magiques qui prennent vie</p>
                          </div>
                          <div class="footer-right">
                            <img src="https://storage.googleapis.com/revila/partenariat/69.png" alt="Fabriqué en France">
                          </div>
                        </div>
                      </a>
                    </div>

                    <script>
                      function formatEuro(value) {
                        return new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        }).format(value);
                      }

                      function updateConversion() {
                        const prospects = parseFloat(document.getElementById('global-prospects').value);
                        const conversion = parseFloat(document.getElementById('global-conversion').value) / 100;
                        const prestatairesConvaincus = Math.round(prospects * conversion);
                        document.getElementById('prestataires-convaincus').textContent = prestatairesConvaincus.toLocaleString('fr-FR');
                      }

                      function getPrestatairesConvaincus() {
                        const prospects = parseFloat(document.getElementById('global-prospects').value);
                        const conversion = parseFloat(document.getElementById('global-conversion').value) / 100;
                        return Math.round(prospects * conversion);
                      }

                      function showModel(modelNum) {
                        document.querySelectorAll('.model-btn').forEach(btn => btn.classList.remove('active'));
                        document.querySelectorAll('.model-card').forEach(card => card.classList.remove('active'));
                        document.querySelectorAll('.model-btn')[modelNum - 1].classList.add('active');
                        document.getElementById('model-' + modelNum).classList.add('active');
                      }

                      function calculatePricePerPhoto(nbPhotos) {
                        const basePrice = 9.50;
                        if (nbPhotos <= 1) return basePrice;
                        if (nbPhotos >= 10 && nbPhotos < 50) return basePrice * 0.75; // -25%
                        if (nbPhotos >= 50 && nbPhotos < 100) return basePrice * 0.65; // -35%
                        if (nbPhotos >= 100) return basePrice * 0.55; // -45%
                        return basePrice;
                      }

                      function updateM1Price() {
                        const photos = parseFloat(document.getElementById('m1-photos').value);
                        const price = calculatePricePerPhoto(photos);
                        document.getElementById('m1-prix').value = price.toFixed(2);
                      }

                      function calculateModel1() {
                        const prestataires = getPrestatairesConvaincus();
                        const clientsParPrest = parseFloat(document.getElementById('global-clients').value);
                        const tauxAdoption = parseFloat(document.getElementById('global-taux').value) / 100;
                        const clientsAcheteurs = clientsParPrest * tauxAdoption;

                        const photos = parseFloat(document.getElementById('m1-photos').value);
                        const prixPhoto = parseFloat(document.getElementById('m1-prix').value);

                        const totalCommandes = prestataires * clientsAcheteurs;

                        const montantCommandeBrut = photos * prixPhoto;
                        const remiseClientPct = 0.05;
                        const remiseMontant = montantCommandeBrut * remiseClientPct;
                        const montantCommandeNet = montantCommandeBrut - remiseMontant;

                        const commissionCommande = montantCommandeNet * 0.20;
                        const revenuPrest = clientsAcheteurs * commissionCommande;
                        const totalReseau = totalCommandes * commissionCommande;

                        document.getElementById('m1-total-cmd').textContent = Math.round(totalCommandes).toLocaleString('fr-FR');
                        document.getElementById('m1-montant-cmd-brut').textContent = formatEuro(montantCommandeBrut);
                        document.getElementById('m1-remise-cmd').textContent = '-' + formatEuro(remiseMontant);
                        document.getElementById('m1-montant-cmd-net').textContent = formatEuro(montantCommandeNet);
                        document.getElementById('m1-commission-cmd').textContent = formatEuro(commissionCommande);
                        document.getElementById('m1-revenu-prest').textContent = formatEuro(revenuPrest);
                        document.getElementById('m1-total').textContent = formatEuro(totalReseau);

                        document.getElementById('m1-total-cmd-detail').textContent =
                          \`Prestataires convaincus (\${prestataires.toLocaleString('fr-FR')}) × Clients acheteurs par prestataire (\${clientsAcheteurs.toLocaleString('fr-FR')}) = \${Math.round(totalCommandes).toLocaleString('fr-FR')}\`;
                        document.getElementById('m1-montant-cmd-brut-detail').textContent =
                          \`Nombre de photos par commande (\${photos}) × Prix moyen par photo (\${formatEuro(prixPhoto)}) = \${formatEuro(montantCommandeBrut)}\`;
                        document.getElementById('m1-remise-cmd-detail').textContent =
                          \`Montant brut (\${formatEuro(montantCommandeBrut)}) × 5% = \${formatEuro(remiseMontant)}\`;
                        document.getElementById('m1-montant-cmd-net-detail').textContent =
                          \`Montant brut (\${formatEuro(montantCommandeBrut)}) − Remise (\${formatEuro(remiseMontant)}) = \${formatEuro(montantCommandeNet)}\`;
                        document.getElementById('m1-commission-cmd-detail').textContent =
                          \`Montant net (\${formatEuro(montantCommandeNet)}) × 20% = \${formatEuro(commissionCommande)}\`;
                        document.getElementById('m1-revenu-prest-detail').textContent =
                          \`Clients acheteurs par prestataire (\${clientsAcheteurs.toLocaleString('fr-FR')}) × Commission par commande (\${formatEuro(commissionCommande)}) = \${formatEuro(revenuPrest)}\`;
                        document.getElementById('m1-total-detail').textContent =
                          \`Total commandes (\${Math.round(totalCommandes).toLocaleString('fr-FR')}) × Commission par commande (\${formatEuro(commissionCommande)}) = \${formatEuro(totalReseau)}\`;

                        document.getElementById('results-m1').classList.add('show');
                      }

                      function calculateModel2() {
                        const prestatairesConvaincus = getPrestatairesConvaincus();
                        const tauxPartenaires = parseFloat(document.getElementById('m2-taux-partenaires').value) / 100;
                        const tauxReussite = parseFloat(document.getElementById('m2-taux-reussite').value) / 100;
                        const bonusParrain = parseFloat(document.getElementById('m2-bonus-parrain').value);
                        const bonusFilleul = parseFloat(document.getElementById('m2-bonus-filleul').value);

                        const totalFilleuls = prestatairesConvaincus * tauxPartenaires;
                        const parrainagesReussis = totalFilleuls * tauxReussite;
                        const gainsParrain = parrainagesReussis * bonusParrain;
                        const gainsFilleuls = parrainagesReussis * bonusFilleul;

                        document.getElementById('m2-total-filleuls').textContent = Math.round(totalFilleuls).toLocaleString('fr-FR');
                        document.getElementById('m2-parrainages').textContent = Math.round(parrainagesReussis).toLocaleString('fr-FR');
                        document.getElementById('m2-gains-filleuls').textContent = formatEuro(gainsFilleuls);
                        document.getElementById('m2-total').textContent = formatEuro(gainsParrain);

                        document.getElementById('m2-total-filleuls-detail').textContent =
                          \`Prestataires convaincus (\${prestatairesConvaincus.toLocaleString('fr-FR')}) × Taux partenaires (\${(tauxPartenaires*100).toFixed(0)}%) = \${Math.round(totalFilleuls).toLocaleString('fr-FR')}\`;
                        document.getElementById('m2-parrainages-detail').textContent =
                          \`Filleuls (\${Math.round(totalFilleuls).toLocaleString('fr-FR')}) × Taux de réussite (\${(tauxReussite*100).toFixed(0)}%) = \${Math.round(parrainagesReussis).toLocaleString('fr-FR')}\`;
                        document.getElementById('m2-gains-filleuls-detail').textContent =
                          \`Parrainages rémunérés (\${Math.round(parrainagesReussis).toLocaleString('fr-FR')}) × Bonus filleul (\${formatEuro(bonusFilleul)}) = \${formatEuro(gainsFilleuls)}\`;
                        document.getElementById('m2-total-detail').textContent =
                          \`Parrainages rémunérés (\${Math.round(parrainagesReussis).toLocaleString('fr-FR')}) × Bonus parrain (\${formatEuro(bonusParrain)}) = \${formatEuro(gainsParrain)}\`;

                        document.getElementById('results-m2').classList.add('show');
                      }

                      function calculateModel3() {
                        const prestatairesConvaincus = getPrestatairesConvaincus();
                        const tauxPartage = parseFloat(document.getElementById('m3-taux-partage').value);
                        const commandesMoy = parseFloat(document.getElementById('m3-commandes-moy').value);
                        const commN1 = parseFloat(document.getElementById('m3-comm-n1').value) / 100;
                        const commN2 = parseFloat(document.getElementById('m3-comm-n2').value) / 100;
                        const commN3 = parseFloat(document.getElementById('m3-comm-n3').value) / 100;

                        const niveau1Filleuls = prestatairesConvaincus;
                        const niveau1Commandes = niveau1Filleuls * commandesMoy;
                        const niveau1Commission = niveau1Commandes * commN1;

                        const niveau2Filleuls = niveau1Filleuls * tauxPartage;
                        const niveau2Commandes = niveau2Filleuls * commandesMoy;
                        const niveau2Commission = niveau2Commandes * commN2;

                        const niveau3Filleuls = niveau2Filleuls * tauxPartage;
                        const niveau3Commandes = niveau3Filleuls * commandesMoy;
                        const niveau3Commission = niveau3Commandes * commN3;

                        const revenuTotalParrain = niveau1Commission + niveau2Commission + niveau3Commission;

                        document.getElementById('m3-n1-details').textContent =
                          \`\${Math.round(niveau1Filleuls).toLocaleString('fr-FR')} filleuls × \${formatEuro(commandesMoy)} × \${(commN1*100).toFixed(1)}% = \${formatEuro(niveau1Commission)}\`;
                        document.getElementById('m3-n2-details').textContent =
                          \`\${Math.round(niveau2Filleuls).toLocaleString('fr-FR')} filleuls × \${formatEuro(commandesMoy)} × \${(commN2*100).toFixed(1)}% = \${formatEuro(niveau2Commission)}\`;
                        document.getElementById('m3-n3-details').textContent =
                          \`\${Math.round(niveau3Filleuls).toLocaleString('fr-FR')} filleuls × \${formatEuro(commandesMoy)} × \${(commN3*100).toFixed(1)}% = \${formatEuro(niveau3Commission)}\`;

                        document.getElementById('m3-total-parrain').textContent = formatEuro(revenuTotalParrain);
                        document.getElementById('m3-total-parrain-detail').textContent =
                          \`Commission N1 (\${formatEuro(niveau1Commission)}) + Commission N2 (\${formatEuro(niveau2Commission)}) + Commission N3 (\${formatEuro(niveau3Commission)}) = \${formatEuro(revenuTotalParrain)}\`;

                        document.getElementById('results-m3').classList.add('show');
                      }

                      document.addEventListener('DOMContentLoaded', () => {
                        updateM1Price();
                        updateConversion();
                        const globalClients = document.getElementById('global-clients');
                        const m1Clients = document.getElementById('m1-clients');
                        if (globalClients && m1Clients) {
                          m1Clients.value = globalClients.value;
                          globalClients.addEventListener('input', (e) => { m1Clients.value = e.target.value; });
                        }
                      });
                    </script>
                  </body>
                  </html>
                `
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
