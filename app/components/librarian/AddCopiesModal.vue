<template>
	<LibrarianModalShell :open="open" size="lg" :title="added ? 'Copies Added' : confirming ? 'Confirm New Copies' : 'Add Book Copy'"
		:subtitle="added ? added.title : confirming ? 'Check the details before they go into the catalog.' : 'Log more copies of a book that\'s already in the catalog.'"
		:busy="busy" @close="emit('close')">
		<!-- Done: the copies are in the catalog, and their barcode labels are one tap away. -->
		<div v-if="added" class="space-y-4">
			<div class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
				<Icon name="i-tabler-circle-check" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
				<div class="min-w-0">
					<p class="text-[15px] font-semibold text-stone-900">{{ added.accessions.length }} {{ added.accessions.length === 1 ? 'copy' : 'copies' }} added</p>
					<p class="font-data text-[13px] text-stone-600">Accession no. {{ addedNumbers }}</p>
				</div>
			</div>
			<p class="text-[14px] leading-snug text-stone-600">Each copy needs a barcode label stuck on it before it can be scanned at checkout. Print them now, or later from the Book Catalog.</p>
		</div>

		<!-- Step 2: a summary of what is about to be added. It replaces the form in this same window (no second pop-up). -->
		<div v-else-if="confirming" class="space-y-4">
			<div class="rounded-xl bg-stone-50 px-4 py-3">
				<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Book</p>
				<p class="text-[15px] font-semibold text-stone-900">{{ pending?.title }}</p>
			</div>
			<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
				<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Copies to add</dt><dd class="font-semibold text-stone-900">{{ pending?.quantity }}</dd></div>
				<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Cost per copy</dt><dd class="font-semibold text-stone-900">{{ formatPeso(pending?.cost ?? 0) }}</dd></div>
				<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Total cost</dt><dd class="font-semibold text-stone-900">{{ formatPeso((pending?.cost ?? 0) * (pending?.quantity ?? 0)) }}</dd></div>
				<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Source of fund</dt><dd class="text-right font-semibold text-stone-900">{{ pending?.sourceOfFund }}</dd></div>
				<div v-if="pending?.remarks" class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Remarks</dt><dd class="text-right text-stone-900">{{ pending.remarks }}</dd></div>
			</dl>
			<p class="text-[13px] text-stone-500">Each copy gets the next accession number and its own barcode. This is recorded in the stock log.</p>
		</div>

		<div v-else class="space-y-4">
			<!-- Opened from a catalog row: the book is already known. -->
			<div v-if="book" class="rounded-xl bg-stone-50 px-4 py-3">
				<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Book</p>
				<p class="text-[15px] font-semibold text-stone-900">{{ book.title }}</p>
			</div>

			<div v-else>
				<label for="add-copies-book" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Book<FieldRequired /></label>
				<LibrarianSearchSelect v-model="picked" input-id="add-copies-book" placeholder="Search by title, author or ISBN"
					:fetcher="searchBooks" :get-label="(b: CatalogBook) => b.title" :get-sublabel="bookSublabel"
					:invalid="!!errors.book" />
				<p v-if="errors.book" class="mt-1 text-[12.5px] text-red-500">{{ errors.book }}</p>
			</div>

			<!-- How many, and what each one cost, side by side. -->
			<div class="grid items-start gap-4 sm:grid-cols-2">
				<LibrarianTextField id="add-copies-quantity" v-model="quantity" type="number" label="How many copies" :min="1" :max="50"
					:error="errors.quantity" hint="Each gets the next accession number and its own barcode."
					@update:model-value="errors.quantity = ''" />

				<LibrarianTextField id="add-copies-cost" v-model="cost" type="number" label="Cost per copy (₱)" :min="0" step="0.01"
					placeholder="0.00" :error="errors.cost" hint="Enter 0 for a donated copy."
					@update:model-value="errors.cost = ''" />
			</div>

			<!-- Where these copies came from. The source of fund and the cost are required; remarks are not. -->
			<LibrarianTextField id="add-copies-fund" v-model="sourceOfFund" label="Source of fund" :maxlength="255"
				placeholder="e.g. Library budget, Donation, Alumni gift" :error="errors.sourceOfFund"
				@update:model-value="errors.sourceOfFund = ''" />

			<LibrarianTextField id="add-copies-remarks" v-model="remarks" label="Remarks" optional :maxlength="1000"
				placeholder="e.g. Donated by the Class of 2025, or Purchase order #1042" />
		</div>

		<template #footer>
			<template v-if="added">
				<ButtonsButton variant="ghost" @click="emit('close')">Done</ButtonsButton>
				<ButtonsButton variant="primary" @click="emit('print', added.accessions)">
					<Icon name="i-tabler-printer" class="h-3.5 w-3.5" />Print {{ added.accessions.length === 1 ? 'label' : `${added.accessions.length} labels` }}
				</ButtonsButton>
			</template>
			<template v-else-if="confirming">
				<ButtonsButton variant="ghost" :disabled="busy" @click="confirming = false">Back</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="confirm">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
					Yes, add {{ pending?.quantity === 1 ? 'copy' : `${pending?.quantity} copies` }}
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="submit">
					<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5" />
					Review
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { librarianService, type CatalogBook } from '~/services/librarianService'
import { describeRanges, toRanges } from '~/utils/accessionRanges'

const props = defineProps<{
	open: boolean
	/** Set when opened from a catalog row; otherwise the librarian searches for the book. */
	book: { bookUuid: string; title: string } | null
	busy?: boolean
	/** Set once the copies are in: the window then shows what was added, with a button to print their labels. */
	added?: { title: string; accessions: number[] } | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	/** Print the barcode labels of the copies that were just added (their accession numbers). */
	(e: 'print', accessions: number[]): void
	(e: 'submit', payload: Payload): void
}>()

const picked = ref<CatalogBook | null>(null)
const quantity = ref<string | number>(1)
const sourceOfFund = ref('')
const cost = ref<string | number>('')
const remarks = ref('')
const errors = reactive({ book: '', quantity: '', sourceOfFund: '', cost: '' })

type Payload = { bookUuid: string; title: string; quantity: number; sourceOfFund: string; cost: number; remarks: string | undefined }

// Step 1 is the form; once it validates, `pending` holds what was typed and `confirming` swaps in the summary.
const confirming = ref(false)
const pending = ref<Payload | null>(null)
const addedNumbers = computed(() => describeRanges(toRanges(props.added?.accessions ?? [])))

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	confirming.value = false
	pending.value = null
	picked.value = null
	quantity.value = 1
	sourceOfFund.value = ''
	cost.value = ''
	remarks.value = ''
	errors.book = ''
	errors.quantity = ''
	errors.sourceOfFund = ''
	errors.cost = ''
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

	errors.sourceOfFund = sourceOfFund.value.trim() ? '' : 'Enter where the money for these copies came from.'

	// An empty box is not a cost of 0: it has to be typed (a donated copy is 0).
	const price = cost.value === '' ? NaN : Number(cost.value)
	errors.cost = Number.isFinite(price) && price >= 0 ? '' : 'Enter the cost of each copy (0 if it was donated).'

	if (!target || errors.quantity || errors.sourceOfFund || errors.cost) return

	pending.value = {
		bookUuid: target.bookUuid, title: target.title, quantity: n,
		sourceOfFund: sourceOfFund.value.trim(), cost: price, remarks: remarks.value.trim() || undefined,
	}
	confirming.value = true
}

function confirm() {
	if (pending.value) emit('submit', pending.value)
}
</script>
