'use client'

import { useEffect, useRef, useState } from 'react'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileDock } from '@/components/layout/mobile-dock'
import { MobileNav } from '@/components/layout/mobile-nav'
import { CallcenterCallbackNotificationProvider } from '@/components/callcenter/callcenter-callback-notification-provider'
import { VoiceControl } from '@/components/voice/voice-control'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useIsLargeDesktop, useIsTablet } from '@/lib/hooks/use-media-query'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isTablet = useIsTablet()
  const isLargeDesktop = useIsLargeDesktop()
  const previousShellMode = useRef<'tablet' | 'desktop' | null>(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()
  const isNachrichten = pathname?.startsWith('/nachrichten')

  useEffect(() => {
    const nextMode = isTablet ? 'tablet' : isLargeDesktop ? 'desktop' : null

    if (!nextMode || previousShellMode.current === nextMode) {
      return
    }

    const nextCollapsed = nextMode === 'tablet'
    const frame = window.requestAnimationFrame(() => {
      setSidebarCollapsed(nextCollapsed)
      previousShellMode.current = nextMode
    })

    return () => {
      window.cancelAnimationFrame(frame)
    }
  }, [isLargeDesktop, isTablet])

  return (
    <TooltipProvider>
      <div className="flex h-[calc(100dvh-1.5rem)] min-h-[calc(100dvh-1.5rem)] overflow-hidden bg-background">
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
            onOpenChange={setMobileNavOpen}
          />
        </Suspense>

        <Suspense fallback={null}>
          <MobileDock onMenuOpen={() => setMobileNavOpen(true)} />
        </Suspense>

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header
            onMenuToggle={() => setMobileNavOpen(true)}
            onSidebarToggle={() => setSidebarCollapsed((current) => !current)}
            sidebarCollapsed={sidebarCollapsed}
          />
          {isNachrichten ? (
            <main className="flex-1 overflow-hidden pb-[var(--mobile-dock-offset)] md:pb-0">
              {children}
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1600px] px-3 py-3 pb-[calc(var(--mobile-dock-offset)+1.1rem)] sm:px-4 sm:py-4 md:px-6 md:py-5 md:pb-6 lg:px-6 lg:py-6 lg:pb-6">
                {children}
              </div>
            </main>
          )}
        </div>

        {/* Voice Control */}
        <VoiceControl />
        <CallcenterCallbackNotificationProvider />
      </div>
    </TooltipProvider>
  )
}
