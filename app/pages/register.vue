<template>
	<section class="auth-pane" data-side="right">
		<Transition mode="out-in" enter-active-class="transition duration-300 ease-out"
			enter-from-class="translate-y-1.5 opacity-0" leave-active-class="transition duration-150 ease-out"
			leave-to-class="opacity-0">
			<!-- After submit -->
			<div v-if="submitted" key="done" class="px-1 py-2 text-center">
				<div class="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
					<Icon name="i-tabler-check" class="h-6 w-6" />
				</div>
				<h1 class="dashboard-heading text-[22px] font-bold text-amber-900">Registration submitted</h1>
				<p class="mt-1 text-[13px] leading-relaxed text-stone-500">
					Thanks, <span class="font-semibold text-stone-800">{{ form.firstName.trim() }}</span>. Your account is
					waiting for a librarian to approve it.
				</p>

				<ol class="my-5 grid gap-2.5 text-left">
					<li v-for="step in steps" :key="step.title" class="flex items-start gap-3 text-[13px] leading-snug text-stone-500">
						<span class="mt-px flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
							:class="step.state === 'done' ? 'bg-emerald-50 text-emerald-600' : step.state === 'now' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-500'">
							<Icon v-if="step.state === 'done'" name="i-tabler-check" class="h-3 w-3" />
							<template v-else>{{ step.n }}</template>
						</span>
						<span><b class="font-semibold text-stone-900">{{ step.title }}</b><br>{{ step.body }}</span>
					</li>
				</ol>

				<ButtonsButton class="!h-[46px] w-full !text-[14.5px]" @click="navigateTo('/login')">Back to sign in</ButtonsButton>
			</div>

			<!-- Form -->
			<form v-else key="form" novalidate @submit.prevent="step === 1 ? next() : submit()">
				<h1 class="dashboard-heading text-[30px] font-extrabold leading-[1.15] tracking-[-.02em] text-amber-900">Create account</h1>
				<p class="mt-2 text-[14px] leading-relaxed text-stone-500">
					A librarian will review your registration before you can sign in.
				</p>

				<!-- Two short steps instead of one long form. A finished step can be reopened. -->
				<ol class="mb-6 mt-5 grid grid-cols-2 gap-2.5" aria-label="Registration steps">
					<li v-for="s in stepList" :key="s.n" :aria-current="step === s.n ? 'step' : undefined">
						<button type="button" :disabled="s.n > step"
							class="group w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 disabled:cursor-default"
							@click="goTo(s.n)">
							<span class="block h-1 rounded-full transition-colors duration-300"
								:class="s.n <= step ? 'bg-accent-500' : 'bg-stone-200'" />
							<span class="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-300"
								:class="step === s.n ? 'text-accent-600' : s.n < step ? 'text-stone-700 group-hover:text-accent-600' : 'text-stone-400'">
								<Icon v-if="s.n < step" name="i-tabler-check" class="h-3.5 w-3.5" />
								<span v-else class="tabular-nums">{{ s.n }}.</span>
								{{ s.label }}
							</span>
						</button>
					</li>
				</ol>

				<Transition enter-active-class="transition duration-200 ease-out" enter-from-class="-translate-y-1 opacity-0"
					leave-active-class="transition duration-150 ease-out" leave-to-class="opacity-0">
					<div v-if="formError" role="alert"
						class="mb-4 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[12.5px] leading-snug text-red-600">
						<Icon name="i-tabler-alert-circle" class="mt-px h-4 w-4 shrink-0" />
						<span>{{ formError }}</span>
					</div>
				</Transition>

				<Transition mode="out-in" enter-active-class="transition duration-300 ease-out"
					:enter-from-class="direction > 0 ? 'translate-x-3 opacity-0' : '-translate-x-3 opacity-0'"
					leave-active-class="transition duration-150 ease-out" leave-to-class="opacity-0"
					@after-enter="focusPending">
				<div v-if="step === 1" key="about">
				<fieldset class="mb-6">
					<legend class="sr-only">About you</legend>
					<div class="grid gap-3 sm:grid-cols-[1fr_84px_1fr]" @focusout="touch">
						<LibrarianTextField id="firstName" v-model="form.firstName" label="First name" autocomplete="given-name"
							placeholder="Matt" :error="err('firstName')" @update:model-value="clear('firstName')" />
						<LibrarianTextField id="middleInitial" v-model="form.middleInitial" label="M.I." optional :maxlength="5"
							placeholder="O" :error="err('middleInitial')" @update:model-value="clear('middleInitial')" />
						<LibrarianTextField id="lastName" v-model="form.lastName" label="Last name" autocomplete="family-name"
							placeholder="Pojadas" :error="err('lastName')" @update:model-value="clear('lastName')" />
					</div>
					<div class="mt-3 grid gap-3 sm:grid-cols-2" @focusout="touch">
						<LibrarianTextField id="birthDate" v-model="form.birthDate" label="Birth date" optional type="date"
							:error="err('birthDate')" @update:model-value="clear('birthDate')" />
						<LibrarianTextField id="phoneNumber" v-model="form.phoneNumber" label="Phone" optional type="tel"
							autocomplete="tel" placeholder="0917 123 4567" :maxlength="20" :error="err('phoneNumber')"
							@update:model-value="clear('phoneNumber')" />
					</div>
					<div class="mt-3" @focusout="touch">
						<LibrarianTextField id="address" v-model="form.address" label="Address" optional
							autocomplete="street-address" placeholder="Street, barangay, city" :error="err('address')"
							@update:model-value="clear('address')" />
					</div>
				</fieldset>

				<ButtonsButton type="submit" class="!h-[46px] w-full !text-[14.5px]">
					Continue
					<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
				</ButtonsButton>
				</div>

				<div v-else key="school">
				<fieldset class="mb-5">
					<legend class="mb-2.5 text-[10.5px] font-bold uppercase tracking-[.08em] text-stone-400">School</legend>
					<div class="grid gap-3 sm:grid-cols-2" @focusout="touch">
						<LibrarianTextField id="studentIDNumber" v-model="form.studentIDNumber" label="Student ID number" mono
							placeholder="e.g. 2021-00042" hint="As printed on your school ID." :error="err('studentIDNumber')"
							@update:model-value="clear('studentIDNumber')" />
						<div>
							<label for="academicProgram" class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">
								Program <span class="font-normal text-stone-400">(optional)</span>
							</label>
							<select id="academicProgram" v-model="form.academicProgram"
								class="h-10 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[13.5px] outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
								:class="form.academicProgram ? 'text-stone-900' : 'text-stone-400'" @change="clear('academicProgram')">
								<option value="">Select…</option>
								<option v-for="program in programs" :key="program" :value="program" class="text-stone-900">{{ program }}</option>
							</select>
							<p v-if="err('academicProgram')" class="mt-1 text-[11.5px] text-red-500">{{ err('academicProgram') }}</p>
						</div>
					</div>
				</fieldset>

				<fieldset class="mb-5">
					<legend class="mb-2.5 text-[10.5px] font-bold uppercase tracking-[.08em] text-stone-400">Sign-in details</legend>
					<div @focusout="touch">
						<LibrarianTextField id="email" v-model="form.email" label="Email" type="email" autocomplete="email"
							placeholder="you@school.edu.ph" :error="err('email')" @update:model-value="clear('email')" />
					</div>
					<div class="mt-3 grid gap-3 sm:grid-cols-2" @focusout="touch">
						<AuthPasswordField id="password" v-model="form.password" label="Password" autocomplete="new-password"
							placeholder="At least 8 characters" :error="err('password')"
							@update:model-value="clear('password'); clear('password_confirmation')" />
						<AuthPasswordField id="password_confirmation" v-model="form.password_confirmation"
							label="Confirm password" autocomplete="new-password" placeholder="Repeat it"
							:error="err('password_confirmation')" @update:model-value="clear('password_confirmation')" />
					</div>
					<ul class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px]" aria-label="Password requirements">
						<li v-for="rule in passwordRules" :key="rule.label"
							class="inline-flex items-center gap-1.5 transition-colors duration-200"
							:class="rule.met ? 'text-emerald-600' : 'text-stone-400'">
							<span class="h-[7px] w-[7px] rounded-full transition-colors duration-200"
								:class="rule.met ? 'bg-emerald-500' : 'bg-stone-200'" />
							{{ rule.label }}
						</li>
					</ul>
				</fieldset>

				<div class="flex gap-2.5">
					<ButtonsButton type="button" variant="ghost" class="!h-[46px] !px-4 !text-[14.5px]" :disabled="submitting"
						@click="goTo(1)">
						<Icon name="i-tabler-arrow-left" class="h-4 w-4" />
						Back
					</ButtonsButton>
					<ButtonsButton type="submit" class="!h-[46px] flex-1 !text-[14.5px]" :disabled="submitting">
						<span v-if="submitting" class="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
						{{ submitting ? 'Creating account…' : 'Create account' }}
					</ButtonsButton>
				</div>
				</div>
				</Transition>

				<p class="mt-4 text-center text-[13px] text-stone-500 lg:hidden">
					Already registered?
					<NuxtLink to="/login" class="font-semibold text-accent-500 hover:underline">Sign in</NuxtLink>
				</p>
			</form>
		</Transition>
	</section>
</template>

<script setup lang="ts">
import { authService, type RegisterPayload } from '~/services/auth/AuthService'

definePageMeta({
	layout: 'auth',
	middleware: 'guest',
	pageTransition: { name: 'auth-swap', mode: 'default' },
})
useHead({ title: 'Create account' })

// Free-text column on the API side; this is just a convenient list.
const programs = ['BSIT', 'BSCS', 'BSBA', 'BSHM', 'Other']

const steps = [
	{ n: 1, state: 'done', title: 'Registration received', body: "We've saved your details." },
	{ n: 2, state: 'now', title: 'Librarian review', body: 'Usually done at the library desk — bring your school ID.' },
	{ n: 3, state: 'todo', title: 'You can sign in', body: 'Once a librarian approves your account.' },
] as const

const form = reactive({
	firstName: '',
	middleInitial: '',
	lastName: '',
	birthDate: '',
	phoneNumber: '',
	address: '',
	studentIDNumber: '',
	academicProgram: '',
	email: '',
	password: '',
	password_confirmation: '',
})
type Field = keyof typeof form

const submitting = ref(false)
const submitted = ref(false)
const formError = ref('')
const touched = reactive(new Set<Field>())
const serverErrors = ref<Partial<Record<Field, string>>>({})

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const today = () => new Date().toISOString().slice(0, 10)

/** Mirrors StudentRegistrationRequest so most mistakes are caught before a round trip. */
const clientErrors = computed<Partial<Record<Field, string>>>(() => {
	const f = form
	const e: Partial<Record<Field, string>> = {}
	if (!f.firstName.trim()) e.firstName = 'Enter your first name.'
	if (!f.lastName.trim()) e.lastName = 'Enter your last name.'
	if (f.middleInitial.length > 5) e.middleInitial = 'Use 5 characters or fewer.'
	if (f.birthDate && f.birthDate > today()) e.birthDate = "Birth date can't be in the future."
	if (f.phoneNumber.length > 20) e.phoneNumber = 'Use 20 characters or fewer.'
	if (f.address.length > 255) e.address = 'Use 255 characters or fewer.'
	if (!f.studentIDNumber.trim()) e.studentIDNumber = 'Enter your student ID number.'
	if (!f.email.trim()) e.email = 'Enter your email.'
	else if (!emailPattern.test(f.email.trim())) e.email = "That doesn't look like an email address."
	if (!f.password) e.password = 'Choose a password.'
	else if (f.password.length < 8) e.password = 'Use at least 8 characters.'
	if (f.password_confirmation !== f.password) e.password_confirmation = "The passwords don't match."
	return e
})

const passwordRules = computed(() => [
	{ label: '8+ characters', met: form.password.length >= 8 },
	{ label: 'Passwords match', met: !!form.password && form.password === form.password_confirmation },
])

/** Server message wins (it's the truth, e.g. "already registered"); otherwise show client errors once a field was visited. */
function err(field: Field) {
	return serverErrors.value[field] ?? (touched.has(field) ? clientErrors.value[field] : undefined)
}

const stepList = [
	{ n: 1, label: 'About you' },
	{ n: 2, label: 'School & sign-in' },
] as const
type Step = (typeof stepList)[number]['n']

const stepFields: Record<Step, Field[]> = {
	1: ['firstName', 'middleInitial', 'lastName', 'birthDate', 'phoneNumber', 'address'],
	2: ['studentIDNumber', 'academicProgram', 'email', 'password', 'password_confirmation'],
}
const stepOf = (field: Field): Step => (stepFields[1].includes(field) ? 1 : 2)

const step = ref<Step>(1)
const direction = ref(1)
// Set before a step change; focused once the new step has finished entering (see @after-enter).
const pendingFocus = ref<Field | null>(null)

function focusField(field: Field) {
	if (stepOf(field) === step.value) {
		document.getElementById(field)?.focus()
		return
	}
	pendingFocus.value = field
	goTo(stepOf(field))
}

function focusPending() {
	if (pendingFocus.value) document.getElementById(pendingFocus.value)?.focus()
	pendingFocus.value = null
}

function goTo(target: Step) {
	if (target === step.value) return
	direction.value = target > step.value ? 1 : -1
	pendingFocus.value ??= stepFields[target][0]!
	step.value = target
}

/** Step 1 is checked on its own, so the second step only opens once the first is right. */
function next() {
	stepFields[1].forEach((f) => touched.add(f))
	const firstInvalid = stepFields[1].find((f) => clientErrors.value[f])
	if (firstInvalid) focusField(firstInvalid)
	else goTo(2)
}

function clear(field: Field) {
	if (serverErrors.value[field]) serverErrors.value = { ...serverErrors.value, [field]: undefined }
	if (formError.value) formError.value = ''
}

// Marks the field as visited when focus leaves it (focusout bubbles from the inner <input>).
function touch(event: FocusEvent) {
	const id = (event.target as HTMLElement | null)?.id as Field | undefined
	if (id && id in form) touched.add(id)
}

async function submit() {
	formError.value = ''
	;(Object.keys(form) as Field[]).forEach((f) => touched.add(f))

	const firstInvalid = (Object.keys(form) as Field[]).find((f) => clientErrors.value[f])
	if (firstInvalid) {
		focusField(firstInvalid)
		return
	}

	submitting.value = true
	serverErrors.value = {}

	const payload: RegisterPayload = {
		firstName: form.firstName.trim(),
		lastName: form.lastName.trim(),
		email: form.email.trim(),
		password: form.password,
		password_confirmation: form.password_confirmation,
		studentIDNumber: form.studentIDNumber.trim(),
		middleInitial: form.middleInitial.trim() || undefined,
		phoneNumber: form.phoneNumber.trim() || undefined,
		birthDate: form.birthDate || undefined,
		address: form.address.trim() || undefined,
		academicProgram: form.academicProgram || undefined,
	}

	try {
		await authService.register(payload)
		submitted.value = true
		window.scrollTo({ top: 0 })
	} catch (error: any) {
		if (!error?.response) {
			formError.value = 'Unable to reach the server. Check your connection and try again.'
		} else {
			const fields = apiFieldErrors(error) as Partial<Record<Field, string>>
			serverErrors.value = fields
			formError.value = Object.keys(fields).length
				? 'We couldn\'t create your account. Check the highlighted fields and try again.'
				: apiErrorMessage(error, 'Something went wrong. Please try again.')
			const firstServer = (Object.keys(form) as Field[]).find((f) => fields[f])
			// A server error can belong to either step (e.g. a name that's too long), so go to it.
			if (firstServer) focusField(firstServer)
		}
	} finally {
		submitting.value = false
	}
}
</script>
