<template>
	<div
		class="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white p-3 transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-card sm:gap-3.5 sm:rounded-[18px] sm:p-[18px]">
		<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-[13px]" :class="toneClasses.bg">
			<Icon :name="icon" class="h-[18px] w-[18px] sm:h-5 sm:w-5" :class="toneClasses.text" />
		</div>
		<div class="min-w-0">
			<p class="truncate text-[22px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-stone-900 sm:text-[28px]" :title="String(value)">{{ value }}</p>
			<p class="mt-0.5 text-[12px] leading-tight text-stone-500 sm:text-[13px]">{{ label }}</p>
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
