<template>
	<!-- A single row of book covers that scrolls sideways, for Home's cards (New arrivals, Recommended). Four show at a
		 time on a wide screen and the rest are a swipe or an arrow away; on a phone about two and a half show, so it is
		 clear the row continues. -->
	<div class="relative">
		<div ref="scroller" class="no-scrollbar -mx-5 flex snap-x scroll-pl-5 gap-4 overflow-x-auto px-5 pb-1 md:mx-0 md:scroll-pl-0 md:px-0" @scroll.passive="measure">
			<button v-for="book in books" :key="book.bookID" type="button"
				class="group w-[148px] shrink-0 snap-start rounded-2xl text-left focus-visible:outline-none md:w-[calc((100%-48px)/4)]"
				:aria-pressed="isSelected(book.bookID)" @click="emit('pick', book)">
				<span class="relative flex h-[200px] items-center justify-center rounded-2xl transition-shadow duration-200 group-focus-visible:ring-2 group-focus-visible:ring-accent-500"
					:class="isSelected(book.bookID) ? 'ring-2 ring-accent-500 ring-offset-2' : ''"
					:style="{ background: tint(book) }">
					<span v-if="showNew" class="absolute left-2.5 top-2.5 rounded-full bg-accent-500 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-white">New</span>
					<StudentCover :book="book" :width="112" class="transition-transform duration-300 ease-out group-hover:-translate-y-1.5" />
				</span>
				<span class="mt-2.5 block truncate px-0.5 text-[14px] font-semibold text-stone-900">{{ book.title }}</span>
				<span class="block truncate px-0.5 text-[12.5px] text-stone-500">{{ book.authors[0] ?? 'Unknown author' }}</span>
			</button>
		</div>

		<!-- Arrows, on a wide screen and only when there is more to see in that direction. -->
		<button v-if="canLeft" type="button" aria-label="Scroll back"
			class="absolute left-0 top-[100px] z-[1] hidden h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-card transition-[transform,background-color] duration-150 hover:bg-stone-50 active:scale-[0.96] md:flex"
			@click="scrollByPage(-1)">
			<Icon name="i-tabler-chevron-left" class="h-5 w-5" />
		</button>
		<button v-if="canRight" type="button" aria-label="Scroll forward"
			class="absolute right-0 top-[100px] z-[1] hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-card transition-[transform,background-color] duration-150 hover:bg-stone-50 active:scale-[0.96] md:flex"
			@click="scrollByPage(1)">
			<Icon name="i-tabler-chevron-right" class="h-5 w-5" />
		</button>
	</div>
</template>

<script setup lang="ts">
import type { CatalogBook } from '~/services/studentService'

const props = defineProps<{
	books: CatalogBook[]
	/** Which book the side panel is showing (it gets a ring). */
	isSelected: (bookID: number) => boolean
	/** The tinted tile behind a cover. */
	tint: (book: CatalogBook) => string
	/** A "New" tag in the corner of each cover. */
	showNew?: boolean
}>()

const emit = defineEmits<{ (e: 'pick', book: CatalogBook): void }>()

const scroller = ref<HTMLElement | null>(null)
const canLeft = ref(false)
const canRight = ref(false)

function measure() {
	const el = scroller.value
	if (!el) return
	canLeft.value = el.scrollLeft > 4
	canRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 4
}

// A page is the width on show: four books on a wide screen.
function scrollByPage(direction: 1 | -1) {
	const el = scroller.value
	if (!el) return
	el.scrollBy({ left: direction * el.clientWidth, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
}

onMounted(() => {
	measure()
	window.addEventListener('resize', measure)
})
onBeforeUnmount(() => window.removeEventListener('resize', measure))
// The books arrive after the first paint, and change when a librarian adds one.
watch(() => props.books.length, () => nextTick(measure))
</script>
