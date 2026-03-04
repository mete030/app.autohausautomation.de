import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns'
import { de } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy', { locale: de })
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd.MM.yyyy HH:mm', { locale: de })
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de })
}

export function formatMileage(km: number): string {
  return new Intl.NumberFormat('de-DE').format(km) + ' km'
}

export function getDaysRemaining(deadline: string): number {
  return differenceInDays(new Date(deadline), new Date())
}

export function getEscalationLevel(deadline: string): 'green' | 'yellow' | 'red' | 'darkred' {
  const days = getDaysRemaining(deadline)
  if (days < 0) return 'darkred'
  if (days < 3) return 'red'
  if (days <= 5) return 'yellow'
  return 'green'
}

export function formatSlaTime(createdAt: string): { text: string; overdue: boolean } {
  const created = new Date(createdAt)
  const slaDeadline = new Date(created.getTime() + 2 * 60 * 60 * 1000) // 2 hours
  const now = new Date()
  const overdue = now > slaDeadline

  if (overdue) {
    const hoursOver = differenceInHours(now, slaDeadline)
    const minsOver = differenceInMinutes(now, slaDeadline) % 60
    return { text: `+${hoursOver}h ${minsOver}m überfällig`, overdue: true }
  }

  const minsLeft = differenceInMinutes(slaDeadline, now)
  const hoursLeft = Math.floor(minsLeft / 60)
  const remainingMins = minsLeft % 60
  return { text: `${hoursLeft}h ${remainingMins}m verbleibend`, overdue: false }
}
