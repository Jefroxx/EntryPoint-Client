<template>
	<!-- Barcode labels laid out on sheets, in millimetres: the same markup is the preview and the printed copy. -->
	<div class="bls-sheets">
		<section v-for="(page, p) in pages" :key="p" class="bls-page" :style="pageStyle">
			<div v-for="(label, i) in page" :key="i" class="bls-cell" :class="[`bls-${layout.size}`, { 'bls-cut': layout.cutLines, 'bls-empty': !label }]">
				<template v-if="label">
					<!-- The library's label, top to bottom: area of the library, call number (the Dewey number), author Cutter, year of publication. -->
					<div class="bls-lines">
						<span class="bls-area">{{ label.area }}</span>
						<span class="bls-dewey">{{ label.dewey ?? '' }}</span>
						<span class="bls-cutter">{{ label.cutter ?? '' }}</span>
						<span class="bls-year">{{ label.year ?? '' }}</span>
					</div>
					<svg v-if="label.barcodeValue" :viewBox="`0 0 ${barcodeOf(label.barcodeValue).width} 64`" preserveAspectRatio="none" role="img"
						:aria-label="`Barcode ${label.barcodeValue}`" class="bls-bars">
						<rect v-for="([x, w], b) in barcodeOf(label.barcodeValue).bars" :key="b" :x="x" y="0" :width="w" height="64" fill="#000" />
					</svg>
					<p class="bls-code">
						<span>{{ label.barcodeValue ?? 'No barcode' }}</span>
						<span class="bls-acc">No. {{ label.accessionNumber }}</span>
					</p>
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

/* The four lines, centred and stacked. Each keeps its height when empty (an unchecked Dewey number leaves its lines
   blank), so the barcode below sits in the same place on every label. */
.bls-lines {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
}

.bls-lines > span {
	display: block;
	width: 100%;
	min-height: 1.15em;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.bls-area {
	font-weight: 700;
	letter-spacing: .06em;
	text-transform: uppercase;
	color: #57534e;
}

.bls-dewey,
.bls-cutter,
.bls-year {
	font-family: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
}

.bls-dewey {
	font-weight: 800;
}

.bls-cutter {
	font-weight: 700;
}

.bls-year {
	font-weight: 600;
	color: #44403c;
}

.bls-bars {
	display: block;
	width: 100%;
	margin-top: .6mm;
}

/* Under the barcode: the code it spells, and the copy's accession number. */
.bls-code {
	margin-top: .3mm !important;
	display: flex;
	align-items: baseline;
	justify-content: space-between;
	gap: 1mm;
	font-family: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
	font-weight: 600;
	letter-spacing: .06em;
}

.bls-code > span {
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.bls-acc {
	font-weight: 800;
	letter-spacing: 0;
}

/* Type and barcode height for each label size. */
.bls-md .bls-area { font-size: 6.5pt; }
.bls-md .bls-dewey { font-size: 10pt; }
.bls-md .bls-cutter { font-size: 9pt; }
.bls-md .bls-year { font-size: 8pt; }
.bls-md .bls-bars { height: 8mm; }
.bls-md .bls-code { font-size: 6pt; }
.bls-md .bls-acc { font-size: 7pt; }

.bls-sm .bls-area { font-size: 5.5pt; }
.bls-sm .bls-dewey { font-size: 8.5pt; }
.bls-sm .bls-cutter { font-size: 7.5pt; }
.bls-sm .bls-year { font-size: 6.5pt; }
.bls-sm .bls-bars { height: 6mm; }
.bls-sm .bls-code { font-size: 5pt; }
.bls-sm .bls-acc { font-size: 6pt; }

.bls-xs { padding: 1mm 1.4mm; }
.bls-xs .bls-area { font-size: 4.2pt; }
.bls-xs .bls-dewey { font-size: 6.4pt; }
.bls-xs .bls-cutter { font-size: 5.6pt; }
.bls-xs .bls-year { font-size: 4.8pt; }
.bls-xs .bls-bars { height: 4.2mm; }
.bls-xs .bls-code { font-size: 3.9pt; }
.bls-xs .bls-acc { font-size: 4.6pt; }

@media print {
	.bls-cell {
		-webkit-print-color-adjust: exact;
		print-color-adjust: exact;
	}
}
</style>
