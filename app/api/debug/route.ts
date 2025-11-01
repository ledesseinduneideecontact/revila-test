import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const info = {
    timestamp: new Date().toISOString(),
    server_url: `${request.nextUrl.protocol}//${request.nextUrl.host}`,
    current_port: request.nextUrl.port,
    headers: Object.fromEntries(request.headers.entries()),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    }
  }

  return NextResponse.json({
    status: 'Debug info',
    info,
    message: 'Server is running correctly'
  })
}