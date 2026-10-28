<template>
	<main class="flex min-h-screen items-center justify-center bg-parchment px-4 py-10">
		<div class="w-full max-w-[420px] rounded-[28px] border border-stone-200 bg-white p-7 shadow-overlay sm:p-8">
			<AuthLogo />
			<h1 class="dashboard-heading text-balance text-center text-[26px] font-extrabold leading-[1.15] tracking-[-.02em] text-crimson">Set your own password</h1>
			<p class="mb-6 mt-2 text-center text-[14px] leading-snug text-stone-500">
				Your account started with a temporary password from the library. Choose one that only you know, then you can carry on.
			</p>

			<form class="grid gap-3.5" novalidate @submit.prevent="submit">
				<AuthPasswordField id="current" v-model="form.current" label="Temporary password" autocomplete="current-password"
					:error="errors.currentPassword" @update:model-value="errors.currentPassword = ''" />
				<AuthPasswordField id="next" v-model="form.next" label="New password" autocomplete="new-password" placeholder="At least 8 characters"
					:error="errors.newPassword" @update:model-value="errors.newPassword = ''" />
				<AuthPasswordField id="confirm" v-model="form.confirm" label="Confirm new password" autocomplete="new-password" placeholder="Repeat it"
					@update:model-value="errors.newPassword = ''" />

				<ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px]" aria-label="Password requirements">
					<li v-for="rule in rules" :key="rule.label" class="inline-flex items-center gap-1.5 transition-colors duration-200"
						:class="rule.met ? 'text-emerald-600' : 'text-stone-500'">
						<span class="h-[7px] w-[7px] rounded-full transition-colors duration-200" :class="rule.met ? 'bg-emerald-500' : 'bg-stone-200'" />{{ rule.label }}
					</li>
				</ul>

				<p v-if="failure" role="alert" class="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[12.5px] leading-snug text-red-600">
					<Icon name="i-tabler-alert-circle" class="mt-px h-4 w-4 shrink-0" />{{ failure }}
				</p>

				<ButtonsButton type="submit" class="mt-1 !h-[46px] w-full !text-[14.5px]" :disabled="!ready || saving">
					<span v-if="saving" class="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
					{{ saving ? 'Saving…' : 'Save and continue' }}
				</ButtonsButton>
			</form>

			<p class="mt-5 text-center text-[13px] text-stone-500">
				Not you?
				<button type="button" class="font-semibold text-accent-600 hover:underline" @click="signOutInstead">Sign out</button>
			</p>
		</div>
	</main>
</template>

<script setup lang="ts">
import { authService } from '~/services/authService'
import { settingsService } from '~/services/settingsService'
import { studentService } from '~/services/studentService'

definePageMeta({ layout: false })
useHead({ title: 'Set your password' })

// Which side is waiting on a new password: the middleware only lets someone here when one of them is.
const staffSession = useAuthSession('librarian')
const studentSession = useAuthSession('student')
const area = computed<'librarian' | 'student'>(() => (staffSession.token.value && staffSession.mustChange.value === '1' ? 'librarian' : 'student'))

const form = reactive({ current: '', next: '', confirm: '' })
const errors = reactive({ currentPassword: '', newPassword: '' })
const failure = ref('')
const saving = ref(false)

const rules = computed(() => [
	{ label: '8+ characters', met: form.next.length >= 8 },
	{ label: 'Passwords match', met: !!form.next && form.next === form.confirm },
	{ label: 'Different from the temporary one', met: !!form.next && form.next !== form.current },
])
const ready = computed(() => !!form.current && rules.value.every((r) => r.met))

async function submit() {
	if (!ready.value || saving.value) return
	saving.value = true
	failure.value = ''
	errors.currentPassword = ''
	errors.newPassword = ''

	const payload = { currentPassword: form.current, newPassword: form.next, newPassword_confirmation: form.confirm }

	try {
		if (area.value === 'librarian') await settingsService.changePassword(payload)
		else await studentService.changePassword(payload)

		const session = area.value === 'librarian' ? staffSession : studentSession
		session.mustChange.value = null
		await navigateTo(homeFor(session.role.value, staffSession.staffRole?.value))
	} catch (error) {
		const fields = serverFieldErrors(error)
		if (fields) {
			errors.currentPassword = fields.currentPassword ?? ''
			errors.newPassword = fields.newPassword ?? ''
			if (!errors.currentPassword && !errors.newPassword) failure.value = Object.values(fields)[0] ?? 'Could not save the password.'
		} else {
			failure.value = apiErrorMessage(error, 'Could not save the password. Please try again.')
		}
	} finally {
		saving.value = false
	}
}

async function signOutInstead() {
	const target = area.value
	try {
		await authService.logout(target)
	} finally {
		;(target === 'librarian' ? staffSession : studentSession).signOut()
		await navigateTo(target === 'librarian' ? '/librarian/login' : '/login')
	}
}
</script>
