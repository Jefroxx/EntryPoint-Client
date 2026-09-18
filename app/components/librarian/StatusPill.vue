<template>
	<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold" :class="toneClasses.pill">
		<span class="h-1.5 w-1.5 rounded-full" :class="toneClasses.dot" />
		{{ label }}
	</span>
</template>

<script setup lang="ts">
const props = defineProps<{
	label: string
	tone?: 'info' | 'warning' | 'danger' | 'success' | 'neutral'
}>()

const toneMap = {
	info: { pill: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
	warning: { pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
	danger: { pill: 'bg-red-50 text-red-600', dot: 'bg-red-500' },
	success: { pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
	neutral: { pill: 'bg-stone-100 text-stone-500', dot: 'bg-stone-400' },
}

const toneClasses = computed(() => toneMap[props.tone ?? 'neutral'])
</script>
