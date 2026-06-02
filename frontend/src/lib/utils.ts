import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function basename(path: string): string {
  if (!path) return ''
  const parts = path.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || ''
}
