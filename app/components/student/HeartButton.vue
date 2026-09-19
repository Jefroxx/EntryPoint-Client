<template>
	<button type="button" :aria-pressed="active" :aria-label="active ? 'Remove from wishlist' : 'Save to wishlist'"
		class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl transition-[transform,color,background-color] duration-150 ease-out active:scale-90 [@media(hover:hover)]:hover:bg-stone-100"
		:class="active ? 'text-red-500' : 'text-stone-400'" @click.stop="emit('toggle')">
		<svg viewBox="0 0 24 24" class="h-[19px] w-[19px]" :class="{ 'heart-pop': popping }" :fill="active ? 'currentColor' : 'none'"
			stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
			<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z" />
		</svg>
	</button>
</template>

<script setup lang="ts">
const props = defineProps<{ active: boolean }>()
const emit = defineEmits<{ (e: 'toggle'): void }>()

// The pop plays only when a heart turns on, never on first render.
const popping = ref(false)
watch(() => props.active, (on) => {
	popping.value = false
	if (!on) return
	void nextTick(() => { popping.value = true })
})
</script>
