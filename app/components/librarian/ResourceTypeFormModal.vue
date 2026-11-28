<template>
	<LibrarianModalShell :open="open" size="md" :title="type ? 'Rename Type' : 'Add Type'"
		:subtitle="type ? `Every ${noun} of this type is renamed with it.` : `A kind of ${noun}, like ${example}.`"
		:busy="busy" :dirty="dirty"
		:discard-title="type ? 'Discard the New Name?' : 'Discard This Type?'"
		:discard-text="type ? `The type keeps its name, ${type.name}.` : 'The type you started won\'t be added.'" ref="shell" @close="emit('close')">
		<LibrarianTextField id="resource-type-name" v-model="form.name" label="Name of the type" :placeholder="`e.g. ${example}`" :maxlength="100"
			:error="error" @update:model-value="error = ''" />

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ type ? 'Save Changes' : 'Add Type' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	open: boolean
	type: { name: string } | null
	busy?: boolean
	/** What the type is a type of, in the pop-up's words (a resource, a reward). */
	noun?: string
	example?: string
}>(), { noun: 'resource', example: 'Study Room' })
const emit = defineEmits<{ (e: 'close'): void; (e: 'submit', name: string): void }>()

const form = reactive({ name: '' })
const error = ref('')

// What is typed in this window: closing it with changes asks "Discard Changes?" first.
const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => form, () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.name = props.type?.name ?? ''
	error.value = ''
})

function submit() {
	if (!form.name.trim()) {
		error.value = 'Enter a name for the type.'
		return
	}
	emit('submit', form.name.trim())
}
</script>
