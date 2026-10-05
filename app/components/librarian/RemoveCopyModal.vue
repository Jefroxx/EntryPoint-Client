<template>
	<LibrarianModalShell :open="open" size="sm" :title="copy ? `Remove Accession No. ${copy.accessionNumber}` : 'Remove Copy'"
		:subtitle="copy?.book.title" :busy="busy" @close="emit('close')">
		<!-- A copy out on loan only leaves through check-in. -->
		<div v-if="copy?.status === 'borrowed'" class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-800">
			<Icon name="i-tabler-clock" class="mt-0.5 h-4 w-4 shrink-0" />
			<p>This copy is out on loan. Check it in at Circulation first, then remove it.</p>
		</div>

		<div v-else class="space-y-4">
			<fieldset class="space-y-2">
				<legend class="mb-2 text-[13px] font-semibold text-stone-700">Why is it being removed?</legend>
				<label v-for="option in OPTIONS" :key="option.value"
					class="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors"
					:class="reason === option.value ? 'border-red-300 bg-red-50' : 'border-stone-200 hover:bg-stone-50'">
					<input v-model="reason" type="radio" name="remove-reason" :value="option.value" class="mt-1 accent-accent-500" />
					<span>
						<span class="block text-[14.5px] font-semibold text-stone-900">{{ option.value }}</span>
						<span class="block text-[13px] text-stone-500">{{ option.hint }}</span>
					</span>
				</label>
			</fieldset>

			<LibrarianTextField id="remove-copy-note" v-model="note" label="Note" optional placeholder="Anything worth remembering" />

			<p class="text-[13px] text-stone-500">
				The copy leaves the catalog and its accession number is never reused. The removal stays in the stock log.
			</p>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">{{ copy?.status === 'borrowed' ? 'Close' : 'Cancel' }}</ButtonsButton>
			<ButtonsButton v-if="copy?.status !== 'borrowed'" variant="primary" class="!border-red-500 !bg-red-500 hover:!bg-red-600"
				:disabled="busy" @click="emit('submit', { reason, note: note.trim() || undefined })">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				<Icon v-else name="i-tabler-minus" class="h-3.5 w-3.5" />
				Remove copy
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { CopyCatalogRow, RemoveReason } from '~/services/librarianService'

const props = defineProps<{
	open: boolean
	copy: CopyCatalogRow | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { reason: RemoveReason; note: string | undefined }): void
}>()

const OPTIONS: { value: RemoveReason; hint: string }[] = [
	{ value: 'Lost', hint: "It can't be found." },
	{ value: 'Damaged', hint: "It's too damaged to lend." },
	{ value: 'Withdrawn', hint: 'Taken out of circulation (outdated, discarded).' },
	{ value: 'Donated', hint: 'Given away to someone else.' },
	{ value: 'Other', hint: 'Anything else; add a note.' },
]

const reason = ref<RemoveReason>('Withdrawn')
const note = ref('')

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	reason.value = props.copy?.status === 'lost' ? 'Lost' : props.copy?.status === 'damaged' ? 'Damaged' : 'Withdrawn'
	note.value = ''
})
</script>
