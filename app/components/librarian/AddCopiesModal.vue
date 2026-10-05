<template>
	<LibrarianModalShell :open="open" size="sm" title="Add Book Copy"
		subtitle="Log more copies of a book that's already in the catalog." :busy="busy" @close="emit('close')">
		<div class="space-y-4">
			<!-- Opened from a catalog row: the book is already known. -->
			<div v-if="book" class="rounded-xl bg-stone-50 px-4 py-3">
				<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-400">Book</p>
				<p class="text-[15px] font-semibold text-stone-900">{{ book.title }}</p>
			</div>

			<div v-else>
				<label for="add-copies-book" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Book</label>
				<LibrarianSearchSelect v-model="picked" input-id="add-copies-book" placeholder="Search by title, author or ISBN"
					:fetcher="searchBooks" :get-label="(b: CatalogBook) => b.title" :get-sublabel="bookSublabel"
					:invalid="!!errors.book" />
				<p v-if="errors.book" class="mt-1 text-[12.5px] text-red-500">{{ errors.book }}</p>
			</div>

			<LibrarianTextField id="add-copies-quantity" v-model="quantity" type="number" label="How many copies" :min="1" :max="50"
				:error="errors.quantity" hint="Each one gets the next accession number and its own barcode."
				@update:model-value="errors.quantity = ''" />

			<LibrarianTextField id="add-copies-note" v-model="note" label="Note" optional
				placeholder="e.g. Donated by the Class of 2025, or Purchase order #1042" />
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				<Icon v-else name="i-tabler-plus" class="h-3.5 w-3.5" />
				Add {{ count === 1 ? 'copy' : `${count || ''} copies` }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { librarianService, type CatalogBook } from '~/services/librarianService'

const props = defineProps<{
	open: boolean
	/** Set when opened from a catalog row; otherwise the librarian searches for the book. */
	book: { bookUuid: string; title: string } | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { bookUuid: string; title: string; quantity: number; note: string | undefined }): void
}>()

const picked = ref<CatalogBook | null>(null)
const quantity = ref<string | number>(1)
const note = ref('')
const errors = reactive({ book: '', quantity: '' })

const count = computed(() => Number(quantity.value) || 0)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	picked.value = null
	quantity.value = 1
	note.value = ''
	errors.book = ''
	errors.quantity = ''
})
watch(picked, () => { errors.book = '' })

async function searchBooks(query: string) {
	const result = await librarianService.fetchBooks({ search: query || undefined, perPage: 8 })
	return result.data
}

const bookSublabel = (b: CatalogBook) =>
	`${b.authors.map((a) => a.name).join(', ') || 'Unknown author'} · ${b.copies.length} ${b.copies.length === 1 ? 'copy' : 'copies'}`

function submit() {
	const target = props.book ?? (picked.value ? { bookUuid: picked.value.uuid, title: picked.value.title } : null)
	errors.book = target ? '' : 'Choose a book.'

	const n = Number(quantity.value)
	errors.quantity = Number.isInteger(n) && n >= 1 && n <= 50 ? '' : 'Enter a whole number from 1 to 50.'
	if (!target || errors.quantity) return

	emit('submit', { bookUuid: target.bookUuid, title: target.title, quantity: n, note: note.value.trim() || undefined })
}
</script>
