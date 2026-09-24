<template>
	<div class="mx-auto w-full max-w-[360px]">
		<AuthLogo />
		<h1 class="dashboard-heading text-balance text-center text-[30px] font-extrabold leading-[1.15] tracking-[-.02em] text-amber-900">
			{{ isLibrarianPortal ? 'Librarian sign-in' : 'Welcome back' }}
		</h1>
		<p class="mb-7 mt-2 text-center text-[14px] text-stone-500">
			{{ isLibrarianPortal ? 'Staff accounts only.' : 'Sign in with your school email.' }}
		</p>

		<!-- Where the link in the confirmation email lands (the server redirects here with ?verified=). -->
		<div v-if="notice" role="status"
			class="-mt-3 mb-5 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-[12.5px] leading-snug text-emerald-700">
			<Icon name="i-tabler-mail-check" class="mt-px h-4 w-4 shrink-0" />
			<span>{{ notice }}</span>
		</div>

		<form class="grid gap-3.5" novalidate @submit.prevent="handleLogin">
			<LibrarianTextField id="email" v-model="email" label="Email" type="email" autocomplete="email"
				:placeholder="!isLibrarianPortal && emailDomain ? `you@${emailDomain}` : 'you@school.edu.ph'" @update:model-value="errorMessage = ''" />
			<AuthPasswordField id="password" v-model="password" label="Password" autocomplete="current-password"
				placeholder="••••••••" @update:model-value="errorMessage = ''" />

			<Transition enter-active-class="transition duration-200 ease-out"
				enter-from-class="-translate-y-1 opacity-0" leave-active-class="transition duration-150 ease-out"
				leave-to-class="opacity-0">
				<div v-if="errorMessage" role="alert"
					class="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[12.5px] leading-snug text-red-600">
					<Icon name="i-tabler-alert-circle" class="mt-px h-4 w-4 shrink-0" />
					<span>{{ errorMessage }}</span>
				</div>
			</Transition>

			<!-- Stays after the error clears: an expired link means typing the email in first, then asking. -->
			<p v-if="canResend" class="-mt-1 text-[12.5px] text-stone-500">
				<template v-if="resendState === 'sent'">
					<Icon name="i-tabler-check" class="-mt-px mr-0.5 inline h-3.5 w-3.5 text-emerald-600" />New link sent to
					<b class="font-semibold text-stone-700">{{ email.trim() }}</b>. Check your inbox and Junk folder.
				</template>
				<template v-else>
					Didn't get the email?
					<button type="button" class="font-semibold text-accent-600 hover:underline disabled:opacity-60"
						:disabled="resendState === 'sending'" @click="resend">
						{{ resendState === 'sending' ? 'Sending…' : 'Send a new link' }}
					</button>
				</template>
			</p>

			<ButtonsButton type="submit" class="mt-2 !h-[46px] w-full !text-[14.5px]" :disabled="isLoading">
				<span v-if="isLoading"
					class="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
				{{ isLoading ? 'Signing in…' : 'Sign in' }}
			</ButtonsButton>
		</form>

		<!-- On wide screens the brand panel carries this link. -->
		<p v-if="!isLibrarianPortal" class="mt-5 text-center text-[13.5px] text-stone-500 lg:hidden">
			New to the library?
			<NuxtLink to="/register" class="group inline-flex items-center gap-1 font-semibold text-accent-600 hover:underline">
				Create an account<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5 transition-transform duration-150 ease-out group-hover:translate-x-0.5" />
			</NuxtLink>
		</p>

		<!-- Shown on every screen for both portals: it keeps the two sign-in pages the same height, so the
			 logo, heading and fields sit in exactly the same place on each. -->
		<p class="mt-6 border-t border-stone-100 pt-5 text-center text-[12.5px] text-stone-500">
			<template v-if="isLibrarianPortal">
				Are you a student?
				<NuxtLink to="/login" class="font-semibold text-stone-700 hover:text-accent-500 hover:underline">Go to student sign-in</NuxtLink>
			</template>
			<template v-else>
				Library staff?
				<NuxtLink to="/librarian/login" class="font-semibold text-stone-700 hover:text-accent-500 hover:underline">Use the librarian sign-in</NuxtLink>
			</template>
		</p>
	</div>
</template>

<script setup lang="ts">
import { authService, NeedsVerificationError } from '~/services/auth/AuthService'

const props = withDefaults(defineProps<{ portal?: 'student' | 'librarian' }>(), { portal: 'student' })
const isLibrarianPortal = props.portal === 'librarian'
const emailDomain = useRuntimeConfig().public.studentEmailDomain as string

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const route = useRoute()
const { signIn } = useAuthSession(isLibrarianPortal ? 'librarian' : 'student')

// ?verified= is set by the server after the student clicks the link in their confirmation email.
const verified = String(route.query.verified ?? '')
const notice = ref(
	verified === '1' ? "Email confirmed. A librarian will now review your registration; you can sign in once it's approved."
		: verified === 'already' ? "That email is already confirmed. You can sign in once a librarian approves your registration."
			: '',
)
const errorMessage = ref(
	route.query.expired === '1' ? 'Your session ended. Please sign in again.'
		: verified === 'expired' ? 'That confirmation link has expired. Enter your email below and send yourself a new one.'
			: verified === 'invalid' ? "That confirmation link isn't valid. Enter your email below and send yourself a new one."
				: '',
)

const canResend = ref(verified === 'expired' || verified === 'invalid')
const resendState = ref<'idle' | 'sending' | 'sent'>('idle')

async function resend() {
	if (!email.value.trim()) {
		errorMessage.value = 'Enter your email above first.'
		return
	}

	resendState.value = 'sending'
	try {
		await authService.resendVerification(email.value.trim())
		errorMessage.value = ''
		resendState.value = 'sent'
	} catch (error: any) {
		errorMessage.value = error?.response?.status === 429
			? 'Too many requests. Wait a minute, then try again.'
			: apiErrorMessage(error, "Couldn't send a new link. Please try again.")
		resendState.value = 'idle'
	}
}

async function handleLogin() {
	if (!email.value.trim() || !password.value) {
		errorMessage.value = 'Enter your email and password.'
		return
	}

	isLoading.value = true
	errorMessage.value = ''

	try {
		const { token, user } = isLibrarianPortal
			? await authService.librarianLogin(email.value.trim(), password.value)
			: await authService.login(email.value.trim(), password.value)

		signIn({ token, uuid: user.uuid, role: user.userType, firstName: user.firstName, lastName: user.lastName })

		// Back to the page the session ended on, or the user's own home.
		await navigateTo(safeRedirect(route.query.redirect, user.userType))
	} catch (error: any) {
		errorMessage.value = error?.message || 'Invalid email or password.'
		if (error instanceof NeedsVerificationError) {
			canResend.value = true
			resendState.value = 'idle'
		}
	} finally {
		isLoading.value = false
	}
}
</script>
