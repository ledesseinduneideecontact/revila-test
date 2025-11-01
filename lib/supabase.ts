import { createClient } from '@supabase/supabase-js'

// Vérifier si les variables d'environnement sont présentes avant d'initialiser
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Création sûre pour éviter un crash si l'URL est invalide
function safeCreate(url?: string, key?: string) {
  try {
    if (!url || !key) return null
    // Valide l'URL
    // eslint-disable-next-line no-new
    new URL(url)
    return createClient(url, key)
  } catch {
    return null
  }
}

// Clients Supabase (retournent null si variables manquantes/invalides)
export const supabase = safeCreate(supabaseUrl, supabaseAnonKey)
export const supabaseAdmin = safeCreate(supabaseUrl, supabaseServiceKey)

/**
 * Génère l'URL publique d'un fichier stocké dans Supabase Storage
 * @param path Chemin relatif du fichier dans le bucket (ex: "2025-01/uuid/photo-1.jpg")
 * @returns URL publique complète du fichier
 */
export function getFilePublicUrl(path: string): string {
  if (!supabaseAdmin) {
    throw new Error('Supabase client not initialized')
  }
  const { data } = supabaseAdmin.storage
    .from('revive.v3')
    .getPublicUrl(path)
  
  return data.publicUrl
}

/**
 * Ajoute les URLs publiques aux order_items
 * @param orderItems Array d'order_items avec les chemins relatifs
 * @returns Array d'order_items avec les URLs publiques ajoutées
 */
export function enrichOrderItemsWithUrls(orderItems: any[]): any[] {
  return orderItems.map(item => ({
    ...item,
    photo_public_url: getFilePublicUrl(item.photo_gcs_url),
    video_public_url: getFilePublicUrl(item.video_gcs_url)
  }))
}