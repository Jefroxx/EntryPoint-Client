<template>
	<LibrarianModalShell :open="open" size="sm" title="Edit Penalty" :subtitle="subtitle" :busy="busy" :dirty="dirty"
		discard-title="Discard Penalty Changes?"
		discard-text="The penalty stays as it was. The student is still charged the amount on record." ref="shell" @close="emit('close')">
		<div class="space-y-5">
			<div>
				<label for="edit-penalty-amount" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Amount (₱)</label>
				<input id="edit-penalty-amount" v-model="amount" type="text" inputmode="decimal" autocomplete="off" :disabled="accruing"
					class="font-data h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[14px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 disabled:bg-stone-50 disabled:text-stone-500"
					@input="amount = decimalOnly(String(amount), 2)" @keydown.enter.prevent="submit">
				<p class="mt-1.5 text-[12.5px] text-stone-500">
					<template v-if="accruing">This late fee is still running up until the book is back, so its amount can't be changed yet.</template>
					<template v-else>The student is told if the amount changes.</template>
				</p>
			</div>

			<div>
				<label for="edit-penalty-note" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Note <span class="font-normal text-stone-500">(optional)</span></label>
				<textarea id="edit-penalty-note" v-model="note" rows="3" maxlength="500" placeholder="Anything worth remembering about this penalty"
					class="w-full resize-none rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-[14.5px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
			</div>
			<p v-if="error" class="text-[12.5px] text-red-500">{{ error }}</p>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy || !dirty" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				Save Changes
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { isCopyPenalty, penaltyCopy, type PenaltyRecord } from '~/services/circulationService'

const props = defineProps<{
	open: boolean
	penalty: PenaltyRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { amount?: number; reason: string }): void
}>()

const shell = ref<{ requestClose: () => void } | null>(null)
const amount = ref('')
const note = ref('')
const error = ref('')

// A late fee whose book is still out keeps growing, so only its note can change.
const accruing = computed(() => !!props.penalty && !isCopyPenalty(props.penalty) && props.penalty.loan?.status !== 'Returned')
const subtitle = computed(() => props.penalty ? (penaltyCopy(props.penalty)?.book?.title ?? 'Late fee') : '')

watch(() => [props.open, props.penalty?.penaltyID], () => {
	amount.value = props.penalty ? Number(props.penalty.amount).toFixed(2) : ''
	note.value = props.penalty?.reason ?? ''
	error.value = ''
})

const dirty = computed(() => !!props.penalty && (
	(!accruing.value && Number(amount.value) !== Number(props.penalty.amount))
	|| note.value.trim() !== (props.penalty.reason ?? '').trim()
))

function submit() {
	if (!dirty.value || props.busy) return
	if (!accruing.value && !(Number(amount.value) > 0)) { error.value = 'Enter an amount above zero.'; return }
	emit('submit', { ...(accruing.value ? {} : { amount: Number(amount.value) }), reason: note.value.trim() })
}
</script>
