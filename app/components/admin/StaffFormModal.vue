<template>
	<LibrarianModalShell :open="open" size="xl" :title="reviewing ? 'Create This Account?' : account ? 'Edit Staff Account' : 'Add Staff Account'"
		:subtitle="subtitle" :busy="busy" @close="emit('close')">
		<!-- Step 2 (new accounts only): look it over before anything is created. Back returns to the form with everything kept. -->
		<div v-if="reviewing" class="space-y-4">
			<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
				<div v-for="row in reviewRows" :key="row.label" class="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
					<dt class="w-40 shrink-0 text-[12px] font-semibold uppercase tracking-wide text-stone-500">{{ row.label }}</dt>
					<dd class="min-w-0 break-words text-[15px] font-semibold text-stone-900">{{ row.value }}</dd>
				</div>
			</dl>
			<p class="flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-3 text-[13.5px] leading-snug text-stone-600">
				<Icon :name="reviewIsStudent ? 'i-tabler-user-check' : 'i-tabler-mail-check'" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
				<span v-if="reviewIsStudent">A username and a temporary password are made for them. You'll see both once, to hand over.</span>
				<span v-else>A confirmation link is emailed to them, and a temporary password is made that you'll see once, to hand over.</span>
			</p>
		</div>

		<div v-else class="space-y-4">
			<!-- Role first: a student assistant is made differently from everyone else. -->
			<fieldset>
				<legend class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Role<FieldRequired /></legend>
				<div class="grid gap-2 sm:grid-cols-3" role="radiogroup">
					<label v-for="r in ROLES" :key="r.value"
						class="flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors"
						:class="[
							form.role === r.value ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-300' : 'border-stone-200 bg-white',
							roleLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-stone-50',
						]">
						<input v-model="form.role" type="radio" name="staff-role" :value="r.value" :disabled="roleLocked" class="mt-1 accent-accent-500"
							@change="errors.role = ''" />
						<span class="min-w-0">
							<span class="block text-[14.5px] font-semibold text-stone-900">{{ r.label }}</span>
							<span class="block text-[12.5px] leading-snug text-stone-500">{{ r.hint }}</span>
						</span>
					</label>
				</div>
				<p v-if="errors.role" class="mt-1 text-[12.5px] text-red-500">{{ errors.role }}</p>
				<p v-else-if="roleLocked" class="mt-1 text-[12.5px] text-stone-500">You can't change your own role. Ask another administrator.</p>
			</fieldset>

			<!-- New student assistant: from the registered students, or from outside the school. -->
			<fieldset v-if="choosingAssistantSource">
				<legend class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Who is the assistant?<FieldRequired /></legend>
				<div class="grid gap-2 sm:grid-cols-2" role="radiogroup">
					<label v-for="s in SOURCES" :key="s.value"
						class="flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors hover:bg-stone-50"
						:class="form.assistantSource === s.value ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-300' : 'border-stone-200 bg-white'">
						<input v-model="form.assistantSource" type="radio" name="assistant-source" :value="s.value" class="mt-1 accent-accent-500" />
						<span class="min-w-0">
							<span class="block text-[14.5px] font-semibold text-stone-900">{{ s.label }}</span>
							<span class="block text-[12.5px] leading-snug text-stone-500">{{ s.hint }}</span>
						</span>
					</label>
				</div>
			</fieldset>

			<!-- A registered student: search the list and pick one. Their details come from their record. -->
			<div v-if="pickingStudent" class="space-y-2">
				<LibrarianSearchInput id="assistant-student-search" v-model="studentSearch" placeholder="Search name, ID number or program" />
				<ul class="max-h-80 divide-y divide-stone-100 overflow-auto rounded-xl border border-stone-200 bg-white" role="radiogroup" aria-label="Registered students">
					<li v-if="loadingStudents" class="px-3.5 py-3 text-[13.5px] text-stone-500">Loading students…</li>
					<li v-else-if="candidates.length === 0" class="px-3.5 py-3 text-[13.5px] text-stone-500">
						{{ studentSearch ? 'No registered student matches that.' : 'No registered student is available to add.' }}
					</li>
					<li v-for="s in candidates" :key="s.uuid">
						<label class="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-stone-50"
							:class="form.studentUuid === s.uuid ? 'bg-accent-50' : ''">
							<input v-model="form.studentUuid" type="radio" name="assistant-student" :value="s.uuid" class="accent-accent-500"
								@change="errors.studentUuid = ''" />
							<span class="min-w-0">
								<span class="block truncate text-[14.5px] font-semibold text-stone-900">{{ s.name }}</span>
								<span class="block truncate text-[12.5px] text-stone-500">{{ s.idNumber }}<template v-if="s.academicProgram"> · {{ s.academicProgram }}</template></span>
							</span>
						</label>
					</li>
				</ul>
				<p v-if="errors.studentUuid" class="text-[12.5px] text-red-500">{{ errors.studentUuid }}</p>
				<p class="flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-[12.5px] leading-snug text-stone-600">
					<Icon name="i-tabler-info-circle" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
					<span>They get a new username and a temporary password for the librarian side. No email is needed, and their student account stays as it is.</span>
				</p>
			</div>

			<!-- Everyone else: typed in, and the email gets a confirmation link. -->
			<template v-else>
				<div class="name-row">
					<LibrarianTextField id="staff-first" v-model="form.firstName" label="First name" :error="errors.firstName" autocomplete="off"
						@update:model-value="errors.firstName = ''" />
					<LibrarianTextField id="staff-mi" v-model="form.middleInitial" label="M.I." optional :maxlength="1" :error="errors.middleInitial"
						@update:model-value="errors.middleInitial = ''" />
					<LibrarianTextField id="staff-last" v-model="form.lastName" label="Last name" :error="errors.lastName" autocomplete="off"
						@update:model-value="errors.lastName = ''" />
				</div>

				<div class="grid gap-3 sm:grid-cols-2">
					<LibrarianTextField v-if="hasEmail" id="staff-email" v-model="form.email" type="email" label="Email" placeholder="name@stidavao.edu.ph"
						:error="errors.email" autocomplete="off" @update:model-value="errors.email = ''" />
					<LibrarianTextField id="staff-phone" v-model="form.phoneNumber" type="tel" label="Phone" optional :error="errors.phoneNumber"
						@update:model-value="errors.phoneNumber = ''" />
				</div>
				<p v-if="!account" class="flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-[12.5px] leading-snug text-stone-600">
					<Icon name="i-tabler-mail-check" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
					<span>We email them a link to confirm this address. They can sign in once they've clicked it, using the temporary password you give them.</span>
				</p>
			</template>
		</div>

		<template #footer>
			<template v-if="reviewing">
				<ButtonsButton variant="ghost" :disabled="busy" @click="reviewing = false">Back</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="confirmCreate">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					Yes, create account
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="submit">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					{{ account ? 'Save changes' : 'Create account' }}
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { adminService, type AssistantCandidate, type StaffAccount, type StaffPayload, type StaffRole } from '~/services/adminService'

const props = defineProps<{
	open: boolean
	account: StaffAccount | null
	busy?: boolean
	/** Messages from the server (a taken email, say), per field. */
	serverErrors?: Record<string, string>
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: StaffPayload): void
}>()

const ROLES: { value: StaffRole; label: string; hint: string }[] = [
	{ value: 'assistant', label: 'Student assistant', hint: 'Works the desk: loans, returns and attendance. Limited access.' },
	{ value: 'librarian', label: 'Librarian', hint: 'Runs the library: every area of the librarian side.' },
	{ value: 'admin', label: 'Administrator', hint: 'Everything, plus the admin side: accounts, roles and the audit log.' },
]

const SOURCES: { value: 'student' | 'outside'; label: string; hint: string }[] = [
	{ value: 'student', label: 'A registered student', hint: 'Pick from the students already in the system.' },
	{ value: 'outside', label: 'Someone from outside', hint: 'Not a student here. Made like a librarian, with an email.' },
]

const form = reactive({
	firstName: '', middleInitial: '', lastName: '', email: '', phoneNumber: '',
	role: 'assistant' as StaffRole,
	assistantSource: 'student' as 'student' | 'outside',
	studentUuid: '',
})
const errors = reactive<Record<string, string>>({})

// You can't change your own role (the server refuses it too).
const roleLocked = computed(() => !!props.account?.isYou)

// An existing student assistant has a username and no email, so there is no email to edit.
const hasEmail = computed(() => !props.account || !!props.account.email)

const choosingAssistantSource = computed(() => !props.account && form.role === 'assistant')
const pickingStudent = computed(() => choosingAssistantSource.value && form.assistantSource === 'student')

/* ---------- step 2: review before creating (new accounts only) ---------- */
const reviewing = ref(false)
const pending = ref<StaffPayload | null>(null)

const roleLabel = computed(() => ROLES.find((r) => r.value === form.role)?.label ?? form.role)
const reviewIsStudent = computed(() => pending.value?.assistantSource === 'student')
const reviewRows = computed(() => {
	const p = pending.value
	if (!p) return []
	if (p.assistantSource === 'student') {
		const s = candidates.value.find((c) => c.uuid === p.studentUuid)
		return [
			{ label: 'Role', value: roleLabel.value },
			{ label: 'Registered student', value: s ? s.name : 'Selected student' },
			...(s ? [{ label: 'ID number', value: s.idNumber }] : []),
			...(s?.academicProgram ? [{ label: 'Program', value: s.academicProgram }] : []),
			{ label: 'Signs in with', value: 'A new username and temporary password' },
		]
	}
	const name = [p.firstName, p.middleInitial ? `${p.middleInitial}.` : '', p.lastName].filter(Boolean).join(' ')
	return [
		{ label: 'Role', value: p.assistantSource === 'outside' ? 'Student assistant (from outside)' : roleLabel.value },
		{ label: 'Name', value: name },
		{ label: 'Email', value: p.email ?? '' },
		...(p.phoneNumber ? [{ label: 'Phone', value: p.phoneNumber }] : []),
	]
})

function confirmCreate() {
	if (pending.value) emit("submit", pending.value)
}

const subtitle = computed(() => {
	if (reviewing.value) return 'Check these details. Nothing is created until you confirm.'
	if (props.account) return 'Change their details or role.'
	return pickingStudent.value
		? 'Pick a registered student. They sign in with a username and temporary password you give them.'
		: 'They confirm their email, then sign in on the librarian side with a temporary password you give them.'
})

/* ---------- the list of registered students ---------- */
const studentSearch = ref('')
const candidates = ref<AssistantCandidate[]>([])
const loadingStudents = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | undefined
let searchSeq = 0

async function loadCandidates() {
	const seq = ++searchSeq
	loadingStudents.value = true
	try {
		const result = await adminService.assistantCandidates(studentSearch.value.trim())
		if (seq === searchSeq) candidates.value = result.students
	} catch {
		if (seq === searchSeq) candidates.value = []
	} finally {
		if (seq === searchSeq) loadingStudents.value = false
	}
}

watch(studentSearch, () => {
	clearTimeout(searchTimer)
	searchTimer = setTimeout(loadCandidates, 250)
})
// Load the list when the picker appears (form opened on "Student assistant", or the role was just switched to it).
watch(pickingStudent, (showing) => { if (showing && props.open) void loadCandidates() })
onBeforeUnmount(() => clearTimeout(searchTimer))

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	const a = props.account
	form.firstName = a?.firstName ?? ''
	form.middleInitial = a?.middleInitial ?? ''
	form.lastName = a?.lastName ?? ''
	form.email = a?.email ?? ''
	form.phoneNumber = a?.phoneNumber ?? ''
	form.role = a?.role ?? 'assistant'
	form.assistantSource = 'student'
	form.studentUuid = ''
	studentSearch.value = ''
	candidates.value = []
	for (const k of Object.keys(errors)) errors[k] = ''
	reviewing.value = false
	pending.value = null
	if (pickingStudent.value) void loadCandidates()
})

// The server refused something (a taken email, say): back to the form, where the message sits under the field.
watch(() => props.serverErrors, (incoming) => {
	if (!incoming) return
	Object.assign(errors, incoming)
	if (Object.keys(incoming).length) reviewing.value = false
})

/** The form's "Create account" / "Save changes": a new account goes to the review step, an edit saves straight away. */
function send(payload: StaffPayload) {
	if (props.account) {
		emit('submit', payload)
		return
	}
	pending.value = payload
	reviewing.value = true
}

function submit() {
	if (pickingStudent.value) {
		errors.studentUuid = form.studentUuid ? '' : 'Choose a registered student.'
		if (errors.studentUuid) return
		send({ role: 'assistant', assistantSource: 'student', studentUuid: form.studentUuid })
		return
	}

	errors.firstName = form.firstName.trim() ? '' : 'First name is required.'
	errors.lastName = form.lastName.trim() ? '' : 'Last name is required.'
	errors.email = !hasEmail.value || /^\S+@\S+\.\S+$/.test(form.email.trim()) ? '' : 'Enter a valid email address.'
	if (errors.firstName || errors.lastName || errors.email) return

	send({
		firstName: form.firstName.trim(),
		middleInitial: form.middleInitial.trim() || null,
		lastName: form.lastName.trim(),
		...(hasEmail.value ? { email: form.email.trim() } : {}),
		phoneNumber: form.phoneNumber.trim() || null,
		role: form.role,
		...(choosingAssistantSource.value ? { assistantSource: 'outside' as const } : {}),
	})
}
</script>

<style scoped>
/* First name, middle initial (narrow) and last name: one row from 640px up, stacked on a phone. */
.name-row {
	display: grid;
	gap: 0.75rem;
}

@media (min-width: 640px) {
	.name-row {
		grid-template-columns: 1fr 112px 1fr;
	}
}
</style>
