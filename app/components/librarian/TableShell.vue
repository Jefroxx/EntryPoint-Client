<template>
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<!-- Phones: a table that offers a `cards` slot shows those cards instead of the table. -->
		<template v-if="$slots.cards">
			<ul class="divide-y divide-stone-100 sm:hidden">
				<slot name="cards" />
			</ul>
			<p v-if="empty && !loading" class="px-4 py-10 text-center text-[15px] text-stone-400 sm:hidden">{{ emptyText }}</p>
		</template>

		<div ref="scroller" class="max-h-[480px] overflow-auto" :class="$slots.cards ? 'max-sm:hidden' : ''" @scroll.passive="measure">
			<table class="shell-table w-full border-collapse text-left" :style="{ minWidth }">
				<thead>
					<tr>
						<th v-for="(column, index) in columns" :key="`${index}-${column}`"
							class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
							{{ column }}
						</th>
					</tr>
				</thead>
				<tbody>
					<slot />
					<tr v-if="empty && !loading">
						<td :colspan="columns.length" class="py-10 text-center text-[15px] text-stone-400">{{ emptyText }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- A soft fade on the right edge while there is more to swipe to. -->
		<div v-if="moreToRight" aria-hidden="true"
			class="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-stone-300/40 to-transparent"
			:class="$slots.cards ? 'max-sm:hidden' : ''" />

		<LibrarianLoadingOverlay :loading="loading" />
	</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	columns: string[]
	loading: boolean
	empty: boolean
	emptyText: string
	minWidth?: string
}>(), {
	minWidth: '760px',
})

const scroller = ref<HTMLElement | null>(null)
const moreToRight = ref(false)

function measure() {
	const el = scroller.value
	if (!el) return
	moreToRight.value = el.scrollWidth - el.clientWidth - el.scrollLeft > 4
}

// The table's width and its rows change as data loads, so re-measure then; on the next frame, to stay clear of
// the browser's "ResizeObserver loop" warning.
let observer: ResizeObserver | undefined
onMounted(() => {
	measure()
	if (!scroller.value) return
	observer = new ResizeObserver(() => requestAnimationFrame(measure))
	observer.observe(scroller.value)
	const table = scroller.value.querySelector('table')
	if (table) observer.observe(table)
})
onUnmounted(() => observer?.disconnect())
</script>

<style scoped>
/* Phones: the first column (who or what the row is about) stays in view while the rest scrolls sideways. */
@media (max-width: 639px) {
	.shell-table :deep(tr > :first-child:not([colspan])) {
		position: sticky;
		left: 0;
		background: #fff;
		box-shadow: 1px 0 0 #f0ebe4;
	}

	.shell-table :deep(thead tr > :first-child) {
		z-index: 20;
		background: #fafaf9;
	}

	.shell-table :deep(tbody tr > :first-child:not([colspan])) {
		z-index: 5;
	}
}
</style>
