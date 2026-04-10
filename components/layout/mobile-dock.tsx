'use client'

import Link from 'next/link'
import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { navigation, type NavItem } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface MobileDockProps {
  onMenuOpen: () => void
}

function normalizeTargetPath(href: string) {
  return href.split('?')[0]
}

function isItemActive(pathname: string, item: NavItem) {
  const targetPath = normalizeTargetPath(item.href)

  if (targetPath === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/'
  }

  if (item.children?.length) {
    return pathname.startsWith(targetPath)
  }

  return pathname === targetPath || pathname.startsWith(`${targetPath}/`)
}

function getPrimaryItems(pathname: string) {
  const defaultItems = navigation.slice(0, 4)
  const activeItem = navigation.find((item) => isItemActive(pathname, item))

  if (!activeItem || defaultItems.some((item) => item.href === activeItem.href)) {
    return defaultItems
  }

  return [...defaultItems.slice(0, 3), activeItem]
}

export function MobileDock({ onMenuOpen }: MobileDockProps) {
  const pathname = usePathname() ?? '/'
  const items = getPrimaryItems(pathname)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] md:hidden">
      <nav className="pointer-events-auto mx-auto flex max-w-xl items-center gap-1 rounded-[28px] border border-border/70 bg-card/92 px-2 py-2 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.5)] backdrop-blur-xl">
        {items.map((item) => {
          const Icon = item.icon
          const active = isItemActive(pathname, item)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[10px] font-medium transition-all duration-200',
                active
                  ? 'bg-primary text-primary-foreground shadow-[0_8px_20px_-12px_rgba(37,99,235,0.9)]'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
              )}
            >
              <Icon className={cn('h-[18px] w-[18px] transition-transform duration-200', active ? 'scale-105' : 'group-hover:scale-105')} />
              <span className="truncate">{item.title}</span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={onMenuOpen}
          className="group flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-2 py-2 text-[10px] font-medium text-muted-foreground transition-all duration-200 hover:bg-muted/70 hover:text-foreground"
          aria-label="Navigation öffnen"
        >
          <Menu className="h-[18px] w-[18px] transition-transform duration-200 group-hover:scale-105" />
          <span className="truncate">Menü</span>
        </button>
      </nav>
    </div>
  )
}
