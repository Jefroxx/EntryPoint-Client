<template>
	<section id="features" class="px-6 py-24 sm:px-10 lg:px-16 lg:py-32" aria-labelledby="features-heading">
		<div class="mx-auto max-w-[1180px]">
			<div class="max-w-[640px]">
				<h2 id="features-heading" class="text-balance text-[clamp(34px,4.4vw,60px)] font-extrabold leading-[1.03] tracking-[-.03em] text-accent-800">
					Built for both sides of the desk.
				</h2>
				<p class="mt-5 max-w-[520px] text-pretty text-[17px] leading-relaxed text-stone-600">
					Students use it from their phone. Librarians run the desk from a laptop. These are the actual pages.
				</p>
			</div>

			<div class="mt-14 grid gap-4 lg:grid-cols-12">
				<!-- Circulation -->
				<article class="tile bg-white lg:col-span-7 lg:min-h-[470px]">
					<h3 class="tile-title text-accent-800">Check books out and take them back.</h3>
					<p class="tile-body text-stone-600">Active loans, reservations, returns and penalties in one place, with overdue books flagged.</p>
					<div class="tile-shot">
						<img :src="circulation" alt="Librarian circulation page with a table of active loans" width="1600" height="1000" loading="lazy" class="shot" />
					</div>
				</article>

				<!-- Discover -->
				<article class="tile bg-accent-100 lg:col-span-5 lg:min-h-[470px]">
					<h3 class="tile-title text-accent-800">Find a book before you walk over.</h3>
					<p class="tile-body text-accent-700/80">Search the catalog and see how many copies are on the shelf right now.</p>
					<div class="tile-shot">
						<img :src="discover" alt="Student catalog showing books with how many copies are available" width="1600" height="1000" loading="lazy" class="shot" />
					</div>
				</article>

				<!-- Attendance -->
				<article class="tile bg-white lg:col-span-4 lg:min-h-[420px]">
					<h3 class="tile-title text-accent-800">Scan in and out at the door.</h3>
					<p class="tile-body text-stone-600">A time-stamped record of who is in the library and for how long.</p>
					<div class="tile-shot">
						<img :src="attendance" alt="Librarian attendance page with entry and exit times" width="1600" height="1000" loading="lazy" class="shot" />
					</div>
				</article>

				<!-- Rewards -->
				<article class="tile bg-accent-200/70 lg:col-span-4 lg:min-h-[420px]">
					<h3 class="tile-title text-accent-800">Points, streaks and a reward shop.</h3>
					<p class="tile-body text-accent-700/80">Knowledge points and visit streaks can be spent on supplies and library merchandise.</p>
					<div class="tile-shot">
						<img :src="rewards" alt="Student rewards page with a points balance and marketplace" width="1600" height="1000" loading="lazy" class="shot" />
					</div>
				</article>

				<!-- Everything else -->
				<article class="tile tile--list landing-maroon text-white lg:col-span-4 lg:min-h-[420px]">
					<h3 class="tile-title text-white">And the rest of the library.</h3>
					<ul class="mt-6 divide-y divide-white/15 border-y border-white/15">
						<li v-for="item in more" :key="item" class="py-3 text-[15.5px] font-semibold text-white/90">{{ item }}</li>
					</ul>
				</article>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import circulation from '~/assets/landing/librarian-circulation.webp'
import discover from '~/assets/landing/student-discover.webp'
import attendance from '~/assets/landing/librarian-attendance.webp'
import rewards from '~/assets/landing/student-rewards.webp'

const more = [
	'Suggest a book and follow its status',
	'Wishlist and reservations',
	'Facility and computer availability',
	'Reports for the library',
	'Student approvals at the desk',
	'Due-date and desk notifications',
]
</script>

<style scoped>
.tile {
	position: relative;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	border-radius: 28px;
	padding: 2rem 2rem 0;
	box-shadow: var(--shadow-card);
}

.tile--list {
	padding-bottom: 2rem;
}

.tile-title {
	max-width: 17ch;
	text-wrap: balance;
	font-size: clamp(24px, 2.3vw, 31px);
	font-weight: 800;
	line-height: 1.08;
	letter-spacing: -.02em;
}

.tile-body {
	margin-top: .75rem;
	max-width: 36ch;
	text-wrap: pretty;
	font-size: 16px;
	line-height: 1.55;
}

/* The screenshot hangs off the tile's right and bottom edges, so it reads as a window, not a picture. */
.tile-shot {
	position: relative;
	flex: 1;
	margin-top: 1.75rem;
	min-height: 210px;
}

.shot {
	position: absolute;
	left: 0;
	top: 0;
	display: block;
	width: 118%;
	max-width: none;
	height: auto;
	border-top-left-radius: 16px;
	box-shadow: 0 2px 6px rgb(28 23 18 / .06), 0 18px 40px -16px rgb(28 23 18 / .38);
}
</style>
