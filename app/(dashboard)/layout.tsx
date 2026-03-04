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
      <div className="flex h-screen overflow-hidden bg-background">
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
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto">
              <div className="p-4 lg:p-6 max-w-[1600px]">
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
