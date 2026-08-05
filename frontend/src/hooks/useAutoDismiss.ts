import { useEffect } from 'react'

/** Clears `value` after `delayMs` — used for the "brief confirmation" banners (AC 2.1.6, DESIGN.md). */
export function useAutoDismiss(value: string | null, onDismiss: () => void, delayMs = 3000) {
  useEffect(() => {
    if (!value) return
    const timer = setTimeout(onDismiss, delayMs)
    return () => clearTimeout(timer)
  }, [value, onDismiss, delayMs])
}
