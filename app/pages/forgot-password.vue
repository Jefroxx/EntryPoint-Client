<template>
	<section class="auth-pane" data-side="left">
		<div class="mx-auto w-full max-w-[360px]">
			<AuthLogo />

			<!-- After asking: the same message whether or not the address has an account. -->
			<template v-if="sent">
				<div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
					<Icon name="i-tabler-mail-forward" class="h-6 w-6" />
				</div>
				<h1 class="dashboard-heading text-balance text-center text-[26px] font-extrabold leading-[1.15] tracking-[-.02em] text-crimson">Check your email</h1>
				<p class="mt-2 text-center text-[14px] leading-relaxed text-stone-500">
					If <b class="break-all font-semibold text-stone-800">{{ email.trim() }}</b> has an account, a link to choose a new password is on its way.
					It works once, for an hour. Not there? Check your Junk folder.
				</p>

				<ButtonsButton class="mt-6 !h-[46px] w-full !text-[14.5px]" @click="navigateTo('/login')">Back to sign in</ButtonsButton>

				<p class="mt-4 text-center text-[13px] text-stone-500">
					Wrong address, or nothing came?
					<button type="button" class="font-semibold text-accent-600 hover:underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-60"
						:disabled="cooldown > 0" @click="again">
						{{ cooldown > 0 ? `Try again in ${cooldown}s` : 'Send it again' }}
					</button>
				</p>
			</template>

			<template v-else>
				<h1 class="dashboard-heading text-balance text-center text-[30px] font-extrabold leading-[1.15] tracking-[-.02em] text-crimson">Forgot your password?</h1>
				<p class="mb-7 mt-2 text-center text-[14px] text-stone-500">Enter your school email and we'll send a link to choose a new one.</p>

				<form class="grid gap-3.5" novalidate @submit.prevent="send">
					<LibrarianTextField id="forgot-email" v-model="email" label="Email" type="email" autocomplete="email"
						:placeholder="emailDomain ? `you@${emailDomain}` : 'you@school.edu.ph'" :error="fieldError" @update:model-value="fieldError = ''" />

					<ButtonsButton type="submit" class="mt-2 !h-[46px] w-full !text-[14.5px]" :disabled="sending">
						<span v-if="sending" class="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
						{{ sending ? 'Sending…' : 'Send reset link' }}
					</ButtonsButton>
				</form>

				<p class="mt-6 border-t border-stone-100 pt-5 text-center text-[12.5px] text-stone-500">
					Remembered it?
					<NuxtLink to="/login" class="font-semibold text-stone-700 hover:text-accent-500 hover:underline">Back to sign in</NuxtLink>
				</p>
			</template>
		</div>
	</section>
</template>

<script setup lang="ts">
import { authService } from '~/services/authService'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({
	layout: 'auth',
	middleware: 'guest',
	layoutTransition: { name: 'soft-fade', mode: 'out-in' },
	// Out first, then in: this page and sign-in are in the same column, so they must not be on screen together.
	pageTransition: { name: 'auth-swap', mode: 'out-in' },
})

useHead({ title: 'Forgot password' })

const emailDomain = useRuntimeConfig().public.studentEmailDomain as string
const alert = useAlert()

// Whatever was typed on the sign-in page carries over, so nobody types it twice.
const carried = useState<string>('auth-email', () => '')
const email = ref(carried.value)
const fieldError = ref('')
const sending = ref(false)
const sent = ref(false)
const cooldown = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

function startCooldown() {
	cooldown.value = 30
	clearInterval(timer)
	timer = setInterval(() => {
		cooldown.value -= 1
		if (cooldown.value <= 0) clearInterval(timer)
	}, 1000)
}
onBeforeUnmount(() => clearInterval(timer))

async function send() {
	const value = email.value.trim()
	if (!value) { fieldError.value = 'Enter your email.'; return }
	if (!/^\S+@\S+\.\S+$/.test(value)) { fieldError.value = 'Enter a valid email address.'; return }

	sending.value = true
	try {
		await authService.forgotPassword(value)
		carried.value = value
		sent.value = true
		startCooldown()
	} catch (error: any) {
		if (error?.response?.status === 429) alert.error('Too many requests', 'Wait a minute, then try again.')
		else if (error?.response?.status === 422) fieldError.value = apiErrorMessage(error, 'Enter a valid email address.')
		else alert.error('Could not send the link', apiErrorMessage(error, 'Please check your connection and try again.'))
	} finally {
		sending.value = false
	}
}

// "Send it again" and "wrong address" go back to the form with the email still filled in.
function again() {
	sent.value = false
}
</script>
