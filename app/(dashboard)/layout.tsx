'use client'

import { useState } from 'react'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { VoiceControl } from '@/components/voice/voice-control'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  // On tablet (md, < lg) the sidebar starts collapsed (icon-only); on desktop expanded.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(max-width: 1023.98px)').matches
  })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()
  const isNachrichten = pathname?.startsWith('/nachrichten')

  return (
    <TooltipProvider>
      <div className="flex h-dvh min-h-dvh overflow-hidden bg-background">
        {/* Desktop & Tablet Sidebar */}
        <div className="hidden md:flex">
          <Suspense fallback={null}>
            <Sidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </Suspense>
        </div>

        {/* Mobile Navigation (only < md) */}
        <Suspense fallback={null}>
          <MobileNav
            open={mobileNavOpen}
            onClose={() => setMobileNavOpen(false)}
          />
        </Suspense>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuToggle={() => setMobileNavOpen(true)} />
          {isNachrichten ? (
            <main className="flex-1 overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1600px] px-3 py-3 pb-24 sm:px-4 sm:py-4 sm:pb-28 md:px-5 md:py-5 md:pb-6 lg:px-6 lg:py-6 lg:pb-6">
                {children}
              </div>
            </main>
          )}
        </div>

        {/* Voice Control */}
        <VoiceControl />
      </div>
    </TooltipProvider>
  )
}
