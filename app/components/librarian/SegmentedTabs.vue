<template>
	<div class="relative inline-flex gap-0.5 rounded-xl bg-stone-100 p-1">
		<div ref="thumbRef"
			class="absolute top-1 bottom-1 left-1 rounded-lg bg-white shadow-sm transition-[transform,width] duration-300 ease-[cubic-bezier(.22,1,.36,1)]" />
		<button v-for="tab in tabs" :key="tab.value" ref="btnRefs" type="button"
			class="relative z-10 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-[15px] font-semibold transition-colors duration-200"
			:class="tab.value === modelValue ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700'"
			@click="select(tab.value)">
			{{ tab.label }}
			<span v-if="tab.badge"
				class="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-amber-600 px-1.5 text-[11px] font-bold text-white">
				{{ tab.badge }}
			</span>
		</button>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	tabs: { label: string; value: string; badge?: number }[]
	modelValue: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const thumbRef = ref<HTMLElement | null>(null)
const btnRefs = ref<HTMLElement[]>([])

function select(value: string) {
	emit('update:modelValue', value)
}

function moveThumb() {
	const index = props.tabs.findIndex((t) => t.value === props.modelValue)
	const el = btnRefs.value[index]
	if (!thumbRef.value || !el) return
	thumbRef.value.style.width = `${el.offsetWidth}px`
	thumbRef.value.style.transform = `translateX(${el.offsetLeft - 4}px)`
}

onMounted(() => nextTick(moveThumb))
watch(() => props.modelValue, () => nextTick(moveThumb))
// A badge appearing or changing width shifts the tabs, so re-measure the thumb.
watch(() => props.tabs.map((t) => t.badge ?? 0).join(','), () => nextTick(moveThumb))
</script>
