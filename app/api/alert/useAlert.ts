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
  const id = ++seq
  alerts.value.push({ id, variant, title, description })

  if (duration > 0) {
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
