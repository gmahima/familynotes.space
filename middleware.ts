import type { NextRequest } from "next/server"
import { updateSession } from "@/utils/supabase/middleware"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, assets, etc.)
     *
     * Also specifically match authenticated routes:
     * - /dashboard and all its subpaths
     * - /notes and all its subpaths
     * - /folders and all its subpaths
     * - /billing and all its subpaths
     * - /memes and all its subpaths
     * - /api routes that require authentication
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
