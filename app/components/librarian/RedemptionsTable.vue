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
					<div class="mt-2.5 flex items-center gap-3">
						<img v-if="redemption.item?.photoURL" :src="redemption.item.photoURL" alt="" loading="lazy" class="h-11 w-11 shrink-0 rounded-lg object-cover" />
						<div v-else class="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400"><Icon name="i-tabler-gift" class="h-5 w-5" /></div>
						<div class="min-w-0">
							<p class="text-[14.5px] font-semibold leading-snug text-stone-900">{{ redemption.quantity > 1 ? `${redemption.quantity} × ` : '' }}{{ redemption.item?.name ?? 'Removed reward' }}</p>
							<p class="mt-0.5 text-[12.5px] text-stone-500">{{ redemption.pointsSpent }} pts · {{ formatDate(redemption.redeemedAt) }}</p>
						</div>
					</div>
					<!-- Still waiting: how long, so the oldest are seen first and a forgotten one stands out. -->
					<p v-if="waiting(redemption)" class="mt-2 text-[12.5px] font-semibold" :class="waiting(redemption)!.late ? 'text-red-600' : 'text-amber-700'">{{ waiting(redemption)!.text }}</p>
					<p v-else-if="redemption.fulfillmentStatus === 'Cancelled' && redemption.cancelReason" class="mt-2 text-[12.5px] text-stone-500">Cancelled: {{ redemption.cancelReason }}</p>
					<div v-if="redemption.fulfillmentStatus === 'Pending'" class="mt-3 flex gap-2" @click.stop>
						<ButtonsButton variant="danger" class="flex-1" @click="emit('cancel', redemption)">Cancel</ButtonsButton>
						<ButtonsButton variant="primary" class="flex-[1.4]" @click="emit('fulfill', redemption)">Fulfill</ButtonsButton>
					</div>
				</div>
			</li>
		</template>
	<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Redemption details" :title="selected?.item?.name ?? 'Removed reward'"
			:subtitle="selected ? personName(selected.student?.user) : ''"
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

/** A pending redemption's wait: "Waiting 5 days" (red from a week), nothing when it is less than a day old or already dealt with. */
function waiting(r: RedemptionRecord): { text: string; late: boolean } | null {
	if (r.fulfillmentStatus !== 'Pending') return null
	const days = Math.floor((Date.now() - new Date(r.redeemedAt).getTime()) / 86_400_000)
	if (days < 1) return null
	return { text: `Waiting ${days} ${days === 1 ? 'day' : 'days'}`, late: days >= 7 }
}

const fields = computed(() => {
	const r = selected.value
	if (!r) return []
	return [
		{ label: 'Student', value: personName(r.student?.user), wide: true },
		{ label: 'Quantity', value: r.quantity },
		{ label: 'Points spent', value: `${r.pointsSpent} pts` },
		{ label: 'Redeemed', value: formatDateTime(r.redeemedAt), wide: true },
		{ label: 'Student ID', value: r.student?.memberIDNumber, mono: true },
		...(waiting(r) ? [{ label: 'Waiting', value: waiting(r)!.text.replace(/^Waiting /, ''), wide: true }] : []),
		...(r.fulfillmentStatus === 'Cancelled' && r.cancelReason ? [{ label: 'Cancelled because', value: r.cancelReason, wide: true }] : []),
	]
})
</script>
