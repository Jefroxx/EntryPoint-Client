<template>
	<section class="px-6 pb-24 sm:px-10 lg:px-16 lg:pb-32" aria-labelledby="doors-heading">
		<div class="mx-auto max-w-[1180px]">
			<h2 id="doors-heading" class="text-balance text-[clamp(34px,4.4vw,60px)] font-extrabold leading-[1.03] tracking-[-.03em] text-accent-800">
				Pick your door.
			</h2>

			<div class="mt-12 grid gap-4 md:grid-cols-2">
				<!-- Students -->
				<div class="flex flex-col rounded-[28px] border border-accent-200 bg-white p-8 shadow-card sm:p-10">
					<h3 class="text-[clamp(26px,2.8vw,36px)] font-extrabold leading-[1.05] tracking-[-.02em] text-accent-800">I'm a student.</h3>
					<p class="mt-3 max-w-[40ch] text-pretty text-[16.5px] leading-relaxed text-stone-600">
						Sign in with your school email, or register and bring your school ID to the desk to be approved.
					</p>
					<div class="mt-auto flex flex-wrap gap-3 pt-10">
						<NuxtLink to="/login"
							class="inline-flex h-[52px] items-center rounded-full bg-accent-500 px-8 text-[15px] font-bold text-white transition-colors duration-200 hover:bg-accent-600">
							Sign in
						</NuxtLink>
						<NuxtLink to="/register"
							class="inline-flex h-[52px] items-center rounded-full border-[1.5px] border-accent-300 px-7 text-[15px] font-bold text-accent-600 transition-colors duration-200 hover:bg-accent-50">
							Create an account
						</NuxtLink>
					</div>
				</div>

				<!-- Staff -->
				<div class="landing-maroon relative isolate flex flex-col overflow-hidden rounded-[28px] p-8 text-white sm:p-10">
					<img :src="compass" alt="" aria-hidden="true" class="landing-compass pointer-events-none absolute -bottom-24 -right-20 -z-10 w-[320px] max-w-none opacity-[.09]" />
					<h3 class="text-[clamp(26px,2.8vw,36px)] font-extrabold leading-[1.05] tracking-[-.02em]">I work at the library desk.</h3>
					<p class="mt-3 max-w-[40ch] text-pretty text-[16.5px] leading-relaxed text-white/80">
						Attendance, circulation and new registrations, ready as soon as you sign in.
					</p>
					<div class="mt-auto pt-10">
						<NuxtLink to="/librarian/login"
							class="group inline-flex h-[52px] items-center gap-2 rounded-full bg-white pl-8 pr-6 text-[15px] font-bold text-accent-600 transition-colors duration-200 hover:bg-accent-50">
							Librarian sign-in
							<Icon name="i-tabler-arrow-right" class="h-[18px] w-[18px] transition-transform duration-200 ease-out group-hover:translate-x-0.5" />
						</NuxtLink>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import compass from '~/assets/landing/compass-white.png'
</script>
