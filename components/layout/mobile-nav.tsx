'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center">
            <img src="/wackenhut_logo1.svg" alt="Wackenhut" className="h-8 w-auto max-w-[180px] invert dark:invert-0" />
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-1 px-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

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
      </SheetContent>
    </Sheet>
  )
}
