<template>
	<!-- Scan ISBN for one book (the ⋮ menu on an Accession Record card): the librarian holds that book up to the camera
		 (or the phone, or types the number) and the catalogues fill what its record lacks, as Add Book's scan does.
		 Nothing is saved until "Save"; only empty fields are filled. Scan, review and the result stay in this one window. -->
	<LibrarianModalShell :open="open" size="lg" :title="phase === 'done' && saveError ? 'Not Saved' : TITLES[phase]" :subtitle="book?.title" :busy="phase === 'looking' || phase === 'saving'" @close="close">
		<!-- 1. Scan (or type) the ISBN. -->
		<div v-if="phase === 'scan' || phase === 'looking'" class="mx-auto max-w-[560px] space-y-4">
			<div v-if="phase === 'looking'" class="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3.5" aria-live="polite">
				<span class="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-stone-200 border-t-accent-500" />
				<p class="text-[14px] text-stone-700">Looking up <b class="font-data">{{ isbn }}</b> in the Library of Congress, Open Library and Google Books…</p>
			</div>
			<template v-else>
				<p v-if="book?.isbn" class="rounded-xl bg-stone-50 px-3.5 py-2.5 text-[13px] text-stone-600">
					This book already has ISBN <b class="font-data text-stone-800">{{ book.isbn }}</b>. A scan still fills what is missing; the ISBN on record stays.</p>
				<div v-show="!phoneOpen">
					<LibrarianCameraScanPanel :active="open && phase === 'scan' && !phoneOpen" format="isbn"
						hint="Hold the barcode on the back cover inside the box, about 10–15 cm away" @code="onScanned" />
				</div>
				<LibrarianPhoneScanner v-model:open="phoneOpen" :active="open && phase === 'scan'" @code="onScanned" />
			</template>

			<div v-show="phase === 'scan'">
				<label for="scanBookIsbn" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">No barcode, or it won't scan? Type the ISBN</label>
				<div class="flex gap-2">
					<input id="scanBookIsbn" v-model="isbn" type="text" inputmode="numeric" placeholder="978-0-000-00000-0" maxlength="20" autocomplete="off"
						class="font-data h-[42px] w-full rounded-xl border border-stone-200 bg-white px-3 text-[13.5px] text-stone-800 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
						@input="isbn = sanitizeIsbnInput(isbn)" @keydown.enter.prevent="lookUp" />
					<ButtonsButton variant="ghost" class="shrink-0" :disabled="!isbn.trim()" @click="lookUp">
						<Icon name="i-tabler-search" class="h-4 w-4" />Find
					</ButtonsButton>
				</div>
				<p v-if="scanError" class="mt-2 flex items-start gap-2 text-[13px] leading-snug text-red-600" aria-live="polite">
					<Icon name="i-tabler-alert-circle" class="mt-0.5 h-4 w-4 shrink-0" />{{ scanError }}</p>
			</div>
		</div>

		<!-- 2. What was found: saved only on "Save". -->
		<div v-else-if="phase === 'review' && result" class="mx-auto max-w-[560px] space-y-3.5">
			<div class="rounded-xl border px-4 py-3" :class="result.titleAgrees === false ? 'border-red-200 bg-red-50/50' : 'border-stone-200'">
				<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">ISBN {{ result.matched?.isbn }}</p>
				<template v-if="result.catalogueFound !== false && result.matched">
					<p class="mt-0.5 text-[15px] font-semibold text-stone-900">{{ result.matched.title || 'Untitled' }}</p>
					<p class="text-[13px] text-stone-600">{{ [result.matched.authors.slice(0, 3).join(', '), result.matched.publisher, result.matched.year].filter(Boolean).join(' · ') }}</p>
					<p v-if="result.titleAgrees === false" class="mt-2 flex items-start gap-2 text-[13px] text-red-700">
						<Icon name="i-tabler-alert-triangle" class="mt-0.5 h-4 w-4 shrink-0" />This title doesn't match "{{ book?.title }}". Make sure you scanned the right book before saving.</p>
					<label v-if="result.titleAgrees === false" class="mt-2 flex items-center gap-2 text-[13px] font-semibold text-stone-800">
						<input v-model="confirmedBook" type="checkbox" class="h-4 w-4 rounded border-stone-300 text-accent-600 focus:ring-accent-300" />Yes, this is the book in my hand</label>
				</template>
				<p v-else class="mt-1 text-[13.5px] text-stone-600">No catalogue knows this ISBN{{ fillsWithoutDewey.isbn ? ', so only the ISBN itself can be saved' : ', and the record already has it' }}. Fill in the rest by editing the book.</p>
			</div>

			<p v-if="result.recordIsbn" class="text-[13px] text-amber-800">The record already has ISBN <b class="font-data">{{ result.recordIsbn }}</b>, which is kept. Only the empty fields below are filled.</p>
			<p v-if="result.isbnTakenBy" class="text-[13px] text-red-600">This ISBN is already on "{{ result.isbnTakenBy }}", so it isn't added to this book.</p>

			<div v-if="chips.length">
				<p class="mb-1.5 text-[13px] font-semibold text-stone-700">Will be filled in</p>
				<div class="flex flex-wrap gap-1.5">
					<span v-for="chip in chips" :key="chip" class="rounded-md bg-stone-100 px-2 py-0.5 text-[12.5px] text-stone-700">{{ chip }}</span>
				</div>
			</div>
			<p v-else-if="!needsDewey && result.catalogueFound !== false" class="text-[13.5px] text-stone-600">The record already has everything the catalogue knows.</p>

			<!-- The Dewey number is required, so it is asked for here when the record has none that was checked. -->
			<div v-if="needsDewey" class="flex flex-wrap items-center gap-2">
				<label for="scanBookDewey" class="text-[13px] font-semibold text-stone-700">Dewey no.</label>
				<input id="scanBookDewey" v-model="dewey" type="text" inputmode="decimal" maxlength="14" placeholder="e.g. 005.1"
					class="font-data h-9 w-[130px] rounded-lg border px-2.5 text-[13.5px] outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
					:class="dewey && !deweyValid ? 'border-red-400 bg-red-50' : 'border-stone-200'" />
				<span class="text-[12.5px] text-stone-500">{{ result.fills?.deweyNumber ? 'Found in a library catalogue' : 'None found; type it if you know it' }}</span>
			</div>
		</div>

		<!-- 3. Saving. -->
		<div v-else-if="phase === 'saving'" class="flex flex-col items-center justify-center gap-3 py-10 text-center" aria-live="polite">
			<span class="h-7 w-7 animate-spin rounded-full border-[3px] border-stone-200 border-t-accent-500" />
			<p class="text-[15px] font-semibold text-stone-800">Saving…</p>
		</div>

		<!-- 4. Done. -->
		<div v-else-if="phase === 'done'" class="mx-auto max-w-[560px]">
			<div class="flex items-start gap-3 rounded-xl border px-4 py-3" :class="saveError ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'">
				<Icon :name="saveError ? 'i-tabler-alert-triangle' : 'i-tabler-circle-check'" class="mt-0.5 h-5 w-5 shrink-0" :class="saveError ? 'text-amber-600' : 'text-emerald-600'" />
				<div class="min-w-0">
					<p class="text-[15px] font-semibold text-stone-900">{{ saveError ? "The details weren't saved" : 'Book details saved' }}</p>
					<p class="text-[13.5px] text-stone-600">{{ saveError || (savedRefused ? `The ISBN was already another book's, so it wasn't added. The rest was saved.` : `"${book?.title}" now has what the catalogue found.`) }}</p>
				</div>
			</div>
		</div>

		<template #footer>
			<template v-if="phase === 'scan'">
				<ButtonsButton variant="ghost" @click="close">Cancel</ButtonsButton>
			</template>
			<template v-else-if="phase === 'review'">
				<ButtonsButton variant="ghost" class="mr-auto" @click="scanAgain"><Icon name="i-tabler-scan" class="h-3.5 w-3.5" />Scan Again</ButtonsButton>
				<ButtonsButton variant="ghost" @click="close">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="!canSave" @click="save"><Icon name="i-tabler-check" class="h-3.5 w-3.5" />Save Details</ButtonsButton>
			</template>
			<template v-else-if="phase === 'done'">
				<ButtonsButton v-if="saveError" variant="ghost" @click="phase = 'review'">Back</ButtonsButton>
				<ButtonsButton variant="primary" @click="close">Done</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { librarianService, type CatalogBook, type DetailsCheckResult, type DetailsFills } from '~/services/librarianService'

const props = defineProps<{ open: boolean; book: CatalogBook | null }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'saved'): void }>()

type Phase = 'scan' | 'looking' | 'review' | 'saving' | 'done'
const TITLES: Record<Phase, string> = { scan: 'Scan ISBN', looking: 'Scan ISBN', review: 'Check What Was Found', saving: 'Saving', done: 'Details Saved' }
const DEWEY_FORMAT = /^\d{3}(\.\d{1,10})?$/

const phase = ref<Phase>('scan')
const isbn = ref('')
const phoneOpen = ref(false)
const scanError = ref('')
const result = ref<DetailsCheckResult | null>(null)
const dewey = ref('')
const saveError = ref('')
const savedRefused = ref(false)
// A scan whose title disagrees with the record's (the wrong book picked up) is saved only after the librarian says so.
const confirmedBook = ref(false)

const needsDewey = computed(() => !!props.book && (!props.book.callNumber || props.book.deweyStatus === 'needs_review'))
const deweyValid = computed(() => DEWEY_FORMAT.test(dewey.value.trim()))
const fillsWithoutDewey = computed(() => {
	const f: DetailsFills = { ...(result.value?.fills ?? {}) }
	delete f.deweyNumber
	delete f.deweySource
	if (result.value?.isbnTakenBy) delete f.isbn
	return f
})
const canSave = computed(() => (result.value?.titleAgrees !== false || confirmedBook.value) && (Object.keys(fillsWithoutDewey.value).length > 0 || (needsDewey.value && deweyValid.value)))

const chips = computed(() => {
	const f = fillsWithoutDewey.value
	return [
		f.isbn && `ISBN ${f.isbn}`,
		f.authors?.length && `Author ${f.authors.slice(0, 2).join(', ')}`,
		f.publisher && `Publisher ${f.publisher}`,
		f.publicationYear && `Year ${f.publicationYear}`,
		f.pageCount && `${f.pageCount} pages`,
		f.edition && `Edition ${f.edition}`,
		f.volume && `Volume ${f.volume}`,
		f.coverImageURL && 'Cover picture',
	].filter(Boolean) as string[]
})

function onScanned(code: string) {
	if (phase.value !== 'scan') return
	const found = isbnFromBarcode(code) ?? normalizeIsbn(code)
	if (!found) {
		scanError.value = "That barcode isn't a book's ISBN. Scan the one on the back cover (its number starts with 978 or 979)."
		return
	}
	isbn.value = found
	void lookUp()
}

async function lookUp() {
	if (!props.book || !isbn.value.trim()) return
	scanError.value = ''
	phoneOpen.value = false
	phase.value = 'looking'
	try {
		const answer = await librarianService.checkBookDetails(props.book.uuid, isbn.value.trim())
		if (!answer.found) {
			scanError.value = answer.reason || 'Nothing was found for this ISBN.'
			phase.value = 'scan'
			return
		}
		result.value = answer
		dewey.value = answer.fills?.deweyNumber ?? ''
		phase.value = 'review'
	} catch (e) {
		scanError.value = apiErrorMessage(e, "The catalogues couldn't be reached. Try again.")
		phase.value = 'scan'
	}
}

async function save() {
	if (!props.book || !result.value || !canSave.value) return
	const fills: DetailsFills = { ...fillsWithoutDewey.value }
	if (needsDewey.value && deweyValid.value) {
		fills.deweyNumber = dewey.value.trim()
		// A number changed or typed here is the librarian's; one left as found keeps its catalogue.
		fills.deweySource = dewey.value.trim() === result.value.fills?.deweyNumber ? result.value.fills?.deweySource : 'manual'
	}
	phase.value = 'saving'
	saveError.value = ''
	try {
		const answer = await librarianService.applyBookDetails([{ book: props.book.uuid, fills }], [props.book.uuid])
		savedRefused.value = answer.refusedIsbns.length > 0
		emit('saved')
	} catch (e) {
		saveError.value = apiErrorMessage(e, 'The connection was lost. Try again.')
	}
	phase.value = 'done'
}

function scanAgain() {
	result.value = null
	confirmedBook.value = false
	isbn.value = ''
	scanError.value = ''
	phase.value = 'scan'
}

function close() {
	if (phase.value === 'looking' || phase.value === 'saving') return
	phoneOpen.value = false
	emit('close')
}

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	scanAgain()
	phoneOpen.value = false
	saveError.value = ''
	savedRefused.value = false
	dewey.value = ''
})
</script>
