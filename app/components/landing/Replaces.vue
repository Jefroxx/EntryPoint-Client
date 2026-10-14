<template>
	<section class="px-6 py-24 sm:px-10 lg:px-16 lg:py-32" aria-labelledby="replaces-heading">
		<div class="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
			<h2 id="replaces-heading"
				class="text-balance text-[clamp(34px,4.4vw,60px)] font-extrabold leading-[1.03] tracking-[-.03em] text-accent-800">
				The paper trail ends here.
			</h2>

			<ol class="divide-y divide-accent-200 border-y border-accent-200">
				<li v-for="row in rows" :key="row.before" class="grid gap-1.5 py-6 sm:grid-cols-[minmax(0,5fr)_auto_minmax(0,6fr)] sm:items-baseline sm:gap-6">
					<span class="text-[16px] font-medium text-stone-500 line-through decoration-accent-300 decoration-[1.5px]">{{ row.before }}</span>
					<Icon name="i-tabler-arrow-right" class="hidden h-5 w-5 text-accent-400 sm:block" aria-hidden="true" />
					<span class="text-[19px] font-bold leading-snug text-accent-700">{{ row.after }}</span>
				</li>
			</ol>
		</div>
	</section>
</template>

<script setup lang="ts">
// What the library did on paper, and what it does now. Every line is something the system actually does.
const rows = [
	{ before: 'A paper logbook at the door', after: 'Scan your Library ID in and out' },
	{ before: 'Manual borrowing cards', after: 'Borrow from your account and see what is due' },
	{ before: 'Handwritten fine records', after: 'Fines worked out from the library\'s own rules and recorded' },
	{ before: 'Walking over to ask if a book is in', after: 'See every title\'s availability before you go' },
]
</script>
