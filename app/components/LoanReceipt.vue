<template>
	<!-- A checkout receipt: the slip as a preview, plus a copy teleported to <body> that printOnly() sends
		 to the printer on its own (see the print rules in tailwind.css). -->
	<div class="receipt-preview">
		<ReceiptSlip :receipt="receipt" />
	</div>

	<Teleport to="body">
		<div ref="printCopy" class="print-only" aria-hidden="true">
			<ReceiptSlip :receipt="receipt" />
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import type { LoanReceipt } from '~/services/circulationService'

defineProps<{ receipt: LoanReceipt }>()

const printCopy = ref<HTMLElement | null>(null)

defineExpose({ print: () => printOnly(printCopy.value) })
</script>

<style>
/* Screen: the preview sits on a light backdrop, like a slip of paper on the desk. */
.receipt-preview {
	padding: 12px;
	border-radius: 16px;
	background: #f5f5f4;
}

.receipt-preview .rs-slip {
	box-shadow: 0 1px 2px rgb(28 23 18 / .06), 0 8px 20px -12px rgb(28 23 18 / .3);
}

@media print {
	.print-now .rs-slip {
		break-inside: avoid;
	}
}
</style>
