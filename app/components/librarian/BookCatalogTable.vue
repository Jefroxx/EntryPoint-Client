<template>
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<div class="max-h-[480px] overflow-auto">
			<table class="w-full min-w-[860px] border-collapse text-left">
				<thead>
					<tr>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Book</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Author</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Category</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Call No.</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Accession No.</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Copies</th>
						<th class="sticky top-0 z-10 border-b border-stone-100 bg-stone-50 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(book, index) in books" :key="book.bookID"
						class="row-enter border-b border-stone-100 opacity-0 transition-colors duration-150 last:border-0 hover:bg-stone-50"
						:style="{ animationDelay: `${index * 40}ms` }">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<div class="h-11 w-8 shrink-0 overflow-hidden rounded-[4px] bg-gradient-to-br from-accent-100 to-stone-200 shadow-sm">
									<img v-if="book.coverImageURL" :src="book.coverImageURL" alt="" class="h-full w-full object-cover" />
								</div>
								<div>
									<p class="text-[13.5px] font-semibold text-stone-900">{{ book.title }}</p>
									<p v-if="book.isbn" class="font-data text-[11px] text-stone-400">ISBN {{ book.isbn }}</p>
								</div>
							</div>
						</td>
						<td class="px-4 py-3 text-[13px] text-stone-600">{{ authorNames(book) }}</td>
						<td class="px-4 py-3">
							<span v-if="book.subject"
								class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-semibold text-stone-700"
								:style="{ backgroundColor: `${subjectSwatch(book.subject.name)}1f` }">
								<span class="h-2 w-2 shrink-0 rounded-[3px]" :style="{ backgroundColor: subjectSwatch(book.subject.name) }" />
								{{ book.subject.name }}
							</span>
							<span v-else class="text-stone-300">—</span>
						</td>
						<td class="font-data px-4 py-3 text-[12.5px] text-stone-500">{{ book.callNumber }}</td>
						<td class="font-data px-4 py-3 text-[12.5px] text-stone-500">{{ primaryAccession(book) }}</td>
						<td class="px-4 py-3 tabular-nums">
							<span class="font-bold" :class="availableCopies(book) === 0 ? 'text-red-500' : 'text-stone-900'">
								{{ availableCopies(book) }}
							</span>
							<span class="text-stone-400"> / {{ book.copies.length }}</span>
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center justify-end gap-1">
								<ButtonsButton variant="icon" size="sm" :aria-label="`Edit ${book.title}`">
									<Icon name="i-lucide-pencil" class="h-[15px] w-[15px]" />
								</ButtonsButton>
								<div class="relative">
									<ButtonsButton variant="icon" size="sm" aria-label="More actions" @click.stop="toggleMenu(book.bookID)">
										<Icon name="i-lucide-ellipsis-vertical" class="h-[15px] w-[15px]" />
									</ButtonsButton>
									<div class="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[150px] origin-top-right rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg transition-all duration-150"
										:class="openMenuId === book.bookID ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'">
										<button type="button" class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-stone-700 hover:bg-stone-50">
											<Icon name="i-lucide-eye" class="h-[14px] w-[14px] opacity-70" />View details
										</button>
										<button type="button" class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-red-500 hover:bg-red-50">
											<Icon name="i-lucide-trash-2" class="h-[14px] w-[14px] opacity-70" />Remove
										</button>
									</div>
								</div>
							</div>
						</td>
					</tr>

					<tr v-if="!loading && books.length === 0">
						<td colspan="7" class="py-10 text-center text-sm text-stone-400">No books match your search.</td>
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

const openMenuId = ref<number | null>(null)

function toggleMenu(bookID: number) {
	openMenuId.value = openMenuId.value === bookID ? null : bookID
}

function closeMenu() {
	openMenuId.value = null
}

onMounted(() => window.addEventListener('click', closeMenu))
onUnmounted(() => window.removeEventListener('click', closeMenu))

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
