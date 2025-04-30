import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  
  if (!code) {
    // Missing code, redirect to login
    return NextResponse.redirect(new URL(`/login?error=Missing code`, request.url))
  }
  
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set(name, value, options as any)
          } catch (error) {
            console.error(`Error setting cookie ${name}:`, error)
          }
        },
        remove(name, options) {
          try {
            cookieStore.set(name, "", { ...options as any, maxAge: 0 })
          } catch (error) {
            console.error(`Error removing cookie ${name}:`, error)
          }
        },
      },
    }
  )
  
  try {
    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error("Auth callback error:", error)
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url))
    }
    
    // Success - redirect to dashboard
    const response = NextResponse.redirect(new URL("/dashboard", request.url))
    
    // Get the session to set cookies
    const { data: { session } } = await supabase.auth.getSession()
    
    // If there's a session, ensure cookies are properly set for all routes
    if (session) {
      response.cookies.set('sb-access-token', session.access_token, { 
        path: '/',
        sameSite: 'lax',
        maxAge: session.expires_in
      })
      
      response.cookies.set('sb-refresh-token', session.refresh_token, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })
    }
    
    return response
  } catch (error) {
    console.error("Unexpected error during code exchange:", error)
    return NextResponse.redirect(new URL(`/login?error=Authentication failed`, request.url))
  }
}
