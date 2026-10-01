<template>
	<LibrarianModalShell :open="open" size="sm" title="Check the returned book"
		:subtitle="summary ? `${summary.bookTitle} · Acc. no. ${summary.accessionNumber}` : undefined" :busy="busy" @close="emit('close')">
		<div class="space-y-4">
			<p class="text-[14px] leading-relaxed text-stone-600">
				{{ summary?.studentName ?? 'The student' }} handed this book in.
				Look it over, then finish the return.
			</p>

			<fieldset class="space-y-2">
				<legend class="mb-2 text-[13px] font-semibold text-stone-700">Condition</legend>
				<label v-for="option in OPTIONS" :key="option.value"
					class="flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors"
					:class="condition === option.value
						? option.value === 'damaged' ? 'border-red-300 bg-red-50' : 'border-emerald-300 bg-emerald-50'
						: 'border-stone-200 hover:bg-stone-50'">
					<input v-model="condition" type="radio" name="return-condition" :value="option.value" class="mt-1 accent-accent-500" />
					<span>
						<span class="block text-[14.5px] font-semibold text-stone-900">{{ option.label }}</span>
						<span class="block text-[13px] text-stone-500">{{ option.hint }}</span>
					</span>
				</label>
			</fieldset>

			<LibrarianTextField v-if="condition === 'damaged'" id="finish-return-note" v-model="note" label="What's wrong with it?" optional
				placeholder="e.g. Torn cover, water damage on pages 40-60" hint="The student sees this in their notification." />
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Not yet</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="emit('submit', { condition, note: note.trim() || undefined })">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ condition === 'damaged' ? 'Finish, mark damaged' : 'Finish, back on the shelf' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
type Condition = 'good' | 'damaged'

const props = defineProps<{
	open: boolean
	summary: { bookTitle: string; accessionNumber: number; studentName: string } | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { condition: Condition; note: string | undefined }): void
}>()

const OPTIONS: { value: Condition; label: string; hint: string }[] = [
	{ value: 'good', label: 'Good condition', hint: 'It goes back on the shelf and the next person in line is told.' },
	{ value: 'damaged', label: 'Damaged', hint: 'It stays off the shelf, marked damaged, until you deal with it.' },
]

const condition = ref<Condition>('good')
const note = ref('')

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	condition.value = 'good'
	note.value = ''
})
</script>
