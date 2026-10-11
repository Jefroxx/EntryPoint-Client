<template>
	<header class="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-5 sm:pt-6">
		<nav aria-label="Main"
			class="pointer-events-auto flex w-full max-w-[1080px] items-center justify-between gap-3 rounded-full border py-2 pl-5 pr-2 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 ease-out"
			:class="solid
				? 'border-stone-200/80 bg-white/85 shadow-card backdrop-blur-xl'
				: 'landing-glass border-white/20 bg-white/10 backdrop-blur-md'">
			<NuxtLink to="/" class="flex shrink-0 items-center" aria-label="EntryPoint, home">
				<img :src="solid ? wordmark : wordmarkWhite" alt="EntryPoint" class="h-7 w-auto transition-opacity duration-200 sm:h-8" />
			</NuxtLink>

			<ul class="hidden items-center gap-1 md:flex">
				<li v-for="link in links" :key="link.href">
					<a :href="link.href"
						class="rounded-full px-4 py-2 text-[14px] font-semibold transition-colors duration-200"
						:class="solid ? 'text-stone-600 hover:bg-accent-50 hover:text-accent-600' : 'text-white/85 hover:bg-white/15 hover:text-white'">
						{{ link.label }}
					</a>
				</li>
			</ul>

			<div class="flex items-center gap-1.5">
				<NuxtLink to="/login"
					class="hidden whitespace-nowrap rounded-full px-4 py-2.5 text-[14px] font-semibold transition-colors duration-200 sm:block"
					:class="solid ? 'text-stone-700 hover:bg-accent-50' : 'text-white hover:bg-white/15'">
					Sign in
				</NuxtLink>
				<NuxtLink to="/register"
					class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-5 py-2.5 text-[14px] font-bold transition-colors duration-200"
					:class="solid ? 'bg-accent-500 text-white hover:bg-accent-600' : 'bg-white text-accent-600 hover:bg-accent-50'">
					Get started
				</NuxtLink>
			</div>
		</nav>
	</header>
</template>

<script setup lang="ts">
import wordmark from '~/assets/landing/wordmark.png'
import wordmarkWhite from '~/assets/landing/wordmark-white.png'

const links = [
	{ label: 'How it works', href: '#how' },
	{ label: 'Features', href: '#features' },
	{ label: 'Visit us', href: '#visit' },
]

// Glass over the maroon hero; a light, solid bar once the page has scrolled past it.
const solid = ref(false)

onMounted(() => {
	const update = () => {
		solid.value = window.scrollY > window.innerHeight * 0.72
	}
	update()
	window.addEventListener('scroll', update, { passive: true })
	onBeforeUnmount(() => window.removeEventListener('scroll', update))
})
</script>
