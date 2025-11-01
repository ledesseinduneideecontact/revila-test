import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Tester différentes méthodes d'authentification
    const tests = {
      signup: false,
      signin: false,
      magicLink: false,
      resetPassword: false
    }
    
    // Test email factice pour vérification
    const testEmail = `test-${Date.now()}@example.com`
    
    // Test 1: Signup
    try {
      const { error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'TestPassword123!'
      })
      tests.signup = !error || error.message.includes('rate limit')
    } catch (e) {
      tests.signup = false
    }
    
    // Test 2: Magic Link
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: testEmail
      })
      tests.magicLink = !error || error.message.includes('rate limit')
    } catch (e) {
      tests.magicLink = false
    }
    
    // Test 3: Reset Password
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(testEmail)
      tests.resetPassword = !error || error.message.includes('rate limit')
    } catch (e) {
      tests.resetPassword = false
    }
    
    // Récupérer la configuration actuelle
    const { data: { user } } = await supabase.auth.getUser()
    
    return NextResponse.json({
      success: true,
      currentUser: user ? { id: user.id, email: user.email } : null,
      authMethods: tests,
      recommendations: {
        if_all_fail: [
          '1. Vérifier dans Supabase Dashboard → Authentication → Providers → Email est activé',
          '2. Vérifier dans Supabase Dashboard → Authentication → Email Templates',
          '3. Pour le dev, désactiver temporairement "Confirm email" dans Email Provider',
          '4. Vérifier les logs Supabase pour plus de détails'
        ],
        smtp_config: [
          'Si SMTP custom est configuré, vérifier:',
          '- Host: smtp.gmail.com',
          '- Port: 587',
          '- Username: votre email complet',
          '- Password: mot de passe d\'application (pas le mot de passe normal)',
          '- Sender email: doit correspondre au domaine'
        ]
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}