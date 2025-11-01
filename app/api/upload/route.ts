import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as any
    const type = formData.get('type') as string // 'photo' ou 'video'
    const orderId = formData.get('orderId') as string
    const position = formData.get('position') as string

    if (!file || !type || !orderId || !position) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Vérifier la taille du fichier
    const maxSize = type === 'photo' ? 10 * 1024 * 1024 : 50 * 1024 * 1024 // 10MB pour photos, 50MB pour vidéos
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Le fichier est trop volumineux (max ${type === 'photo' ? '10MB' : '50MB'})` },
        { status: 400 }
      )
    }

    // Récupérer les infos de la commande
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders2')
      .select('order_number')
      .eq('id', orderId)
      .single()

    if (orderError) throw orderError

    // Créer le chemin de stockage
    const fileExt = file.name.split('.').pop()
    const fileName = type === 'photo' ? `photo-${position}.${fileExt}` : `video-${position}.${fileExt}`
    const yearMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const storagePath = `commandes/${yearMonth}/${order.order_number}/${fileName}`

    // Convertir le File en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload vers Supabase Storage
    const bucket = type === 'photo' ? 'photos' : 'videos'
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) throw uploadError

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      path: storagePath,
      url: publicUrl,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    )
  }
}

// Configuration pour autoriser les gros fichiers
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
}