import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs'

const OUTPUT_DIR = path.join(process.cwd(), 'outputs')

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params

    // Sécurité : vérifier que le nom de fichier ne contient pas de chemin relatif
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return new Response('Invalid filename', { status: 400 })
    }

    const filePath = path.join(OUTPUT_DIR, filename)

    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      return new Response('File not found', { status: 404 })
    }

    // Lire le fichier
    const fileBuffer = fs.readFileSync(filePath)

    // Retourner le fichier vidéo
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': fileBuffer.length.toString(),
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=31536000',
      },
    })

  } catch (error) {
    console.error('Error serving video:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
