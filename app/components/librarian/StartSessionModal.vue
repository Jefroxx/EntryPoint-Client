<template>
	<LibrarianModalShell :open="open" size="xl" title="Start Session"
		:subtitle="resource ? `Assign ${resource.name} to a student: scan their ID, or search for them.` : ''" :busy="busy" @close="emit('close')">
		<div class="grid gap-6 md:grid-cols-2">
			<!-- Left: the camera, so the student's ID is scanned without leaving this window. -->
			<section aria-label="Camera" class="min-w-0">
				<div v-show="!phoneOpen"><LibrarianCameraScanPanel :active="open && !phoneOpen" hint="Hold the student's ID inside the box" @code="findStudent" /></div>
			<LibrarianPhoneScanner v-model:open="phoneOpen" :class="phoneOpen ? '' : 'mt-4'" :active="open" @code="findStudent" />
			</section>

			<!-- Right: the student, found by the camera, a scanner, or by name. -->
			<section aria-label="Student" class="min-w-0 space-y-4">
				<form autocomplete="off" @submit.prevent="findStudent(code)">
					<label for="session-student-scan" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Student ID</label>
					<div class="flex gap-2">
						<div class="relative min-w-0 flex-1">
							<Icon name="i-tabler-id" class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
							<input id="session-student-scan" ref="scanInput" v-model="code" type="text" autocomplete="off" spellcheck="false"
								placeholder="Scan the ID, or type the student number" :disabled="finding" aria-label="Student ID"
								class="font-data h-11 w-full rounded-[10px] border bg-white pl-10 pr-3 text-[14px] text-stone-900 outline-none placeholder:font-sans focus:border-accent-500 focus:ring-2 focus:ring-accent-200 disabled:opacity-70"
								:class="scanError ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="scanError = ''">
						</div>
						<ButtonsButton type="submit" variant="ghost" :disabled="finding || !code.trim()">
							<Icon v-if="finding" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
							Find
						</ButtonsButton>
					</div>
					<p v-if="scanError" class="mt-1 text-[12.5px] text-red-500">{{ scanError }}</p>
				</form>

				<div>
					<label for="session-student" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Or search by name<FieldRequired /></label>
					<LibrarianSearchSelect v-model="student" input-id="session-student" placeholder="Search name or student ID"
						:fetcher="searchStudents" :get-label="label" :get-sublabel="sublabel" :invalid="!!error" />
					<p v-if="error" class="mt-1 text-[12.5px] text-red-500">{{ error }}</p>
				</div>

				<div v-if="student" class="flex items-center gap-4 rounded-2xl border border-stone-200 p-4">
					<LibrarianStudentAvatar :name="label(student)" />
					<div class="min-w-0">
						<p class="truncate text-[16px] font-semibold text-stone-900">{{ label(student) }}</p>
						<p class="font-data text-[13px] text-stone-500">{{ student.memberIDNumber }}</p>
						<p class="truncate text-[13px] text-stone-500">{{ student.academicProgram ?? student.department ?? '—' }}</p>
					</div>
				</div>
			</section>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
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
// The librarian's phone is the camera instead of the webcam (the webcam panel is hidden and switched off meanwhile).
const phoneOpen = ref(false)
const code = ref('')
const scanError = ref('')
const finding = ref(false)
const scanInput = ref<HTMLInputElement | null>(null)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	student.value = null
	error.value = ''
	code.value = ''
	scanError.value = ''
	// A USB scanner types into the box, so it takes the cursor.
	nextTick(() => setTimeout(() => scanInput.value?.focus(), 80))
})
watch(student, () => { error.value = '' })

async function searchStudents(query: string) {
	const result = await librarianService.fetchStudents({ search: query || undefined, status: 'approved', perPage: 6 })
	return result.data
}

const label = (s: StudentRecord) => personName(s.user)
const sublabel = (s: StudentRecord) => `${s.memberIDNumber} · ${s.academicProgram ?? '—'}`

// The ID card's barcode (or the typed student number) finds the one approved student it belongs to.
async function findStudent(raw: string) {
	const value = raw.replace(/[\r\n\t]/g, '').trim()
	if (!value || finding.value) return

	finding.value = true
	scanError.value = ''
	try {
		const result = await librarianService.fetchStudents({ search: value, status: 'approved', perPage: 5 })
		const exact = result.data.find((s) => s.memberIDNumber.toLowerCase() === value.toLowerCase())
		const found = exact ?? (result.data.length === 1 ? result.data[0] : undefined)
		if (found) student.value = found
		else scanError.value = result.data.length > 1 ? 'More than one student matches. Search by name below.' : 'No approved student has that ID.'
		code.value = ''
	} catch (e: any) {
		scanError.value = e?.data?.message ?? 'Could not look that student up.'
	} finally {
		finding.value = false
	}
}

function submit() {
	if (!student.value) {
		error.value = 'Choose a student.'
		return
	}
	emit('submit', student.value.studentID)
}
</script>
