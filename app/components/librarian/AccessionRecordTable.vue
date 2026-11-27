<template>
	<div class="relative rounded-2xl">
		<!-- Too narrow for the table: one card per book; edit and the rest of the actions are on the card. -->
		<LibrarianCardSkeleton v-if="loading" />
		<ul v-else class="card-grid grid gap-3 sm:grid-cols-2 2xl:grid-cols-3 [&>li]:overflow-hidden [&>li]:rounded-2xl [&>li]:border [&>li]:border-stone-200 [&>li]:bg-white">
			<li v-for="book in books" :key="`card-${book.bookID}`">
				<div class="relative px-4 py-3.5 transition-colors active:bg-accent-50">
					<button type="button" class="card-cover" :aria-label="`Open ${book.title}`" @click="emit('view', book)" />
					<div class="card-body flex gap-3">
						<StudentCover :book="book" :width="48" />
						<div class="min-w-0 flex-1">
							<p class="line-clamp-2 break-words text-[15px] font-semibold leading-snug text-stone-900" :title="book.title">{{ book.title }}</p>
							<p class="break-words text-[13px] text-stone-500">{{ authorNames(book) }}</p>
							<span v-if="book.areaOfLibrary"
									class="mt-1.5 inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-[12px] font-semibold text-stone-700">{{ LIBRARY_AREAS[book.areaOfLibrary] ?? book.areaOfLibrary }}</span>
								<!-- Books brought in from the old accession record may lack details Add Book asks for; editing fills them in. -->
								<span v-if="book.missingDetails?.length"
									class="ml-1.5 mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[12px] font-semibold text-amber-800 ring-1 ring-amber-200"
									:title="`Missing: ${book.missingDetails.join(', ')}. Edit the book to fill them in.`">
									<Icon name="i-tabler-alert-circle" class="h-3 w-3" />Incomplete
								</span>

								<!-- Every number says what it is: the Dewey (call) number, the copies' accession numbers, how many are in. -->
								<dl class="mt-2 space-y-1 text-[13px]">
									<div class="flex items-baseline gap-2">
										<dt class="w-[88px] shrink-0 text-stone-500">Dewey no.</dt>
										<dd class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
											<span v-if="book.callNumber" class="font-data font-semibold text-stone-800">{{ book.callNumber }}</span>
											<span v-else class="text-stone-400">Not set</span>
											<span v-if="book.deweyStatus === 'needs_review'" class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-700" title="The Dewey number hasn't been verified yet">Unverified</span>
											<span v-else class="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700" title="The Dewey number has been verified">Verified</span>
										</dd>
									</div>
									<div class="flex items-baseline gap-2">
										<dt class="w-[88px] shrink-0 text-stone-500">Accession no.</dt>
										<dd class="font-data min-w-0 font-semibold tabular-nums text-stone-800" :title="accessionList(book)">{{ accessionSummary(book) }}</dd>
									</div>
									<div class="flex items-baseline gap-2">
										<dt class="w-[88px] shrink-0 text-stone-500">On the shelf</dt>
										<dd class="tabular-nums text-stone-500">
											<b :class="availableCopies(book) === 0 ? 'text-red-500' : 'text-stone-900'">{{ availableCopies(book) }}</b> of {{ book.copies.length }} {{ book.copies.length === 1 ? 'copy' : 'copies' }}
										</dd>
									</div>
								</dl>
						</div>
						<!-- Top right: the pencil, then the ⋮ menu in the corner. -->
						<div class="card-action -mr-1.5 -mt-1 flex shrink-0 items-start gap-0.5">
							<ButtonsButton variant="icon" size="sm" :aria-label="`Edit ${book.title}`" @click="emit('edit', book)">
								<Icon name="i-tabler-pencil" class="h-[15px] w-[15px]" />
							</ButtonsButton>
							<LibrarianRowMenu :items="BOOK_MENU" :label="`More actions for ${book.title}`" @select="(key: string) => onMenu(key, book)" />
						</div>
					</div>
				</div>
			</li>
		</ul>
		<p v-if="!loading && books.length === 0" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">
			{{ filtered ? 'No books match these filters.' : 'No books in the catalog yet.' }}
		</p>

	</div>
</template>

<script setup lang="ts">
import type { CatalogBook } from '~/services/librarianService'

const props = defineProps<{
	books: CatalogBook[]
	loading: boolean
	/** Filters or a search are narrowing the list, so an empty table means "no match", not "no books". */
	filtered?: boolean
}>()

const emit = defineEmits<{
	(e: 'view' | 'edit' | 'remove' | 'print-labels', book: CatalogBook): void
}>()


const BOOK_MENU = [
	{ key: 'view', label: 'View details', icon: 'i-tabler-eye' },
	{ key: 'edit', label: 'Edit book', icon: 'i-tabler-pencil' },
	{ key: 'print-labels', label: 'Print barcode labels', icon: 'i-tabler-printer' },
	{ key: 'remove', label: 'Remove', icon: 'i-tabler-trash', tone: 'danger', separator: true },
] as const

function onMenu(key: string, book: CatalogBook) {
	if (key === 'view' || key === 'edit' || key === 'remove' || key === 'print-labels') emit(key, book)
}

function authorNames(book: CatalogBook): string {
	return book.authors.length ? book.authors.map((a) => a.name).join(', ') : '—'
}

/** Accession numbers shown before a row folds the rest behind "+N more". */
const COLLAPSED_COUNT = 8

const COPY_TONE: Record<string, string> = {
	available: 'bg-stone-100 text-stone-700',
	borrowed: 'bg-amber-100 text-amber-800',
	damaged: 'bg-red-50 text-red-700',
	lost: 'bg-red-50 text-red-700 line-through',
}
const COPY_LABEL: Record<string, string> = { available: 'On the shelf', borrowed: 'Borrowed', damaged: 'Damaged', lost: 'Lost' }

const expanded = ref(new Set<number>())

function toggleExpanded(bookID: number) {
	const next = new Set(expanded.value)
	if (!next.delete(bookID)) next.add(bookID)
	expanded.value = next
}

function shownCopies(book: CatalogBook) {
	const sorted = [...book.copies].sort((a, b) => a.accessionNumber - b.accessionNumber)
	return expanded.value.has(book.bookID) ? sorted : sorted.slice(0, COLLAPSED_COUNT)
}

/** Accession numbers as ranges ("1–3, 5, 8–9"), so a book with many copies still fits on its card. */
const SUMMARY_GROUPS = 4

function accessionGroups(book: CatalogBook): string[] {
	const numbers = [...new Set(book.copies.map((c) => c.accessionNumber))].sort((a, b) => a - b)
	const groups: string[] = []
	for (let i = 0; i < numbers.length; i++) {
		let j = i
		while (j + 1 < numbers.length && numbers[j + 1] === numbers[j]! + 1) j++
		groups.push(j > i ? `${numbers[i]}–${numbers[j]}` : String(numbers[i]))
		i = j
	}
	return groups
}

function accessionSummary(book: CatalogBook): string {
	const groups = accessionGroups(book)
	if (!groups.length) return '—'
	return groups.length > SUMMARY_GROUPS ? `${groups.slice(0, SUMMARY_GROUPS).join(', ')} +${groups.length - SUMMARY_GROUPS} more` : groups.join(', ')
}

function accessionList(book: CatalogBook): string {
	const groups = accessionGroups(book)
	return groups.length ? `Accession no. ${groups.join(', ')}` : 'No copies'
}

function availableCopies(book: CatalogBook): number {
	return Math.max(0, book.copies.filter((c) => c.status === 'available').length - (book.heldCopies ?? 0))
}
</script>

<style scoped>
.row-enter {
	animation: catalogRowIn .4s cubic-bezier(.22,1,.36,1) forwards;
}

@keyframes catalogRowIn {
	to {
		opacity: 1;
	}
}

@media (prefers-reduced-motion: reduce) {
	.row-enter {
		animation: none !important;
		opacity: 1 !important;
	}
}
</style>
