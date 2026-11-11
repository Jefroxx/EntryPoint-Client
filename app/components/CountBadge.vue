<template>
	<!-- The small number on an icon or a tab ("3 waiting"). One recipe for the whole app: the digit is centred on its own line
		 (leading-none), digits are all the same width (a 1 and a 2 make the same circle), and one digit is a perfect circle.
		 Where it sits (absolute, beside a label…) is the caller's job: pass `class`. -->
	<span class="inline-flex shrink-0 items-center justify-center rounded-full font-bold leading-none tabular-nums text-white" :class="[TONE[tone], SIZE[size], RING[ring]]">
		<slot />
	</span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	/** red: needs attention; accent: the cart; amber: waiting for the librarian. */
	tone?: 'red' | 'accent' | 'amber'
	/** sm: beside a label or on a tab; md: on an icon, with a ring; lg: a dashboard count. */
	size?: 'sm' | 'md' | 'lg'
	/** A ring in the page's own colour, so the badge is cut out of the icon it sits on. */
	ring?: 'none' | 'white' | 'parchment'
}>(), { tone: 'red', size: 'sm', ring: 'none' })

const TONE = { red: 'bg-red-500', accent: 'bg-accent-500', amber: 'bg-amber-600' }
const SIZE = {
	sm: 'h-4 min-w-4 px-1 text-[10.5px]',
	// 22px counts the 2px ring on each side, so one digit is a circle (the old box-content version added the ring on top and made an oval).
	md: 'h-[22px] min-w-[22px] px-1 text-[11px]',
	lg: 'h-5 min-w-5 px-1.5 text-[11.5px] sm:h-6 sm:min-w-6 sm:px-2 sm:text-[12px]',
}
const RING = { none: '', white: 'border-2 border-white', parchment: 'border-2 border-parchment' }
</script>
