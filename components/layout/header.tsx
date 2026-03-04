'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Search, Bell, Moon, Sun, Menu } from 'lucide-react'

interface HeaderProps {
  onMenuToggle: () => void
}

export function Header({ onMenuToggle }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border/50 bg-card px-4 lg:px-6">
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
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Suchen..."
          className="pl-9 h-9 bg-muted/40 border-transparent focus:bg-background focus:border-input text-sm"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
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
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 h-8 ml-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                    TM
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:inline text-sm">Thomas M.</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem className="text-sm">Profil</DropdownMenuItem>
              <DropdownMenuItem className="text-sm">Einstellungen</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-sm">Abmelden</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button variant="ghost" className="gap-2 px-2 h-8 ml-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-medium">
                TM
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline text-sm">Thomas M.</span>
          </Button>
        )}
      </div>
    </header>
  )
}
