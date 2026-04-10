'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navigation } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react'
import { useIsTablet } from '@/lib/hooks/use-media-query'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isTablet = useIsTablet()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const isActive = (href: string, hasChildren?: boolean) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    if (hasChildren) {
      const basePath = '/' + href.split('/')[1]
      return pathname.startsWith(basePath)
    }
    return pathname.startsWith(href)
  }

  const isChildActive = (href: string) => {
    const [targetPath, targetQuery] = href.split('?')
    if (pathname !== targetPath) return false
    if (!targetQuery) return true

    const requiredParams = new URLSearchParams(targetQuery)
    for (const [key, value] of requiredParams.entries()) {
      if (searchParams.get(key) !== value) return false
    }
    return true
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border/50 bg-card transition-all duration-300 ease-in-out',
        collapsed ? 'w-[84px]' : 'w-[248px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border/50 px-3">
        {!collapsed ? (
          <Link href="/callcenter" className="flex items-center">
            <img src="/wackenhut_logo1.svg" alt="Wackenhut" className="h-8 w-auto max-w-[180px] invert dark:invert-0" />
          </Link>
        ) : (
          <Link href="/callcenter" className="mx-auto flex flex-col items-center gap-1.5">
            <img src="/wackenhut_logo1.svg" alt="Wackenhut" className="h-7 w-7 object-contain invert dark:invert-0" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
              Menu
            </span>
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-0.5 px-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const hasChildren = item.children && item.children.length > 0
            const active = isActive(item.href, hasChildren)
            const expanded = expandedItems.includes(item.title)

            if (collapsed) {
              return (
                <Tooltip key={item.title} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'mx-auto flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-center transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <span className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
                        active ? 'bg-primary/12' : 'bg-muted/50',
                      )}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className={cn(
                        'line-clamp-2 text-[10px] font-medium leading-tight',
                        isTablet ? 'max-w-[64px]' : 'max-w-[52px]',
                      )}>
                        {item.title}
                      </span>
                    </Link>
                  </TooltipTrigger>
                  {!isTablet && <TooltipContent side="right" className="text-xs">{item.title}</TooltipContent>}
                </Tooltip>
              )
            }

            return (
              <div key={item.title}>
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    className={cn(
                      'flex flex-1 items-center gap-2.5 rounded-lg px-2.5 py-[7px] text-[13px] transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                  {hasChildren && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0 text-muted-foreground"
                      onClick={() => toggleExpand(item.title)}
                    >
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
                {hasChildren && expanded && (
                  <div className="ml-[34px] mt-0.5 flex flex-col gap-0.5">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-[13px] transition-colors',
                          isChildActive(child.href)
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      </ScrollArea>

      {/* Collapse Toggle */}
      <div className="border-t border-border/50 p-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-full text-muted-foreground hover:text-foreground"
          onClick={onToggle}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} />
        </Button>
      </div>
    </aside>
  )
}
