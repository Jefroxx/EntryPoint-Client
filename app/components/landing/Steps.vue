<template>
	<section id="how" class="px-3" aria-labelledby="how-heading">
		<div class="landing-maroon relative isolate overflow-hidden rounded-[28px] px-6 py-20 sm:px-10 lg:px-16 lg:py-28">
			<div class="mx-auto grid max-w-[1180px] items-center gap-16 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20">
				<div>
					<h2 id="how-heading" class="max-w-[14ch] text-balance text-[clamp(36px,4.8vw,64px)] font-extrabold leading-[1.02] tracking-[-.03em] text-white">
						Three steps to borrowing.
					</h2>
					<p class="mt-5 max-w-[440px] text-pretty text-[17px] leading-relaxed text-white/80">
						Your account works once a librarian approves it at the desk.
					</p>

					<ol class="mt-12 space-y-9">
						<li v-for="(step, i) in steps" :key="step.title" class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5">
							<span class="flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-[17px] font-bold tabular-nums text-white">{{ i + 1 }}</span>
							<div>
								<h3 class="text-[21px] font-bold leading-tight text-white">{{ step.title }}</h3>
								<p class="mt-1.5 max-w-[400px] text-pretty text-[16px] leading-relaxed text-white/75">{{ step.body }}</p>
							</div>
						</li>
					</ol>

					<NuxtLink to="/register"
						class="group mt-12 inline-flex h-[52px] items-center gap-2 rounded-full bg-white pl-7 pr-6 text-[15px] font-bold text-accent-600 transition-colors duration-200 hover:bg-accent-50">
						Create an account
						<Icon name="i-tabler-arrow-right" class="h-[18px] w-[18px] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
					</NuxtLink>
				</div>

				<!-- A phone inside the logo's circle. The compass behind it turns with the page. -->
				<div class="relative mx-auto aspect-square w-full max-w-[520px]">
					<div class="absolute inset-0 rounded-full bg-white/[.08]" aria-hidden="true" />
					<img :src="compass" alt="" aria-hidden="true" class="landing-compass pointer-events-none absolute inset-[6%] h-[88%] w-[88%] max-w-none opacity-[.16]" />
					<img :src="phone" alt="A student's home screen on a phone: knowledge points, visit streak and what needs attention"
						width="640" height="1385" loading="lazy"
						class="absolute left-1/2 top-[8%] block w-[43%] -translate-x-1/2 rounded-[28px] bg-white shadow-overlay ring-1 ring-white/25" />
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import compass from '~/assets/landing/compass-white.png'
import phone from '~/assets/landing/student-home-phone.webp'

// The same three steps as the register page, in the same words.
const steps = [
	{ title: 'Register online', body: 'Your school email and student ID.' },
	{ title: 'Get approved at the desk', body: 'Bring your school ID. A librarian checks it.' },
	{ title: 'Scan in and borrow', body: 'Your Library ID gets you in and books out.' },
]
</script>
