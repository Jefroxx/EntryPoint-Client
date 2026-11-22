<template>
	<!-- A single task on its own: no side panel and no links to other pages, so nothing pulls the person away from it
		 (used by "choose a new password", reached from an emailed link). -->
	<main class="focus-page flex min-h-screen flex-col items-center justify-center px-4 py-10">
		<div class="w-full max-w-[440px] overflow-hidden rounded-[28px] border border-stone-200 bg-white px-6 py-9 shadow-overlay sm:px-10 sm:py-11">
			<slot />
		</div>

		<p class="mt-6 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-[12.5px] text-stone-500">
			<span class="font-semibold text-accent-700">EntryPoint</span><span aria-hidden="true">·</span>
			<span>STI College Davao Library</span><span aria-hidden="true">·</span><span>© {{ new Date().getFullYear() }}</span>
		</p>
	</main>
</template>

<style>
.focus-page {
	background-color: var(--color-parchment);
	background-image:
		radial-gradient(55% 50% at 0% 0%, rgb(221 200 189 / .55), transparent 70%),
		radial-gradient(50% 45% at 100% 100%, rgb(133 94 86 / .20), transparent 72%);
}

/* The same 16px rule as the sign-in pages: iOS zooms the page when a smaller field is focused. */
@media (max-width: 1023px), (pointer: coarse) {
	.focus-page input {
		font-size: 16px;
	}
}

.focus-page ::selection {
	background: var(--color-accent-200);
	color: var(--color-accent-700);
}
</style>
