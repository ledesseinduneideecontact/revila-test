import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Failed attempts tracking for brute force protection
const failedAttemptsStore = new Map<string, { attempts: number; lastAttempt: number; blockedUntil?: number }>()

// Clean up old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
  
  // Clean up failed attempts store
  for (const [key, value] of failedAttemptsStore.entries()) {
    if (value.blockedUntil && now > value.blockedUntil) {
      failedAttemptsStore.delete(key)
    } else if (!value.blockedUntil && now - value.lastAttempt > 30 * 60 * 1000) { // 30 minutes
      failedAttemptsStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `video-search:${ip}`
}

function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 10

  const current = rateLimitStore.get(key)
  
  if (!current || now > current.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

function validateShortId(shortId: string): boolean {
  // Validate format: alphanumeric, 6-20 characters
  // More strict validation to prevent any special characters
  const pattern = /^[a-zA-Z0-9]{6,20}$/
  
  // Additional checks
  if (!shortId || typeof shortId !== 'string') return false
  if (shortId.length < 6 || shortId.length > 20) return false
  if (!pattern.test(shortId)) return false
  
  // Check for any non-printable characters
  if (/[\x00-\x1F\x7F]/.test(shortId)) return false
  
  return true
}

function checkBruteForceProtection(ip: string): boolean {
  const now = Date.now()
  const key = `brute-force:${ip}`
  const current = failedAttemptsStore.get(key)
  
  // If currently blocked, check if block has expired
  if (current?.blockedUntil && now < current.blockedUntil) {
    return false // Still blocked
  }
  
  // If block expired, reset
  if (current?.blockedUntil && now >= current.blockedUntil) {
    failedAttemptsStore.delete(key)
    return true
  }
  
  return true
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const key = `brute-force:${ip}`
  const current = failedAttemptsStore.get(key)
  
  if (!current) {
    failedAttemptsStore.set(key, { attempts: 1, lastAttempt: now })
  } else {
    current.attempts++
    current.lastAttempt = now
    
    // Progressive delay: 3s, 5s, 10s, 30s, then 1 hour block
    const delays = [3000, 5000, 10000, 30000] // 3s, 5s, 10s, 30s
    if (current.attempts <= delays.length) {
      const delay = delays[current.attempts - 1]
      current.blockedUntil = now + delay
      console.warn(`IP ${ip} delayed for ${delay/1000}s due to ${current.attempts} failed attempts`)
    } else if (current.attempts >= 5) {
      // Block for 1 hour after 5 failed attempts
      current.blockedUntil = now + (60 * 60 * 1000) // 1 hour
      console.warn(`IP ${ip} blocked for 1 hour due to ${current.attempts} failed attempts`)
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let clientIP = 'unknown'
  
  try {
    // Get client IP for logging
    const forwarded = request.headers.get('x-forwarded-for')
    clientIP = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    
    // Check brute force protection first
    if (!checkBruteForceProtection(clientIP)) {
      console.warn(`IP ${clientIP} is blocked due to too many failed attempts`)
      return NextResponse.json(
        { error: 'Trop de tentatives échouées. Veuillez réessayer plus tard.' },
        { status: 429 }
      )
    }
    
    // Rate limiting check
    const rateLimitKey = getRateLimitKey(request)
    if (!checkRateLimit(rateLimitKey)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Trop de tentatives. Veuillez réessayer dans une minute.' },
        { status: 429 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const { shortId } = body

    if (!shortId || typeof shortId !== 'string') {
      return NextResponse.json(
        { error: 'Code non valide' },
        { status: 400 }
      )
    }

    // Validate short_id format
    if (!validateShortId(shortId)) {
      console.warn(`Invalid short_id format from IP: ${clientIP}, shortId: ${shortId}`)
      return NextResponse.json(
        { error: 'Code non valide' },
        { status: 400 }
      )
    }

    // Create Supabase client
    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      console.error('Supabase client creation failed:', clientError)
      return NextResponse.json(
        { error: 'Service temporairement indisponible' },
        { status: 503 }
      )
    }

    // Secure query with parameterized statement
    const { data, error } = await supabase
      .from('order_items')
      .select('video_gcs_url')
      .eq('short_id', shortId)
      .single()

    // Handle specific Supabase errors
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - this is expected for invalid codes
        console.info(`Video not found for shortId: ${shortId} from IP: ${clientIP}`)
        recordFailedAttempt(clientIP) // Record failed attempt for brute force protection
        return NextResponse.json(
          { error: 'Code non valide' },
          { status: 404 }
        )
      } else {
        // Other database errors
        console.error(`Database query error for IP: ${clientIP}, shortId: ${shortId}:`, error)
        return NextResponse.json(
          { error: 'Erreur de connexion. Veuillez réessayer.' },
          { status: 500 }
        )
      }
    }

    if (!data) {
      recordFailedAttempt(clientIP) // Record failed attempt for brute force protection
      return NextResponse.json(
        { error: 'Code non valide' },
        { status: 404 }
      )
    }

    // Validate that we have a video URL
    if (!data.video_gcs_url || typeof data.video_gcs_url !== 'string') {
      recordFailedAttempt(clientIP) // Record failed attempt for brute force protection
      return NextResponse.json(
        { error: 'Code non valide' },
        { status: 404 }
      )
    }

    // Log successful video access
    const duration = Date.now() - startTime
    console.info(`Video access successful for shortId: ${shortId} from IP: ${clientIP} (${duration}ms)`)
    
    // Return the video URL
    return NextResponse.json({
      success: true,
      videoUrl: data.video_gcs_url
    })

  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`Video search error for IP: ${clientIP} (${duration}ms):`, error)
    return NextResponse.json(
      { error: 'Erreur de connexion. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}

// Only allow POST method
export async function GET() {
  return NextResponse.json(
    { error: 'Méthode non autorisée' },
    { status: 405 }
  )
}
