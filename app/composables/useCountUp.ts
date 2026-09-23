import type { Ref } from 'vue'

/** A number that eases from its old value to its new one (ease-out cubic), e.g. a points balance after redeeming. */
export function useCountUp(source: Ref<number>, duration = 520) {
  const shown = ref(source.value)
  let frame = 0

  watch(source, (to, from) => {
    cancelAnimationFrame(frame)

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.value = to
      return
    }

    const start = performance.now()
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration)
      shown.value = Math.round(from + (to - from) * (1 - Math.pow(1 - progress, 3)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  })

  onBeforeUnmount(() => cancelAnimationFrame(frame))

  return shown
}
