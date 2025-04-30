import type React from "react"
import { Toaster } from "sonner"
import { Inter } from "next/font/google"
import { AuthProvider } from "@/components/providers/auth-provider"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Family Notes",
  description: "Keep your family organized with smart notes",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  )
}
