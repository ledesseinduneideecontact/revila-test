import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Pour les routes API qui reçoivent des fichiers, augmenter la limite
  if (request.nextUrl.pathname.startsWith('/api/orders/create-with-payment')) {
    const response = NextResponse.next()
    // Augmenter la limite de taille du body à 200MB
    response.headers.set('x-middleware-request-body-size-limit', '209715200') // 200MB en bytes
    return response
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
