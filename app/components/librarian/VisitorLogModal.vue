<template>
	<LibrarianModalShell :open="open" title="Log a Visitor"
		subtitle="For someone without an account. Type their name and pick why they came." :busy="busy" :dirty="dirty" ref="shell" @close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="visitor-name" v-model="form.name" label="Name" placeholder="e.g. Maria Santos"
				:maxlength="120" :error="errors.name" @update:model-value="errors.name = ''" />
			<!-- Pick the reason instead of typing it: the same wording every time, so the visits can be counted by reason. -->
			<fieldset>
				<legend class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Purpose of visit<FieldRequired /></legend>
				<div role="radiogroup" aria-label="Purpose of visit" class="grid grid-cols-2 gap-2">
					<button v-for="purpose in PURPOSES" :key="purpose" type="button" role="radio" :aria-checked="form.purpose === purpose"
						class="flex min-h-[46px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[14px] font-medium transition-colors duration-150"
						:class="form.purpose === purpose ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'"
						@click="form.purpose = purpose; errors.purpose = ''">
						{{ purpose }}
						<Icon v-if="form.purpose === purpose" name="i-tabler-check" class="h-4 w-4 shrink-0" />
					</button>
				</div>
				<p v-if="errors.purpose" class="mt-1 text-[12.5px] text-red-500">{{ errors.purpose }}</p>
				<!-- "Other" has no fixed wording, so the librarian says what it was. -->
				<div v-if="form.purpose === 'Other'" class="mt-3">
					<LibrarianTextField id="visitor-other" v-model="form.otherPurpose" label="Please specify" placeholder="e.g. Meeting a teacher"
						:maxlength="200" :error="errors.otherPurpose" @update:model-value="errors.otherPurpose = ''" />
				</div>
			</fieldset>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				Check in visitor
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
const props = defineProps<{
	open: boolean
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { name: string; purpose: string }): void
}>()

// The reasons a walk-in gives for coming; nothing to type.
const PURPOSES = ['Study or reading', 'Research', 'Borrow or return books', 'Use a computer', 'Inquiry or tour', 'Other']

const form = reactive({ name: '', purpose: '', otherPurpose: '' })
const errors = reactive({ name: '', purpose: '', otherPurpose: '' })

// Every time the modal opens it starts blank.
// What is typed in this window: closing it with changes asks "Discard Changes?" first (see ModalShell, useUnsavedChanges).
const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => form, () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.name = ''
	form.purpose = ''
	form.otherPurpose = ''
	errors.otherPurpose = ''
	errors.name = ''
	errors.purpose = ''
})

function submit() {
	errors.name = form.name.trim() ? '' : 'Enter the visitor\'s name.'
	errors.purpose = form.purpose ? '' : 'Choose the purpose of the visit.'
	errors.otherPurpose = form.purpose === 'Other' && !form.otherPurpose.trim() ? 'Say what the visit was for.' : ''
	if (errors.name || errors.purpose || errors.otherPurpose) return
	emit('submit', { name: form.name.trim(), purpose: form.purpose === 'Other' ? `Other: ${form.otherPurpose.trim()}` : form.purpose.trim() })
}
</script>
