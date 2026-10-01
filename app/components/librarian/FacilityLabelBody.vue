<template>
	<!-- A facility's label: its name and a barcode (F-000012). 80 mm wide, like the receipts. -->
	<div class="fl-label">
		<p class="fl-brand">EntryPoint</p>
		<p class="fl-type">{{ resource.resourceType }}</p>
		<p class="fl-name">{{ resource.name }}</p>
		<svg :viewBox="`0 0 ${barcode.width} 64`" preserveAspectRatio="none" role="img" :aria-label="`Barcode ${resource.barcodeValue}`" class="fl-bars">
			<rect v-for="([x, w], i) in barcode.bars" :key="i" :x="x" y="0" :width="w" height="64" fill="#000" />
		</svg>
		<p class="fl-code">{{ resource.barcodeValue }}</p>
		<p class="fl-hint">Scan to start or end a session</p>
	</div>
</template>

<script setup lang="ts">
import type { ResourceRecord } from '~/services/resourceService'
import { code128 } from '~/utils/code128'

const props = defineProps<{ resource: ResourceRecord }>()

const barcode = computed(() => code128(props.resource.barcodeValue))
</script>

<style>
/* Plain (unscoped) so the printed copy, teleported to <body>, is styled the same. */
.fl-label {
	width: 80mm;
	max-width: 100%;
	margin: 0 auto;
	padding: 6mm 5mm;
	text-align: center;
	background: #fff;
	color: #1c1917;
	border: 1.5px solid #1c1917;
	border-radius: 3mm;
	font-family: 'Raleway', ui-sans-serif, system-ui, sans-serif;
	break-inside: avoid;
}

.fl-label p {
	margin: 0;
}

.fl-brand {
	font-size: 11pt;
	font-weight: 800;
	color: var(--color-binding, #532c2e);
}

.fl-type {
	margin-top: 2mm;
	font-size: 8pt;
	font-weight: 700;
	letter-spacing: .1em;
	text-transform: uppercase;
	color: #78716c;
}

.fl-name {
	font-size: 18pt;
	font-weight: 800;
	line-height: 1.15;
}

.fl-bars {
	display: block;
	width: 100%;
	height: 18mm;
	margin-top: 4mm;
}

.fl-code {
	margin-top: 1.6mm;
	font-family: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
	font-size: 11pt;
	font-weight: 700;
	letter-spacing: .15em;
}

.fl-hint {
	margin-top: 2mm;
	font-size: 8pt;
	color: #78716c;
}
</style>
