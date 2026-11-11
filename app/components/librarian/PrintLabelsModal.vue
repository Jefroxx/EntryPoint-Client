<template>
	<LibrarianModalShell :open="open" size="xl" title="Print Barcode Labels"
		:subtitle="loading ? 'Gathering the labels…' : `${labels.length} ${labels.length === 1 ? 'label' : 'labels'} · ${pages.length} ${pages.length === 1 ? 'sheet' : 'sheets'}`"
		@close="emit('close')">
		<div class="grid gap-6 md:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
			<!-- Left: which labels, and how the sheet is laid out. Always shown, so the numbers can be changed while it reloads. -->
			<div class="min-w-0 space-y-4">
				<form autocomplete="off" @submit.prevent="applyNumbers">
					<label for="label-numbers" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Only these accession numbers <span class="font-normal text-stone-500">(optional)</span></label>
					<div class="flex gap-2">
						<input id="label-numbers" v-model="numbers" type="text" inputmode="text" spellcheck="false" placeholder="e.g. 1-20, 25, 30-35"
							class="font-data h-11 min-w-0 flex-1 rounded-[10px] border bg-white px-3 text-[14px] text-stone-900 outline-none placeholder:font-sans focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
							:class="numbersError ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="numbersError = ''" />
						<ButtonsButton type="submit" variant="ghost" :disabled="loading">Show</ButtonsButton>
					</div>
					<p v-if="numbersError" class="mt-1 text-[12.5px] text-red-500">{{ numbersError }}</p>
					<p v-else class="mt-1 text-[12.5px] leading-snug text-stone-500">
						Start to end, like <b class="font-semibold text-stone-700">1-20</b>, single numbers, like <b class="font-semibold text-stone-700">1, 2, 10</b>, or both. Blank prints everything chosen.
					</p>
				</form>

				<fieldset>
					<legend class="mb-2 text-[13.5px] font-semibold text-stone-800">What are you printing on?</legend>
					<div class="space-y-2">
						<label v-for="option in LAYOUT_LIST" :key="option.key"
							class="flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-2 transition-colors"
							:class="layoutKey === option.key ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-300' : 'border-stone-200 hover:bg-stone-50'">
							<input v-model="layoutKey" type="radio" name="label-layout" :value="option.key" class="mt-1 accent-accent-500" />
							<span class="min-w-0">
								<span class="block text-[14px] font-semibold text-stone-900">{{ option.name }}</span>
								<span class="block text-[12.5px] text-stone-500">{{ option.hint }}</span>
							</span>
						</label>
					</div>
				</fieldset>

				<div class="grid grid-cols-2 items-start gap-3">
					<div v-if="layout.paperChoice">
						<label for="label-paper" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Paper size</label>
						<select id="label-paper" v-model="paperKey"
							class="h-11 w-full rounded-[10px] border border-stone-200 bg-white px-2.5 text-[14px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200">
							<option v-for="(p, key) in PAPERS" :key="key" :value="key">{{ p.name }}</option>
						</select>
					</div>
					<div :class="layout.paperChoice ? '' : 'col-span-2'">
						<label for="label-start" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Start at label</label>
						<input id="label-start" v-model.number="startAt" type="number" min="1" :max="perPage"
							class="h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[14.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
					</div>
					<p class="col-span-2 -mt-1 text-[12.5px] leading-snug text-stone-500">Reusing a partly used sticker sheet? Start after the labels already taken (1 to {{ perPage }}).</p>
				</div>

				<p v-if="truncated" class="rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13px] leading-snug text-amber-900">
					More than {{ labels.length }} copies matched, so only the first {{ labels.length }} are included. Narrow it down with accession numbers or the filters.
				</p>
				<!-- Books whose Dewey number is only a guess from the category: their call number and Cutter lines are left blank so nobody
					 shelves by a wrong number. Printing the guess anyway is the librarian's call. -->
				<label v-if="unconfirmedCount || (loading && sawUnconfirmed)" class="flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors"
					:class="includeUnconfirmed ? 'border-amber-300 bg-amber-50' : 'border-stone-200 bg-stone-50 hover:bg-stone-100'">
					<input v-model="includeUnconfirmed" type="checkbox" class="mt-0.5 h-4 w-4 shrink-0 accent-accent-500" :disabled="loading" @change="reload" />
					<span class="min-w-0">
						<span class="block text-[13.5px] font-semibold text-stone-900">Print the unconfirmed call numbers too</span>
						<span class="mt-0.5 block text-[12.5px] leading-snug text-stone-600">
							{{ unconfirmedCount }} {{ unconfirmedCount === 1 ? 'label is' : 'labels are' }} for books whose Dewey number is only a guess from the category.
							{{ includeUnconfirmed ? 'Their guessed call number and Cutter are printed. They may be wrong, so check them before shelving.' : 'Left unticked, their call number and Cutter lines stay blank; the rest of the label still prints.' }}
						</span>
					</span>
				</label>
			</div>

			<!-- Right: the sheet as it will print (scaled down), one sheet at a time. -->
			<div class="min-w-0">
				<div v-if="loading" class="grid min-h-[320px] place-items-center text-[14px] text-stone-500">
					<span class="flex items-center gap-2"><Icon name="i-tabler-loader-2" class="h-4 w-4 animate-spin" />Gathering the labels…</span>
				</div>
				<div v-else-if="error" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{{ error }}</div>
				<p v-else-if="!labels.length" class="rounded-xl border border-stone-200 px-4 py-10 text-center text-[14px] text-stone-500">
					{{ numbers.trim() ? 'No copies have those accession numbers.' : 'There are no copies to print labels for.' }}
				</p>

				<template v-else>
					<div class="mb-2 flex items-center justify-between text-[13px] text-stone-500">
						<span>Preview · sheet {{ sheet + 1 }} of {{ pages.length }}</span>
						<div class="flex items-center gap-1">
							<ButtonsButton variant="icon" size="sm" aria-label="Previous sheet" :disabled="sheet <= 0" @click="sheet--">
								<Icon name="i-tabler-chevron-left" class="h-4 w-4" />
							</ButtonsButton>
							<ButtonsButton variant="icon" size="sm" aria-label="Next sheet" :disabled="sheet >= pages.length - 1" @click="sheet++">
								<Icon name="i-tabler-chevron-right" class="h-4 w-4" />
							</ButtonsButton>
						</div>
					</div>
					<div class="overflow-hidden rounded-xl border border-stone-200 bg-stone-100 p-3">
						<div class="mx-auto overflow-hidden bg-white shadow-sm" :style="{ width: `${previewW}px`, height: `${previewH}px` }">
							<div :style="{ transform: `scale(${PREVIEW_SCALE})`, transformOrigin: 'top left', width: `${paperSize.w}mm` }">
								<LibrarianBookLabelSheet :pages="[pages[sheet] ?? []]" :layout="layout" :paper="paper" />
							</div>
						</div>
					</div>
				</template>
			</div>
		</div>

		<!-- The printed copy: every sheet at full size, teleported to <body> so printOnly() can send just this to the printer. -->
		<AppTeleport>
			<div v-if="open && labels.length" ref="printCopy" class="print-only" aria-hidden="true">
				<component :is="'style'">{{ pageRule }}</component>
				<LibrarianBookLabelSheet :pages="pages" :layout="layout" :paper="paper" />
			</div>
		</AppTeleport>

		<template #footer>
			<ButtonsButton variant="ghost" @click="emit('close')">Close</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="loading || !labels.length" @click="print">
				<Icon name="i-tabler-printer" class="h-4 w-4" />Print {{ labels.length }} {{ labels.length === 1 ? 'label' : 'labels' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { CopyLabel } from '~/services/librarianService'
import { LABEL_LAYOUTS, PAPERS, labelsPerPage, paginateLabels, type LabelLayoutKey, type PaperKey } from '~/utils/labelLayouts'
import { parseAccessionRanges, type AccessionRange } from '~/utils/accessionRanges'

const props = defineProps<{
	open: boolean
	labels: CopyLabel[]
	loading?: boolean
	error?: string
	/** There were more copies than the limit, so only the first ones are in `labels`. */
	truncated?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	/** The librarian typed accession numbers (or cleared them: an empty list), or changed the unconfirmed-numbers choice: load the labels again. */
	(e: 'refine', ranges: AccessionRange[], options: { includeUnconfirmed: boolean }): void
}>()

const LAYOUT_LIST = Object.values(LABEL_LAYOUTS)
const STORAGE_KEY = 'entrypoint.labelLayout'
const PREVIEW_SCALE = 0.42
const MM = 3.7795 // CSS pixels per millimetre

const layoutKey = ref<LabelLayoutKey>('plain')
const paperKey = ref<PaperKey>('a4')
const startAt = ref(1)
const sheet = ref(0)
const printCopy = ref<HTMLElement | null>(null)

// Which copies, by accession number: "1-20, 25". Applied with Enter or Show.
const numbers = ref('')
const numbersError = ref('')

// Print the call number and Cutter of books whose Dewey number is only a guess? Off by default (those lines stay blank).
const includeUnconfirmed = ref(false)
// The numbers last applied, so ticking the box above reloads the same labels instead of whatever is half typed.
let appliedRanges: AccessionRange[] = []

function applyNumbers() {
	const { ranges, error } = parseAccessionRanges(numbers.value)
	numbersError.value = error
	if (error) return
	appliedRanges = ranges
	emit('refine', ranges, { includeUnconfirmed: includeUnconfirmed.value })
}

function reload() {
	emit('refine', appliedRanges, { includeUnconfirmed: includeUnconfirmed.value })
}

// The last layout used is remembered: a library tends to use the same sheets every time.
onMounted(() => {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
		if (saved?.layout in LABEL_LAYOUTS) layoutKey.value = saved.layout
		if (saved?.paper in PAPERS) paperKey.value = saved.paper
	} catch { /* private window: the defaults are fine */ }
})
watch([layoutKey, paperKey], () => {
	try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout: layoutKey.value, paper: paperKey.value })) } catch { /* optional */ }
})

const layout = computed(() => LABEL_LAYOUTS[layoutKey.value])
// A layout that is only for A4 sheets ignores the paper choice.
const paper = computed<PaperKey>(() => (layout.value.paperChoice ? paperKey.value : 'a4'))
const paperSize = computed(() => PAPERS[paper.value])
const perPage = computed(() => labelsPerPage(layout.value, paper.value))

const skip = computed(() => {
	const n = Number(startAt.value)
	return Number.isInteger(n) && n > 1 ? Math.min(n, perPage.value) - 1 : 0
})
const pages = computed(() => paginateLabels(props.labels, perPage.value, skip.value))

const previewW = computed(() => Math.round(paperSize.value.w * MM * PREVIEW_SCALE))
const previewH = computed(() => Math.round(paperSize.value.h * MM * PREVIEW_SCALE))
const unconfirmedCount = computed(() => props.labels.filter((l) => l.unconfirmed).length)
// While the labels reload after ticking the box, the box stays where it is instead of vanishing and coming back.
const sawUnconfirmed = ref(false)
watch(unconfirmedCount, (n) => { if (n > 0) sawUnconfirmed.value = true })

// The sheet the preview shows can't be past the last one; and a fresh set of labels starts at the top.
watch(pages, (list) => { if (sheet.value > list.length - 1) sheet.value = Math.max(0, list.length - 1) })
watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	sheet.value = 0
	startAt.value = 1
	numbers.value = ''
	numbersError.value = ''
	includeUnconfirmed.value = false
	sawUnconfirmed.value = false
	appliedRanges = []
})
watch([layoutKey, paperKey], () => { startAt.value = 1 })

// Sets the paper for the print job; the margin is 0 because each label's position is already measured from the edge.
const pageRule = computed(() => `@page { size: ${paperSize.value.w}mm ${paperSize.value.h}mm; margin: 0; }`)

function print() {
	printOnly(printCopy.value)
}
</script>
