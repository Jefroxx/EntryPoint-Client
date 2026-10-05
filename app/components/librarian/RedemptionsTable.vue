<template>
	<LibrarianTableShell :columns="['Student', 'Item', 'Qty', 'Points spent', 'Redeemed', 'Status', '']" :loading="loading"
		:empty="redemptions.length === 0" empty-text="No redemptions match your filters." min-width="860px">
		<tr v-for="(redemption, index) in redemptions" :key="redemption.redemptionID" tabindex="0" @click="selected = redemption" @keydown.enter.self="selected = redemption"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3">
				<LibrarianPersonCell :name="personName(redemption.student?.user)" />
			</td>
			<td class="px-4 py-3 text-[15px] font-medium text-stone-800">{{ redemption.item?.name ?? 'Removed item' }}</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ redemption.quantity }}</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ redemption.pointsSpent }} pts</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDate(redemption.redeemedAt) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill :label="redemption.fulfillmentStatus" :tone="tones[redemption.fulfillmentStatus]" />
			</td>
			<td class="px-4 py-3" @click.stop>
				<div v-if="redemption.fulfillmentStatus === 'Pending'" class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="primary" size="sm" @click="emit('fulfill', redemption)">Fulfill</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" @click="emit('cancel', redemption)">Cancel</ButtonsButton>
				</div>
			</td>
		</tr>
	<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Redemption details" :title="selected?.item?.name ?? 'Removed item'"
			:subtitle="selected ? `Redemption #${selected.redemptionID}` : ''"
			:status="selected ? { label: selected.fulfillmentStatus, tone: tones[selected.fulfillmentStatus] } : undefined"
			:fields="fields" @close="selected = null" />
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { FulfillmentStatus, RedemptionRecord } from '~/services/engagementService'

defineProps<{
	redemptions: RedemptionRecord[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'fulfill', redemption: RedemptionRecord): void
	(e: 'cancel', redemption: RedemptionRecord): void
}>()

const tones: Record<FulfillmentStatus, 'warning' | 'success' | 'danger'> = {
	Pending: 'warning',
	Fulfilled: 'success',
	Cancelled: 'danger',
}
const selected = ref<RedemptionRecord | null>(null)

const fields = computed(() => {
	const r = selected.value
	if (!r) return []
	return [
		{ label: 'Student', value: personName(r.student?.user), wide: true },
		{ label: 'Quantity', value: r.quantity },
		{ label: 'Points spent', value: `${r.pointsSpent} pts` },
		{ label: 'Redeemed', value: formatDateTime(r.redeemedAt), wide: true },
		{ label: 'Student no.', value: r.student?.studentID, mono: true },
		{ label: 'Item ID', value: r.item?.itemID, mono: true },
	]
})
</script>
