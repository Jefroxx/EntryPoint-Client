<template>
	<div>
		<!-- What this list is, in a sentence, so nobody has to guess why a book is here. -->
		<div class="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3.5">
			<Icon name="i-tabler-info-circle" class="mt-0.5 h-[18px] w-[18px] shrink-0 text-amber-700" aria-hidden="true" />
			<p class="text-[14px] leading-snug text-amber-900">
				These books have a Dewey number nobody has checked: it was guessed from the category, or the book was added before real lookups.
				Students don't see these numbers and the shelf label says "Pending" until one is confirmed here. To confirm a book,
				tap <b>Look up</b>, type the right number and tap <b>Save</b>, or tap <b>This number is correct</b> if the number shown is already right.
			</p>
		</div>

		<div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
			<LibrarianSearchInput id="dewey-search" v-model="search" placeholder="Search title, ISBN or call number" />
			<div class="flex-1"></div>
			<ButtonsButton variant="ghost" :disabled="!lookable.length || bulkBusy" @click="lookUpAll">
				<Icon :name="bulkBusy ? 'i-tabler-loader-2' : 'i-tabler-search'" class="h-4 w-4" :class="{ 'animate-spin': bulkBusy }" />
				{{ bulkBusy ? `Looking up ${bulkDone} of ${lookable.length}…` : `Look up this page (${lookable.length})` }}
			</ButtonsButton>
		</div>

		<LibrarianCardSkeleton v-if="pending && !data" />

		<ul v-else-if="rows.length" class="grid gap-3 lg:grid-cols-2">
			<li v-for="book in rows" :key="book.uuid" class="rounded-2xl border border-stone-200 bg-white p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-[15px] font-semibold leading-snug text-stone-900">{{ book.title }}</p>
						<p class="mt-0.5 truncate text-[13px] text-stone-500">{{ book.authors.join(', ') || 'No author recorded' }}</p>
						<p class="mt-1 text-[12.5px] text-stone-500">
							<span v-if="book.isbn" class="font-data">ISBN {{ book.isbn }}</span>
							<span v-else class="font-medium text-stone-600">No ISBN, so it can't be looked up. Type the number.</span>
						</p>
					</div>
					<span class="shrink-0 rounded-lg bg-stone-100 px-2.5 py-1.5 text-center">
						<span class="block text-[10.5px] font-semibold uppercase tracking-wide text-stone-500">Now</span>
						<span class="font-data block text-[13px] font-semibold text-stone-700">{{ book.deweyNumber ?? '—' }}</span>
					</span>
				</div>

				<form class="mt-3.5 flex flex-wrap items-center gap-2" @submit.prevent="save(book)">
					<input v-model="typed[book.uuid]" type="text" inputmode="decimal" maxlength="14" placeholder="Correct number, e.g. 005.1"
						:aria-label="`Dewey number for ${book.title}`" :disabled="busy[book.uuid]"
						class="font-data h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-900 outline-none placeholder:font-sans placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200 sm:h-10"
						@input="notes[book.uuid] = ''" />
					<ButtonsButton type="submit" variant="primary" class="!h-11 sm:!h-10" :disabled="busy[book.uuid] || !typed[book.uuid]?.trim()">Save</ButtonsButton>
					<ButtonsButton v-if="book.isbn" variant="ghost" class="!h-11 sm:!h-10" :disabled="busy[book.uuid]" @click="lookUpOne(book)">
						<Icon :name="busy[book.uuid] ? 'i-tabler-loader-2' : 'i-tabler-search'" class="h-4 w-4" :class="{ 'animate-spin': busy[book.uuid] }" />Look up
					</ButtonsButton>
				</form>
				<!-- The current number can simply be right (a librarian knows it, or has just looked at the book): one tap confirms it. -->
				<ButtonsButton v-if="book.deweyNumber" variant="ghost" class="mt-3 w-full !h-11 !border-emerald-300 !bg-emerald-50 !text-emerald-800 hover:!bg-emerald-100 sm:!h-10"
					:disabled="busy[book.uuid]" @click="confirmCurrent(book)">
					<Icon name="i-tabler-circle-check" class="h-[18px] w-[18px]" />This number is correct: keep {{ book.deweyNumber }}
				</ButtonsButton>
				<p v-if="notes[book.uuid]" class="mt-2 text-[12.5px] leading-snug" :class="noteIsError[book.uuid] ? 'text-red-600' : 'text-stone-500'">{{ notes[book.uuid] }}</p>
			</li>
		</ul>

		<div v-else class="rounded-2xl border border-stone-200 bg-white px-4 py-12 text-center">
			<span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
				<Icon name="i-tabler-circle-check" class="h-6 w-6" />
			</span>
			<p class="mt-3 text-[16px] font-semibold text-stone-900">{{ search ? 'No books match your search.' : 'Every Dewey number has been checked.' }}</p>
			<p v-if="!search" class="mt-1 text-[14px] text-stone-500">New books get a number from the catalogues when they're added. Any it can't find will show up here.</p>
		</div>

		<LibrarianPagination v-if="data" class="mt-4" :shown="rows.length" :total="data.books.total" noun="books" :page="page" :last-page="data.books.last_page"
			@change="page = $event" />
	</div>
</template>

<script setup lang="ts">
import { librarianService, type DeweyReviewBook } from '~/services/librarianService'
import { useAlert } from '~/api/alert/useAlert'

const emit = defineEmits<{
	/** Something was confirmed, so counts elsewhere (the tab's badge, the catalog) are out of date. */
	(e: 'changed'): void
}>()

const alert = useAlert()
const search = ref('')
const page = ref(1)

const { data, pending, execute: refetch } = useLiveAsyncData(
	'dewey-review',
	() => librarianService.fetchDeweyReview({ search: search.value || undefined, page: page.value, perPage: 10 }),
	{ lazy: true },
)

const rows = computed(() => data.value?.books.data ?? [])
const lookable = computed(() => rows.value.filter((b) => !!b.isbn))

let timer: ReturnType<typeof setTimeout>
watch(search, () => {
	clearTimeout(timer)
	timer = setTimeout(() => { page.value = 1; void refetch() }, 300)
})
watch(page, () => void refetch())

// Per-book state: what was typed, which request is running, and the short line under the row.
const typed = reactive<Record<string, string>>({})
const busy = reactive<Record<string, boolean>>({})
const notes = reactive<Record<string, string>>({})
const noteIsError = reactive<Record<string, boolean>>({})

async function afterChange() {
	await refetch()
	emit('changed')
	// Confirming the last book on a page leaves it empty: step back to the previous one.
	if (!rows.value.length && page.value > 1) page.value--
}

async function lookUp(book: DeweyReviewBook, quiet = false): Promise<boolean> {
	busy[book.uuid] = true
	noteIsError[book.uuid] = false
	try {
		const result = await librarianService.lookupBookDewey(book.uuid)
		if (result.found) {
			if (!quiet) alert.success('Dewey number confirmed', result.message)
			return true
		}
		notes[book.uuid] = `${result.message} Type the number if you know it.`
		return false
	} catch (error: any) {
		noteIsError[book.uuid] = true
		notes[book.uuid] = apiErrorMessage(error, "Couldn't reach the catalogues. Try again in a moment.")
		return false
	} finally {
		busy[book.uuid] = false
	}
}

async function save(book: DeweyReviewBook) {
	const value = (typed[book.uuid] ?? '').trim()
	if (!/^\d{3}(\.\d{1,10})?$/.test(value)) {
		noteIsError[book.uuid] = true
		notes[book.uuid] = 'A Dewey number is three digits, then an optional decimal part, like 005 or 005.133.'
		return
	}
	busy[book.uuid] = true
	noteIsError[book.uuid] = false
	try {
		const result = await librarianService.setBookDewey(book.uuid, value)
		alert.success('Dewey number saved', result.message)
		delete typed[book.uuid]
		await afterChange()
	} catch (error: any) {
		alert.error('Could not save the number', apiErrorMessage(error))
	} finally {
		busy[book.uuid] = false
	}
}

/** "It's right as it is": the same number is saved as typed in by a person, which counts as checked. */
async function confirmCurrent(book: DeweyReviewBook) {
	if (!book.deweyNumber) return
	busy[book.uuid] = true
	try {
		const result = await librarianService.setBookDewey(book.uuid, book.deweyNumber)
		alert.success('Marked as checked', result.message)
		await afterChange()
	} catch (error: any) {
		alert.error('Could not confirm the number', apiErrorMessage(error))
	} finally {
		busy[book.uuid] = false
	}
}

async function lookUpOne(book: DeweyReviewBook) {
	if (await lookUp(book)) await afterChange()
}

// One at a time, with a pause: the catalogues publish no usage limits, so this goes gently.
const bulkBusy = ref(false)
const bulkDone = ref(0)

async function lookUpAll() {
	bulkBusy.value = true
	bulkDone.value = 0
	let found = 0
	const list = [...lookable.value]
	for (const book of list) {
		if (await lookUp(book, true)) found++
		bulkDone.value++
		await new Promise((resolve) => setTimeout(resolve, 400))
	}
	bulkBusy.value = false
	if (found) alert.success(`${found} of ${list.length} confirmed`, list.length - found ? `${list.length - found} still need a number typed in.` : undefined)
	else alert.error('No numbers found', 'The catalogues have none of these books. Type the numbers in by hand.')
	await afterChange()
}

// The "Look up" button on a single row.
defineExpose({ refetch })
</script>
