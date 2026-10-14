<template>
	<section class="p-3" aria-labelledby="hero-heading">
		<div class="relative isolate flex min-h-[calc(100svh-24px)] flex-col overflow-hidden rounded-[28px]">
			<!-- The maroon field, behind everything. -->
			<div class="landing-maroon pointer-events-none absolute inset-0 -z-20 rounded-[28px]" aria-hidden="true" />
			<!-- The big compass behind everything: the logo's own circle, turning with the page. -->
			<img :src="compass" alt="" aria-hidden="true"
				class="landing-compass pointer-events-none absolute -right-[14%] top-[2%] -z-10 w-[min(88vw,780px)] max-w-none opacity-[.16] sm:-right-[8%] sm:opacity-[.18]" />

			<div class="px-6 pb-2 pt-28 sm:px-10 sm:pt-36 lg:px-16 lg:pt-[clamp(92px,12.5vh,128px)]">
				<h1 id="hero-heading"
					class="max-w-[12ch] text-balance text-[clamp(46px,min(5.6vw,9.6vh),82px)] font-extrabold leading-[.98] tracking-[-.035em] text-white">
					Your library,
					<span class="block text-accent-200">one scan away.</span>
				</h1>
				<p class="mt-5 max-w-[470px] text-pretty text-[17px] leading-relaxed text-white/80 sm:text-[18px]">
					EntryPoint is the STI College Davao library system. Find a book, borrow it, and scan in with your Library ID.
				</p>
				<div class="mt-7 flex flex-wrap items-center gap-3">
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

			<!-- Real screens, fanned out. The phone Library ID is the centre; the outer pair drop away on narrow screens. -->
			<div class="mt-auto px-3 pb-8 pt-5 sm:pt-7" style="perspective: 1500px">
				<ul class="hero-fan flex items-end justify-center gap-3 sm:gap-4 lg:gap-6" role="list">
					<li v-for="(screen, i) in screens" :key="screen.alt" class="hero-card" :class="screen.show"
						:style="{ '--ry': `${screen.ry}deg`, '--y': `${screen.y}px`, '--z': `${screen.z}px`, animationDelay: `${120 + i * 70}ms` }">
						<img :src="screen.src" :alt="screen.alt" :width="screen.phone ? 640 : 1600" :height="screen.phone ? 1385 : 1000"
							class="block h-auto bg-white shadow-overlay ring-1 ring-white/25"
							:class="screen.phone ? 'w-[clamp(150px,11vw,162px)] rounded-[26px]' : 'w-[clamp(190px,18vw,272px)] rounded-2xl'"
							:loading="i === 2 ? 'eager' : 'lazy'" />
					</li>
				</ul>
				<!-- Below the fan, clear of the tilted screens: the outer pair hang about 34px lower than the middle. -->
				<p class="mt-12 text-center text-[12.5px] text-white/65">Real screens from the system, shown with sample data.</p>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import compass from '~/assets/landing/compass-white.png'
import circulation from '~/assets/landing/librarian-circulation.webp'
import discover from '~/assets/landing/student-discover.webp'
import libraryId from '~/assets/landing/student-id-phone.webp'
import dashboard from '~/assets/landing/librarian-dashboard.webp'
import rewards from '~/assets/landing/student-rewards.webp'

const screens = [
	{ src: circulation, alt: 'Librarian circulation page listing active loans', ry: 34, y: 34, z: -150, show: 'hidden lg:block', phone: false },
	{ src: discover, alt: 'Student catalog with live availability', ry: 20, y: 12, z: -70, show: 'hidden sm:block', phone: false },
	{ src: libraryId, alt: 'A student\'s Library ID with its barcode, on a phone', ry: 0, y: -8, z: 40, show: '', phone: true },
	{ src: dashboard, alt: 'Librarian dashboard showing what needs attention', ry: -20, y: 12, z: -70, show: 'hidden sm:block', phone: false },
	{ src: rewards, alt: 'Student rewards page with a points balance', ry: -34, y: 34, z: -150, show: 'hidden lg:block', phone: false },
]
</script>

<style scoped>
.hero-fan {
	transform-style: preserve-3d;
}

.hero-card {
	transform: translateY(var(--y)) translateZ(var(--z)) rotateY(var(--ry));
	animation: heroRise 900ms var(--ease-out) both;
}

/* Rises into place once. The cards are fully visible at rest; the animation only moves them. */
@keyframes heroRise {
	from {
		transform: translateY(calc(var(--y) + 56px)) translateZ(var(--z)) rotateY(var(--ry));
	}
}

@media (prefers-reduced-motion: reduce) {
	.hero-card {
		animation: none;
	}
}
</style>
