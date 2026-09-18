<template>
	<LibrarianModalShell :open="open" :title="subject ? 'Edit Category' : 'Add Category'"
		subtitle="Categories group books on the shelf and in the catalog." :busy="busy" @close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="category-name" v-model="form.name" label="Name" placeholder="e.g. Cooking"
				:error="errors.name" @update:model-value="errors.name = ''" />

			<LibrarianTextField id="category-code" v-model="form.classificationCode" label="Dewey code" optional mono
				placeholder="e.g. 641" hint="Leave blank to assign one automatically from the name." />
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ subject ? 'Save changes' : 'Add Category' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { SubjectRecord } from '~/services/subjectService'

const props = defineProps<{
	open: boolean
	subject: SubjectRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { name: string; classificationCode: string | null }): void
}>()

const form = reactive({ name: '', classificationCode: '' })
const errors = reactive({ name: '' })

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.name = props.subject?.name ?? ''
	form.classificationCode = props.subject?.classificationCode ?? ''
	errors.name = ''
})

function submit() {
	errors.name = form.name.trim() ? '' : 'Name is required.'
	if (errors.name) return

	emit('submit', {
		name: form.name.trim(),
		classificationCode: form.classificationCode.trim() || null,
	})
}
</script>
