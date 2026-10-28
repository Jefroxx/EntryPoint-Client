<template>
	<!-- Grey stand-ins in the shape of a list card, shown while a list loads or a filter / page changes. The grid
		 matches the real one, so nothing jumps when the cards arrive. -->
	<ul class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3" role="status" aria-label="Loading">
		<li v-for="n in count" :key="n" class="skeleton-card overflow-hidden rounded-2xl border border-stone-200 bg-white px-4 py-3.5"
			:style="{ animationDelay: `${(n - 1) * 60}ms` }" aria-hidden="true">
			<div class="flex items-start gap-3">
				<span class="h-10 w-10 shrink-0 rounded-full bg-stone-100" />
				<div class="min-w-0 flex-1 space-y-2 pt-0.5">
					<span class="block h-3.5 w-2/3 rounded-md bg-stone-100" />
					<span class="block h-3 w-1/3 rounded-md bg-stone-100" />
				</div>
				<span class="h-6 w-16 shrink-0 rounded-full bg-stone-100" />
			</div>
			<span class="mt-3.5 block h-3.5 w-4/5 rounded-md bg-stone-100" />
			<div class="mt-3 flex items-center justify-between gap-3">
				<span class="block h-3 w-1/4 rounded-md bg-stone-100" />
				<span class="block h-8 w-20 rounded-xl bg-stone-100" />
			</div>
		</li>
		<span class="sr-only">Loading…</span>
	</ul>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ count?: number }>(), { count: 6 })
</script>

<style scoped>
/* A slow breathing of opacity: cheap for the browser, and enough to read as "loading". */
.skeleton-card {
	animation: skeletonPulse 1.4s ease-in-out infinite;
}

@keyframes skeletonPulse {
	0%, 100% { opacity: 1; }
	50% { opacity: .55; }
}

@media (prefers-reduced-motion: reduce) {
	.skeleton-card {
		animation: none;
	}
}
</style>
