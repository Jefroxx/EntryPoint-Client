<template>
	<div class="flex min-h-screen justify-center bg-amber-50 px-4 pb-12 pt-12 sm:pt-16">
		<div class="w-full" :class="wide ? 'max-w-[560px]' : 'max-w-[400px] sm:mt-[6vh]'">
			<div class="mb-5 text-center">
				<NuxtLink :to="signInPath" class="inline-flex items-center leading-none" aria-label="EntryPoint">
					<img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-10 w-auto" />
				</NuxtLink>
				<p v-if="subtitle" class="mt-1.5 text-[13.5px] text-stone-500">{{ subtitle }}</p>
			</div>
			<div class="rounded-[20px] border border-stone-200 bg-white p-6 shadow-[0_18px_40px_-26px_rgba(28,23,18,.35)] sm:p-7">
				<slot />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	subtitle?: string
	wide?: boolean
}>()

// The logo returns to the sign-in that belongs to the area you are in.
const signInPath = useRoute().path.toLowerCase().startsWith('/librarian') ? '/librarian/login' : '/login'
</script>
