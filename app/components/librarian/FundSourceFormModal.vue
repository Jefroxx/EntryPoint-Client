<template>
	<LibrarianModalShell :open="open" size="md" :title="source ? 'Edit Source of Fund' : 'Add Source of Fund'"
		:subtitle="source ? 'Copies that came from it follow the new name.' : 'Where the library\'s money for books comes from.'"
		:busy="busy" :dirty="dirty"
		:discard-title="source ? 'Discard Fund Changes?' : 'Discard This Source of Fund?'"
		:discard-text="source ? `${source.name} stays as it was.` : 'The source of fund you started won\'t be added.'" ref="shell" @close="emit('close')">
		<LibrarianTextField id="fund-name" v-model="form.name" label="Name" placeholder="e.g. Alumni gift" :maxlength="80" :disabled="source?.locked"
			:hint="source?.locked ? 'Copies from this source cost nothing, so its name stays as it is.' : undefined"
			:error="errors.name" @update:model-value="errors.name = ''" />

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">{{ source?.locked ? 'Close' : 'Cancel' }}</ButtonsButton>
			<!-- Nothing about "Donated" can be changed, so there is nothing to save. -->
			<ButtonsButton v-if="!source?.locked" variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ source ? 'Save Changes' : 'Add Source' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { FundSourceRecord } from '~/services/areaService'

const props = defineProps<{ open: boolean; source: FundSourceRecord | null; busy?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'submit', payload: { name: string }): void }>()

const form = reactive({ name: '' })
const errors = reactive({ name: '' })

const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => form, () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.name = props.source?.name ?? ''
	errors.name = ''
})

function submit() {
	errors.name = form.name.trim() ? '' : 'Name is required.'
	if (errors.name) return
	emit('submit', { name: form.name.trim() })
}
</script>
