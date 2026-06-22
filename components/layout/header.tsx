'use client'

import { useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useIsTablet } from '@/lib/hooks/use-media-query'
import { navigation } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Search, Bell, Moon, Sun, Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'

interface HeaderProps {
  onMenuToggle: () => void
  onSidebarToggle?: () => void
  sidebarCollapsed?: boolean
}

export function Header({
  onMenuToggle,
  onSidebarToggle,
  sidebarCollapsed = false,
}: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const mobileSearchRef = useRef<HTMLInputElement>(null)
  const pathname = usePathname() ?? '/'
  const isTablet = useIsTablet()

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const userMenuTriggerClassName = cn(
    buttonVariants({ variant: 'ghost' }),
    'ml-1 h-8 gap-2 px-1.5 sm:px-2'
  )

  const pageMeta = resolvePageMeta(pathname)
  const SidebarToggleIcon = sidebarCollapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <>
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border/60 bg-card/92 px-3 backdrop-blur-xl sm:px-4 md:h-16 md:px-5 lg:px-6">
      {/* Mobile Menu Button (only when sidebar is hidden, i.e. < md) */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-9 w-9"
        onClick={onMenuToggle}
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="min-w-0 flex-1 md:hidden">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          {pageMeta.eyebrow}
        </p>
        <p className="truncate text-sm font-semibold text-foreground">
          {pageMeta.title}
        </p>
      </div>

      {isTablet && onSidebarToggle && (
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex xl:hidden h-9 w-9"
          onClick={onSidebarToggle}
          title={sidebarCollapsed ? 'Navigation erweitern' : 'Navigation einklappen'}
        >
          <SidebarToggleIcon className="h-4 w-4" />
        </Button>
      )}

      <div className="hidden min-w-0 md:flex md:flex-1 md:flex-col xl:max-w-[240px]">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/80">
          {pageMeta.eyebrow}
        </p>
        <p className="truncate text-sm font-semibold text-foreground xl:text-[15px]">
          {pageMeta.title}
        </p>
      </div>

      {/* Search */}
      <div className="relative hidden lg:block lg:flex-1 lg:max-w-md">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Suchen..."
          className="pl-9 h-9 bg-muted/40 border-transparent focus:bg-background focus:border-input text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 md:h-9 md:w-9 lg:hidden"
          onClick={() => {
            setMobileSearchOpen((v) => {
              if (!v) setTimeout(() => mobileSearchRef.current?.focus(), 50)
              return !v
            })
          }}
        >
          {mobileSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
        </Button>

        {/* Dark Mode Toggle */}
        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-9 md:w-9" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-9 md:w-9 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User: reine Namensanzeige, keine Interaktion */}
        <div className={userMenuTriggerClassName}>
          <Avatar className="h-6 w-6">
            <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
              RL
            </AvatarFallback>
          </Avatar>
          <span className="hidden lg:inline text-sm">Rainer Leenen</span>
        </div>
      </div>
    </header>

    {/* Mobile expandable search bar */}
    {mobileSearchOpen && (
      <div className="sticky top-14 z-30 border-b border-border/60 bg-card/95 px-3 py-2 backdrop-blur-xl lg:hidden md:top-16">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={mobileSearchRef}
            placeholder="Suchen..."
            className="pl-9 h-10 bg-muted/40 border-transparent focus:bg-background focus:border-input text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setMobileSearchOpen(false)
            }}
          />
        </div>
      </div>
    )}
    </>
  )
}

function normalizeTargetPath(href: string) {
  return href.split('?')[0]
}

function matchesPath(pathname: string, href: string) {
  const targetPath = normalizeTargetPath(href)

  if (targetPath === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/'
  }

  return pathname === targetPath || pathname.startsWith(`${targetPath}/`)
}

function resolvePageMeta(pathname: string) {
  for (const item of navigation) {
    if (item.children?.length) {
      const matchingChild = item.children.find((child) => {
        const targetPath = normalizeTargetPath(child.href)
        return targetPath !== normalizeTargetPath(item.href) && matchesPath(pathname, child.href)
      })

      if (matchingChild) {
        return {
          eyebrow: item.title,
          title: matchingChild.title,
        }
      }
    }

    if (matchesPath(pathname, item.href)) {
      return {
        eyebrow: 'Wackenhut Autohaus',
        title: item.title,
      }
    }
  }

  const segments = pathname.split('/').filter(Boolean)
  const fallbackTitle = segments.length > 0
    ? segments[segments.length - 1].replace(/-/g, ' ')
    : 'Start'

  return {
    eyebrow: 'Wackenhut Autohaus',
    title: fallbackTitle.charAt(0).toUpperCase() + fallbackTitle.slice(1),
  }
}
