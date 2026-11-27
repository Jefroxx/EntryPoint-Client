<template>
	<!-- Bringing in the library's accession record, all in this one window: choose the file, see what it will do,
		 import, done. Nothing is saved until "Import"; the check before it saves nothing. -->
	<LibrarianModalShell :open="open" size="lg" fixed-height :title="title" :subtitle="subtitle" :busy="stage === 'importing'" @close="close">
		<!-- 1. Choose the file. -->
		<div v-if="stage === 'pick'" class="space-y-4">
			<label for="import-file"
				class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-9 text-center transition-colors"
				:class="dragging ? 'border-accent-400 bg-accent-50' : 'border-stone-300 bg-stone-50 hover:border-accent-300 hover:bg-accent-50/50'"
				@dragover.prevent="dragging = true" @dragleave="dragging = false" @drop.prevent="onDrop">
				<span class="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-accent-600 ring-1 ring-stone-200">
					<Icon name="i-tabler-file-spreadsheet" class="h-5 w-5" />
				</span>
				<span class="text-[15px] font-semibold text-stone-900">Choose the Excel file</span>
				<span class="text-[13px] text-stone-500">or drop it here (.xlsx)</span>
				<input id="import-file" ref="fileInput" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="sr-only" @change="onPick" />
			</label>
			<p v-if="error" role="alert" class="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-[14px] text-red-700">{{ error }}</p>
			<div class="rounded-xl bg-stone-50 px-4 py-3 text-[13.5px] leading-relaxed text-stone-600">
				<p class="font-semibold text-stone-800">What the file needs</p>
				<p class="mt-1">One row per copy, with the column names in the first row. Only a <b>Title</b> column is needed; these are read when they are there:
					Number (accession no.), Date Received, Class, Author, Edition, Volumes, Pages, Source of Fund, Cost, Publisher, Year and Remarks.</p>
				<p class="mt-1.5">The area comes from the start of the Class (Fil, Cir, Ref, Fic...), and an ISBN typed in Remarks is used. Books keep their accession numbers. EntryPoint's own Excel export can be brought back in too.</p>
			</div>
		</div>

		<!-- 2. Reading the file and checking it with the server (nothing is saved). -->
		<div v-else-if="stage === 'checking'" class="flex h-full flex-col items-center justify-center gap-3 py-10 text-center" aria-live="polite">
			<span class="h-7 w-7 animate-spin rounded-full border-[3px] border-stone-200 border-t-accent-500" />
			<p class="text-[15px] font-semibold text-stone-800">{{ sheet ? `Checking ${formatCount(sheet.rows.length)} rows…` : 'Reading the file…' }}</p>
			<p class="text-[13px] text-stone-500">Nothing is saved yet.</p>
		</div>

		<!-- 3. What the import will do. -->
		<div v-else-if="stage === 'review' && check && sheet" class="space-y-3.5">
			<div class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
				<Icon name="i-tabler-books" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
				<div class="min-w-0">
					<p class="text-[15px] font-semibold text-stone-900">{{ formatCount(check.copies) }} {{ check.copies === 1 ? 'copy' : 'copies' }} ready to import</p>
					<p class="text-[13.5px] text-stone-600">
						{{ formatCount(check.books) }} new {{ check.books === 1 ? 'title' : 'titles' }}<template v-if="check.existingBooks">, and copies of {{ formatCount(check.existingBooks) }} {{ check.existingBooks === 1 ? 'title' : 'titles' }} already in the catalog</template>.
						Each copy keeps its accession number and gets a barcode.
					</p>
				</div>
			</div>

			<ul v-if="notes.length" class="divide-y divide-stone-100 rounded-xl border border-stone-200">
				<li v-for="note in notes" :key="note.text" class="flex items-start gap-3 px-4 py-2.5 text-[13.5px] text-stone-700">
					<Icon :name="note.icon" class="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
					<span><b class="font-semibold tabular-nums text-stone-900">{{ formatCount(note.count) }}</b> {{ note.text }}</span>
				</li>
			</ul>

			<div v-if="check.skipped.length" class="rounded-xl border border-stone-200">
				<button type="button" class="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13.5px] text-stone-700" :aria-expanded="showSkipped" @click="showSkipped = !showSkipped">
					<Icon name="i-tabler-ban" class="h-4 w-4 shrink-0 text-red-500" />
					<span class="flex-1"><b class="font-semibold tabular-nums text-stone-900">{{ formatCount(check.skipped.length) }}</b> {{ check.skipped.length === 1 ? 'row is' : 'rows are' }} left out. They can be added by hand.</span>
					<Icon name="i-tabler-chevron-down" class="h-4 w-4 text-stone-400 transition-transform" :class="{ 'rotate-180': showSkipped }" />
				</button>
				<ul v-if="showSkipped" class="max-h-[220px] divide-y divide-stone-100 overflow-y-auto border-t border-stone-100 [scrollbar-width:thin]">
					<li v-for="item in check.skipped" :key="`${item.row}-${item.accessionNumber}`" class="px-4 py-2 text-[13px]">
						<p class="text-stone-900"><span class="text-stone-500">Row {{ item.row ?? '?' }}<template v-if="item.accessionNumber"> · Acc. no. {{ item.accessionNumber }}</template></span><template v-if="item.title"> · {{ item.title }}</template></p>
						<p class="text-stone-500">{{ item.reason }}</p>
					</li>
				</ul>
			</div>

			<p class="text-[12.5px] text-stone-500">
				From <b class="font-semibold text-stone-700">{{ sheet.fileName }}</b>, sheet "{{ sheet.sheetName }}". Columns read: {{ sheet.columns.join(', ') }}.
				<template v-if="check.emptyRows"> {{ formatCount(check.emptyRows) }} rows with only an accession number (no book) are left out.</template>
			</p>
		</div>

		<!-- 4. Importing, a few hundred rows at a time. -->
		<div v-else-if="stage === 'importing'" class="flex h-full flex-col items-center justify-center gap-4 py-10 text-center" aria-live="polite">
			<p class="text-[15px] font-semibold text-stone-800">Importing… {{ formatCount(progress.copies) }} of {{ formatCount(check?.copies ?? 0) }} copies</p>
			<div class="h-2.5 w-full max-w-[360px] overflow-hidden rounded-full bg-stone-200" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
				<div class="h-full rounded-full bg-accent-500 transition-[width] duration-300" :style="{ width: `${percent}%` }" />
			</div>
			<p class="text-[13px] text-stone-500">Keep this window open until it finishes.</p>
		</div>

		<!-- 5. Done (or stopped part way, with what got in). -->
		<div v-else-if="stage === 'done'" class="space-y-3.5">
			<div class="flex items-start gap-3 rounded-xl border px-4 py-3" :class="error ? 'border-amber-200 bg-amber-50/60' : 'border-emerald-200 bg-emerald-50/60'">
				<Icon :name="error ? 'i-tabler-alert-triangle' : 'i-tabler-circle-check'" class="mt-0.5 h-5 w-5 shrink-0" :class="error ? 'text-amber-600' : 'text-emerald-600'" />
				<div class="min-w-0">
					<!-- A title whose copies came in two batches counts once: the check's count is the true one. -->
					<p class="text-[15px] font-semibold text-stone-900">{{ formatCount(progress.copies) }} {{ progress.copies === 1 ? 'copy' : 'copies' }}<template v-if="!error && check"> of {{ formatCount(check.books + check.existingBooks) }} {{ check.books + check.existingBooks === 1 ? 'title' : 'titles' }}</template> imported</p>
					<p v-if="error" class="text-[13.5px] text-stone-700">The import stopped: {{ error }} Import the same file again to bring in the rest; the copies already in are skipped.</p>
					<p v-else class="text-[13.5px] text-stone-600">They are in the Accession Record now. Books tagged <b>Incomplete</b> are missing details the record didn't have; edit one to fill them in.</p>
				</div>
			</div>
			<p class="text-[13.5px] leading-snug text-stone-600">Each copy has a new EntryPoint barcode. Print the labels from the Book Catalog when you are ready to stick them on.</p>
			<!-- The record rarely has ISBNs, publishers or pages: the online catalogues can fill those in now, or later
				 from the Check Details button on the Accession Record. -->
			<div v-if="progress.copies" class="flex items-start gap-3 rounded-xl border border-stone-200 px-4 py-3">
				<Icon name="i-tabler-world-search" class="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
				<p class="text-[13.5px] leading-snug text-stone-600">
					<b class="font-semibold text-stone-900">Fill in what's missing?</b> Check Details looks the new books up in the online catalogues
					(ISBN, publisher, year, pages, Dewey number) and lets you review before anything is saved. You can also do it later from the Check Details button.
				</p>
			</div>
		</div>

		<template #footer>
			<template v-if="stage === 'pick'">
				<ButtonsButton variant="ghost" @click="close">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" @click="fileInput?.click()">
					<Icon name="i-tabler-upload" class="h-3.5 w-3.5" />Choose File
				</ButtonsButton>
			</template>
			<template v-else-if="stage === 'review'">
				<ButtonsButton variant="ghost" @click="reset">
					<Icon name="i-tabler-arrow-left" class="h-3.5 w-3.5" />Another File
				</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="!check?.copies" @click="runImport">
					<Icon name="i-tabler-check" class="h-3.5 w-3.5" />Import {{ formatCount(check?.copies ?? 0) }} {{ check?.copies === 1 ? 'Copy' : 'Copies' }}
				</ButtonsButton>
			</template>
			<template v-else-if="stage === 'done'">
				<template v-if="progress.copies">
					<ButtonsButton variant="ghost" @click="close">Not Now</ButtonsButton>
					<ButtonsButton variant="primary" @click="emit('check-details')">
						<Icon name="i-tabler-world-search" class="h-3.5 w-3.5" />Check Details
					</ButtonsButton>
				</template>
				<ButtonsButton v-else variant="primary" @click="close">Done</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { librarianService, type ImportBookRow, type ImportBooksResult } from '~/services/librarianService'
import { readAccessionRecord, type AccessionSheet } from '~/utils/accessionImport'

const props = defineProps<{ open: boolean }>()
// check-details: the librarian chose to look the new books up now (the page closes this window and opens Check Details).
const emit = defineEmits<{ (e: 'close'): void; (e: 'imported'): void; (e: 'check-details'): void }>()

type Stage = 'pick' | 'checking' | 'review' | 'importing' | 'done'
const stage = ref<Stage>('pick')
const sheet = ref<AccessionSheet | null>(null)
const check = ref<ImportBooksResult | null>(null)
const error = ref('')
const dragging = ref(false)
const showSkipped = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const progress = reactive({ copies: 0, books: 0, existingBooks: 0 })

// A few hundred rows a request: small enough for the hosted server to finish each one well within its time limit.
const CHUNK = 250

const formatCount = (n: number) => n.toLocaleString('en-US')
const percent = computed(() => (check.value?.copies ? Math.min(100, Math.round((progress.copies / check.value.copies) * 100)) : 0))

const title = computed(() => ({ pick: 'Import From Excel', checking: 'Import From Excel', review: 'Check Before Importing', importing: 'Importing Books', done: 'Import Finished' }[stage.value]))
const subtitle = computed(() => (stage.value === 'pick' ? 'Bring books in from the accession record.' : sheet.value?.fileName))

const notes = computed(() => {
	const n = check.value?.notes
	if (!n) return []
	return [
		{ count: n.incomplete, icon: 'i-tabler-alert-circle', text: `${n.incomplete === 1 ? 'title is' : 'titles are'} missing details Add Book asks for (like the ISBN or publisher) and will be tagged Incomplete.` },
		{ count: n.noArea, icon: 'i-tabler-map-pin', text: `${n.noArea === 1 ? 'copy has' : 'copies have'} no area in the Class column and will go to Circulation.` },
		{ count: n.unreadCallNumber, icon: 'i-tabler-hash', text: `${n.unreadCallNumber === 1 ? 'call number' : 'call numbers'} couldn't be read. The text is kept in the book's remarks, and the book waits for a Dewey number.` },
		{ count: n.unreadDate, icon: 'i-tabler-calendar-question', text: `${n.unreadDate === 1 ? 'date received' : 'dates received'} couldn't be read (or were counted up by Excel). The text is kept in the copy's remarks.` },
		{ count: n.newNumbers, icon: 'i-tabler-number', text: `${n.newNumbers === 1 ? 'row has' : 'rows have'} no accession number and will get the next free one.` },
	].filter((note) => note.count > 0)
})

async function load(file: File | undefined) {
	if (!file) return
	error.value = ''
	if (!/\.xlsx$/i.test(file.name)) {
		error.value = 'Choose an Excel workbook (.xlsx). An older .xls file can be saved as .xlsx from Excel first.'
		return
	}
	stage.value = 'checking'
	sheet.value = null
	try {
		sheet.value = await readAccessionRecord(file)
		check.value = await librarianService.importBooks(sheet.value.rows, true, file.name)
		showSkipped.value = false
		stage.value = 'review'
	} catch (e) {
		error.value = e instanceof Error && !('data' in e) ? e.message : apiErrorMessage(e, "Couldn't read this file. Check that it's the accession record and try again.")
		stage.value = 'pick'
	}
}

const onPick = (event: Event) => load((event.target as HTMLInputElement).files?.[0])
function onDrop(event: DragEvent) {
	dragging.value = false
	void load(event.dataTransfer?.files?.[0])
}

async function runImport() {
	if (!sheet.value || !check.value) return
	// Only the rows the check said will come in: a row left out (a shared accession number) stays out.
	const left = new Set(check.value.skipped.map((s) => s.row))
	const rows: ImportBookRow[] = sheet.value.rows.filter((r) => r.title && !left.has(r.row))

	Object.assign(progress, { copies: 0, books: 0, existingBooks: 0 })
	error.value = ''
	stage.value = 'importing'
	try {
		for (let i = 0; i < rows.length; i += CHUNK) {
			const result = await librarianService.importBooks(rows.slice(i, i + CHUNK), false, sheet.value.fileName)
			progress.copies += result.copies
			progress.books += result.books
			progress.existingBooks += result.existingBooks
		}
	} catch (e) {
		error.value = apiErrorMessage(e, 'the connection was lost.')
	}
	stage.value = 'done'
	if (progress.copies) emit('imported')
}

function reset() {
	stage.value = 'pick'
	sheet.value = null
	check.value = null
	error.value = ''
	if (fileInput.value) fileInput.value.value = ''
}

function close() {
	if (stage.value === 'importing') return
	emit('close')
}

// Every time it opens, it starts at the file picker.
watch(() => props.open, (open) => { if (open) reset() })
</script>
