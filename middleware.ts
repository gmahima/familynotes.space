import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function middleware(request: NextRequest) {
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

  // Refresh session if expired
  await supabase.auth.getSession()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Auth routes - redirect to dashboard if authenticated
  if (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup")) {
    if (user) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // Protected routes - redirect to login if not authenticated
  if (
    request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/notes") ||
    request.nextUrl.pathname.startsWith("/folders") ||
    request.nextUrl.pathname.startsWith("/billing")
  ) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/login", "/signup", "/dashboard/:path*", "/notes/:path*", "/folders/:path*", "/billing/:path*"],
}
