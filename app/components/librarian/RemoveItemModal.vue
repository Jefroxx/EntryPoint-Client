<template>
	<LibrarianModalShell :open="open" size="xl" :title="step === PAGES.length ? 'Confirm Deletion' : 'Delete This Item?'"
		:subtitle="item?.name" :busy="busy" @close="emit('close')">
		<!-- A fixed minimum height, so the window does not jump in size from page to page. -->
		<div v-if="item" class="min-h-[400px] space-y-5">
			<ol class="grid grid-cols-3 gap-2.5" aria-label="Pages">
				<li v-for="(page, i) in PAGES" :key="page" :aria-current="step === i + 1 ? 'step' : undefined">
					<button type="button" class="group w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200" @click="step = i + 1">
						<span class="block h-1 rounded-full transition-colors duration-300" :class="i + 1 <= step ? (blocked && i === 1 ? 'bg-red-500' : 'bg-accent-500') : 'bg-stone-200'" />
						<span class="mt-2 flex items-center gap-1 text-[12.5px] font-semibold transition-colors duration-300" :class="step === i + 1 ? 'text-accent-600' : 'text-stone-700 group-hover:text-accent-600'">
							<Icon v-if="blocked && i === 1" name="i-tabler-alert-circle" class="h-3.5 w-3.5 text-red-500" />
							<span v-else class="tabular-nums">{{ i + 1 }}.</span> {{ page }}<span v-if="i === 1" class="font-normal text-stone-500">({{ mine.length }})</span>
						</span>
					</button>
				</li>
			</ol>

			<!-- ===== 1. The item ===== -->
			<div v-if="step === 1" class="space-y-4">
				<div class="flex items-center gap-4">
					<img v-if="item.photoURL" :src="item.photoURL" alt="" class="h-20 w-20 shrink-0 rounded-xl border border-stone-200 object-cover" />
					<div v-else class="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400"><Icon name="i-tabler-gift" class="h-8 w-8" /></div>
					<div class="min-w-0">
						<p class="text-[18px] font-bold text-stone-900">{{ item.name }}</p>
						<p class="text-[13.5px] text-stone-500">{{ item.type ?? 'No type' }}</p>
					</div>
				</div>
				<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Cost</dt><dd class="font-semibold text-stone-900">{{ item.pointCost }} points</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Stock</dt><dd class="font-semibold text-stone-900">{{ item.stock === 0 ? 'Retired (0)' : item.stock }}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Photo</dt><dd class="font-semibold text-stone-900">{{ item.photoURL ? 'Uploaded' : 'None' }}</dd></div>
				</dl>
			</div>

			<!-- ===== 2. Redemptions ===== -->
			<div v-else-if="step === 2" class="space-y-3">
				<div class="grid gap-3 sm:grid-cols-4">
					<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">All</p><p class="text-[24px] font-bold text-stone-900">{{ mine.length }}</p></div>
					<div class="rounded-xl px-4 py-3" :class="countOf('Pending') ? 'bg-amber-50' : 'bg-stone-50'"><p class="text-[12px] font-semibold uppercase tracking-wide" :class="countOf('Pending') ? 'text-amber-800' : 'text-stone-500'">Pending</p><p class="text-[24px] font-bold" :class="countOf('Pending') ? 'text-amber-800' : 'text-stone-900'">{{ countOf('Pending') }}</p></div>
					<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Fulfilled</p><p class="text-[24px] font-bold text-stone-900">{{ countOf('Fulfilled') }}</p></div>
					<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Cancelled</p><p class="text-[24px] font-bold text-stone-900">{{ countOf('Cancelled') }}</p></div>
				</div>
				<div v-if="mine.length" class="overflow-hidden rounded-xl border border-stone-200">
					<div v-for="r in pageOfMine" :key="r.uuid" class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-stone-100 px-4 py-2.5 text-[14px] last:border-0">
						<span class="min-w-0 flex-1">
							<span class="block truncate font-semibold text-stone-900">{{ personName(r.student?.user) }}</span>
							<span class="block text-[12.5px] text-stone-500"><span class="font-data">{{ r.student?.memberIDNumber ?? '—' }}</span> · {{ r.quantity }} × · {{ r.pointsSpent }} pts · {{ formatDate(r.redeemedAt) }}</span>
						</span>
						<LibrarianStatusPill :label="r.fulfillmentStatus" :tone="TONE[r.fulfillmentStatus]" />
					</div>
				</div>
				<p v-else class="rounded-xl border border-stone-200 px-4 py-6 text-center text-[14px] text-stone-500">Nobody has redeemed this item.</p>
				<LibrarianListPager v-model:page="redemptionPage" :total="mine.length" :page-size="REDEMPTIONS_PER_PAGE" />
			</div>

			<!-- ===== 3. Confirm ===== -->
			<div v-else class="space-y-4">
				<div v-if="blocked" class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
					<Icon name="i-tabler-alert-circle" class="mt-0.5 h-4 w-4 shrink-0" />
					<div>
						<p class="font-semibold">This item has {{ mine.length }} {{ mine.length === 1 ? 'redemption' : 'redemptions' }} on record, so it can't be deleted.</p>
						<p>To stop students redeeming it, close this window and set its stock to 0. That retires it and keeps its history.</p>
					</div>
				</div>
				<template v-else>
					<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
						<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Redemptions</dt><dd class="font-semibold text-stone-900">none, nothing is lost</dd></div>
						<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Photo</dt><dd class="font-semibold text-stone-900">{{ item.photoURL ? 'deleted with the item' : 'none' }}</dd></div>
						<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Stock left</dt><dd class="font-semibold text-stone-900">{{ item.stock }}</dd></div>
					</dl>
					<div class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
						<Icon name="i-tabler-alert-triangle" class="mt-0.5 h-4 w-4 shrink-0" />
						<p>"{{ item.name }}" is removed from the rewards market for good.</p>
					</div>
				</template>
			</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="step > 1 ? step-- : emit('close')">{{ step > 1 ? 'Back' : 'Cancel' }}</ButtonsButton>
			<ButtonsButton v-if="item && step < PAGES.length" variant="primary" @click="step++">
				Next<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
			</ButtonsButton>
			<ButtonsButton v-else-if="item" variant="primary" class="!border-red-500 !bg-red-500 hover:!bg-red-600" :disabled="busy || blocked" @click="emit('confirm')">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
				Yes, delete item
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { FulfillmentStatus, MarketItemRecord, RedemptionRecord } from '~/services/engagementService'

const props = defineProps<{
	open: boolean
	item: MarketItemRecord | null
	/** Every redemption (the page already has them); this window shows the ones for this item. */
	redemptions: RedemptionRecord[]
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'confirm'): void
}>()

const PAGES = ['Item', 'Redemptions', 'Confirm']
const TONE: Record<FulfillmentStatus, 'warning' | 'success' | 'neutral'> = { Pending: 'warning', Fulfilled: 'success', Cancelled: 'neutral' }

const step = ref(1)

const mine = computed(() => props.redemptions
	.filter((r) => r.item?.itemID === props.item?.itemID)
	.sort((a, b) => new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()))
// A long list is shown a few at a time, so the window never has to scroll.
const REDEMPTIONS_PER_PAGE = 4
const redemptionPage = ref(1)
const pageOfMine = computed(() => mine.value.slice((redemptionPage.value - 1) * REDEMPTIONS_PER_PAGE, redemptionPage.value * REDEMPTIONS_PER_PAGE))
const countOf = (status: FulfillmentStatus) => mine.value.filter((r) => r.fulfillmentStatus === status).length
// The server refuses to delete an item with any redemption history (even cancelled ones).
const blocked = computed(() => mine.value.length > 0 || (props.item?.redemptions_count ?? 0) > 0)

watch(() => props.open, (isOpen) => { if (isOpen) { step.value = 1; redemptionPage.value = 1 } })
</script>
