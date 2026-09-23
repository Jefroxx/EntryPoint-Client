<template>
	<!-- The team's book-cart drawing (public/icons/book-cart.png), used as a mask so it takes the
		 current text colour like the Tabler icons around it (hover, active and so on). -->
	<span aria-hidden="true" class="inline-block shrink-0 bg-current" :style="maskStyle" />
</template>

<script setup lang="ts">
const url = 'url(/icons/book-cart.png)'
const maskStyle = {
	maskImage: url,
	WebkitMaskImage: url,
	maskSize: 'contain',
	WebkitMaskSize: 'contain',
	maskRepeat: 'no-repeat',
	WebkitMaskRepeat: 'no-repeat',
	maskPosition: 'center',
	WebkitMaskPosition: 'center',
}
</script>
