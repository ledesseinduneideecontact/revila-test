import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Vérifier les tables nécessaires
    const tables = ['user_profiles', 'saved_carts', 'saved_cart_items']
    const results: any = {}
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          results[table] = {
            exists: false,
            error: error.message,
            hint: error.hint || 'Table n\'existe pas'
          }
        } else {
          results[table] = {
            exists: true,
            count: count || 0
          }
        }
      } catch (e: any) {
        results[table] = {
          exists: false,
          error: e.message
        }
      }
    }
    
    // Vérifier aussi l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser()
    
    return NextResponse.json({
      success: true,
      user: user ? { id: user.id, email: user.email } : null,
      tables: results,
      instructions: {
        if_missing_tables: [
          '1. Aller dans Supabase Dashboard > SQL Editor',
          '2. Copier le contenu de sql/auth-and-saved-carts.sql',
          '3. Exécuter le script SQL',
          '4. Rafraîchir cette page pour vérifier'
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