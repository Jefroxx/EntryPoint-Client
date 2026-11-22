<template>
	<!-- The one stacked logo every auth page uses, so its size and gap to the heading never drift.
		 width/height are the file's own size: the browser reserves the right space before the image arrives, so the
		 form below does not jump down when it does. -->
	<img :src="logoUrl" alt="EntryPoint" width="408" height="330" fetchpriority="high" decoding="async"
		class="mx-auto mb-7 block h-[104px] w-auto lg:h-[120px]" />
</template>

<script setup lang="ts">
// A copy sized for how big it is shown (3x of 120px tall); the full-size file stays for the big decorative emblem.
import logoUrl from '~/assets/css/logo/EntryPointLogoStacked-sm.png'

// Fetched while the page is still loading, not after the form has painted.
useHead({ link: [{ rel: 'preload', as: 'image', href: logoUrl, fetchpriority: 'high' }] })
</script>
