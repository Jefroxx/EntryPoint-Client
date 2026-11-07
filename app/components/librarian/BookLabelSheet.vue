<template>
	<!-- Barcode labels laid out on sheets, in millimetres: the same markup is the preview and the printed copy. -->
	<div class="bls-sheets">
		<section v-for="(page, p) in pages" :key="p" class="bls-page" :style="pageStyle">
			<div v-for="(label, i) in page" :key="i" class="bls-cell" :class="[`bls-${layout.size}`, { 'bls-cut': layout.cutLines, 'bls-empty': !label }]">
				<template v-if="label">
					<div class="bls-top">
						<span class="bls-area">{{ label.area }}</span>
						<span class="bls-acc">No. {{ label.accessionNumber }}</span>
					</div>
					<svg v-if="label.barcodeValue" :viewBox="`0 0 ${barcodeOf(label.barcodeValue).width} 64`" preserveAspectRatio="none" role="img"
						:aria-label="`Barcode ${label.barcodeValue}`" class="bls-bars">
						<rect v-for="([x, w], b) in barcodeOf(label.barcodeValue).bars" :key="b" :x="x" y="0" :width="w" height="64" fill="#000" />
					</svg>
					<p class="bls-code">{{ label.barcodeValue ?? 'No barcode' }}</p>
					<p class="bls-title">{{ label.title }}</p>
					<p class="bls-call">{{ label.callNumber ?? '' }}</p>
				</template>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import type { CopyLabel } from '~/services/librarianService'
import { code128, type Code128 } from '~/utils/code128'
import { PAPERS, rowsFor, type LabelLayout, type PaperKey } from '~/utils/labelLayouts'

const props = defineProps<{
	/** Already split into sheets (null = an empty place, left blank for a partly used sticker sheet). */
	pages: (CopyLabel | null)[][]
	layout: LabelLayout
	paper: PaperKey
}>()

// Drawing a barcode is cheap, but a sheet shows dozens of them and the preview redraws as options change.
const cache = new Map<string, Code128>()
function barcodeOf(value: string): Code128 {
	let hit = cache.get(value)
	if (!hit) { hit = code128(value); cache.set(value, hit) }
	return hit
}

const pageStyle = computed(() => {
	const { layout, paper } = props
	const size = PAPERS[paper]
	const rows = rowsFor(layout, paper)
	return {
		width: `${size.w}mm`,
		height: `${size.h}mm`,
		paddingTop: `${layout.top}mm`,
		paddingLeft: `${layout.left}mm`,
		gridTemplateColumns: `repeat(${layout.cols}, ${layout.w}mm)`,
		gridTemplateRows: `repeat(${rows}, ${layout.h}mm)`,
		columnGap: `${layout.gapX}mm`,
		rowGap: `${layout.gapY}mm`,
	}
})
</script>

<style>
/* Plain (unscoped) so the printed copy, teleported to <body>, is styled the same as the preview. */
.bls-page {
	box-sizing: border-box;
	display: grid;
	align-content: start;
	background: #fff;
	overflow: hidden;
	break-after: page;
	page-break-after: always;
}

.bls-page:last-child {
	break-after: auto;
	page-break-after: auto;
}

.bls-cell {
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
	min-width: 0;
	padding: 1.3mm 1.8mm;
	overflow: hidden;
	background: #fff;
	color: #111;
	font-family: 'Raleway', ui-sans-serif, system-ui, sans-serif;
	line-height: 1.15;
}

.bls-cut {
	border: 0.2mm dashed #9ca3af;
}

.bls-cell p,
.bls-cell span {
	margin: 0;
}

.bls-top {
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 1mm;
}

.bls-area {
	font-weight: 700;
	letter-spacing: .06em;
	text-transform: uppercase;
	color: #57534e;
}

.bls-acc {
	font-family: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
	font-weight: 800;
	white-space: nowrap;
}

.bls-bars {
	display: block;
	width: 100%;
	margin-top: .6mm;
}

.bls-code {
	margin-top: .3mm !important;
	font-family: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
	font-weight: 600;
	text-align: center;
	letter-spacing: .08em;
}

.bls-title {
	margin-top: .5mm !important;
	font-weight: 700;
	display: -webkit-box;
	-webkit-box-orient: vertical;
	-webkit-line-clamp: 2;
	overflow: hidden;
}

.bls-call {
	margin-top: auto !important;
	font-family: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
	font-weight: 800;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

/* Type and barcode height for each label size. */
.bls-md .bls-area { font-size: 6.5pt; }
.bls-md .bls-acc { font-size: 9pt; }
.bls-md .bls-bars { height: 11mm; }
.bls-md .bls-code { font-size: 6pt; }
.bls-md .bls-title { font-size: 8pt; }
.bls-md .bls-call { font-size: 9pt; }

.bls-sm .bls-area { font-size: 6pt; }
.bls-sm .bls-acc { font-size: 8pt; }
.bls-sm .bls-bars { height: 9mm; }
.bls-sm .bls-code { font-size: 5.5pt; }
.bls-sm .bls-title { font-size: 7pt; }
.bls-sm .bls-call { font-size: 8pt; }

.bls-xs { padding: 1mm 1.4mm; }
.bls-xs .bls-area { font-size: 4.6pt; }
.bls-xs .bls-acc { font-size: 6.2pt; }
.bls-xs .bls-bars { height: 6.4mm; }
.bls-xs .bls-code { font-size: 4.4pt; }
.bls-xs .bls-title { font-size: 5.6pt; -webkit-line-clamp: 1; }
.bls-xs .bls-call { font-size: 6.2pt; }

@media print {
	.bls-cell {
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
}
</style>
