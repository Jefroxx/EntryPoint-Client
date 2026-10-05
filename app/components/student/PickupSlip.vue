<template>
	<!-- A reservation pickup slip: the barcode the desk scans to hand over a reserved book. It is not the
		 borrowing receipt; that is issued at the desk when the book is checked out. Shown as a preview, plus
		 a copy teleported to <body> that printOnly() sends to the printer on its own (as LoanReceipt.vue does). -->
	<div class="ps-preview">
		<PickupSlipBody :code="code" :title="title" :author="author" :reserved-on="reservedOn" />
	</div>

	<Teleport to="body">
		<div ref="printCopy" class="print-only" aria-hidden="true">
			<PickupSlipBody :code="code" :title="title" :author="author" :reserved-on="reservedOn" />
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import PickupSlipBody from './PickupSlipBody.vue'

const props = defineProps<{ code: string; title: string; author?: string; reservedAt: string }>()

const reservedOn = computed(() => formatDate(props.reservedAt))

const printCopy = ref<HTMLElement | null>(null)

defineExpose({ print: () => printOnly(printCopy.value) })
</script>

<style>
.ps-preview {
	padding: 12px;
	border-radius: 16px;
	background: #f5f5f4;
}

.ps-preview .ps-slip {
	box-shadow: 0 1px 2px rgb(28 23 18 / .06), 0 8px 20px -12px rgb(28 23 18 / .3);
}
</style>
