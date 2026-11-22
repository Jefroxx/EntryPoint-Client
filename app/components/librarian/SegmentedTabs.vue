<template>
	<div ref="rootRef" class="no-scrollbar relative inline-flex max-w-full gap-0.5 overflow-x-auto rounded-xl bg-stone-100 p-1">
		<div ref="thumbRef"
			class="absolute top-1 bottom-1 left-1 rounded-lg bg-white shadow-sm transition-[transform,width] duration-300 ease-[cubic-bezier(.22,1,.36,1)]" />
		<button v-for="tab in tabs" :key="tab.value" ref="btnRefs" type="button"
			class="relative z-10 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[14px] font-semibold transition-colors duration-200 sm:px-4 sm:text-[15px]"
			:class="tab.value === modelValue ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700'"
			@click="select(tab.value)">
			<template v-if="tab.short"><span class="sm:hidden">{{ tab.short }}</span><span class="hidden sm:inline">{{ tab.label }}</span></template>
				<template v-else>{{ tab.label }}</template>
			<CountBadge v-if="tab.badge" tone="amber">{{ tab.badge }}</CountBadge>
		</button>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	tabs: { label: string; value: string; badge?: number; /** Shown instead of the label below 640px. */ short?: string }[]
	modelValue: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const rootRef = ref<HTMLElement | null>(null)
const thumbRef = ref<HTMLElement | null>(null)
const btnRefs = ref<HTMLElement[]>([])

function select(value: string) {
	emit('update:modelValue', value)
}

/**
 * Puts the white thumb behind the chosen tab. `instant` skips the slide: when the tabs themselves changed size
 * (the window was resized, the font loaded, a label switched to its short form) the thumb must jump to the new
 * place, not glide there from the old one.
 */
function moveThumb(instant = false) {
	const index = props.tabs.findIndex((t) => t.value === props.modelValue)
	const el = btnRefs.value[index]
	const thumb = thumbRef.value
	if (!thumb || !el) return
	if (instant) thumb.style.transition = 'none'
	thumb.style.width = `${el.offsetWidth}px`
	thumb.style.transform = `translateX(${el.offsetLeft - 4}px)`
	if (instant) {
		void thumb.offsetWidth // apply it before the slide comes back
		thumb.style.transition = ''
	}
}

// The tabs change width without the selection changing: a resize (padding and text size change at breakpoints,
// phones show short labels), a font that arrives late, a badge. Watching the tabs themselves covers all of them.
let observer: ResizeObserver | undefined
function observe() {
	observer?.disconnect()
	if (typeof ResizeObserver === 'undefined') return
	observer = new ResizeObserver(() => moveThumb(true))
	if (rootRef.value) observer.observe(rootRef.value)
	btnRefs.value.forEach((button) => observer!.observe(button))
}

onMounted(() => {
	nextTick(() => { moveThumb(true); observe() })
	void document.fonts?.ready.then(() => moveThumb(true))
})
onBeforeUnmount(() => observer?.disconnect())
watch(() => props.modelValue, () => nextTick(() => moveThumb()))
// Tabs added or removed, or a badge appearing: measure again and watch the new buttons.
watch(() => props.tabs.map((t) => `${t.value}:${t.badge ?? 0}`).join(','), () => nextTick(() => { moveThumb(true); observe() }))
</script>
