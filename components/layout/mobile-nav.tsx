'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navigation } from '@/lib/constants'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[88vw] max-w-xs p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-4 py-4 gap-3">
          <SheetTitle className="flex items-center">
            <img src="/wackenhut_logo1.svg" alt="Wackenhut" className="h-7 w-auto max-w-[150px] invert dark:invert-0" />
          </SheetTitle>
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                TM
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">Thomas Mueller</p>
              <p className="truncate text-xs text-muted-foreground">Geschaeftsfuehrung</p>
            </div>
          </div>
        </SheetHeader>
        <ScrollArea className="flex-1 py-3">
          <nav className="flex flex-col gap-0.5 px-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const hasChildren = Boolean(item.children?.length)
              const active = isActive(item.href, hasChildren)

              return (
                <div key={item.title}>
                  <Link
                    href={item.href}
                    onClick={() => onOpenChange(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors',
                      active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-foreground/80 hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-5 w-5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
                    <span>{item.title}</span>
                  </Link>
                  {item.children && active && (
                    <div className="ml-5 mt-1 mb-1 flex flex-col border-l border-border/70">
                      {item.children.map((child) => {
                        const childActive = isChildActive(child.href)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => onOpenChange(false)}
                            className={cn(
                              'relative -ml-px border-l-2 px-4 py-2 text-sm transition-colors',
                              childActive
                                ? 'border-l-primary text-primary font-medium'
                                : 'border-l-transparent text-muted-foreground hover:text-foreground hover:border-l-border'
                            )}
                          >
                            {child.title}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
