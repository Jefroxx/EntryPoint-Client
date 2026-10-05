<template>
	<!-- The Book Catalog: one row per copy, its accession number and status first, then the book's fuller record.
		 Wide on purpose; it scrolls sideways with the accession number and title pinned on the left. -->
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<div class="max-h-[520px] overflow-auto">
			<table class="w-full min-w-[1680px] border-collapse text-left">
				<thead>
					<tr>
						<th v-for="(col, i) in COLUMNS" :key="col"
							class="sticky top-0 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400"
							:class="i === 0 ? 'left-0 z-20 w-[92px]' : i === 1 ? 'left-[92px] z-20 border-r' : 'z-10'">{{ col }}</th>
						<th class="sticky top-0 z-10 border-b border-stone-100 bg-stone-50 px-4 py-3" />
					</tr>
				</thead>
				<tbody>
					<tr v-for="(copy, index) in copies" :key="copy.copyID" tabindex="0" @click="emit('view', copy)" @keydown.enter.self="emit('view', copy)"
						class="row-fade-in group cursor-pointer border-b border-stone-100 text-[14px] text-stone-600 last:border-0"
						:style="{ animationDelay: `${index * 30}ms` }">
						<!-- Pinned columns carry their own background so scrolled cells don't show through. -->
						<td class="font-data sticky left-0 z-[1] bg-white px-4 py-3 text-[14px] font-bold text-stone-900 group-hover:bg-accent-50">
							{{ copy.accessionNumber }}
						</td>
						<td class="sticky left-[92px] z-[1] min-w-[240px] max-w-[300px] border-r border-stone-100 bg-white px-4 py-3 group-hover:bg-accent-50">
							<button type="button" class="line-clamp-2 text-left text-[14.5px] font-semibold text-stone-900 hover:text-accent-600 hover:underline"
								@click="emit('view', copy)">{{ copy.book.title }}</button>
							<p v-if="copy.book.isbn" class="font-data text-[12px] text-stone-400">ISBN {{ copy.book.isbn }}</p>
						</td>
						<td class="px-4 py-3 group-hover:bg-accent-50">
							<LibrarianStatusPill :label="STATUS[copy.status].label" :tone="STATUS[copy.status].tone" />
						</td>
						<td class="max-w-[200px] px-4 py-3 group-hover:bg-accent-50">{{ copy.book.authors.join(', ') || '—' }}</td>
						<td class="whitespace-nowrap px-4 py-3 group-hover:bg-accent-50">
							<span v-if="copy.book.subject" class="inline-flex items-center gap-1.5 text-[13.5px] text-stone-700">
								<span class="h-2 w-2 shrink-0 rounded-[3px]" :style="{ backgroundColor: subjectSwatch(copy.book.subject.name) }" />
								{{ copy.book.subject.name }}
							</span>
							<span v-else class="text-stone-300">—</span>
						</td>
						<td class="font-data whitespace-nowrap px-4 py-3 text-[13.5px] group-hover:bg-accent-50">{{ copy.book.callNumber }}</td>
						<td class="whitespace-nowrap px-4 py-3 group-hover:bg-accent-50">{{ areaLabel(copy.book.areaOfLibrary) }}</td>
						<td class="whitespace-nowrap px-4 py-3 group-hover:bg-accent-50">{{ copy.book.edition || '—' }}</td>
						<td class="whitespace-nowrap px-4 py-3 group-hover:bg-accent-50">{{ copy.book.volume || '—' }}</td>
						<td class="max-w-[200px] px-4 py-3 group-hover:bg-accent-50">{{ copy.book.publisher || '—' }}</td>
						<td class="px-4 py-3 tabular-nums group-hover:bg-accent-50">{{ copy.book.publicationYear ?? '—' }}</td>
						<td class="px-4 py-3 tabular-nums group-hover:bg-accent-50">{{ copy.book.pages ?? '—' }}</td>
						<td class="whitespace-nowrap px-4 py-3 group-hover:bg-accent-50">{{ copy.book.sourceOfFund || '—' }}</td>
						<td class="whitespace-nowrap px-4 py-3 tabular-nums group-hover:bg-accent-50">{{ copy.book.cost != null ? formatPeso(copy.book.cost) : '—' }}</td>
						<td class="whitespace-nowrap px-4 py-3 group-hover:bg-accent-50">{{ copy.book.shelfLocation || '—' }}</td>
						<td class="font-data whitespace-nowrap px-4 py-3 text-[12.5px] text-stone-400 group-hover:bg-accent-50">{{ copy.barcodeValue || '—' }}</td>
						<td class="px-4 py-3 group-hover:bg-accent-50" @click.stop>
							<div class="flex items-center justify-end gap-1">
								<ButtonsButton variant="icon" size="sm" :aria-label="`Add another copy of ${copy.book.title}`"
									title="Add a copy of this book" class="!text-emerald-600 hover:!bg-emerald-50" @click="emit('add-copy', copy)">
									<Icon name="i-tabler-circle-plus" class="h-[18px] w-[18px]" />
								</ButtonsButton>
								<ButtonsButton variant="icon" size="sm" :aria-label="`Remove accession no. ${copy.accessionNumber}`"
									:title="copy.status === 'borrowed' ? 'Out on loan: check it in first' : 'Remove this copy'"
									class="!text-red-500 hover:!bg-red-50" @click="emit('remove-copy', copy)">
									<Icon name="i-tabler-circle-minus" class="h-[18px] w-[18px]" />
								</ButtonsButton>
								<LibrarianRowMenu :items="COPY_MENU" :label="`More actions for accession no. ${copy.accessionNumber}`"
									@select="(key: string) => onMenu(key, copy)" />
							</div>
						</td>
					</tr>

					<tr v-if="!loading && copies.length === 0">
						<td :colspan="COLUMNS.length + 1" class="py-10 text-center text-[15px] text-stone-400">
							{{ filtered ? 'No copies match these filters.' : 'No copies in the catalog yet.' }}
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<LibrarianLoadingOverlay :loading="loading" />
	</div>
</template>

<script setup lang="ts">
import { LIBRARY_AREAS, type CopyCatalogRow, type CopyStatus, type LibraryArea } from '~/services/librarianService'

defineProps<{
	copies: CopyCatalogRow[]
	loading: boolean
	/** Filters or a search are narrowing the list, so an empty table means "no match", not "no copies". */
	filtered?: boolean
}>()

const emit = defineEmits<{
	(e: 'view' | 'edit-book' | 'edit-copy' | 'add-copy' | 'remove-copy', copy: CopyCatalogRow): void
}>()

// The row buttons add or remove a copy (logged in the stock log). The menu keeps the other edits: this copy's status
// (damaged / lost), and the book's own fields, which every copy shares.
const COPY_MENU = [
	{ key: 'edit-copy', label: 'Edit this copy', icon: 'i-tabler-pencil' },
	{ key: 'view', label: 'View book details', icon: 'i-tabler-eye' },
	{ key: 'edit-book', label: 'Edit book', icon: 'i-tabler-book' },
] as const

function onMenu(key: string, copy: CopyCatalogRow) {
	if (key === 'view' || key === 'edit-book' || key === 'edit-copy') emit(key, copy)
}

const COLUMNS = [
	'Acc. No.', 'Title', 'Status', 'Author', 'Category', 'Call No.', 'Area of the library', 'Edition', 'Volume',
	'Publisher', 'Year', 'Pages', 'Source of fund', 'Cost', 'Shelf', 'Barcode',
] as const

const STATUS: Record<CopyStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
	available: { label: 'On the shelf', tone: 'success' },
	borrowed: { label: 'Borrowed', tone: 'warning' },
	damaged: { label: 'Damaged', tone: 'danger' },
	lost: { label: 'Lost', tone: 'danger' },
}

function areaLabel(area: LibraryArea | null): string {
	return area ? LIBRARY_AREAS[area] ?? area : '—'
}
</script>
