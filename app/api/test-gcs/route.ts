import { NextRequest, NextResponse } from 'next/server'
import { uploadToGCS, testGCSConnection } from '@/lib/gcs'

export async function POST(request: NextRequest) {
  console.log('🧪 Test GCS Upload...')
  
  try {
    // Tester la connexion d'abord
    const isConnected = await testGCSConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Impossible de se connecter au bucket GCS' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as any
    
    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    console.log(`📁 Fichier reçu: ${file.name} (${file.size} bytes)`)

    // Créer un nom unique pour éviter les conflits
    const timestamp = Date.now()
    const filename = `test/${timestamp}-${file.name}`
    
    // Convertir le fichier en Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    console.log(`🚀 Upload vers GCS: ${filename}`)
    
    // Upload vers GCS
    const url = await uploadToGCS(buffer, filename, file.type)
    
    console.log(`✅ Upload réussi: ${url}`)
    
    return NextResponse.json({
      success: true,
      url,
      filename,
      size: file.size,
      type: file.type
    })
    
  } catch (error: any) {
    console.error('❌ Erreur test GCS:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Erreur inconnue',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}