<template>
	<Teleport to="body">
		<Transition enter-active-class="transition-opacity duration-[280ms] ease-out" enter-from-class="opacity-0"
			leave-active-class="transition-opacity duration-200 ease-out" leave-to-class="opacity-0">
			<div v-if="open" class="fixed inset-0 z-[110] bg-stone-900/40" aria-hidden="true" @click="emit('close')" />
		</Transition>

		<!-- Phones: a bottom sheet (drag it down or flick to dismiss). Wide screens: a centred dialog. -->
		<div class="pointer-events-none fixed inset-0 z-[120] flex items-end justify-center md:items-center">
			<Transition enter-active-class="transition-[transform,opacity] duration-[340ms] ease-drawer md:duration-[240ms] md:ease-out"
				enter-from-class="translate-y-full md:translate-y-0 md:scale-[.96] md:opacity-0"
				leave-active-class="transition-[transform,opacity] duration-[240ms] ease-out md:duration-150"
				leave-to-class="translate-y-full md:translate-y-0 md:scale-[.96] md:opacity-0">
				<div v-if="open" ref="panel" role="dialog" aria-modal="true" :aria-label="title"
					class="student-app pointer-events-auto w-full max-w-[520px] overflow-y-auto overscroll-contain rounded-t-[26px] bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-2 shadow-[0_18px_44px_-18px_rgba(40,25,8,.45)] md:w-[400px] md:rounded-3xl md:p-6"
					style="max-height: 88dvh">
					<div class="mx-auto mb-4 mt-1 h-6 w-full touch-none md:hidden" @pointerdown="onPointerDown" @pointermove="onPointerMove"
						@pointerup="onPointerUp" @pointercancel="onPointerUp">
						<div class="mx-auto h-[5px] w-[38px] rounded-full bg-stone-200" />
					</div>
					<h3 class="dashboard-heading mb-1.5 text-[20px] font-extrabold text-amber-900">{{ title }}</h3>
					<div class="text-[14px] leading-relaxed text-stone-600">
						<slot />
					</div>
					<div v-if="$slots.actions" class="mt-5 grid gap-2">
						<slot name="actions" />
					</div>
				</div>
			</Transition>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const panel = ref<HTMLElement | null>(null)

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

/* Drag the grabber down: the sheet follows the finger; a flick or 90px+ dismisses. */
interface Drag { startY: number; lastY: number; lastT: number; velocity: number }
let drag: Drag | null = null

function onPointerDown(event: PointerEvent) {
	if (!panel.value) return
	drag = { startY: event.clientY, lastY: event.clientY, lastT: performance.now(), velocity: 0 }
	;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
	panel.value.style.transition = 'none'
}

function onPointerMove(event: PointerEvent) {
	if (!drag || !panel.value) return
	const now = performance.now()
	drag.velocity = (event.clientY - drag.lastY) / Math.max(1, now - drag.lastT)
	drag.lastY = event.clientY
	drag.lastT = now
	const dy = event.clientY - drag.startY
	// dragging up meets resistance instead of a wall
	panel.value.style.transform = `translateY(${dy > 0 ? dy : dy * 0.15}px)`
}

function onPointerUp(event: PointerEvent) {
	if (!drag || !panel.value) return
	const el = panel.value
	const dy = event.clientY - drag.startY
	const dismiss = dy > 90 || drag.velocity > 0.6
	drag = null

	el.style.transition = ''
	el.style.transform = ''
	if (dismiss) emit('close')
}
</script>
