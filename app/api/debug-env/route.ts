import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const envCheck = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    variables: {
      NEXT_PUBLIC_SUPABASE_URL: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        value: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
          (process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy') ? 'DUMMY_VALUE' : 'SET') : 
          'MISSING',
        isDummy: process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('dummy') || false
      },
      NEXT_PUBLIC_SUPABASE_ANON_KEY: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
          (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('dummy') ? 'DUMMY_VALUE' : 'SET') : 
          'MISSING',
        isDummy: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes('dummy') || false
      },
      SUPABASE_SERVICE_ROLE_KEY: {
        exists: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        value: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
          (process.env.SUPABASE_SERVICE_ROLE_KEY.includes('dummy') ? 'DUMMY_VALUE' : 'SET') : 
          'MISSING',
        isDummy: process.env.SUPABASE_SERVICE_ROLE_KEY?.includes('dummy') || false
      },
      STRIPE_SECRET_KEY: {
        exists: !!process.env.STRIPE_SECRET_KEY,
        value: process.env.STRIPE_SECRET_KEY ? 
          (process.env.STRIPE_SECRET_KEY.includes('dummy') ? 'DUMMY_VALUE' : 'SET') : 
          'MISSING',
        isDummy: process.env.STRIPE_SECRET_KEY?.includes('dummy') || false
      },
      STRIPE_WEBHOOK_SECRET: {
        exists: !!process.env.STRIPE_WEBHOOK_SECRET,
        value: process.env.STRIPE_WEBHOOK_SECRET ? 
          (process.env.STRIPE_WEBHOOK_SECRET.includes('dummy') ? 'DUMMY_VALUE' : 'SET') : 
          'MISSING',
        isDummy: process.env.STRIPE_WEBHOOK_SECRET?.includes('dummy') || false
      },
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: {
        exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 
          (process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('dummy') ? 'DUMMY_VALUE' : 'SET') : 
          'MISSING',
        isDummy: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('dummy') || false
      }
    },
    summary: {
      totalVariables: 6,
      missingVariables: 0,
      dummyVariables: 0,
      validVariables: 0
    }
  }

  // Calculer le résumé
  Object.values(envCheck.variables).forEach(variable => {
    if (!variable.exists) {
      envCheck.summary.missingVariables++
    } else if (variable.isDummy) {
      envCheck.summary.dummyVariables++
    } else {
      envCheck.summary.validVariables++
    }
  })

  return NextResponse.json(envCheck)
} 