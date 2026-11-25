<template>
	<component :is="to ? NuxtLink : 'div'" :to="to"
		class="flex items-center gap-2.5 rounded-2xl border border-stone-200 bg-white p-3 transition-[transform,box-shadow] duration-200 ease-out sm:gap-3.5 sm:rounded-[18px] sm:p-[18px]"
		:class="[to || interactive ? 'hover:-translate-y-0.5 hover:shadow-card' : '', active ? 'ring-2 ring-accent-500' : '']">
		<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 sm:rounded-[13px]" :class="toneClasses.bg">
			<Icon :name="icon" class="h-[18px] w-[18px] sm:h-5 sm:w-5" :class="toneClasses.text" />
		</div>
		<!-- The column is a size container, so the number can be sized from the room it actually has and never wraps. -->
		<div class="stat-col min-w-0 flex-1">
			<p class="stat-value font-bold leading-tight tracking-[-0.02em] tabular-nums text-stone-900"
				:style="{ '--n': Math.max(String(value).length, 3) }" :title="String(value)">{{ value }}</p>
			<p class="mt-0.5 text-[12px] leading-tight text-stone-500 sm:text-[13px]">{{ label }}</p>
			<!-- What the number covers (a period), when that is not obvious. -->
			<p v-if="hint" class="mt-px text-[11px] leading-tight text-stone-400 sm:text-[11.5px]">{{ hint }}</p>
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
	/** A small line under the label, saying what the number covers ("Last 6 months"). */
	hint?: string
	/** The selected one of a row of filter tiles. The outline is drawn here, on the tile, so it lifts with it instead of being covered. */
	active?: boolean
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

<style scoped>
.stat-col { container-type: inline-size; }

/* About 0.62em per character for bold tabular figures: the text takes the column's width, up to its normal size. */
.stat-value {
	white-space: nowrap;
	font-size: clamp(12px, calc(158cqw / var(--n)), 22px);
}

@media (min-width: 640px) {
	.stat-value { font-size: clamp(12px, calc(158cqw / var(--n)), 28px); }
}
</style>
