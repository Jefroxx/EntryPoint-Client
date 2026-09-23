<template>
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<div class="max-h-[480px] overflow-auto">
			<table class="w-full min-w-[860px] border-collapse text-left">
				<thead>
					<tr>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Book</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Author</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Category</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Call No.</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Accession No.</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Copies</th>
						<th class="sticky top-0 z-10 border-b border-stone-100 bg-stone-50 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(book, index) in books" :key="book.bookID"
						class="row-enter border-b border-stone-100 opacity-0 transition-colors duration-150 last:border-0 hover:bg-accent-50"
						:style="{ animationDelay: `${index * 40}ms` }">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<div class="h-11 w-8 shrink-0 overflow-hidden rounded-[4px] bg-gradient-to-br from-accent-100 to-stone-200 shadow-sm">
									<img v-if="book.coverImageURL" :src="book.coverImageURL" alt="" class="h-full w-full object-cover" />
								</div>
								<div>
									<p class="text-[15px] font-semibold text-stone-900">{{ book.title }}</p>
									<p v-if="book.isbn" class="font-data text-[12px] text-stone-400">ISBN {{ book.isbn }}</p>
								</div>
							</div>
						</td>
						<td class="px-4 py-3 text-[14px] text-stone-600">{{ authorNames(book) }}</td>
						<td class="px-4 py-3">
							<span v-if="book.subject"
								class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-stone-700"
								:style="{ backgroundColor: `${subjectSwatch(book.subject.name)}1f` }">
								<span class="h-2 w-2 shrink-0 rounded-[3px]" :style="{ backgroundColor: subjectSwatch(book.subject.name) }" />
								{{ book.subject.name }}
							</span>
							<span v-else class="text-stone-300">—</span>
						</td>
						<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ book.callNumber }}</td>
						<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ primaryAccession(book) }}</td>
						<td class="px-4 py-3 tabular-nums">
							<span class="font-bold" :class="availableCopies(book) === 0 ? 'text-red-500' : 'text-stone-900'">
								{{ availableCopies(book) }}
							</span>
							<span class="text-stone-400"> / {{ book.copies.length }}</span>
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center justify-end gap-1">
								<ButtonsButton variant="icon" size="sm" :aria-label="`Edit ${book.title}`">
									<Icon name="i-tabler-pencil" class="h-[15px] w-[15px]" />
								</ButtonsButton>
								<LibrarianRowMenu :items="BOOK_MENU" />
							</div>
						</td>
					</tr>

					<tr v-if="!loading && books.length === 0">
						<td colspan="7" class="py-10 text-center text-[15px] text-stone-400">No books match your search.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<LibrarianLoadingOverlay :loading="loading" />
	</div>
</template>

<script setup lang="ts">
import type { CatalogBook } from '~/services/librarianService'

const props = defineProps<{
	books: CatalogBook[]
	loading: boolean
}>()

const BOOK_MENU = [
	{ key: 'view', label: 'View details', icon: 'i-tabler-eye' },
	{ key: 'edit', label: 'Edit book', icon: 'i-tabler-pencil' },
	{ key: 'remove', label: 'Remove', icon: 'i-tabler-trash', tone: 'danger', separator: true },
] as const

function authorNames(book: CatalogBook): string {
	return book.authors.length ? book.authors.map((a) => a.name).join(', ') : '—'
}

function primaryAccession(book: CatalogBook): string {
	return book.copies[0]?.accessionNumber ?? '—'
}

function availableCopies(book: CatalogBook): number {
	return book.copies.filter((c) => c.status === 'available').length
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
