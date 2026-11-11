<template>
	<LibrarianModalShell :open="open" title="Log a Visitor"
		subtitle="For someone without an account. Type their name and why they came." :busy="busy" @close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="visitor-name" v-model="form.name" label="Name" placeholder="e.g. Maria Santos"
				:maxlength="120" :error="errors.name" @update:model-value="errors.name = ''" />
			<LibrarianTextField id="visitor-purpose" v-model="form.purpose" label="Purpose of visit"
				placeholder="e.g. Research, returning a borrowed book, tour" :maxlength="255" :error="errors.purpose"
				@update:model-value="errors.purpose = ''" />
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
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

const form = reactive({ name: '', purpose: '' })
const errors = reactive({ name: '', purpose: '' })

// Every time the modal opens it starts blank.
watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.name = ''
	form.purpose = ''
	errors.name = ''
	errors.purpose = ''
})

function submit() {
	errors.name = form.name.trim() ? '' : 'Enter the visitor\'s name.'
	errors.purpose = form.purpose.trim() ? '' : 'Enter the purpose of the visit.'
	if (errors.name || errors.purpose) return
	emit('submit', { name: form.name.trim(), purpose: form.purpose.trim() })
}
</script>
