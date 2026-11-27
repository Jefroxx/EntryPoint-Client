<template>
	<!-- "Your account", the same screen for every staff account: librarians and student assistants see it under
		 Settings → Account, administrators on their Account page (pages/Admin/account.vue). One component so the two
		 never drift apart again. It is a container: two columns when it has the room (the admin page), one stacked
		 column inside the narrower Settings section. -->
	<div class="@container">
		<!-- Who you are: the same card as the top of the student profile. -->
		<section class="mb-5 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
			<div class="flex min-w-0 flex-1 items-center gap-4">
				<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[22px] font-extrabold text-white" aria-hidden="true">
					{{ initials }}
				</div>
				<div class="min-w-0">
					<component :is="standalone ? 'h1' : 'h2'" class="dashboard-heading truncate text-[26px] font-extrabold leading-tight text-crimson">
						{{ fullName }}
					</component>
					<p class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-stone-500">
						<LibrarianStatusPill :label="account.roleLabel" tone="info" />
						<span class="font-data truncate">{{ account.email ?? account.username }}</span>
					</p>
				</div>
			</div>
			<p class="max-w-[260px] text-[13px] leading-snug text-stone-500 max-md:hidden">Your name appears in the header and in the audit log next to everything you change.</p>
		</section>

		<div class="grid gap-5 @3xl:grid-cols-2 @3xl:items-start">
			<section class="rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
				<h2 class="text-[17px] font-bold text-stone-900">Your details</h2>
				<p class="mt-0.5 text-[13px] text-stone-500">{{ hasEmail ? 'The name and email on your account.' : 'The name on your account.' }}</p>

				<form class="mt-4 grid gap-3.5" novalidate @submit.prevent="saveProfile">
					<div class="grid gap-3.5 sm:grid-cols-2">
						<LibrarianTextField id="account-first" v-model="profile.firstName" label="First name" autocomplete="given-name"
							:error="profileErrors.firstName" @update:model-value="profileErrors.firstName = ''" />
						<LibrarianTextField id="account-last" v-model="profile.lastName" label="Last name" autocomplete="family-name"
							:error="profileErrors.lastName" @update:model-value="profileErrors.lastName = ''" />
					</div>
					<!-- A student assistant signs in with a username and has no email to change. -->
					<LibrarianTextField v-if="hasEmail" id="account-email" v-model="profile.email" type="email" label="Email" autocomplete="email"
						:error="profileErrors.email" @update:model-value="profileErrors.email = ''" />
					<!-- A new email decides where password resets go, so changing it asks for the password. -->
					<AuthPasswordField v-if="emailChanged" id="account-email-password" v-model="emailPassword" label="Current password"
						autocomplete="current-password" placeholder="Needed to change your email"
						:error="profileErrors.currentPassword" @update:model-value="profileErrors.currentPassword = ''" />
					<div class="mt-1 flex items-center gap-3">
						<ButtonsButton type="submit" :disabled="!profileDirty || savingProfile">
							<span v-if="savingProfile" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
							{{ savingProfile ? 'Saving…' : 'Save changes' }}
						</ButtonsButton>
						<button v-if="profileDirty && !savingProfile" type="button" class="text-[13px] font-semibold text-stone-500 hover:text-stone-800" @click="resetProfile">
							Undo
						</button>
					</div>
				</form>
			</section>

			<div class="grid gap-5">
				<section class="rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
					<h2 class="text-[17px] font-bold text-stone-900">Account record</h2>
					<p class="mt-0.5 text-[13px] text-stone-500">Set by the system. An administrator can change a role.</p>
					<dl class="mt-3">
						<div v-for="row in lockedRows" :key="row.label" class="flex items-center justify-between gap-4 border-b border-stone-100 py-2.5 text-[14px] last:border-0">
							<dt class="flex items-center gap-2 text-stone-500"><Icon name="i-tabler-lock" class="h-3.5 w-3.5 text-stone-400" />{{ row.label }}</dt>
							<dd class="min-w-0 truncate text-right text-stone-900" :class="row.data ? 'font-data' : ''">{{ row.value || '—' }}</dd>
						</div>
					</dl>
				</section>

				<section class="rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
					<h2 class="text-[17px] font-bold text-stone-900">Password</h2>
					<p class="mt-0.5 text-[13px] text-stone-500">Changing it signs you out on your other devices.</p>
					<form class="mt-3.5 grid gap-3.5" novalidate @submit.prevent="savePassword">
						<AuthPasswordField id="currentPassword" v-model="pw.currentPassword" label="Current password" autocomplete="current-password"
							:error="pwErrors.currentPassword" @update:model-value="pwErrors.currentPassword = ''" />
						<div class="grid gap-3.5 sm:grid-cols-2">
							<AuthPasswordField id="newPassword" v-model="pw.newPassword" label="New password" autocomplete="new-password"
								placeholder="10+ characters" :error="pwErrors.newPassword" @update:model-value="pwErrors.newPassword = ''" />
							<AuthPasswordField id="newPassword_confirmation" v-model="pw.confirm" label="Confirm new password" autocomplete="new-password"
								placeholder="Repeat it" />
						</div>
						<ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px]" aria-label="Password requirements">
							<li v-for="rule in pwRules" :key="rule.label" class="inline-flex items-center gap-1.5 transition-colors duration-200"
								:class="rule.met ? 'text-emerald-600' : 'text-stone-500'">
								<span class="h-[7px] w-[7px] rounded-full transition-colors duration-200" :class="rule.met ? 'bg-emerald-500' : 'bg-stone-200'" />{{ rule.label }}
							</li>
						</ul>
						<div>
							<ButtonsButton type="submit" :disabled="!pwReady || savingPw">
								<span v-if="savingPw" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
								{{ savingPw ? 'Changing…' : 'Change password' }}
							</ButtonsButton>
						</div>
					</form>
				</section>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { settingsService, type SettingsOverview } from '~/services/settingsService'
import { useAlert } from '~/api/alert/useAlert'

const props = defineProps<{
	account: SettingsOverview['account']
	/** On a page of its own (the admin side), the name is the page's heading; inside Settings it is a section's. */
	standalone?: boolean
}>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'dirty', value: boolean): void }>()

const alert = useAlert()
const { firstName: firstNameCookie, lastName: lastNameCookie } = useAuthSession()

const hasEmail = computed(() => props.account.email !== null)
const fullName = computed(() => `${props.account.firstName} ${props.account.lastName}`.trim())
const initials = computed(() => `${props.account.firstName.charAt(0)}${props.account.lastName.charAt(0)}`.toUpperCase() || '?')

/* ---- details ---- */
const profile = reactive({ firstName: '', lastName: '', email: '' })
const profileErrors = reactive({ firstName: '', lastName: '', email: '', currentPassword: '' })
const emailPassword = ref('')
const saved = computed(() => ({ firstName: props.account.firstName, lastName: props.account.lastName, email: props.account.email ?? '' }))
// A different email (not just different capitals or spaces) is what asks for the password.
const emailChanged = computed(() => hasEmail.value && profile.email.trim().toLowerCase() !== saved.value.email.toLowerCase())
const profileDirty = computed(() => (['firstName', 'lastName', 'email'] as const).some((k) => profile[k].trim() !== saved.value[k]))

function resetProfile() {
	Object.assign(profile, saved.value)
	Object.assign(profileErrors, { firstName: '', lastName: '', email: '', currentPassword: '' })
	emailPassword.value = ''
}
// Fill the form when the account arrives, and again after a save; never over the top of unsaved typing.
watch(saved, (_, before) => {
	const typing = before && (['firstName', 'lastName', 'email'] as const).some((k) => profile[k].trim() !== before[k])
	if (!typing) resetProfile()
}, { immediate: true })

const savingProfile = ref(false)
async function saveProfile() {
	profileErrors.firstName = profile.firstName.trim() ? '' : 'First name is required.'
	profileErrors.lastName = profile.lastName.trim() ? '' : 'Last name is required.'
	profileErrors.email = !hasEmail.value || /^\S+@\S+\.\S+$/.test(profile.email.trim()) ? '' : 'Enter a valid email address.'
	profileErrors.currentPassword = !emailChanged.value || emailPassword.value ? '' : 'Enter your current password to change your email.'
	if (profileErrors.firstName || profileErrors.lastName || profileErrors.email || profileErrors.currentPassword) return

	savingProfile.value = true
	try {
		const result = await settingsService.updateAccount({
			firstName: profile.firstName.trim(),
			lastName: profile.lastName.trim(),
			...(hasEmail.value ? { email: profile.email.trim() } : {}),
			...(emailChanged.value ? { currentPassword: emailPassword.value } : {}),
		})
		// The header reads these cookies, so keep its name and initials current.
		firstNameCookie.value = result.account.firstName
		lastNameCookie.value = result.account.lastName
		emailPassword.value = ''
		alert.success('Details saved')
		emit('saved')
	} catch (err) {
		const fields = apiFieldErrors(err) as Record<string, string>
		Object.assign(profileErrors, { firstName: fields.firstName ?? '', lastName: fields.lastName ?? '', email: fields.email ?? '', currentPassword: fields.currentPassword ?? '' })
		if (!Object.keys(fields).length) alert.error('Could not save your details', apiErrorMessage(err))
	} finally {
		savingProfile.value = false
	}
}

const lockedRows = computed(() => [
	{ label: 'Role', value: props.account.roleLabel, data: false },
	...(props.account.username ? [{ label: 'Username', value: props.account.username, data: true }] : []),
	{ label: 'Phone', value: props.account.phoneNumber, data: true },
])

/* ---- password (staff passwords are at least 10 characters, as the server insists) ---- */
const pw = reactive({ currentPassword: '', newPassword: '', confirm: '' })
const pwErrors = reactive({ currentPassword: '', newPassword: '' })
const pwRules = computed(() => [
	{ label: '10+ characters', met: pw.newPassword.length >= 10 },
	{ label: 'Passwords match', met: !!pw.newPassword && pw.newPassword === pw.confirm },
	{ label: 'Different from current', met: !!pw.newPassword && pw.newPassword !== pw.currentPassword },
])
const pwReady = computed(() => !!pw.currentPassword && pwRules.value.every((r) => r.met))

const savingPw = ref(false)
async function savePassword() {
	if (!pwReady.value) return
	savingPw.value = true
	try {
		await settingsService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword, newPassword_confirmation: pw.confirm })
		Object.assign(pw, { currentPassword: '', newPassword: '', confirm: '' })
		alert.success('Password changed', 'Use the new one next time you sign in.')
	} catch (err) {
		const fields = apiFieldErrors(err) as Record<string, string>
		pwErrors.currentPassword = fields.currentPassword ?? ''
		pwErrors.newPassword = fields.newPassword ?? ''
		if (!Object.keys(fields).length) alert.error('Could not change your password', apiErrorMessage(err))
		else if (fields.currentPassword) document.getElementById('currentPassword')?.focus()
	} finally {
		savingPw.value = false
	}
}

// Tells the Settings page there is something unsaved here, so switching to another section can ask first.
const anythingTyped = computed(() => profileDirty.value || !!pw.currentPassword || !!pw.newPassword || !!pw.confirm)
watch(anythingTyped, (value) => emit('dirty', value), { immediate: true })
onBeforeUnmount(() => emit('dirty', false))
</script>
