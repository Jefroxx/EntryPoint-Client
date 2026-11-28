<template>
	<LibrarianModalShell :open="open" :title="resource ? 'Edit Resource' : 'Add Resource'"
		:subtitle="resource ? 'Rename it or change its type.' : 'Add a computer, room or study space.'" :busy="busy"
		:dirty="dirty"
		:discard-title="resource ? 'Discard Resource Changes?' : 'Discard This Resource?'"
		:discard-text="resource ? 'This computer, room or space stays as it was.' : 'The computer, room or space you started won\'t be added.'" ref="shell" @close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="resource-name" v-model="form.name" label="Name" placeholder="e.g. PC-08"
				:error="errors.name" @update:model-value="errors.name = ''" />

			<!-- The type is picked from the list kept under Resources > Types, so it is always spelled the same way. -->
			<div>
				<label for="resource-type" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Type<FieldRequired /></label>
				<select v-if="types.length" id="resource-type" v-model="form.resourceType"
					class="h-11 w-full rounded-[10px] border bg-white px-3 text-[15px] text-stone-900 outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
					:class="errors.resourceType ? 'border-red-400 bg-red-50' : 'border-stone-200'" @change="errors.resourceType = ''">
					<option value="" disabled>Choose a type</option>
					<option v-for="type in types" :key="type" :value="type">{{ type }}</option>
				</select>
				<p v-else class="rounded-lg bg-amber-50 px-3 py-2 text-[13.5px] text-amber-900">There are no types yet. Add one in the Types tab first (Computer, Study Room…).</p>
				<p v-if="errors.resourceType" class="mt-1 text-[12.5px] text-red-500">{{ errors.resourceType }}</p>
				<p v-else-if="types.length" class="mt-1 text-[12.5px] text-stone-500">Need another kind? Add it in the Types tab.</p>
			</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ resource ? 'Save changes' : 'Add Resource' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { ResourceRecord } from '~/services/resourceService'

const props = defineProps<{
	open: boolean
	resource: ResourceRecord | null
	/** The names on the list of types. */
	types: string[]
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { name: string; resourceType: string }): void
}>()

const form = reactive({ name: '', resourceType: '' })
const errors = reactive({ name: '', resourceType: '' })

// What is typed in this window: closing it with changes asks "Discard Changes?" first (see ModalShell, useUnsavedChanges).
const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => form, () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.name = props.resource?.name ?? ''
	form.resourceType = props.resource?.resourceType ?? ''
	errors.name = ''
	errors.resourceType = ''
})

function submit() {
	errors.name = form.name.trim() ? '' : 'Name is required.'
	errors.resourceType = form.resourceType.trim() ? '' : 'Choose a type.'
	if (errors.name || errors.resourceType) return
	emit('submit', { name: form.name.trim(), resourceType: form.resourceType.trim() })
}
</script>
