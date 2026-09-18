<template>
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <UCard class="w-full max-w-sm">
            <template #header>
                <h1 class="text-center text-2xl font-semibold text-gray-800">
                    Sign in
                </h1>
            </template>

            <form @submit.prevent="handleLogin" class="space-y-4">
                <div>
                    <label for="email" class="mb-1 block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <UInput id="email" v-model="email" type="email" required autocomplete="email"
                        placeholder="you@example.com" class="w-full" />
                </div>

                <div>
                    <label for="password" class="mb-1 block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <UInput id="password" v-model="password" type="password" required autocomplete="current-password"
                        placeholder="••••••••" class="w-full" />
                </div>

                <UAlert v-if="errorMessage" color="error" variant="subtle" :title="errorMessage" />

                <UButton type="submit" block :loading="isLoading" :disabled="isLoading">
                    {{ isLoading ? 'Signing in...' : 'Sign in' }}
                </UButton>
            </form>
        </UCard>
    </div>
</template>

<script setup lang="ts">
import { authService } from '~/services/auth/AuthService'

const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
    isLoading.value = true
    errorMessage.value = ''

    try {
        const { token, user } = await authService.login(email.value, password.value)

        useCookie('_token').value = token
        useCookie('_uuid').value = user.uuid
        useCookie('_role').value = user.userType
        useCookie('_firstName').value = user.firstName
        useCookie('_lastName').value = user.lastName

        if (user.userType === 'librarian') {
            await navigateTo('/librarian/dashboard')
        } else {
            errorMessage.value = 'Student portal is not available yet.'
        }
    } catch (error: any) {
        errorMessage.value = error?.message || 'Invalid email or password.'
    } finally {
        isLoading.value = false
    }
}
</script>