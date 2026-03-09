'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navigation } from '@/lib/constants'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MobileNavProps {
  open: boolean
  onClose: () => void
}

export function MobileNav({ open, onClose }: MobileNavProps) {
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
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[88vw] max-w-xs p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center">
            <img src="/wackenhut_logo1.svg" alt="Wackenhut" className="h-8 w-auto max-w-[160px] invert dark:invert-0 sm:max-w-[180px]" />
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-1 px-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const hasChildren = Boolean(item.children?.length)
              const active = isActive(item.href, hasChildren)

              return (
                <div key={item.title}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                      active
                        ? 'bg-accent text-primary font-medium'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{item.title}</span>
                  </Link>
                  {item.children && (
                    <div className="ml-8 mt-1 flex flex-col gap-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            'rounded-lg px-3 py-1.5 text-sm transition-colors',
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
      </SheetContent>
    </Sheet>
  )
}
