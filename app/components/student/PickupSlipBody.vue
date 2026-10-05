<template>
	<!-- The slip itself, 80 mm wide like the borrowing receipt. Used twice by PickupSlip.vue: preview and print copy. -->
	<div class="ps-slip">
		<header class="ps-head">
			<p class="ps-brand">EntryPoint</p>
			<p class="ps-muted">STI College Davao Library</p>
			<p class="ps-title">Reservation Pickup Slip</p>
			<p class="ps-muted ps-num">{{ code }} · Reserved {{ reservedOn }}</p>
		</header>

		<section class="ps-block">
			<p class="ps-label">Book</p>
			<p class="ps-strong">{{ title }}</p>
			<p v-if="author" class="ps-muted">{{ author }}</p>
		</section>

		<section class="ps-scan">
			<p class="ps-label">Show this at the desk</p>
			<svg :viewBox="`0 0 ${barcode.width} 64`" preserveAspectRatio="none" role="img" :aria-label="`Barcode ${code}`" class="ps-bars">
				<rect v-for="([x, w], i) in barcode.bars" :key="i" :x="x" y="0" :width="w" height="64" fill="#000" />
			</svg>
			<p class="ps-num ps-code">{{ code }}</p>
		</section>

		<footer class="ps-foot">
			<p>Your book is being held for you. Bring your Library ID too.</p>
			<p class="ps-muted">This is not a borrowing receipt; you'll get that when you collect the book.</p>
		</footer>
	</div>
</template>

<script setup lang="ts">
import { code128 } from '~/utils/code128'

const props = defineProps<{ code: string; title: string; author?: string; reservedOn: string }>()

const barcode = computed(() => code128(props.code))
</script>

<style>
/* Plain (unscoped) so the printed copy, teleported to <body>, is styled the same. */
.ps-slip {
	width: 80mm;
	max-width: 100%;
	margin: 0 auto;
	padding: 5mm 4.5mm;
	background: #fff;
	color: #1c1917;
	font-family: 'Raleway', ui-sans-serif, system-ui, sans-serif;
	font-size: 9pt;
	line-height: 1.35;
	font-variant-numeric: lining-nums;
	break-inside: avoid;
}

.ps-slip p {
	margin: 0;
}

.ps-num {
	font-family: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
}

.ps-head {
	padding-bottom: 3mm;
	text-align: center;
	border-bottom: 1px dashed #a8a29e;
}

.ps-brand {
	font-size: 14pt;
	font-weight: 800;
	color: var(--color-binding, #532c2e);
}

.ps-slip .ps-title {
	margin-top: 2mm;
	font-size: 10.5pt;
	font-weight: 800;
	letter-spacing: .08em;
	text-transform: uppercase;
}

.ps-muted {
	color: #78716c;
	font-size: 8pt;
}

.ps-block {
	padding: 3mm 0;
	border-bottom: 1px dashed #a8a29e;
}

.ps-slip .ps-label {
	margin-bottom: .8mm;
	font-size: 7.5pt;
	font-weight: 700;
	letter-spacing: .1em;
	text-transform: uppercase;
	color: #78716c;
}

.ps-strong {
	font-size: 10.5pt;
	font-weight: 700;
}

.ps-scan {
	margin-top: 3mm;
	padding: 3mm;
	text-align: center;
	border: 1.5px solid #1c1917;
	border-radius: 2mm;
}

.ps-bars {
	display: block;
	width: 100%;
	height: 16mm;
	margin-top: 2mm;
}

.ps-slip .ps-code {
	margin-top: 1.6mm;
	font-size: 11pt;
	font-weight: 700;
	letter-spacing: .15em;
}

.ps-foot {
	padding-top: 3mm;
	text-align: center;
	font-size: 8.5pt;
}

.ps-slip .ps-foot p + p {
	margin-top: 1mm;
}
</style>
