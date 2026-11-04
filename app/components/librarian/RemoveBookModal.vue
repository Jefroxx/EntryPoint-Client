<template>
	<LibrarianModalShell :open="open" size="xl" :title="step === PAGES.length ? 'Confirm Removal' : 'Remove This Book?'"
		:subtitle="book?.title" :busy="busy" @close="emit('close')">
		<!-- Loading / error while the book's records are gathered. -->
		<div v-if="loading" class="grid min-h-[260px] place-items-center text-[14px] text-stone-500">
			<span class="flex items-center gap-2"><Icon name="i-tabler-loader-2" class="h-4 w-4 animate-spin" />Gathering everything tied to this book…</span>
		</div>
		<div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{{ loadError }}</div>

		<!-- A fixed minimum height, so the window does not jump in size from page to page. -->
		<div v-else-if="summary" class="min-h-[440px] space-y-5">
			<!-- The pages, one per kind of data. Every page is open from the start: nothing here is typed in. -->
			<ol class="grid grid-cols-2 gap-2.5 sm:grid-cols-4" aria-label="Pages">
				<li v-for="(page, i) in PAGES" :key="page.label" :aria-current="step === i + 1 ? 'step' : undefined">
					<button type="button" class="group w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200" @click="step = i + 1">
						<span class="block h-1 rounded-full transition-colors duration-300" :class="i + 1 <= step ? (summary.blockers.length && i + 1 === 2 ? 'bg-red-500' : 'bg-accent-500') : 'bg-stone-200'" />
						<span class="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-300"
							:class="step === i + 1 ? 'text-accent-600' : 'text-stone-700 group-hover:text-accent-600'">
							<Icon v-if="i === 1 && summary.blockers.length" name="i-tabler-alert-circle" class="h-3.5 w-3.5 text-red-500" />
							<span v-else class="tabular-nums">{{ i + 1 }}.</span>
							{{ page.label }}
							<span v-if="page.count(summary) !== null" class="font-normal text-stone-500">({{ page.count(summary) }})</span>
						</span>
					</button>
				</li>
			</ol>

			<!-- ===== 1. Copies ===== -->
			<div v-if="step === 1" class="space-y-3">
				<p class="text-[14px] text-stone-600">Every copy of this book still in the catalog. All of them are retired when the book is removed, and their accession numbers are never used again.</p>
				<div class="overflow-hidden rounded-xl border border-stone-200">
					<div v-for="copy in pageOfCopies" :key="copy.accessionNumber" class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-stone-100 px-4 py-2.5 text-[14px] last:border-0">
						<span class="font-data w-20 shrink-0 font-bold text-stone-900">No. {{ copy.accessionNumber }}</span>
						<LibrarianStatusPill :label="STATUS[copy.status]?.label ?? copy.status" :tone="STATUS[copy.status]?.tone ?? 'neutral'" />
						<span class="font-data text-[12.5px] text-stone-500">{{ copy.barcodeValue ?? '—' }}</span>
						<span class="ml-auto text-[13px] text-stone-600">{{ copy.cost != null ? formatPeso(copy.cost) : '—' }}<span v-if="copy.sourceOfFund" class="text-stone-500"> · {{ copy.sourceOfFund }}</span></span>
					</div>
					<p v-if="!summary.copies.items.length" class="px-4 py-6 text-center text-[14px] text-stone-500">No copies are left in the catalog.</p>
				</div>
				<LibrarianListPager v-model:page="copyPage" :total="summary.copies.items.length" :page-size="COPIES_PER_PAGE" />
				<p v-if="summary.copies.alreadyRemoved" class="text-[13px] text-stone-500">{{ summary.copies.alreadyRemoved }} more {{ summary.copies.alreadyRemoved === 1 ? 'copy was' : 'copies were' }} removed earlier.</p>
			</div>

			<!-- ===== 2. Loans & fines ===== -->
			<div v-else-if="step === 2" class="space-y-4">
				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">All loans</p><p class="text-[24px] font-bold text-stone-900">{{ summary.loans.total }}</p></div>
					<div class="rounded-xl px-4 py-3" :class="summary.loans.active.length ? 'bg-red-50' : 'bg-stone-50'"><p class="text-[12px] font-semibold uppercase tracking-wide" :class="summary.loans.active.length ? 'text-red-700' : 'text-stone-500'">Out right now</p><p class="text-[24px] font-bold" :class="summary.loans.active.length ? 'text-red-700' : 'text-stone-900'">{{ summary.loans.active.length }}</p></div>
					<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Returned</p><p class="text-[24px] font-bold text-stone-900">{{ summary.loans.returned }}</p></div>
				</div>

				<div v-if="summary.loans.active.length" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
					<p class="mb-2 flex items-center gap-2 text-[14px] font-semibold text-red-800"><Icon name="i-tabler-alert-circle" class="h-4 w-4" />Check these in first</p>
					<ul class="space-y-1 text-[14px] text-red-900">
						<li v-for="loan in summary.loans.active" :key="`${loan.studentID}-${loan.accessionNumber}`" class="flex flex-wrap gap-x-3">
							<span class="font-semibold">{{ loan.name }}</span>
							<span class="font-data text-[12.5px]">{{ loan.studentID }}</span>
							<span>copy no. {{ loan.accessionNumber }}</span>
							<span v-if="loan.dueDate" class="text-red-700">due {{ formatDate(loan.dueDate) }}</span>
						</li>
					</ul>
				</div>

				<div class="rounded-xl border border-stone-200 px-4 py-3 text-[14px]">
					<p class="mb-1 text-[13px] font-semibold text-stone-800">Fines on this book's copies</p>
					<p v-if="!summary.penalties.total" class="text-stone-500">No fines have been issued for it.</p>
					<p v-else class="text-stone-700">{{ summary.penalties.total }} {{ summary.penalties.total === 1 ? 'fine' : 'fines' }} on record<span v-if="summary.penalties.unpaidCount">, <b class="text-amber-700">{{ summary.penalties.unpaidCount }} unpaid ({{ formatPeso(summary.penalties.unpaidAmount) }})</b></span>.</p>
				</div>
			</div>

			<!-- ===== 3. Reservations & saves ===== -->
			<div v-else-if="step === 3" class="space-y-4">
				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Reservations</p><p class="text-[24px] font-bold text-stone-900">{{ summary.reservations.total }}</p></div>
					<div class="rounded-xl px-4 py-3" :class="summary.reservations.open.length ? 'bg-amber-50' : 'bg-stone-50'"><p class="text-[12px] font-semibold uppercase tracking-wide" :class="summary.reservations.open.length ? 'text-amber-800' : 'text-stone-500'">Still open</p><p class="text-[24px] font-bold" :class="summary.reservations.open.length ? 'text-amber-800' : 'text-stone-900'">{{ summary.reservations.open.length }}</p></div>
					<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Saved by students</p><p class="text-[24px] font-bold text-stone-900">{{ summary.wishlists }}</p></div>
				</div>

				<div v-if="summary.reservations.open.length" class="overflow-hidden rounded-xl border border-stone-200">
					<p class="border-b border-stone-100 bg-stone-50 px-4 py-2 text-[13px] font-semibold text-stone-700">Students waiting on this book: their reservations are cancelled and they are told</p>
					<div v-for="r in summary.reservations.open" :key="r.pickupCode" class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-stone-100 px-4 py-2.5 text-[14px] last:border-0">
						<span class="font-semibold text-stone-900">{{ r.name }}</span>
						<span class="font-data text-[12.5px] text-stone-500">{{ r.studentID }}</span>
						<LibrarianStatusPill :label="r.status === 'Accepted' ? 'Ready for pickup' : 'Waiting'" :tone="r.status === 'Accepted' ? 'success' : 'warning'" />
						<span class="font-data ml-auto text-[12.5px] text-stone-500">{{ r.pickupCode }}</span>
					</div>
				</div>
				<p v-else class="rounded-xl border border-stone-200 px-4 py-6 text-center text-[14px] text-stone-500">Nobody is waiting on this book.</p>
			</div>

			<!-- ===== 4. Confirm ===== -->
			<div v-else class="space-y-4">
				<div v-if="summary.blockers.length" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
					<Icon name="i-tabler-alert-circle" class="mt-0.5 h-4 w-4 shrink-0" />
					<div>
						<p v-for="blocker in summary.blockers" :key="blocker" class="font-semibold">{{ blocker }}</p>
						<button type="button" class="mt-1 text-[13px] font-semibold underline" @click="step = 2">See which ones</button>
					</div>
				</div>

				<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Copies retired</dt><dd class="font-semibold text-stone-900">{{ summary.copies.items.length }}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Past loans and fines</dt><dd class="text-right font-semibold text-stone-900">stay on students' records ({{ summary.loans.total }} {{ summary.loans.total === 1 ? 'loan' : 'loans' }})</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Open reservations</dt><dd class="text-right font-semibold" :class="summary.reservations.open.length ? 'text-amber-700' : 'text-stone-900'">{{ summary.reservations.open.length ? `${summary.reservations.open.length} cancelled, and those students are notified` : 'none' }}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Saved by students</dt><dd class="font-semibold text-stone-900">{{ summary.wishlists }}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Page photos</dt><dd class="font-semibold text-stone-900">{{ summary.pagePhotos }}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Stock log</dt><dd class="text-right font-semibold text-stone-900">{{ summary.stockLogCount }} {{ summary.stockLogCount === 1 ? 'entry' : 'entries' }} kept, plus one removal per copy</dd></div>
				</dl>

				<div class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
					<Icon name="i-tabler-alert-triangle" class="mt-0.5 h-4 w-4 shrink-0" />
					<p>"{{ summary.book.title }}" leaves the catalog and its copies are retired. This is recorded in the stock log.</p>
				</div>
			</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="step > 1 && summary ? step-- : emit('close')">{{ step > 1 && summary ? 'Back' : 'Cancel' }}</ButtonsButton>
			<ButtonsButton v-if="summary && step < PAGES.length" variant="primary" @click="step++">
				Next<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
			</ButtonsButton>
			<ButtonsButton v-else-if="summary" variant="primary" class="!border-red-500 !bg-red-500 hover:!bg-red-600"
				:disabled="busy || summary.blockers.length > 0" @click="emit('confirm')">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
				Yes, remove book
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { librarianService, type BookRemovalSummary } from '~/services/librarianService'

const props = defineProps<{
	open: boolean
	book: { uuid: string; title: string } | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'confirm'): void
}>()

// One page per kind of data, then the confirmation. `count` is the badge on the step bar.
const PAGES: { label: string; count: (s: BookRemovalSummary) => number | null }[] = [
	{ label: 'Copies', count: (s) => s.copies.items.length },
	{ label: 'Loans & fines', count: (s) => s.loans.total },
	{ label: 'Reservations & saves', count: (s) => s.reservations.total + s.wishlists },
	{ label: 'Confirm', count: () => null },
]

const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
	available: { label: 'On the shelf', tone: 'success' },
	borrowed: { label: 'Borrowed', tone: 'warning' },
	damaged: { label: 'Damaged', tone: 'danger' },
	lost: { label: 'Lost', tone: 'danger' },
}

const step = ref(1)
const summary = ref<BookRemovalSummary | null>(null)

// A long list is shown a few at a time, so the window never has to scroll.
const COPIES_PER_PAGE = 6
const copyPage = ref(1)
const pageOfCopies = computed(() => (summary.value?.copies.items ?? []).slice((copyPage.value - 1) * COPIES_PER_PAGE, copyPage.value * COPIES_PER_PAGE))
const loading = ref(false)
const loadError = ref('')

watch(() => [props.open, props.book?.uuid] as const, async ([isOpen, uuid]) => {
	if (!isOpen || !uuid) return
	step.value = 1
	copyPage.value = 1
	summary.value = null
	loadError.value = ''
	loading.value = true
	try {
		summary.value = await librarianService.fetchBookRemovalSummary(uuid)
	} catch (error: any) {
		loadError.value = error?.data?.message ?? "Couldn't load this book's records. Close this and try again."
	} finally {
		loading.value = false
	}
}, { immediate: true })
</script>
