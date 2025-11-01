import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  
  // Récupérer TOUS les paramètres possibles
  const params: any = {}
  
  // Paramètres dans l'URL
  url.searchParams.forEach((value, key) => {
    params[key] = value
  })
  
  // Paramètres dans le hash (après #)
  const hashParams = url.hash ? url.hash.substring(1) : ''
  if (hashParams) {
    const hashSearchParams = new URLSearchParams(hashParams)
    hashSearchParams.forEach((value, key) => {
      params[`hash_${key}`] = value
    })
  }
  
  return NextResponse.json({
    message: 'Debug callback parameters',
    url: request.url,
    pathname: url.pathname,
    search: url.search,
    hash: url.hash,
    params,
    headers: {
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin')
    },
    note: 'Copiez l\'URL du lien email et testez avec: /api/debug/test-callback?[params]'
  })
}