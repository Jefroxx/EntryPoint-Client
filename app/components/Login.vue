<template>
	<AuthShell :subtitle="isLibrarianPortal ? 'Librarian portal' : 'Library management system'">
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

			<ButtonsButton type="submit" class="mt-1 !h-[46px] w-full !text-[14.5px]" :disabled="isLoading">
				<span v-if="isLoading" class="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
				{{ isLoading ? 'Signing in…' : 'Sign in' }}
			</ButtonsButton>
		</form>

		<p v-if="!isLibrarianPortal" class="mt-4 text-center text-[13px] text-stone-500">
			New student?
			<NuxtLink to="/register" class="font-semibold text-accent-500 hover:underline">Create an account</NuxtLink>
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
const errorMessage = ref('')
const { signIn } = useAuthSession()

async function handleLogin() {
	if (!email.value.trim() || !password.value) {
		errorMessage.value = 'Enter your email and password.'
		return
	}

	isLoading.value = true
	errorMessage.value = ''

	try {
		if (!isLibrarianPortal) {
			await authService.login(email.value.trim(), password.value)

			// The student portal isn't built yet; don't leave a student session behind.
			errorMessage.value = 'Your account is approved, but the student portal is not available yet.'
			return
		}

		const { token, user } = await authService.librarianLogin(email.value.trim(), password.value)

		signIn({ token, uuid: user.uuid, role: user.userType, firstName: user.firstName, lastName: user.lastName })
		await navigateTo('/librarian/dashboard')
	} catch (error: any) {
		errorMessage.value = error?.message || 'Invalid email or password.'
	} finally {
		isLoading.value = false
	}
}
</script>
