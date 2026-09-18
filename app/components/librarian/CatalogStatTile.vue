<template>
	<div
		class="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
		<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="toneClasses.bg">
			<Icon :name="icon" class="h-[18px] w-[18px]" :class="toneClasses.text" />
		</div>
		<div>
			<p class="text-xl font-bold tabular-nums text-stone-900">{{ value }}</p>
			<p class="text-xs text-stone-500">{{ label }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	label: string
	value: string | number
	icon: string
	tone?: 'accent' | 'success' | 'warning' | 'danger'
}>()

const toneMap = {
	accent: { bg: 'bg-accent-100', text: 'text-accent-600' },
	success: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
	warning: { bg: 'bg-amber-100', text: 'text-amber-600' },
	danger: { bg: 'bg-red-100', text: 'text-red-600' },
}

const toneClasses = computed(() => toneMap[props.tone ?? 'accent'])
</script>
