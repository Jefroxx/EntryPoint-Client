<template>
	<LibrarianTableShell :columns="['Item', 'Type', 'Cost', 'Stock', 'Redemptions', '']" :loading="loading"
		:empty="items.length === 0" empty-text="No items yet. Add a reward students can redeem.">
		<tr v-for="(item, index) in items" :key="item.itemID" tabindex="0" @click="selected = item" @keydown.enter.self="selected = item"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3">
				<div class="flex items-center gap-3">
					<img v-if="item.photoURL" :src="item.photoURL" alt="" loading="lazy" class="h-10 w-10 shrink-0 rounded-lg object-cover" />
					<div v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400">
						<Icon name="i-tabler-gift" class="h-5 w-5" />
					</div>
					<span class="text-[15px] font-semibold text-stone-900">{{ item.name }}</span>
				</div>
			</td>
			<td class="px-4 py-3 text-[14px] text-stone-600">{{ item.type ?? '—' }}</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ item.pointCost }} pts</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill v-if="item.stock === 0" label="Retired" tone="neutral" />
				<LibrarianStatusPill v-else-if="item.stock <= 3" :label="`${item.stock} left`" tone="warning" />
				<span v-else class="font-bold tabular-nums text-stone-900">{{ item.stock }}</span>
			</td>
			<td class="px-4 py-3 font-bold tabular-nums text-stone-900">{{ item.redemptions_count }}</td>
			<td class="px-4 py-3" @click.stop>
				<div class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="ghost" size="sm" @click="emit('edit', item)">Edit</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" :disabled="item.redemptions_count > 0"
						:title="item.redemptions_count > 0 ? 'Has redemption history — set stock to 0 to retire it' : undefined"
						@click="emit('delete', item)">
						Delete
					</ButtonsButton>
				</div>
			</td>
		</tr>
	<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Item details" :title="selected?.name ?? ''" :subtitle="selected?.type ?? undefined"
			:status="selected ? (selected.stock === 0 ? { label: 'Retired', tone: 'neutral' } : selected.stock <= 3 ? { label: `${selected.stock} left`, tone: 'warning' } : { label: 'In stock', tone: 'success' }) : undefined"
			:fields="fields" @close="selected = null" />
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { MarketItemRecord } from '~/services/engagementService'

defineProps<{
	items: MarketItemRecord[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'edit', item: MarketItemRecord): void
	(e: 'delete', item: MarketItemRecord): void
}>()
const selected = ref<MarketItemRecord | null>(null)

const fields = computed(() => {
	const item = selected.value
	if (!item) return []
	return [
		{ label: 'Cost', value: `${item.pointCost} pts` },
		{ label: 'In stock', value: item.stock },
		{ label: 'Redemptions', value: item.redemptions_count },
		{ label: 'Item ID', value: item.itemID, mono: true },
		{ label: 'Photo', value: item.photoURL ? 'Uploaded' : 'None' },
	]
})
</script>
