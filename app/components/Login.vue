<template>
	<AuthShell :subtitle="isLibrarianPortal ? 'Librarian portal' : 'Library management system'">
		<span v-if="isLibrarianPortal"
			class="mb-2.5 inline-flex h-6 items-center gap-1.5 rounded-full bg-stone-200 px-2.5 text-[11.5px] font-semibold text-stone-700">
			<Icon name="i-lucide-shield-check" class="h-3.5 w-3.5" />Staff portal
		</span>
		<h1 class="dashboard-heading text-[22px] font-bold text-amber-900">
			{{ isLibrarianPortal ? 'Librarian sign in' : 'Welcome back' }}
		</h1>
		<p class="mb-5 mt-1 text-[13px] text-stone-500">
			{{ isLibrarianPortal ? 'Staff accounts only.' : 'Sign in with your school email.' }}
		</p>

		<form class="grid gap-3" novalidate @submit.prevent="handleLogin">
			<LibrarianTextField id="email" v-model="email" label="Email" type="email" autocomplete="email"
				placeholder="you@school.edu.ph" @update:model-value="errorMessage = ''" />
			<AuthPasswordField id="password" v-model="password" label="Password" autocomplete="current-password"
				placeholder="••••••••" @update:model-value="errorMessage = ''" />

			<Transition enter-active-class="transition duration-200 ease-out" enter-from-class="-translate-y-1 opacity-0"
				leave-active-class="transition duration-150 ease-out" leave-to-class="opacity-0">
				<div v-if="errorMessage" role="alert"
					class="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-[12.5px] leading-snug text-red-600">
					<Icon name="i-lucide-circle-alert" class="mt-px h-4 w-4 shrink-0" />
					<span>{{ errorMessage }}</span>
				</div>
			</Transition>

			<ButtonsButton type="submit" class="mt-1 !h-[46px] w-full !text-[14.5px]"
				:class="isLibrarianPortal ? '!border-stone-700 !bg-stone-700 hover:!border-stone-900 hover:!bg-stone-900' : ''"
				:disabled="isLoading">
				<span v-if="isLoading" class="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
				{{ isLoading ? 'Signing in…' : 'Sign in' }}
			</ButtonsButton>
		</form>

		<p v-if="!isLibrarianPortal" class="mt-4 text-center text-[13px] text-stone-500">
			New student?
			<NuxtLink to="/register" class="font-semibold text-accent-500 hover:underline">Create an account</NuxtLink>
		</p>

		<p class="mt-4 border-t border-stone-100 pt-4 text-center text-[12.5px] text-stone-400">
			<template v-if="isLibrarianPortal">
				Are you a student?
				<NuxtLink to="/login" class="font-medium text-stone-500 hover:text-accent-500 hover:underline">Go to student sign-in</NuxtLink>
			</template>
			<template v-else>
				Library staff?
				<NuxtLink to="/librarian/login" class="font-medium text-stone-500 hover:text-accent-500 hover:underline">Use the librarian sign-in</NuxtLink>
			</template>
		</p>
	</AuthShell>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth/AuthService'

const props = withDefaults(defineProps<{ portal?: 'student' | 'librarian' }>(), { portal: 'student' })
const isLibrarianPortal = props.portal === 'librarian'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const route = useRoute()
const errorMessage = ref(route.query.expired === '1' ? 'Your session ended. Please sign in again.' : '')
const { signIn } = useAuthSession(isLibrarianPortal ? 'librarian' : 'student')

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
	} finally {
		isLoading.value = false
	}
}
</script>
