<template>
	<Teleport to="body">
		<Transition enter-active-class="transition-opacity duration-[280ms] ease-out" enter-from-class="opacity-0"
			leave-active-class="transition-opacity duration-200 ease-out" leave-to-class="opacity-0">
			<div v-if="open" class="fixed inset-0 z-[90] bg-stone-900/35" aria-hidden="true" @click="emit('close')" />
		</Transition>

		<!-- Wide screens: a 460px drawer on the right. Phones: a full-screen panel that slides in like a pushed screen. -->
		<Transition enter-active-class="transition-transform duration-[340ms] ease-drawer" enter-from-class="translate-x-full"
			leave-active-class="transition-transform duration-[220ms] ease-out" leave-to-class="translate-x-full"
			@after-enter="focusPanel">
			<aside v-if="open" ref="panel" role="dialog" aria-modal="true" :aria-label="title" tabindex="-1"
				class="student-app fixed inset-y-0 right-0 z-[100] flex w-full touch-pan-y flex-col bg-[#fffbeb] shadow-[-20px_0_50px_-30px_rgba(0,0,0,.5)] outline-none md:w-[460px] md:border-l md:border-stone-200"
				@pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp">
				<header
					class="flex shrink-0 items-center justify-between gap-2 border-b border-stone-200/80 bg-[#fffbeb]/85 px-3 pb-2 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] backdrop-blur-xl md:px-5 md:py-3.5">
					<button type="button"
						class="flex h-10 items-center gap-0.5 rounded-xl pr-2 text-[15px] font-medium text-accent-500 transition-[transform,opacity] duration-150 ease-out active:scale-95 active:opacity-70 md:hidden"
						@click="emit('close')">
						<Icon name="i-lucide-chevron-left" class="h-5 w-5" />Back
					</button>
					<h2 class="dashboard-heading truncate text-[15px] font-semibold text-stone-900 md:text-[17px] md:font-bold md:text-amber-900">{{ title }}</h2>
					<button type="button" aria-label="Close"
						class="hidden h-9 w-9 items-center justify-center rounded-xl text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 active:scale-90 md:flex"
						@click="emit('close')">
						<Icon name="i-lucide-x" class="h-[18px] w-[18px]" />
					</button>
					<!-- keeps the title centred on phones -->
					<span class="w-[60px] md:hidden" />
				</header>

				<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-5">
					<slot />
				</div>

				<footer v-if="$slots.footer"
					class="flex shrink-0 items-center gap-2.5 border-t border-stone-200/80 bg-white/85 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-xl md:px-5">
					<slot name="footer" />
				</footer>
			</aside>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const panel = ref<HTMLElement | null>(null)

function focusPanel() {
	panel.value?.focus({ preventScroll: true })
}

// Escape closes instantly (it's keyboard-initiated, so no ceremony), and the page behind stops scrolling.
function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape' && props.open) emit('close')
}

watch(() => props.open, (isOpen) => {
	if (import.meta.client) document.documentElement.style.overflow = isOpen ? 'hidden' : ''
}, { immediate: true })

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown)
	document.documentElement.style.overflow = ''
})

/* Left-edge swipe to go back on touch screens: the panel follows the finger 1:1, then
   commits on distance or a quick flick (velocity), otherwise springs home. */
interface Drag { startX: number; lastX: number; lastT: number; velocity: number }
let drag: Drag | null = null

function onPointerDown(event: PointerEvent) {
	if (event.pointerType !== 'touch' || !panel.value) return
	if (event.clientX - panel.value.getBoundingClientRect().left > 26) return
	drag = { startX: event.clientX, lastX: event.clientX, lastT: performance.now(), velocity: 0 }
	panel.value.setPointerCapture(event.pointerId)
	panel.value.style.transition = 'none'
}

function onPointerMove(event: PointerEvent) {
	if (!drag || !panel.value) return
	const now = performance.now()
	drag.velocity = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastT)
	drag.lastX = event.clientX
	drag.lastT = now
	panel.value.style.transform = `translateX(${Math.max(0, event.clientX - drag.startX)}px)`
}

function onPointerUp(event: PointerEvent) {
	if (!drag || !panel.value) return
	const el = panel.value
	const distance = Math.max(0, event.clientX - drag.startX)
	const commit = distance > el.offsetWidth * 0.4 || drag.velocity > 0.5
	drag = null

	el.style.transition = 'transform 220ms cubic-bezier(.23, 1, .32, 1)'
	el.style.transform = commit ? 'translateX(100%)' : ''
	if (commit) setTimeout(() => emit('close'), 180)
	else setTimeout(() => { el.style.transition = '' }, 240)
}
</script>
