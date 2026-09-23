<template>
	<LibrarianModalShell :open="open" :title="resource ? 'Edit Resource' : 'Add Resource'"
		:subtitle="resource ? 'Rename it or change its type.' : 'Add a computer, room or study space.'" :busy="busy"
		@close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="resource-name" v-model="form.name" label="Name" placeholder="e.g. PC-08"
				:error="errors.name" @update:model-value="errors.name = ''" />

			<div>
				<LibrarianTextField id="resource-type" v-model="form.resourceType" label="Type"
					placeholder="e.g. Computer, Study Room" :error="errors.resourceType"
					@update:model-value="errors.resourceType = ''" />
			</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
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
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { name: string; resourceType: string }): void
}>()

const form = reactive({ name: '', resourceType: '' })
const errors = reactive({ name: '', resourceType: '' })

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.name = props.resource?.name ?? ''
	form.resourceType = props.resource?.resourceType ?? ''
	errors.name = ''
	errors.resourceType = ''
})

function submit() {
	errors.name = form.name.trim() ? '' : 'Name is required.'
	errors.resourceType = form.resourceType.trim() ? '' : 'Type is required.'
	if (errors.name || errors.resourceType) return
	emit('submit', { name: form.name.trim(), resourceType: form.resourceType.trim() })
}
</script>
