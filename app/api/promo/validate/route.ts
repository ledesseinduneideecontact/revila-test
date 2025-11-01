import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Route API pour valider un code promo
 * Vérifie dans Supabase si le code existe et est valide
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({
        isValid: false,
        discount: 0,
        message: 'Aucun code promo fourni'
      })
    }

    // Appeler la fonction Supabase pour valider le code
    const { data, error } = await supabaseAdmin.rpc('validate_promo_code', {
      p_code: code.trim()
    })

    if (error) {
      console.error('Erreur validation code promo:', error)
      return NextResponse.json({
        isValid: false,
        discount: 0,
        message: 'Erreur lors de la validation du code'
      })
    }

    if (data && data.length > 0) {
      const result = data[0]
      return NextResponse.json({
        isValid: result.is_valid,
        discount: result.is_valid ? result.discount_percentage / 100 : 0, // Convertir en décimal (5% = 0.05)
        message: result.message
      })
    }

    return NextResponse.json({
      isValid: false,
      discount: 0,
      message: 'Code promo invalide'
    })

  } catch (error) {
    console.error('Erreur API promo/validate:', error)
    return NextResponse.json({
      isValid: false,
      discount: 0,
      message: 'Erreur serveur'
    }, { status: 500 })
  }
}