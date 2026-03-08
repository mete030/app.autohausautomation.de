'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useHydrated } from '@/hooks/useHydrated'
import { cn } from '@/lib/utils'
import { Search, Bell, Moon, Sun, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false)
  const mounted = useHydrated()

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  const userMenuTriggerClassName = cn(
    buttonVariants({ variant: 'ghost' }),
    'ml-1 h-8 gap-2 px-1.5 sm:px-2'
  )

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border/50 bg-card px-3 sm:px-4 lg:px-6">
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden h-8 w-8"
        onClick={onMenuToggle}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Search */}
      <div className="relative hidden flex-1 max-w-md sm:block">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Suchen..."
          className="pl-9 h-9 bg-muted/40 border-transparent focus:bg-background focus:border-input text-sm"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden">
          <Search className="h-4 w-4" />
        </Button>

        {/* Dark Mode Toggle */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleDarkMode}>
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </Button>

        {/* User Menu */}
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger className={userMenuTriggerClassName}>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                  TM
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:inline text-sm">Thomas M.</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="text-sm">Profil</DropdownMenuItem>
              <DropdownMenuItem className="text-sm">Einstellungen</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm">Abmelden</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button type="button" className={userMenuTriggerClassName}>
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                TM
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm">Thomas M.</span>
          </button>
        )}
      </div>
    </header>
  )
}
