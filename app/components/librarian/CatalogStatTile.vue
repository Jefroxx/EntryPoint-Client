<template>
	<component :is="to ? NuxtLink : 'div'" :to="to"
		class="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white p-3 transition-[transform,box-shadow] duration-200 ease-out sm:gap-3.5 sm:rounded-[18px] sm:p-[18px]"
		:class="to || interactive ? 'hover:-translate-y-0.5 hover:shadow-card' : ''">
		<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-[13px]" :class="toneClasses.bg">
			<Icon :name="icon" class="h-[18px] w-[18px] sm:h-5 sm:w-5" :class="toneClasses.text" />
		</div>
		<div class="min-w-0">
			<p class="truncate text-[22px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-stone-900 sm:text-[28px]" :title="String(value)">{{ value }}</p>
			<p class="mt-0.5 text-[12px] leading-tight text-stone-500 sm:text-[13px]">{{ label }}</p>
		</div>
	</component>
</template>

<script setup lang="ts">
/**
 * A number with a label. It only lifts on hover when it does something: `to` makes the whole tile a link, and
 * `interactive` is for a tile a parent wraps in its own button. A plain tile stays still, so it doesn't look clickable.
 */
const props = defineProps<{
	label: string
	value: string | number
	icon: string
	tone?: 'accent' | 'success' | 'warning' | 'danger'
	to?: string
	interactive?: boolean
}>()

const NuxtLink = resolveComponent('NuxtLink')

const toneMap = {
	accent: { bg: 'bg-accent-100', text: 'text-accent-600' },
	success: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
	warning: { bg: 'bg-amber-100', text: 'text-amber-600' },
	danger: { bg: 'bg-red-100', text: 'text-red-600' },
}

const toneClasses = computed(() => toneMap[props.tone ?? 'accent'])
</script>
