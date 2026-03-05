'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { VoiceControl } from '@/components/voice/voice-control'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const pathname = usePathname()
  const isNachrichten = pathname?.startsWith('/nachrichten')

  return (
    <TooltipProvider>
      <div className="flex h-dvh min-h-dvh overflow-hidden bg-background">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex">
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        {/* Mobile Navigation */}
        <MobileNav
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header onMenuToggle={() => setMobileNavOpen(true)} />
          {isNachrichten ? (
            <main className="flex-1 overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
              {children}
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto w-full max-w-[1600px] px-3 py-3 pb-24 sm:px-4 sm:py-4 sm:pb-28 lg:px-6 lg:py-6 lg:pb-6">
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
