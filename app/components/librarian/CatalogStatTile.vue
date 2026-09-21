<template>
	<div
		class="flex items-center gap-3.5 rounded-[18px] border border-stone-200 bg-white p-[18px] transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card">
		<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-[13px]" :class="toneClasses.bg">
			<Icon :name="icon" class="h-5 w-5" :class="toneClasses.text" />
		</div>
		<div>
			<p class="text-[28px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-stone-900">{{ value }}</p>
			<p class="mt-0.5 text-[13px] text-stone-500">{{ label }}</p>
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
