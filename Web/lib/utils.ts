import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Removes undefined values from an object to prevent Firebase errors
 * Firebase doesn't accept undefined values, they must be omitted entirely
 */
export function cleanObjectForFirebase<T extends Record<string, any>>(obj: T): Partial<T> {
  const cleaned: Partial<T> = {}
  
  Object.keys(obj).forEach(key => {
    const value = obj[key]
    if (value !== undefined) {
      // Handle nested objects
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        const cleanedNested = cleanObjectForFirebase(value)
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key as keyof T] = cleanedNested as T[keyof T]
        }
      } else {
        cleaned[key as keyof T] = value
      }
    }
  })
  
  return cleaned
}

/**
 * Formats a date to YYYY-MM-DD string for HTML date inputs
 */
export function formatDateForInput(date: Date | undefined): string {
  if (!date) return ''
  return date.toISOString().split('T')[0]
}

/**
 * Safely parses a date string from HTML input
 */
export function parseDateFromInput(dateString: string): Date | undefined {
  if (!dateString) return undefined
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? undefined : date
}
