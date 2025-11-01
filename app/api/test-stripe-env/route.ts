import { NextResponse } from 'next/server'

export async function GET() {
  const env = {
    stripe: {
      hasPublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      publishableKeyPrefix: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 7),
      hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
      secretKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 7),
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      webhookSecretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 7),
    },
    supabase: {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    n8n: {
      hasTestWebhook: !!process.env.N8N_WEBHOOK_NEW_ORDER_TEST,
      hasProdWebhook: !!process.env.N8N_WEBHOOK_NEW_ORDER_PROD,
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
    }
  }

  // Test de connexion Stripe
  let stripeTest: any = { success: false, error: null }
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    const account = await stripe.accounts.retrieve()
    stripeTest = {
      success: true,
      error: null,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      country: account.country,
      defaultCurrency: account.default_currency
    }
  } catch (error: any) {
    stripeTest = {
      success: false,
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    }
  }

  return NextResponse.json({
    ...env,
    stripeConnectionTest: stripeTest
  })
}