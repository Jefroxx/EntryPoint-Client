<template>
	<!-- One copy of a book: its accession number, status, barcode and where it came from, not the whole book (the book's own
		 record is one button away). Used by the Book Catalog's cards and by the copies listed in a book's details.
		 Teleports to <body>; it lives where it is used only so that component keeps a single root element. -->
	<LibrarianRecordDrawer :open="!!copy" heading="Book copy detail" :title="copy?.book.title ?? ''"
		:subtitle="copy ? `Accession no. ${copy.accessionNumber}` : ''"
		:status="copy ? STATUS[copy.status] : undefined" :fields="fields" @close="emit('close')">
		<template #top>
			<LibrarianBarcodeImage :value="copy?.barcodeValue" class="mt-4" />
		</template>
		<template #footer>
			<ButtonsButton variant="ghost" class="flex-1" @click="emit('view-book', copy!)">
				<Icon name="i-tabler-eye" class="h-4 w-4" />View book details
			</ButtonsButton>
			<ButtonsButton variant="primary" class="flex-1" @click="emit('edit-copy', copy!)">
				<Icon name="i-tabler-pencil" class="h-4 w-4" />Edit this copy
			</ButtonsButton>
		</template>
	</LibrarianRecordDrawer>
</template>

<script setup lang="ts">
import { LIBRARY_AREAS, type CopyCatalogRow, type CopyStatus } from '~/services/librarianService'

const props = defineProps<{
	/** The copy to show; null keeps the panel closed. */
	copy: CopyCatalogRow | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'view-book' | 'edit-copy', copy: CopyCatalogRow): void
}>()

const STATUS: Record<CopyStatus, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
	available: { label: 'On the shelf', tone: 'success' },
	borrowed: { label: 'Borrowed', tone: 'warning' },
	damaged: { label: 'Damaged', tone: 'danger' },
	lost: { label: 'Lost', tone: 'danger' },
}

const fields = computed(() => {
	const copy = props.copy
	if (!copy) return []
	const book = copy.book
	const cost = copy.cost ?? book.cost
	return [
		{ label: 'Accession no.', value: copy.accessionNumber, mono: true },
		{ label: 'Source of fund', value: copy.sourceOfFund || book.sourceOfFund },
		{ label: 'Cost', value: cost != null ? formatPeso(cost) : null },
		{ label: 'Copy remarks', value: copy.remarks, wide: true },
		{ label: 'Author', value: book.authors.join(', '), wide: true },
		{ label: 'Call no.', value: book.callNumber, mono: true },
		{ label: 'Area of the library', value: book.areaOfLibrary ? LIBRARY_AREAS[book.areaOfLibrary] ?? book.areaOfLibrary : '—' },
		{ label: 'Shelf', value: book.shelfLocation },
		{ label: 'ISBN', value: book.isbn, mono: true },
		{ label: 'Edition', value: book.edition },
		{ label: 'Volume', value: book.volume },
		{ label: 'Publisher', value: book.publisher },
		{ label: 'Year', value: book.publicationYear },
	]
})
</script>
