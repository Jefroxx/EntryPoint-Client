<template>
	<!-- The Book Catalog: one row per copy, its accession number and status first, then the book's fuller record.
		 Wide on purpose; it scrolls sideways with the accession number and title pinned on the left. -->
	<div class="relative rounded-2xl">
		<!-- Too narrow for the wide grid: one card per row, with the row's buttons on it. -->
		<LibrarianCardSkeleton v-if="loading" />

		<!-- Tick copies to print their barcode labels together (the toolbar's Print labels button). -->
		<label v-if="!loading && copies.length" class="mb-2.5 flex w-fit cursor-pointer items-center gap-2.5 text-[13.5px] font-medium text-stone-600">
			<input type="checkbox" class="h-[18px] w-[18px] accent-accent-500" :checked="allOnPage" :indeterminate="someOnPage && !allOnPage" @change="emit('toggle-page')" />
			Select all on this page
			<span v-if="selected.length" class="font-normal text-stone-500">· {{ selected.length }} selected</span>
		</label>

		<ul v-if="!loading" class="card-grid grid gap-3 sm:grid-cols-2 2xl:grid-cols-3 [&>li]:overflow-hidden [&>li]:rounded-2xl [&>li]:border [&>li]:border-stone-200 [&>li]:bg-white">
			<li v-for="copy in copies" :key="`card-${copy.copyID}`" :class="selected.includes(copy.uuid) ? '!border-accent-300 !bg-accent-50/50' : ''">
				<div class="relative px-4 py-3.5 transition-colors active:bg-accent-50">
					<button type="button" class="card-cover" :aria-label="`Open accession no. ${copy.accessionNumber}`" @click="detailUuid = copy.uuid" />
					<div class="card-body">
						<div class="flex items-center gap-3">
							<input type="checkbox" class="card-action h-[18px] w-[18px] shrink-0 cursor-pointer accent-accent-500" :checked="selected.includes(copy.uuid)"
								:aria-label="`Select accession no. ${copy.accessionNumber}`" @change="emit('toggle', copy)" />
							<!-- Which copy this is: its accession number, labelled, so it can't be mistaken for the Dewey number. -->
							<div class="flex shrink-0 flex-col items-center rounded-xl bg-stone-100 px-2.5 py-1.5 text-center leading-none">
								<span class="text-[10px] font-semibold uppercase tracking-wide text-stone-500">Acc. no.</span>
								<span class="font-data mt-1 text-[17px] font-bold text-stone-900">{{ copy.accessionNumber }}</span>
							</div>
							<span class="flex-1" />
							<LibrarianStatusPill :label="STATUS[copy.status].label" :tone="STATUS[copy.status].tone" class="shrink-0" />
							<!-- The three dots stay in the top right corner (their own click, so the card doesn't open). -->
							<div class="card-action -mr-1.5 shrink-0">
								<LibrarianRowMenu :items="COPY_MENU" :label="`More actions for accession no. ${copy.accessionNumber}`" @select="(key: string) => onMenu(key, copy)" />
							</div>
						</div>

						<!-- The title has the whole width of the card: beside the checkbox, the number, the status and the menu it was squeezed to a word a line. -->
						<div class="mt-2.5 min-w-0">
							<p class="line-clamp-2 break-words text-[15px] font-semibold leading-snug text-stone-900" :title="copy.book.title">{{ copy.book.title }}</p>
							<p class="break-words text-[13px] text-stone-500">{{ copy.book.authors.join(', ') || '—' }}</p>
						</div>

						<!-- Every value says what it is. -->
						<dl class="mt-3 space-y-1 text-[13px]">
							<div class="flex items-baseline gap-2">
								<dt class="w-[76px] shrink-0 text-stone-500">Dewey no.</dt>
								<dd class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
									<span v-if="copy.book.callNumber" class="font-data font-semibold text-stone-800">{{ copy.book.callNumber }}</span>
									<span v-else class="text-stone-400">Not set</span>
									<span v-if="copy.book.deweyStatus === 'needs_review'" class="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-700" title="The Dewey number hasn't been verified yet">Unverified</span>
									<span v-else class="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-emerald-700" title="The Dewey number has been verified">Verified</span>
								</dd>
							</div>
							<div class="flex items-baseline gap-2">
								<dt class="w-[76px] shrink-0 text-stone-500">Location</dt>
								<dd class="min-w-0 break-words font-semibold text-stone-800">{{ [areaLabel(copy.book.areaOfLibrary), copy.book.shelfLocation].filter((v) => v && v !== '—').join(' · ') || '—' }}</dd>
							</div>
							<div class="flex items-baseline gap-2">
								<dt class="w-[76px] shrink-0 text-stone-500">Barcode</dt>
								<dd class="font-data min-w-0 break-all font-semibold text-stone-800">{{ copy.barcodeValue || '—' }}</dd>
							</div>
						</dl>

						<!-- Only the buttons themselves stop the click; the empty part of this row opens the copy like the rest of the card. -->
						<div class="mt-3 flex items-center justify-end gap-2 border-t border-stone-100 pt-2.5">
							<div class="card-action flex items-center gap-2">
								<ButtonsButton variant="ghost" size="sm" class="!h-9 !px-3 !text-emerald-700 hover:!bg-emerald-50" title="Add another copy of this book"
									:aria-label="`Add another copy of ${copy.book.title}`" @click="emit('add-copy', copy)">
									<Icon name="i-tabler-plus" class="h-4 w-4" />Add copy
								</ButtonsButton>
								<ButtonsButton variant="ghost" size="sm" class="!h-9 !px-3" title="Change this copy's status, cost or remarks"
									:aria-label="`Edit accession no. ${copy.accessionNumber}`" @click="emit('edit-copy', copy)">
									<Icon name="i-tabler-pencil" class="h-4 w-4" />Edit
								</ButtonsButton>
							</div>
						</div>
					</div>
				</div>
			</li>
		</ul>
		<p v-if="!loading && copies.length === 0" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">{{ filtered ? 'No copies match these filters.' : 'No copies in the catalog yet.' }}</p>

		<!-- Pressing a copy shows that copy (accession no., barcode, status, where it came from), not the whole book; the book's own
			 record is one button away. -->
		<LibrarianCopyDetailDrawer :copy="detail" @close="detailUuid = null" @view-book="openBook" @edit-copy="editCopy" />

	</div>
</template>

<script setup lang="ts">
import { LIBRARY_AREAS, type CopyCatalogRow, type CopyStatus, type LibraryArea } from '~/services/librarianService'

const props = withDefaults(defineProps<{
	copies: CopyCatalogRow[]
	loading: boolean
	/** Filters or a search are narrowing the list, so an empty table means "no match", not "no copies". */
	filtered?: boolean
	/** The uuids of the copies ticked for printing labels. */
	selected?: string[]
}>(), { selected: () => [] })

const emit = defineEmits<{
	(e: 'view' | 'edit-book' | 'edit-copy' | 'add-copy' | 'remove-copy' | 'print-label' | 'report-penalty' | 'toggle', copy: CopyCatalogRow): void
	(e: 'toggle-page'): void
}>()

const allOnPage = computed(() => props.copies.length > 0 && props.copies.every((c) => props.selected.includes(c.uuid)))
const someOnPage = computed(() => props.copies.some((c) => props.selected.includes(c.uuid)))


// The card's buttons add a copy and edit this copy (status, cost, remarks). The menu keeps the rest: the book's own
// fields (which every copy shares), the barcode label, and removing the copy.
const COPY_MENU = [
	{ key: 'view', label: 'View book details', icon: 'i-tabler-eye' },
	{ key: 'edit-book', label: 'Edit book', icon: 'i-tabler-book' },
	{ key: 'print-label', label: 'Print barcode label', icon: 'i-tabler-printer' },
	{ key: 'report-penalty', label: 'Report lost or damaged', icon: 'i-tabler-gavel' },
	{ key: 'remove-copy', label: 'Remove this copy', icon: 'i-tabler-circle-minus', tone: 'danger', separator: true },
] as const

function onMenu(key: string, copy: CopyCatalogRow) {
	if (key === 'view' || key === 'edit-book' || key === 'edit-copy' || key === 'remove-copy' || key === 'print-label' || key === 'report-penalty') emit(key, copy)
}

const COLUMNS = [
	'Acc. No.', 'Title', 'Status', 'Author', 'Call No.', 'Area of the library', 'Edition', 'Volume',
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

/* ---------- Book copy detail: the copy that was pressed ---------- */
// Held by uuid and looked up in the list, so the drawer shows the fresh copy after it is edited and the list reloads.
const detailUuid = ref<string | null>(null)
const detail = computed(() => props.copies.find((c) => c.uuid === detailUuid.value) ?? null)


// The drawer hands over to the book view or the edit window (never two panels at once).
function openBook(copy: CopyCatalogRow) {
	detailUuid.value = null
	emit('view', copy)
}

function editCopy(copy: CopyCatalogRow) {
	detailUuid.value = null
	emit('edit-copy', copy)
}
</script>
