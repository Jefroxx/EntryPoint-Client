<template>
	<section id="visit" class="px-3 pb-3" aria-labelledby="visit-heading">
		<div class="px-3 py-14 sm:px-7 sm:py-20 lg:px-13 lg:py-28">
			<div class="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20">
				<div>
					<h2 id="visit-heading" class="text-balance text-[clamp(34px,4.4vw,60px)] font-extrabold leading-[1.03] tracking-[-.03em] text-accent-800">
						Visit the library.
					</h2>
					<address class="mt-8 space-y-6 not-italic">
						<div class="flex gap-4">
							<Icon name="i-tabler-map-pin" class="mt-1 h-6 w-6 shrink-0 text-accent-400" aria-hidden="true" />
							<p class="max-w-[34ch] text-[18px] font-semibold leading-snug text-accent-800">
								4th floor, STI College Davao
								<span class="mt-1 block text-[16px] font-medium text-stone-600">
									#506 Lim Building, J.P. Laurel Avenue, corner Acacia, Davao City, Philippines 8000
								</span>
							</p>
						</div>
						<div class="flex gap-4">
							<Icon name="i-tabler-mail" class="mt-0.5 h-6 w-6 shrink-0 text-accent-400" aria-hidden="true" />
							<a :href="`mailto:${email}`" class="break-all text-[18px] font-semibold text-accent-700 underline decoration-accent-300 decoration-2 underline-offset-[6px] transition-colors duration-200 hover:text-accent-500">
								{{ email }}
							</a>
						</div>
					</address>
				</div>

				<div>
					<h3 class="flex items-center gap-3 text-[21px] font-bold text-accent-800">
						<Icon name="i-tabler-clock" class="h-6 w-6 text-accent-400" aria-hidden="true" />
						Opening hours
					</h3>
					<dl class="mt-5 divide-y divide-accent-200 border-y border-accent-200">
						<div v-for="row in hours" :key="row.days" class="flex items-baseline justify-between gap-6 py-3.5">
							<dt class="text-[16px] font-semibold text-stone-700">{{ row.days }}</dt>
							<dd class="text-right text-[15.5px] tabular-nums" :class="row.times ? 'text-stone-700' : 'font-semibold text-stone-600'">
								<template v-if="row.times">
									<span v-for="t in row.times" :key="t" class="block">{{ t }}</span>
								</template>
								<template v-else>Closed</template>
							</dd>
						</div>
					</dl>
				</div>
			</div>
		</div>

		<!-- The close. -->
		<div class="landing-maroon relative isolate overflow-hidden rounded-[28px] px-6 py-20 sm:px-10 lg:px-16 lg:py-24">
			<img :src="compass" alt="" aria-hidden="true" class="landing-compass pointer-events-none absolute -right-24 top-1/2 -z-10 w-[min(90vw,560px)] max-w-none -translate-y-1/2 opacity-[.1]" />
			<div class="mx-auto max-w-[1180px]">
				<h2 class="max-w-[14ch] text-balance text-[clamp(38px,5.4vw,76px)] font-extrabold leading-[1] tracking-[-.035em] text-white">
					Ready to borrow?
				</h2>
				<p class="mt-5 max-w-[440px] text-pretty text-[17px] leading-relaxed text-white/80">
					Register with your school email, then stop by the desk to be approved.
				</p>
				<div class="mt-9 flex flex-wrap gap-3">
					<NuxtLink to="/register"
						class="group inline-flex h-[52px] items-center gap-2 rounded-full bg-white pl-7 pr-6 text-[15px] font-bold text-accent-600 transition-colors duration-200 hover:bg-accent-50">
						Create an account
						<Icon name="i-tabler-arrow-right" class="h-[18px] w-[18px] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
					</NuxtLink>
					<NuxtLink to="/login"
						class="inline-flex h-[52px] items-center rounded-full border-[1.5px] border-white/70 px-7 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-white hover:text-accent-600">
						Sign in
					</NuxtLink>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import compass from '~/assets/landing/compass-white.png'

const email = 'femiajoy.arce@davao.sti.edu'

// From the library's own page, as confirmed by the team.
const weekday = ['8:00 AM – 12:00 PM', '1:00 PM – 5:00 PM']
const hours = [
	{ days: 'Monday', times: weekday },
	{ days: 'Tuesday', times: weekday },
	{ days: 'Wednesday', times: weekday },
	{ days: 'Thursday', times: weekday },
	{ days: 'Friday', times: weekday },
	{ days: 'Saturday', times: null },
	{ days: 'Sunday', times: null },
]
</script>
