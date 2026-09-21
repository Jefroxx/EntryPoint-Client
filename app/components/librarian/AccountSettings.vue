<template>
	<div class="space-y-3">
		<section class="rounded-2xl border border-stone-200 bg-white p-5">
			<h2 class="text-[15px] font-bold text-stone-900">Profile</h2>
			<p class="mb-4 text-[13.5px] text-stone-400">Your name appears in the header and in student notifications.</p>

			<div class="space-y-4">
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<LibrarianTextField id="account-first" v-model="profile.firstName" label="First name"
						:error="profileErrors.firstName" autocomplete="given-name" />
					<LibrarianTextField id="account-last" v-model="profile.lastName" label="Last name"
						:error="profileErrors.lastName" autocomplete="family-name" />
				</div>
				<LibrarianTextField id="account-email" v-model="profile.email" type="email" label="Email"
					:error="profileErrors.email" autocomplete="email" />
			</div>

			<div class="mt-5 flex justify-end border-t border-stone-100 pt-4">
				<ButtonsButton variant="primary" :disabled="!profileDirty || savingProfile" @click="saveProfile">
					<Icon v-if="savingProfile" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
					Save profile
				</ButtonsButton>
			</div>
		</section>

		<section class="rounded-2xl border border-stone-200 bg-white p-5">
			<h2 class="text-[15px] font-bold text-stone-900">Password</h2>
			<p class="mb-4 text-[13.5px] text-stone-400">Use at least 8 characters.</p>

			<div class="space-y-4">
				<LibrarianTextField id="account-current" v-model="password.currentPassword" type="password"
					label="Current password" :error="passwordErrors.currentPassword" autocomplete="current-password" />
				<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
					<LibrarianTextField id="account-new" v-model="password.newPassword" type="password" label="New password"
						:error="passwordErrors.newPassword" autocomplete="new-password" />
					<LibrarianTextField id="account-confirm" v-model="password.newPassword_confirmation" type="password"
						label="Confirm new password" autocomplete="new-password" />
				</div>
			</div>

			<div class="mt-5 flex justify-end border-t border-stone-100 pt-4">
				<ButtonsButton variant="primary" :disabled="!passwordReady || savingPassword" @click="savePassword">
					<Icon v-if="savingPassword" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
					Change password
				</ButtonsButton>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { settingsService, type SettingsOverview } from '~/services/settingsService'
import { useAlert } from '~/api/alert/useAlert'

const props = defineProps<{ account: SettingsOverview['account'] }>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const alert = useAlert()
const { firstName: firstNameCookie, lastName: lastNameCookie } = useAuthSession()

// ---- Profile ----
const profile = reactive({ ...props.account })
const profileErrors = reactive({ firstName: '', lastName: '', email: '' })
const savingProfile = ref(false)

watch(() => props.account, (account) => Object.assign(profile, account))

const profileDirty = computed(() =>
    profile.firstName !== props.account.firstName ||
    profile.lastName !== props.account.lastName ||
    profile.email !== props.account.email)

async function saveProfile() {
	Object.assign(profileErrors, { firstName: '', lastName: '', email: '' })
	savingProfile.value = true

	try {
		const result = await settingsService.updateAccount({
			firstName: profile.firstName.trim(),
			lastName: profile.lastName.trim(),
			email: profile.email.trim(),
		})

		// The header reads these cookies, so keep its name and initials current.
		firstNameCookie.value = result.account.firstName
		lastNameCookie.value = result.account.lastName

		alert.success('Profile saved')
		emit('saved')
	} catch (error) {
		const fields = apiFieldErrors(error)
		profileErrors.firstName = fields.firstName ?? ''
		profileErrors.lastName = fields.lastName ?? ''
		profileErrors.email = fields.email ?? ''
		alert.error('Could not save profile', apiErrorMessage(error))
	} finally {
		savingProfile.value = false
	}
}

// ---- Password ----
const password = reactive({ currentPassword: '', newPassword: '', newPassword_confirmation: '' })
const passwordErrors = reactive({ currentPassword: '', newPassword: '' })
const savingPassword = ref(false)

const passwordReady = computed(() => !!password.currentPassword && !!password.newPassword && !!password.newPassword_confirmation)

async function savePassword() {
	Object.assign(passwordErrors, { currentPassword: '', newPassword: '' })

	if (password.newPassword !== password.newPassword_confirmation) {
		passwordErrors.newPassword = 'The new passwords don\'t match.'
		return
	}

	savingPassword.value = true

	try {
		await settingsService.changePassword({ ...password })
		Object.assign(password, { currentPassword: '', newPassword: '', newPassword_confirmation: '' })
		alert.success('Password changed')
	} catch (error) {
		const fields = apiFieldErrors(error)
		passwordErrors.currentPassword = fields.currentPassword ?? ''
		passwordErrors.newPassword = fields.newPassword ?? ''
		alert.error('Could not change password', apiErrorMessage(error))
	} finally {
		savingPassword.value = false
	}
}
</script>
