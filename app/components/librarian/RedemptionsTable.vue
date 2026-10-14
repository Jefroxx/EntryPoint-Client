<template>
	<LibrarianTableShell :columns="['Student', 'Item', 'Qty', 'Points spent', 'Redeemed', 'Status', '']" :loading="loading"
		:empty="redemptions.length === 0" empty-text="No redemptions match your filters." min-width="860px">
		<!-- Phones: one card per row, with the row's buttons on it. -->
		<template #cards>
			<li v-for="redemption in redemptions" :key="`card-${redemption.redemptionID}`">
				<div role="button" tabindex="0" class="px-4 py-3.5 transition-colors active:bg-accent-50" @click="selected = redemption" @keydown.enter.self="selected = redemption">
					<div class="flex items-start justify-between gap-3">
						<LibrarianPersonCell :name="personName(redemption.student?.user)" />
						<LibrarianStatusPill :label="redemption.fulfillmentStatus" :tone="tones[redemption.fulfillmentStatus]" class="shrink-0" />
					</div>
					<p class="mt-2 text-[14.5px] font-semibold leading-snug text-stone-900">{{ redemption.quantity > 1 ? `${redemption.quantity} × ` : '' }}{{ redemption.item?.name ?? 'Removed item' }}</p>
					<p class="mt-0.5 text-[12.5px] text-stone-500">{{ redemption.pointsSpent }} pts · {{ formatDate(redemption.redeemedAt) }}</p>
					<div v-if="redemption.fulfillmentStatus === 'Pending'" class="mt-3 flex gap-2" @click.stop>
						<ButtonsButton variant="danger" class="flex-1" @click="emit('cancel', redemption)">Cancel</ButtonsButton>
						<ButtonsButton variant="primary" class="flex-[1.4]" @click="emit('fulfill', redemption)">Fulfill</ButtonsButton>
					</div>
				</div>
			</li>
		</template>
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
			:fields="fields" @close="selected = null">
			<template v-if="selected && selected.fulfillmentStatus === 'Pending'" #footer>
				<ButtonsButton variant="danger" class="flex-1" @click="cancelSelected(selected)">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" class="flex-[1.4]" @click="fulfillSelected(selected)">Fulfill</ButtonsButton>
			</template>
		</LibrarianRecordDrawer>
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

// The details panel's buttons close it, then start the same flow as the row's buttons.
function fulfillSelected(r: RedemptionRecord) { selected.value = null; emit('fulfill', r) }
function cancelSelected(r: RedemptionRecord) { selected.value = null; emit('cancel', r) }
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
