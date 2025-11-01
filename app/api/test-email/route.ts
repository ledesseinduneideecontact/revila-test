import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Test d'envoi d'email via Supabase Auth
export async function GET(request: Request) {
  try {
    // Initialiser Supabase Admin
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Récupérer l'email depuis l'URL
    const { searchParams } = new URL(request.url)
    const testEmail = searchParams.get('email')
    
    if (!testEmail) {
      return NextResponse.json({ 
        error: 'Email requis. Utilisez: /api/test-email?email=votre@email.com' 
      }, { status: 400 })
    }

    // Test 1: Envoyer un Magic Link (le plus simple pour tester)
    const { data, error } = await supabaseAdmin.auth.signInWithOtp({
      email: testEmail,
      options: {
        shouldCreateUser: false, // Ne pas créer de compte
        emailRedirectTo: 'http://localhost:3002/auth/callback'
      }
    })

    if (error) {
      return NextResponse.json({ 
        error: 'Erreur SMTP',
        details: error.message,
        suggestion: 'Vérifiez vos paramètres SMTP dans Supabase'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Email de test envoyé à ${testEmail}`,
      info: 'Vérifiez votre boîte de réception (et les spams)',
      smtp_status: 'SMTP fonctionne correctement ✅'
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error.message 
    }, { status: 500 })
  }
}

// Test plus complet avec inscription
export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email requis dans le body JSON' 
      }, { status: 400 })
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test 2: Créer un compte test (envoi email de confirmation)
    const randomPassword = Math.random().toString(36).slice(-8)
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password: randomPassword,
      options: {
        emailRedirectTo: 'http://localhost:3002/auth/callback',
        data: {
          test_account: true,
          created_at: new Date().toISOString()
        }
      }
    })

    if (error) {
      // Si l'utilisateur existe déjà, essayer reset password
      if (error.message.includes('already registered')) {
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
          redirectTo: 'http://localhost:3002/auth/reset-password',
        })
        
        if (resetError) {
          return NextResponse.json({ 
            error: 'Erreur reset password',
            details: resetError.message 
          }, { status: 500 })
        }
        
        return NextResponse.json({
          success: true,
          message: `Email de réinitialisation envoyé à ${email}`,
          type: 'reset_password',
          smtp_status: 'SMTP fonctionne ✅'
        })
      }
      
      return NextResponse.json({ 
        error: 'Erreur création compte',
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Email de confirmation envoyé à ${email}`,
      type: 'signup_confirmation',
      smtp_status: 'SMTP fonctionne ✅',
      user_id: data.user?.id
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erreur serveur',
      details: error.message 
    }, { status: 500 })
  }
}