<template>
	<LibrarianModalShell :open="open" size="xl" :title="title" :subtitle="confirming ? 'Check the changes before they are saved.' : copy?.book.title"
		:busy="busy" :dirty="dirty" ref="shell" @close="emit('close')">
		<!-- Step 2: what is about to change. It replaces the form in this same window (no second pop-up). -->
		<div v-if="confirming" class="space-y-4">
			<div class="rounded-xl bg-stone-50 px-4 py-3">
				<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Accession No. {{ copy?.accessionNumber }}</p>
				<p class="text-[15px] font-semibold text-stone-900">{{ copy?.book.title }}</p>
			</div>

			<div v-if="isRetiring" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
				<Icon name="i-tabler-alert-triangle" class="mt-0.5 h-4 w-4 shrink-0" />
				<p>This removes the copy from the catalog for good. Its accession number is never reused.</p>
			</div>
			<dl v-else class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
				<div v-for="change in changes" :key="change.label" class="px-4 py-2.5">
					<dt class="text-[12.5px] text-stone-500">{{ change.label }}</dt>
					<dd class="mt-0.5 flex flex-wrap items-center gap-x-2 text-stone-900">
						<span class="text-stone-500 line-through decoration-stone-300">{{ change.from }}</span>
						<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5 shrink-0 text-stone-400" />
						<span class="font-semibold">{{ change.to }}</span>
					</dd>
				</div>
			</dl>
		</div>

		<div v-else class="space-y-5">
			<!-- A copy out on loan changes its status only through check-in; its record can still be corrected. -->
			<div v-if="copy?.status === 'borrowed'" class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-800">
				<Icon name="i-tabler-clock" class="mt-0.5 h-4 w-4 shrink-0" />
				<p>This copy is out on loan. Its status changes when it's checked in at Circulation. You can still correct its cost, source of fund and remarks.</p>
			</div>

			<!-- Two columns on a wide window, so the whole form fits without scrolling. -->
			<fieldset v-else class="grid gap-2 sm:grid-cols-2">
				<legend class="mb-2 text-[13px] font-semibold text-stone-700 sm:col-span-2">Status<FieldRequired /></legend>
				<label v-for="option in OPTIONS" :key="option.value"
					class="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors"
					:class="status === option.value
						? option.value === 'retired' ? 'border-red-300 bg-red-50' : 'border-accent-300 bg-accent-50'
						: 'border-stone-200 hover:bg-stone-50'">
					<input v-model="status" type="radio" name="copy-status" :value="option.value" class="mt-1 accent-accent-500" />
					<span>
						<span class="block text-[14.5px] font-semibold" :class="option.value === 'retired' ? 'text-red-700' : 'text-stone-900'">{{ option.label }}</span>
						<span class="block text-[13px] text-stone-500">{{ option.hint }}</span>
					</span>
				</label>
			</fieldset>

			<!-- This copy's own record. Changing it here touches this copy only, not the book or its other copies. -->
			<div v-if="!isRetiring" class="space-y-4">
				<p class="text-[13px] font-semibold text-stone-700">This copy's record</p>
				<div class="grid items-start gap-4 sm:grid-cols-2">
					<LibrarianTextField id="edit-copy-cost" v-model="cost" type="number" label="Cost (₱)" :min="0" step="0.01"
						placeholder="0.00" :error="errors.cost" hint="Enter 0 for a donated copy."
						@update:model-value="errors.cost = ''" />
					<LibrarianTextField id="edit-copy-fund" v-model="sourceOfFund" label="Source of fund" :maxlength="255"
						placeholder="e.g. Library budget, Donation" :error="errors.sourceOfFund"
						@update:model-value="errors.sourceOfFund = ''" />
				</div>
				<LibrarianTextField id="edit-copy-remarks" v-model="remarks" label="Remarks" optional :maxlength="1000"
					placeholder="Anything worth remembering about this copy" />
			</div>
		</div>

		<template #footer>
			<template v-if="confirming">
				<ButtonsButton variant="ghost" :disabled="busy" @click="confirming = false">Back</ButtonsButton>
				<ButtonsButton variant="primary" :class="isRetiring ? '!border-red-500 !bg-red-500 hover:!bg-red-600' : ''"
					:disabled="busy" @click="confirm">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
					{{ isRetiring ? 'Yes, remove copy' : 'Yes, save changes' }}
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy || !hasChanges" @click="review">
					<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5" />
					Review
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { CopyCatalogRow, CopyStatus } from '~/services/librarianService'

type EditableStatus = Exclude<CopyStatus, 'borrowed'> | 'retired'
type Payload = { status?: EditableStatus; sourceOfFund?: string; cost?: number; remarks?: string | null }

const props = defineProps<{
	open: boolean
	copy: CopyCatalogRow | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: Payload): void
}>()

const OPTIONS: { value: EditableStatus; label: string; hint: string }[] = [
	{ value: 'available', label: 'On the shelf', hint: 'Can be borrowed.' },
	{ value: 'damaged', label: 'Damaged', hint: 'Kept in the catalog but not lent out until repaired.' },
	{ value: 'lost', label: 'Lost', hint: 'Missing. Set it back to On the shelf if it turns up.' },
	{ value: 'retired', label: 'Remove from catalog', hint: 'Retires this copy for good. Its accession number is not reused.' },
]
const STATUS_LABEL: Record<string, string> = { borrowed: 'Borrowed', ...Object.fromEntries(OPTIONS.map((o) => [o.value, o.label])) }

const status = ref<EditableStatus>('available')
const cost = ref<string | number>('')
const sourceOfFund = ref('')
const remarks = ref('')
const errors = reactive({ cost: '', sourceOfFund: '' })
const confirming = ref(false)

// What the catalog table shows for this copy: its own record, else the book's.
const original = computed(() => {
	const c = props.copy
	const rawCost = c ? (c.cost ?? c.book.cost) : null
	return {
		cost: rawCost == null || rawCost === '' ? null : Number(rawCost),
		sourceOfFund: (c?.sourceOfFund ?? c?.book.sourceOfFund ?? '').trim(),
		remarks: (c?.remarks ?? '').trim(),
	}
})

// What is typed in this window: closing it with changes asks "Discard Changes?" first (see ModalShell, useUnsavedChanges).
const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => [status.value, cost.value, sourceOfFund.value, remarks.value], () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen || !props.copy) return
	status.value = props.copy.status === 'borrowed' ? 'available' : props.copy.status
	cost.value = original.value.cost ?? ''
	sourceOfFund.value = original.value.sourceOfFund
	remarks.value = original.value.remarks
	errors.cost = ''
	errors.sourceOfFund = ''
	confirming.value = false
})

const isBorrowed = computed(() => props.copy?.status === 'borrowed')
const isRetiring = computed(() => !isBorrowed.value && status.value === 'retired')
const title = computed(() => confirming.value ? (isRetiring.value ? 'Confirm Removal' : 'Confirm Changes')
	: props.copy ? `Accession No. ${props.copy.accessionNumber}` : 'Edit Copy')

const statusChanged = computed(() => !isBorrowed.value && status.value !== props.copy?.status)
const costChanged = computed(() => {
	if (cost.value === '') return original.value.cost !== null
	return Number(cost.value) !== original.value.cost
})
const fundChanged = computed(() => sourceOfFund.value.trim() !== original.value.sourceOfFund)
const remarksChanged = computed(() => remarks.value.trim() !== original.value.remarks)

const hasChanges = computed(() => statusChanged.value || costChanged.value || fundChanged.value || remarksChanged.value)

const peso = (n: number | null) => n === null ? '—' : formatPeso(n)
const shown = (s: string) => s || '—'

const changes = computed(() => {
	const rows: { label: string; from: string; to: string }[] = []
	if (statusChanged.value) rows.push({ label: 'Status', from: STATUS_LABEL[props.copy?.status ?? ''] ?? '—', to: STATUS_LABEL[status.value] })
	if (costChanged.value) rows.push({ label: 'Cost', from: peso(original.value.cost), to: peso(Number(cost.value)) })
	if (fundChanged.value) rows.push({ label: 'Source of fund', from: shown(original.value.sourceOfFund), to: shown(sourceOfFund.value.trim()) })
	if (remarksChanged.value) rows.push({ label: 'Remarks', from: shown(original.value.remarks), to: shown(remarks.value.trim()) })
	return rows
})

function review() {
	if (isRetiring.value) { confirming.value = true; return }

	// A blank box is only a problem when it would erase a value the copy already has.
	const price = Number(cost.value)
	errors.cost = costChanged.value && (cost.value === '' || !Number.isFinite(price) || price < 0)
		? 'Enter the cost of this copy (0 if it was donated).' : ''
	errors.sourceOfFund = fundChanged.value && !sourceOfFund.value.trim() ? 'Enter where the money for this copy came from.' : ''
	if (errors.cost || errors.sourceOfFund) return

	confirming.value = true
}

function confirm() {
	if (isRetiring.value) { emit('submit', { status: 'retired' }); return }

	const payload: Payload = {}
	if (statusChanged.value) payload.status = status.value
	if (costChanged.value) payload.cost = Number(cost.value)
	if (fundChanged.value) payload.sourceOfFund = sourceOfFund.value.trim()
	if (remarksChanged.value) payload.remarks = remarks.value.trim() || null
	emit('submit', payload)
}
</script>
