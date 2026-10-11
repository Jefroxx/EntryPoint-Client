<template>
	<footer class="px-3 pb-3">
		<div class="landing-footer rounded-[28px] bg-accent-900 px-6 py-14 text-white sm:px-10 lg:px-16 lg:py-16">
			<div class="mx-auto grid max-w-[1180px] gap-12 md:grid-cols-[minmax(0,5fr)_minmax(0,3fr)_minmax(0,4fr)]">
				<div>
					<img :src="wordmarkWhite" alt="EntryPoint" class="h-9 w-auto" />
					<p class="mt-5 max-w-[34ch] text-pretty text-[15.5px] leading-relaxed text-white/70">
						The library system of STI College Davao, built as a capstone project.
					</p>
				</div>

				<nav aria-label="Footer">
					<h2 class="text-[15px] font-bold text-white">Go to</h2>
					<ul class="mt-4 space-y-2.5 text-[15px] text-white/75">
						<li v-for="link in links" :key="link.label">
							<NuxtLink :to="link.to" class="transition-colors duration-200 hover:text-white">{{ link.label }}</NuxtLink>
						</li>
					</ul>
				</nav>

				<div>
					<h2 class="text-[15px] font-bold text-white">The team</h2>
					<ul class="mt-4 space-y-2.5 text-[15px] text-white/75">
						<li v-for="name in team" :key="name">{{ name }}</li>
					</ul>
					<p class="mt-5 text-[14px] text-white/55">Adviser: Dominic R. Bantigue</p>
				</div>
			</div>

			<p class="mx-auto mt-14 max-w-[1180px] border-t border-white/15 pt-6 text-[13px] text-white/55">
				EntryPoint · STI College Davao Library · © {{ year }}
			</p>
		</div>
	</footer>
</template>

<script setup lang="ts">
import wordmarkWhite from '~/assets/landing/wordmark-white.png'

const year = new Date().getFullYear()

const links = [
	{ label: 'Student sign-in', to: '/login' },
	{ label: 'Create an account', to: '/register' },
	{ label: 'Librarian sign-in', to: '/librarian/login' },
	{ label: 'Opening hours', to: '/#visit' },
]

const team = ['Matt Oliver U. Pojadas', 'Stephen A. Duray', 'John Lloyd G. Adlaw', 'Ralph Vincent A. Agang']
</script>
