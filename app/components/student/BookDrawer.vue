<template>
	<StudentDrawer :open="open" title="Book details" @close="drawer.close()">
		<div v-if="book">
			<div class="-mx-4 -mt-5 flex justify-center px-4 pb-6 pt-6 md:-mx-5 md:px-5"
				:style="{ background: `linear-gradient(180deg, color-mix(in srgb, ${swatch} 20%, #fffbeb), #fffbeb)` }">
				<StudentCover :book="book" :width="140" />
			</div>

			<h3 class="dashboard-heading mt-2 text-[24px] font-extrabold leading-tight tracking-tight text-amber-900">{{ book.title }}</h3>
			<p class="mt-1 text-[14px] text-stone-500">{{ authorLine(book) }}</p>

			<dl class="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-1 text-[13.5px]">
				<div v-for="row in details" :key="row.label" class="flex justify-between gap-4 border-b border-stone-100 py-2.5 last:border-0">
					<dt class="text-stone-400">{{ row.label }}</dt>
					<dd class="text-right text-stone-800" :class="row.mono ? 'font-data text-[12.5px]' : ''">{{ row.value }}</dd>
				</div>
			</dl>

			<h4 class="mb-2.5 mt-6 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Availability</h4>
			<div class="rounded-2xl border border-stone-200 bg-white p-4">
				<div class="flex items-center justify-between gap-2">
					<b class="text-[14.5px] text-stone-900">
						{{ book.availableCopies ? `${book.availableCopies} of ${book.totalCopies} copies available` : 'All copies are out' }}
					</b>
					<StudentPill v-if="book.availableCopies" tone="good">Available</StudentPill>
					<StudentPill v-else tone="warn">{{ book.queueLength }} waiting</StudentPill>
				</div>
				<div class="mt-3 flex flex-wrap gap-[5px]">
					<i v-for="n in book.totalCopies" :key="n" class="h-2 w-6 rounded-full"
						:class="n <= book.availableCopies ? 'bg-emerald-500' : 'bg-stone-200'" />
				</div>
				<p class="mt-2.5 text-[12.5px] text-stone-400">
					{{ book.availableCopies
						? 'Reserve it and collect it at the desk once a librarian accepts.'
						: `Reserve to join the queue. You'd be #${book.queueLength + 1}.` }}
				</p>
			</div>
		</div>

		<StudentEmptyState v-else-if="failed" icon="i-lucide-book-x" title="Couldn't load this book"
			text="It may have been removed from the catalog.">
			<ButtonsButton variant="ghost" @click="load">Try again</ButtonsButton>
		</StudentEmptyState>

		<div v-else class="animate-pulse space-y-4" aria-busy="true">
			<div class="mx-auto h-[196px] w-[140px] rounded-xl bg-stone-200" />
			<div class="h-6 w-3/4 rounded-lg bg-stone-200" />
			<div class="h-24 rounded-2xl bg-stone-200" />
		</div>

		<template v-if="book" #footer>
			<StudentHeartButton :active="isWished(book.bookID)" class="border border-stone-200 bg-white" @toggle="toggleWish(book.bookID)" />
			<ButtonsButton v-if="isInCart(book.bookID)" variant="ghost" class="!h-[46px] flex-1 !border-accent-100 !bg-accent-100 !text-[15px] !text-accent-600"
				@click="drawer.open('cart')">
				<Icon name="i-lucide-check" class="h-4 w-4" />In cart · View cart
			</ButtonsButton>
			<ButtonsButton v-else class="!h-[46px] flex-1 !text-[15px]" @click="addToCart(book.bookID)">
				<Icon name="i-lucide-shopping-bag" class="h-4 w-4" />{{ book.availableCopies ? 'Add to cart' : 'Add to cart & join queue' }}
			</ButtonsButton>
		</template>
	</StudentDrawer>
</template>

<script setup lang="ts">
import { studentService, type CatalogBook } from '~/services/studentService'

const drawer = useDrawer()
const { isWished, isInCart, toggleWish, addToCart } = useStudent()

const open = computed(() => drawer.active.value?.kind === 'book')

// Keep the last book while the drawer slides out, so it doesn't go blank mid-exit.
const bookId = ref<number | null>(null)
watch(() => drawer.active.value, (active) => {
	if (active?.kind === 'book' && active.id) bookId.value = active.id
}, { immediate: true })

const book = ref<CatalogBook | null>(null)
const failed = ref(false)

async function load() {
	if (!bookId.value) return
	failed.value = false
	const id = bookId.value

	try {
		const { book: loaded } = await studentService.catalogBook(id)
		if (id === bookId.value) book.value = loaded
	} catch {
		if (id === bookId.value) failed.value = true
	}
}

watch(bookId, () => {
	book.value = null
	void load()
}, { immediate: true })

// Availability changes when the student adds to the cart etc. only through the shell, so a quick re-fetch on open keeps it honest.
watch(open, (isOpen) => { if (isOpen && book.value) void load() })

const swatch = computed(() => subjectSwatch(book.value?.subject?.name ?? book.value?.title ?? ''))

const details = computed(() => {
	const b = book.value
	if (!b) return []
	return [
		{ label: 'Subject', value: b.subject?.name ?? '—' },
		{ label: 'Call number', value: b.callNumber ?? '—', mono: true },
		{ label: 'Published', value: b.publicationYear ? String(b.publicationYear) : '—' },
		{ label: 'Where', value: b.shelfLocation ?? b.circulationType.charAt(0).toUpperCase() + b.circulationType.slice(1) },
	]
})
</script>
