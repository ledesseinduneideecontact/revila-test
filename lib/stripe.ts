import Stripe from 'stripe'

// Utilise la version par défaut du SDK (évite les erreurs si la date n'est pas reconnue)
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})