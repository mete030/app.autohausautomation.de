import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { PrototypeIndicator } from "@/components/layout/prototype-indicator"

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Wackenhut Autohaus Management",
  description: "AI-Native Autohaus Management Platform",
  icons: {
    icon: [
      {
        url: "/favicon-light.png",
        type: "image/png",
        sizes: "128x128",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.png",
        type: "image/png",
        sizes: "128x128",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased pt-6`}>
        {children}
        <PrototypeIndicator />
        <Analytics />
      </body>
    </html>
  )
}
