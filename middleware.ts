import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Protection basique pour les routes admin
  // Dans une vraie app, implémenter une authentification complète
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const authHeader = request.headers.get('authorization')
    
    // Pour le développement, on peut utiliser un token simple
    // En production, utiliser une vraie authentification
    if (!authHeader || authHeader !== 'Bearer admin-dev-token') {
      // Permettre l'accès en dev pour faciliter les tests
      // return new NextResponse('Unauthorized', { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}