<template>
	<LibrarianTableShell :columns="['Category', 'Dewey code', 'Books', '']" :loading="loading" :empty="subjects.length === 0"
		empty-text="No categories match your search." min-width="640px">
		<!-- Phones: one card per row, with the row's buttons on it. -->
		<template #cards>
			<li v-for="subject in subjects" :key="`card-${subject.subjectID}`">
				<div role="button" tabindex="0" class="px-4 py-3.5 transition-colors active:bg-accent-50" @click="selected = subject" @keydown.enter.self="selected = subject">
					<div class="flex items-center justify-between gap-3">
						<div class="flex min-w-0 items-center gap-2.5 text-[15px] font-semibold text-stone-900">
							<span class="h-2.5 w-2.5 shrink-0 rounded-[3px]" :style="{ backgroundColor: subjectSwatch(subject.name) }" />
							<span class="truncate">{{ subject.name }}</span>
						</div>
						<span class="shrink-0 text-[13px] text-stone-500"><b class="text-[15px] tabular-nums text-stone-900">{{ subject.books_count }}</b> {{ subject.books_count === 1 ? 'book' : 'books' }}</span>
					</div>
					<div class="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
						<div class="h-full rounded-full bg-accent-500" :style="{ width: `${maxBooks ? (subject.books_count / maxBooks) * 100 : 0}%` }" />
					</div>
					<div class="mt-2.5 flex items-center justify-between gap-2" @click.stop>
						<p class="font-data text-[12.5px] text-stone-400">{{ subject.classificationCode ? `Dewey ${subject.classificationCode}` : 'No Dewey code' }}</p>
						<div class="flex items-center gap-1.5">
							<ButtonsButton variant="ghost" size="sm" @click="emit('edit', subject)">Edit</ButtonsButton>
							<ButtonsButton variant="danger" size="sm" :disabled="subject.books_count > 0" @click="emit('delete', subject)">Delete</ButtonsButton>
						</div>
					</div>
				</div>
			</li>
		</template>
		<tr v-for="(subject, index) in subjects" :key="subject.subjectID" tabindex="0" @click="selected = subject" @keydown.enter.self="selected = subject"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:style="{ animationDelay: `${index * 35}ms` }">
			<td class="px-4 py-3">
				<div class="flex items-center gap-2.5 text-[15px] font-semibold text-stone-900">
					<span class="h-2.5 w-2.5 shrink-0 rounded-[3px]" :style="{ backgroundColor: subjectSwatch(subject.name) }" />
					{{ subject.name }}
				</div>
			</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ subject.classificationCode ?? '—' }}</td>
			<td class="px-4 py-3">
				<div class="flex items-center gap-3">
					<span class="min-w-[18px] font-bold tabular-nums text-stone-900">{{ subject.books_count }}</span>
					<div class="h-1.5 w-28 overflow-hidden rounded-full bg-stone-100">
						<div class="h-full rounded-full bg-accent-500 transition-[width] duration-500 ease-out"
							:style="{ width: `${maxBooks ? (subject.books_count / maxBooks) * 100 : 0}%` }" />
					</div>
				</div>
			</td>
			<td class="px-4 py-3" @click.stop>
				<div class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="ghost" size="sm" @click="emit('edit', subject)">Edit</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" :disabled="subject.books_count > 0"
						:title="subject.books_count > 0 ? `Can't delete — ${subject.books_count} book${subject.books_count > 1 ? 's' : ''} still use this category` : undefined"
						@click="emit('delete', subject)">
						Delete
					</ButtonsButton>
				</div>
			</td>
		</tr>
	<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Category details" :title="selected?.name ?? ''"
			:subtitle="selected?.classificationCode ? `Dewey ${selected.classificationCode}` : undefined"
			:fields="fields" @close="selected = null">
			<!-- The books that carry this category; tap one for its details. -->
			<section class="mt-6" aria-labelledby="category-books-heading">
				<h4 id="category-books-heading" class="mb-2 flex items-center justify-between text-[12px] font-bold uppercase tracking-wide text-stone-400">
					Books in this category<span class="tabular-nums">{{ selected?.books_count ?? 0 }}</span>
				</h4>
				<p v-if="booksLoading" class="rounded-xl bg-stone-50 px-4 py-5 text-center text-[13.5px] text-stone-500">Loading books…</p>
				<p v-else-if="booksError" class="rounded-xl bg-red-50 px-4 py-5 text-center text-[13.5px] text-red-700">Couldn't load the books. Close this and try again.</p>
				<p v-else-if="!categoryBooks.length" class="rounded-xl bg-stone-50 px-4 py-5 text-center text-[13.5px] text-stone-500">No books use this category yet.</p>
				<ul v-else class="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200">
					<li v-for="book in categoryBooks" :key="book.uuid">
						<button type="button" class="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent-50 focus-visible:bg-accent-50 focus-visible:outline-none"
							@click="viewBook(book)">
							<StudentCover :book="book" :width="32" />
							<span class="min-w-0 flex-1">
								<span class="block truncate text-[14px] font-semibold text-stone-900">{{ book.title }}</span>
								<span class="block truncate text-[12.5px] text-stone-500">{{ book.authors.length ? book.authors.map((a) => a.name).join(', ') : 'No author listed' }}</span>
							</span>
							<span class="shrink-0 text-right text-[12px] leading-tight text-stone-500">
								<b class="block text-[14px] tabular-nums" :class="onShelf(book) === 0 ? 'text-red-500' : 'text-stone-900'">{{ onShelf(book) }}/{{ book.copies.length }}</b>on shelf
							</span>
						</button>
					</li>
				</ul>
				<p v-if="categoryBooksTotal > categoryBooks.length" class="mt-2 text-[12.5px] text-stone-500">
					Showing {{ categoryBooks.length }} of {{ categoryBooksTotal }}. Use the button below to see them all.
				</p>
			</section>

			<template v-if="selected && selected.books_count > 0" #footer>
				<ButtonsButton variant="primary" class="w-full" @click="showAll">
					<Icon name="i-tabler-books" class="h-4 w-4" />Show all in Accession Record
				</ButtonsButton>
			</template>
		</LibrarianRecordDrawer>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { SubjectRecord } from '~/services/subjectService'
import { librarianService, type CatalogBook } from '~/services/librarianService'

const props = defineProps<{
	subjects: SubjectRecord[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'edit', subject: SubjectRecord): void
	(e: 'delete', subject: SubjectRecord): void
	/** A book in the open category was tapped. */
	(e: 'view-book', book: CatalogBook): void
	/** "Show all in Accession Record" for the open category. */
	(e: 'show-books', subject: SubjectRecord): void
}>()

const maxBooks = computed(() => Math.max(0, ...props.subjects.map((s) => s.books_count)))
const selected = ref<SubjectRecord | null>(null)

// The books of the category whose drawer is open, loaded when it opens (the first 50; the button shows the rest).
const categoryBooks = ref<CatalogBook[]>([])
const categoryBooksTotal = ref(0)
const booksLoading = ref(false)
const booksError = ref(false)

watch(selected, async (subject) => {
	categoryBooks.value = []
	categoryBooksTotal.value = 0
	booksError.value = false
	if (!subject) return
	booksLoading.value = true
	try {
		const page = await librarianService.fetchBooks({ subjectID: subject.subjectID, perPage: 50 })
		// Ignore an answer for a category that is no longer the open one.
		if (selected.value?.subjectID !== subject.subjectID) return
		categoryBooks.value = page.data
		categoryBooksTotal.value = page.total
	} catch {
		if (selected.value?.subjectID === subject.subjectID) booksError.value = true
	} finally {
		if (selected.value?.subjectID === subject.subjectID) booksLoading.value = false
	}
})

/** Copies on the shelf and free to lend (not promised to an accepted reservation). */
const onShelf = (book: CatalogBook) => Math.max(0, book.copies.filter((c) => c.status === 'available').length - (book.heldCopies ?? 0))

function viewBook(book: CatalogBook) {
	selected.value = null
	emit('view-book', book)
}

function showAll() {
	const subject = selected.value
	selected.value = null
	if (subject) emit('show-books', subject)
}

const fields = computed(() => {
	const s = selected.value
	if (!s) return []
	return [
		{ label: 'Dewey code', value: s.classificationCode, mono: true },
		{ label: 'Books', value: s.books_count },
		{ label: 'Category ID', value: s.subjectID, mono: true },
		{ label: 'Can be deleted?', value: s.books_count > 0 ? `No, ${s.books_count} book${s.books_count > 1 ? 's' : ''} still use it` : 'Yes, nothing uses it', wide: true },
	]
})
</script>
