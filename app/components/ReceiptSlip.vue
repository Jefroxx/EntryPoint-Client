<template>
	<!-- A checkout receipt slip, 80 mm wide (a till-roll width; on A4 it prints centred at the top).
		 Used twice by LoanReceipt.vue: the on-screen preview and the copy that goes to the printer. -->
	<div class="rs-slip">
		<header class="rs-head">
			<p class="rs-brand">EntryPoint</p>
			<p class="rs-muted">STI College Davao Library</p>
			<p class="rs-title">Borrowing Receipt</p>
			<p class="rs-muted rs-num">{{ receipt.receiptNumber }} · {{ dateTime(receipt.checkoutDate) }}</p>
		</header>

		<section class="rs-block">
			<p class="rs-label">Borrower</p>
			<p class="rs-strong">{{ receipt.student.name }}</p>
			<p class="rs-num">{{ receipt.student.studentIDNumber }}<template v-if="receipt.student.program"> · {{ receipt.student.program }}</template></p>
		</section>

		<section class="rs-block">
			<p class="rs-label">Book</p>
			<p class="rs-strong">{{ receipt.book.title }}</p>
			<dl class="rs-rows">
				<template v-for="[label, value] in bookRows" :key="label">
					<dt>{{ label }}</dt>
					<dd class="rs-num">{{ value }}</dd>
				</template>
			</dl>
		</section>

		<!-- The one thing the student must not miss. -->
		<section class="rs-due">
			<template v-if="receipt.dueDate">
				<p class="rs-label">Return on or before</p>
				<p class="rs-due-day">{{ dueDay(receipt.dueDate) }}</p>
				<p class="rs-due-time rs-num">by {{ dueTime(receipt.dueDate) }}</p>
			</template>
			<p v-else class="rs-due-day">For library use only</p>
			<!-- A digital copy looked up after the fact: say the book is back. -->
			<p v-if="receipt.returnDate" class="rs-returned rs-num">Returned {{ dateTime(receipt.returnDate) }}</p>
		</section>

		<section class="rs-block">
			<p class="rs-label">Late returns</p>
			<p class="rs-num">{{ fineText }}</p>
		</section>

		<!-- Scanned at the desk when the book comes back: it tells the system this loan was handed in. -->
		<section class="rs-scan">
			<p class="rs-label">Scan to return this book</p>
			<svg :viewBox="`0 0 ${barcode.width} 64`" preserveAspectRatio="none" role="img" :aria-label="`Barcode ${receipt.receiptNumber}`" class="rs-bars">
				<rect v-for="([x, w], i) in barcode.bars" :key="i" :x="x" y="0" :width="w" height="64" fill="#000" />
			</svg>
			<p class="rs-num rs-code">{{ receipt.receiptNumber }}</p>
		</section>

		<footer class="rs-foot">
			<p>Please keep this receipt until the book is returned.</p>
			<p v-if="receipt.printedBy" class="rs-muted">Processed by {{ receipt.printedBy }}</p>
		</footer>
	</div>
</template>

<script setup lang="ts">
import type { LoanReceipt } from '~/services/circulationService'
import { code128 } from '~/utils/code128'
import { LIBRARY_AREAS, type LibraryArea } from '~/services/librarianService'

const props = defineProps<{ receipt: LoanReceipt }>()

const barcode = computed(() => code128(props.receipt.receiptNumber))

const dateTime = (iso: string) => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
const dueDay = (iso: string) => new Date(iso).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
const dueTime = (iso: string) => new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

/** Only the details this book actually has; a blank edition or volume is left off, not printed as "—". */
const bookRows = computed(() => {
	const b = props.receipt.book
	return ([
		['Author', b.authors.join(', ')],
		['Call no.', b.callNumber],
		['Accession no.', String(b.accessionNumber)],
		['ISBN', b.isbn],
		['Edition', b.edition],
		['Volume', b.volume],
		['Publisher', b.publisher],
		['Year', b.publicationYear ? String(b.publicationYear) : null],
		['Pages', b.pages ? String(b.pages) : null],
		['Category', b.subject],
		['Area', b.areaOfLibrary ? LIBRARY_AREAS[b.areaOfLibrary as LibraryArea] ?? b.areaOfLibrary : null],
	] as [string, string | null][]).filter((row): row is [string, string] => !!row[1])
})

const fineText = computed(() => {
	const fine = props.receipt.fine
	if (!fine) return 'No overdue fine is set for this collection.'
	return `${formatPeso(fine.rate)} per ${fine.rateUnit} late, counted from the due date.`
})
</script>

<style>
/* Plain (unscoped) so the printed copy, teleported to <body>, is styled the same. */
.rs-slip {
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
}

.rs-slip p {
	margin: 0;
}

.rs-num {
	font-family: 'Montserrat', ui-sans-serif, system-ui, sans-serif;
}

.rs-head {
	padding-bottom: 3mm;
	text-align: center;
	border-bottom: 1px dashed #a8a29e;
}

.rs-brand {
	font-size: 14pt;
	font-weight: 800;
	color: var(--color-binding, #532c2e);
}

.rs-slip .rs-title {
	margin-top: 2mm;
	font-size: 10.5pt;
	font-weight: 800;
	letter-spacing: .08em;
	text-transform: uppercase;
}

.rs-muted {
	color: #78716c;
	font-size: 8pt;
}

.rs-block {
	padding: 3mm 0;
	border-bottom: 1px dashed #a8a29e;
}

.rs-slip .rs-label {
	margin-bottom: .8mm;
	font-size: 7.5pt;
	font-weight: 700;
	letter-spacing: .1em;
	text-transform: uppercase;
	color: #78716c;
}

.rs-strong {
	font-size: 10.5pt;
	font-weight: 700;
}

.rs-rows {
	display: grid;
	grid-template-columns: auto 1fr;
	gap: .6mm 3mm;
	margin: 1.6mm 0 0;
}

.rs-rows dt {
	color: #78716c;
}

.rs-rows dd {
	margin: 0;
	text-align: right;
	overflow-wrap: anywhere;
}

.rs-due {
	margin-top: 3mm;
	padding: 3mm;
	text-align: center;
	border: 1.5px solid #1c1917;
	border-radius: 2mm;
}

.rs-due-day {
	font-size: 11pt;
	font-weight: 800;
}

.rs-due-time {
	font-size: 10pt;
	font-weight: 700;
}

.rs-slip .rs-returned {
	margin-top: 1.6mm;
	padding-top: 1.6mm;
	border-top: 1px dashed #a8a29e;
	font-weight: 700;
	color: #047857;
}

.rs-due + .rs-block {
	border-bottom: 1px dashed #a8a29e;
}

.rs-scan {
	padding: 3mm 0;
	text-align: center;
	border-bottom: 1px dashed #a8a29e;
}

.rs-bars {
	display: block;
	width: 100%;
	height: 13mm;
	margin-top: 1.5mm;
}

.rs-slip .rs-code {
	margin-top: 1.2mm;
	font-size: 10pt;
	font-weight: 700;
	letter-spacing: .15em;
}

.rs-foot {
	padding-top: 3mm;
	text-align: center;
	font-size: 8.5pt;
}

.rs-slip .rs-foot p + p {
	margin-top: 1mm;
}
</style>
