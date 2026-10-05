<template>
	<!-- The stock log: when copies were added to or removed from the catalog, why, and by whom. -->
	<LibrarianTableShell :columns="['When', 'Action', 'Acc. No.', 'Title', 'Reason', 'Note', 'By']" :loading="loading"
		:empty="logs.length === 0" :empty-text="filtered ? 'No log entries match these filters.' : 'Nothing has been added or removed yet.'" min-width="900px">
		<tr v-for="(log, index) in logs" :key="log.logID" tabindex="0" @click="selected = log" @keydown.enter.self="selected = log"
			class="row-fade-in cursor-pointer border-b border-stone-100 text-[14px] text-stone-600 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:style="{ animationDelay: `${index * 30}ms` }">
			<td class="font-data whitespace-nowrap px-4 py-3 text-[13.5px] text-stone-500">{{ formatDateTime(log.created_at) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill :label="log.action === 'added' ? 'Added' : 'Removed'" :tone="log.action === 'added' ? 'success' : 'danger'" />
			</td>
			<td class="font-data px-4 py-3 text-[14px] font-bold text-stone-900">{{ log.accessionNumber ?? '—' }}</td>
			<td class="max-w-[280px] px-4 py-3 text-[14.5px] font-semibold text-stone-900"><span class="line-clamp-2">{{ log.bookTitle }}</span></td>
			<td class="whitespace-nowrap px-4 py-3">{{ log.reason ?? '—' }}</td>
			<td class="max-w-[260px] px-4 py-3 text-[13.5px] text-stone-500"><span class="line-clamp-2">{{ log.note || '—' }}</span></td>
			<td class="whitespace-nowrap px-4 py-3 text-[13.5px]">{{ log.librarianName ?? '—' }}</td>
		</tr>
	<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Stock log entry" :title="selected?.bookTitle ?? ''"
			:subtitle="selected ? `Entry #${selected.logID}` : ''"
			:status="selected ? { label: selected.action === 'added' ? 'Added' : 'Removed', tone: selected.action === 'added' ? 'success' : 'danger' } : undefined"
			:fields="fields" @close="selected = null" />
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { StockLogRow } from '~/services/librarianService'

defineProps<{
	logs: StockLogRow[]
	loading: boolean
	/** Filters or a search are narrowing the list, so an empty table means "no match", not "nothing yet". */
	filtered?: boolean
}>()
const selected = ref<StockLogRow | null>(null)

const fields = computed(() => {
	const log = selected.value
	if (!log) return []
	return [
		{ label: 'When', value: formatDateTime(log.created_at), wide: true },
		{ label: 'Accession no.', value: log.accessionNumber, mono: true },
		{ label: 'Reason', value: log.reason },
		{ label: 'Done by', value: log.librarianName },
		{ label: 'Copy ID', value: log.copyID, mono: true },
		{ label: 'Book ID', value: log.bookID, mono: true },
		{ label: 'Note', value: log.note, wide: true },
	]
})
</script>
