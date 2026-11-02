import { ref } from 'vue'

export type AlertVariant = 'success' | 'error'

export interface AlertMessage {
  id: number
  variant: AlertVariant
  title: string
  description?: string
}

const alerts = ref<AlertMessage[]>([])
let seq = 0

function push(variant: AlertVariant, title: string, description?: string, duration = 4000) {
  // Errors show in a dialog the user has to dismiss. If the very same error is already waiting there
  // (say, a button tapped over and over), don't stack another copy of it.
  if (variant === 'error') {
    const same = alerts.value.find((a) => a.variant === 'error' && a.title === title && a.description === description)
    if (same) return same.id
  }

  const id = ++seq
  alerts.value.push({ id, variant, title, description })

  // Only success toasts disappear by themselves; an error stays until it is dismissed.
  if (variant === 'success' && duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }

  return id
}

function dismiss(id: number) {
  const index = alerts.value.findIndex((a) => a.id === id)
  if (index !== -1) alerts.value.splice(index, 1)
}

export function useAlert() {
  return {
    alerts,
    success: (title: string, description?: string) => push('success', title, description),
    error: (title: string, description?: string) => push('error', title, description),
    dismiss,
  }
}
