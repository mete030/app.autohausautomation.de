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
      {/* pt-6 = Platz für das fixe PROTOTYP-Banner. Bewusst NICHT auf <body>:
          Radix-Overlays (Select/Dialog/Popover) sperren beim Öffnen den Scroll
          via react-remove-scroll und überschreiben dabei das Body-Padding —
          das ließ die ganze Seite um 24px nach oben/unten springen. Auf einem
          Wrapper-<div> wird das Padding nicht angefasst. */}
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="pt-6">{children}</div>
        <PrototypeIndicator />
        <Analytics />
      </body>
    </html>
  )
}
