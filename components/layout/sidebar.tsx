'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navigation } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChevronLeft, ChevronDown, ChevronRight } from 'lucide-react'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpand = (title: string) => {
    setExpandedItems(prev =>
      prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border/50 bg-card transition-all duration-300 ease-in-out',
        collapsed ? 'w-[60px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center border-b border-border/50 px-3">
        {!collapsed ? (
          <Link href="/dashboard" className="flex items-center">
            <img src="/wackenhut_logo1.svg" alt="Wackenhut" className="h-8 w-auto max-w-[180px] invert dark:invert-0" />
          </Link>
        ) : (
          <Link href="/dashboard" className="mx-auto">
            <img src="/wackenhut_logo1.svg" alt="Wackenhut" className="h-7 w-7 object-contain invert dark:invert-0" />
          </Link>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-0.5 px-2">
          {navigation.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            const expanded = expandedItems.includes(item.title)
            const hasChildren = item.children && item.children.length > 0

            if (collapsed) {
              return (
                <Tooltip key={item.title} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex h-9 w-9 mx-auto items-center justify-center rounded-lg transition-colors',
                        active
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{item.title}</TooltipContent>
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
                          pathname === child.href
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
          className="w-full h-8 text-muted-foreground hover:text-foreground"
          onClick={onToggle}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform duration-200', collapsed && 'rotate-180')} />
        </Button>
      </div>
    </aside>
  )
}
