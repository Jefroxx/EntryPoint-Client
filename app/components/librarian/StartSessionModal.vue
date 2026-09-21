<template>
	<LibrarianModalShell :open="open" title="Start Session"
		:subtitle="resource ? `Assign ${resource.name} to a student.` : ''" :busy="busy" @close="emit('close')">
		<label for="session-student" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Student</label>
		<LibrarianSearchSelect v-model="student" input-id="session-student" placeholder="Search name or student ID"
			:fetcher="searchStudents" :get-label="label" :get-sublabel="sublabel" :invalid="!!error" />
		<p v-if="error" class="mt-1 text-[12.5px] text-red-500">{{ error }}</p>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
				Start session
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { librarianService, type StudentRecord } from '~/services/librarianService'
import type { ResourceRecord } from '~/services/resourceService'

const props = defineProps<{
	open: boolean
	resource: ResourceRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', studentID: number): void
}>()

const student = ref<StudentRecord | null>(null)
const error = ref('')

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	student.value = null
	error.value = ''
})
watch(student, () => { error.value = '' })

async function searchStudents(query: string) {
	const result = await librarianService.fetchStudents({ search: query || undefined, status: 'approved', perPage: 6 })
	return result.data
}

const label = (s: StudentRecord) => personName(s.user)
const sublabel = (s: StudentRecord) => `${s.studentIDNumber} · ${s.academicProgram ?? '—'}`

function submit() {
	if (!student.value) {
		error.value = 'Choose a student.'
		return
	}
	emit('submit', student.value.studentID)
}
</script>
