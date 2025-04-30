import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function middleware(request: NextRequest) {
  // Create a response object
  const res = NextResponse.next()

  // Create a Supabase client configured to use cookies
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set: () => {}, // This is required but we don't need to implement it for the middleware
      remove: () => {}, // This is required but we don't need to implement it for the middleware
    },
  })

  try {
    // Get the session - this will refresh the session if needed
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if we have a session
    const isAuthenticated = !!session

    // Auth routes - redirect to dashboard if authenticated
    if (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup")) {
      if (isAuthenticated) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
      return res
    }

    // Protected routes - redirect to login if not authenticated
    if (
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/notes") ||
      request.nextUrl.pathname.startsWith("/folders") ||
      request.nextUrl.pathname.startsWith("/billing")
    ) {
      if (!isAuthenticated) {
        return NextResponse.redirect(new URL("/login", request.url))
      }
      return res
    }

    return res
  } catch (error) {
    console.error("Middleware error:", error)
    // If there's an error, we'll just continue to the page
    // This prevents authentication issues from blocking access completely
    return res
  }
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*", "/notes/:path*", "/folders/:path*", "/billing/:path*"],
}
