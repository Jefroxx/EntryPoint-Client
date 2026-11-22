<template>
	<div>
		<AuthLogo />

		<!-- A moment while the link is checked, so a used or expired one never shows the form. -->
		<p v-if="checking" class="py-10 text-center text-[14px] text-stone-500">Checking your link…</p>

		<!-- Done: the only way on is the button. -->
		<template v-else-if="done">
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
				<Icon name="i-tabler-circle-check" class="h-7 w-7" />
			</div>
			<h1 class="dashboard-heading text-balance text-center text-[26px] font-extrabold leading-[1.15] tracking-[-.02em] text-crimson">Password changed</h1>
			<p class="mt-2 text-center text-[14px] leading-relaxed text-stone-500">Your password has been updated. Sign in with the new one.</p>
			<ButtonsButton class="mt-7 !h-[46px] w-full !text-[14.5px]" @click="navigateTo('/login')">Go to sign in</ButtonsButton>
		</template>

		<!-- The link is missing something, or has been used or has expired. -->
		<template v-else-if="!usable">
			<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
				<Icon name="i-tabler-link-off" class="h-6 w-6" />
			</div>
			<h1 class="dashboard-heading text-balance text-center text-[26px] font-extrabold leading-[1.15] tracking-[-.02em] text-crimson">This link can't be used</h1>
			<p class="mt-2 text-center text-[14px] leading-relaxed text-stone-500">{{ expiredMessage }}</p>
			<ButtonsButton class="mt-7 !h-[46px] w-full !text-[14.5px]" @click="navigateTo('/forgot-password')">Get a new link</ButtonsButton>
			<p class="mt-4 text-center text-[13px]">
				<NuxtLink to="/login" class="font-semibold text-accent-600 hover:underline">Go to sign in</NuxtLink>
			</p>
		</template>

		<template v-else>
			<h1 class="dashboard-heading text-balance text-center text-[28px] font-extrabold leading-[1.15] tracking-[-.02em] text-crimson">Change your password</h1>
			<p class="mb-7 mt-2 text-center text-[14px] text-stone-500">
				For <b class="break-all font-semibold text-stone-700">{{ email }}</b>
			</p>

			<form class="grid gap-3.5" novalidate @submit.prevent="submit">
				<AuthPasswordField id="reset-new" v-model="form.password" label="New password" autocomplete="new-password" placeholder="At least 8 characters"
					:error="errors.password" @update:model-value="errors.password = ''" />
				<AuthPasswordField id="reset-confirm" v-model="form.confirm" label="Confirm new password" autocomplete="new-password" placeholder="Repeat it"
					@update:model-value="errors.password = ''" />

				<ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px]" aria-label="Password requirements">
					<li v-for="rule in rules" :key="rule.label" class="inline-flex items-center gap-1.5 transition-colors duration-200"
						:class="rule.met ? 'text-emerald-600' : 'text-stone-500'">
						<span class="h-[7px] w-[7px] rounded-full transition-colors duration-200" :class="rule.met ? 'bg-emerald-500' : 'bg-stone-200'" />{{ rule.label }}
					</li>
				</ul>

				<ButtonsButton type="submit" class="mt-2 !h-[46px] w-full !text-[14.5px]" :disabled="!ready || saving">
					<span v-if="saving" class="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
					{{ saving ? 'Saving…' : 'Change password' }}
				</ButtonsButton>
			</form>
		</template>
	</div>
</template>

<script setup lang="ts">
import { authService } from '~/services/authService'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({
	// Its own screen, not the sign-in page's: just this task, and a button to sign in once it is done.
	layout: 'focus',
	middleware: 'guest',
	// No animated hand-off between layouts here: out-in between this layout and the sign-in one left a blank page.
	layoutTransition: false,
	pageTransition: false,
})

useHead({ title: 'Change your password' })

const route = useRoute()
const alert = useAlert()

// From the link in the email.
const token = String(route.query.token ?? '')
const email = String(route.query.email ?? '')

// Set when the server says the link is no good (used, expired): the page then offers a new one instead of the form.
const expiredMessage = ref('This link is incomplete. Ask for a new one and use the link in the newest email.')
const rejected = ref(false)
const usable = computed(() => !!token && !!email && !rejected.value)
const done = ref(false)

// Asked once the page is open: a link that was already used, or has expired, is refused before anything is typed.
const checking = ref(!!token && !!email)
onMounted(async () => {
	if (!checking.value) return
	try {
		if (!(await authService.checkResetLink(email, token))) {
			expiredMessage.value = 'This link has expired or was already used. Ask for a new one and use the link in the newest email.'
			rejected.value = true
		}
	} catch {
		// Could not ask (offline, server down): show the form, and saving it will say if the link is no good.
	} finally {
		checking.value = false
	}
})

const form = reactive({ password: '', confirm: '' })
const errors = reactive({ password: '' })
const saving = ref(false)

const rules = computed(() => [
	{ label: '8+ characters', met: form.password.length >= 8 },
	{ label: 'Passwords match', met: !!form.password && form.password === form.confirm },
])
const ready = computed(() => rules.value.every((rule) => rule.met))

async function submit() {
	if (!ready.value || saving.value) return
	saving.value = true
	errors.password = ''

	try {
		await authService.resetPassword({ email, token, password: form.password, password_confirmation: form.confirm })
		// Shown here, with a button to sign in. Nothing sends the person on by itself.
		done.value = true
		form.password = ''
		form.confirm = ''
	} catch (error: any) {
		const fields = apiFieldErrors(error)
		if (error?.response?.status === 429) {
			alert.error('Too many tries', 'Wait a minute, then try again.')
		} else if (fields.password) {
			errors.password = fields.password
		} else if (fields.email || fields.token) {
			// An expired or already-used link.
			expiredMessage.value = fields.email || fields.token || expiredMessage.value
			rejected.value = true
		} else {
			alert.error('Could not save the password', apiErrorMessage(error, 'Please check your connection and try again.'))
		}
	} finally {
		saving.value = false
	}
}
</script>
