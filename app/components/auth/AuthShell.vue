<template>
	<div class="flex min-h-screen justify-center bg-amber-50 px-4 pb-12 pt-12 sm:pt-16">
		<div class="w-full" :class="wide ? 'max-w-[560px]' : 'max-w-[400px] sm:mt-[6vh]'">
			<div class="mb-5 text-center">
				<NuxtLink to="/" class="dashboard-heading text-[26px] font-bold text-amber-900">EntryPoint</NuxtLink>
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
</script>
