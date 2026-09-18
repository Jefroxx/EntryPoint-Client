<template>
	<LibrarianTableShell :columns="['Item', 'Type', 'Cost', 'Stock', 'Redemptions', '']" :loading="loading"
		:empty="items.length === 0" empty-text="No items yet. Add a reward students can redeem.">
		<tr v-for="(item, index) in items" :key="item.itemID"
			class="row-fade-in border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-stone-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3 text-[13.5px] font-semibold text-stone-900">{{ item.name }}</td>
			<td class="px-4 py-3 text-[13px] text-stone-600">{{ item.type ?? '—' }}</td>
			<td class="font-data px-4 py-3 text-[12.5px] text-stone-500">{{ item.pointCost }} pts</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill v-if="item.stock === 0" label="Retired" tone="neutral" />
				<LibrarianStatusPill v-else-if="item.stock <= 3" :label="`${item.stock} left`" tone="warning" />
				<span v-else class="font-bold tabular-nums text-stone-900">{{ item.stock }}</span>
			</td>
			<td class="px-4 py-3 font-bold tabular-nums text-stone-900">{{ item.redemptions_count }}</td>
			<td class="px-4 py-3">
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
</script>
