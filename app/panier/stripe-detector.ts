// Utilitaire pour détecter si Stripe est bloqué par un adblocker
export const detectStripeBlocked = async (): Promise<boolean> => {
  try {
    // Tenter de faire une requête vers un endpoint Stripe
    const testUrl = 'https://js.stripe.com/v3/'
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 secondes timeout
    
    const response = await fetch(testUrl, {
      method: 'GET',
      mode: 'no-cors', // Éviter les problèmes CORS
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return false // Stripe accessible
  } catch (error) {
    // Si fetch échoue, Stripe est probablement bloqué
    return true
  }
}

export const getStripeBlockedMessage = () => {
  return {
    title: "🛡️ Bloqueur de publicités détecté",
    message: "Votre bloqueur de publicités empêche le chargement du système de paiement sécurisé.",
    solutions: [
      "1. Désactivez temporairement votre bloqueur de publicités (uBlock Origin/AdBlock) pour localhost",
      "2. Ajoutez *.stripe.com à votre liste blanche",
      "3. Testez en mode navigation privée",
      "4. Ou contactez-nous pour un paiement manuel"
    ]
  }
}