<template>
	<!-- The printable library card. Hidden on screen; when the student prints, this is the only thing on the
		 page: front and back at ID-card size (CR80, 85.6 × 54 mm), side by side with dashed cut lines, so the
		 two halves can be cut out and glued back to back (or folded along the middle line) and laminated.
		 Teleported to <body>; print() sends it to the printer on its own (utils/printOnly.ts). -->
	<Teleport to="body">
		<div ref="printCopy" class="print-only library-card-print" aria-hidden="true">
			<div class="lcp-sheet">
				<!-- Front -->
				<section class="lcp-card lcp-front">
					<header class="lcp-top">
						<img src="~/assets/css/logo/EntryPointLogo.png" alt="" class="lcp-wordmark" />
						<span class="lcp-kind">Library Card</span>
					</header>

					<div class="lcp-who">
						<p class="lcp-name">{{ profile.fullName }}</p>
						<p class="lcp-meta">
							<span class="lcp-id">{{ profile.studentIDNumber }}</span>
							<template v-if="profile.academicProgram"> · {{ profile.academicProgram }}</template>
						</p>
					</div>

					<div class="lcp-barcode">
						<svg :viewBox="`0 0 ${barcode.width} 40`" preserveAspectRatio="none">
							<rect v-for="([x, w], i) in barcode.bars" :key="i" :x="x" y="0" :width="w" height="40" fill="#000" />
						</svg>
						<p class="lcp-code">{{ profile.barcodeValue }}</p>
					</div>

					<footer class="lcp-band">STI College Davao Library</footer>
				</section>

				<!-- Back -->
				<section class="lcp-card lcp-back">
					<header class="lcp-top">
						<img src="/favicon.png" alt="" class="lcp-mark" />
						<span class="lcp-kind">EntryPoint</span>
					</header>

					<ul class="lcp-rules">
						<li>Scan this card at the library entrance to check in and out.</li>
						<li>It is yours alone and can't be lent or transferred.</li>
						<li>If found, please return it to the STI College Davao Library.</li>
					</ul>

					<div class="lcp-sign">
						<span class="lcp-line" />
						<span class="lcp-caption">Student's signature</span>
					</div>

					<footer class="lcp-band lcp-band-back">Printed {{ printedOn }}</footer>
				</section>
			</div>

			<p class="lcp-help">
				Print at 100% (“Actual size”, not “Fit to page”). Cut along the dashed lines, glue the two halves back to
				back, and laminate the card if you can.
			</p>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
	profile: {
		fullName: string
		studentIDNumber: string
		academicProgram: string | null
		barcodeValue: string
	}
}>()

const barcode = computed(() => code128(props.profile.barcodeValue))

const printCopy = ref<HTMLElement | null>(null)
defineExpose({ print: () => printOnly(printCopy.value) })
const printedOn = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
</script>

<style>
/* Hidden on screen and isolated on paper by the .print-only rules in tailwind.css. */
@media print {
	.library-card-print {
		font-family: 'Raleway', ui-sans-serif, system-ui, sans-serif;
		/* Raleway's default figures dip below the line ("29, 2026"); a card wants level ones. */
		font-variant-numeric: lining-nums;
		color: #1c1917;
	}

	.lcp-sheet {
		display: flex;
		width: calc(85.6mm * 2);
		/* Dashed cut lines: around the pair, and down the middle between front and back. */
		outline: .2mm dashed #a8a29e;
		outline-offset: 0;
	}

	.lcp-card {
		position: relative;
		display: flex;
		flex-direction: column;
		width: 85.6mm;
		height: 53.98mm;
		overflow: hidden;
		background: #fff;
		break-inside: avoid;
	}

	.lcp-front {
		border-right: .2mm dashed #a8a29e;
	}

	.lcp-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 3.2mm 4mm 0;
	}

	.lcp-wordmark {
		height: 6mm;
		width: auto;
	}

	.lcp-mark {
		height: 6mm;
		width: 6mm;
	}

	.lcp-kind {
		font-size: 2.3mm;
		font-weight: 700;
		letter-spacing: .12em;
		text-transform: uppercase;
		color: var(--color-binding, #532c2e);
	}

	.lcp-who {
		padding: 2.4mm 4mm 0;
	}

	.lcp-name {
		margin: 0;
		font-size: 4.1mm;
		font-weight: 800;
		line-height: 1.1;
		color: var(--color-crimson, #34000b);
		/* A long name shrinks to one line rather than pushing the barcode off the card. */
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.lcp-meta {
		margin: .8mm 0 0;
		font-size: 2.4mm;
		color: #57534e;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.lcp-id,
	.lcp-code {
		font-family: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
	}

	.lcp-id {
		font-weight: 700;
		color: #1c1917;
	}

	/* The barcode keeps its quiet zones (built into the SVG) and a real-world height scanners like. */
	.lcp-barcode {
		margin: auto 4mm 0;
		padding-bottom: 1.4mm;
	}

	.lcp-barcode svg {
		display: block;
		width: 100%;
		height: 13mm;
	}

	.lcp-code {
		margin: .6mm 0 0;
		text-align: center;
		font-size: 2.3mm;
		letter-spacing: .16em;
	}

	.lcp-band {
		padding: 1.3mm 4mm;
		font-size: 2.1mm;
		font-weight: 600;
		letter-spacing: .04em;
		color: #fff;
		background: var(--color-binding, #532c2e);
	}

	.lcp-band-back {
		margin-top: auto;
		text-align: right;
	}

	.lcp-rules {
		margin: 2.6mm 4mm 0;
		padding-left: 3mm;
		font-size: 2.3mm;
		line-height: 1.45;
		color: #44403c;
	}

	.lcp-sign {
		display: flex;
		flex-direction: column;
		margin: auto 4mm 2.2mm;
	}

	.lcp-line {
		display: block;
		border-bottom: .25mm solid #1c1917;
		height: 6mm;
	}

	.lcp-caption {
		margin-top: .6mm;
		font-size: 2mm;
		color: #78716c;
	}

	.lcp-help {
		max-width: calc(85.6mm * 2);
		margin: 5mm 0 0;
		font-size: 3mm;
		line-height: 1.4;
		color: #78716c;
	}
}
</style>
