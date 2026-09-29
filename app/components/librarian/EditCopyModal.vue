<template>
	<LibrarianModalShell :open="open" size="sm" :title="copy ? `Accession No. ${copy.accessionNumber}` : 'Edit Copy'"
		:subtitle="copy?.book.title" :busy="busy" @close="emit('close')">
		<!-- A copy out on loan only changes through check-in. -->
		<div v-if="copy?.status === 'borrowed'" class="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] text-amber-800">
			<Icon name="i-tabler-clock" class="mt-0.5 h-4 w-4 shrink-0" />
			<p>This copy is out on loan. Its status changes when it's checked in at Circulation.</p>
		</div>

		<fieldset v-else class="space-y-2">
			<legend class="mb-2 text-[13px] font-semibold text-stone-700">Status</legend>
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

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">{{ copy?.status === 'borrowed' ? 'Close' : 'Cancel' }}</ButtonsButton>
			<ButtonsButton v-if="copy?.status !== 'borrowed'" variant="primary" :disabled="busy || status === copy?.status" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ status === 'retired' ? 'Remove copy' : 'Save changes' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { CopyCatalogRow, CopyStatus } from '~/services/librarianService'

type EditableStatus = Exclude<CopyStatus, 'borrowed'> | 'retired'

const props = defineProps<{
	open: boolean
	copy: CopyCatalogRow | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', status: EditableStatus): void
}>()

const OPTIONS: { value: EditableStatus; label: string; hint: string }[] = [
	{ value: 'available', label: 'On the shelf', hint: 'Can be borrowed.' },
	{ value: 'damaged', label: 'Damaged', hint: 'Kept in the catalog but not lent out until repaired.' },
	{ value: 'lost', label: 'Lost', hint: 'Missing. Set it back to On the shelf if it turns up.' },
	{ value: 'retired', label: 'Remove from catalog', hint: 'Retires this copy for good. Its accession number is not reused.' },
]

const status = ref<EditableStatus>('available')

watch(() => props.open, (isOpen) => {
	if (isOpen && props.copy && props.copy.status !== 'borrowed') status.value = props.copy.status
})

function submit() {
	emit('submit', status.value)
}
</script>
