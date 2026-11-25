<template>
	<!-- The stock log: when copies were added to or removed from the catalog, why, and by whom. -->
	<LibrarianTableShell :columns="['When', 'Action', 'Acc. No.', 'Title', 'Reason', 'Note', 'By']" :loading="loading"
		:empty="logs.length === 0" :empty-text="filtered ? 'No log entries match these filters.' : 'Nothing has been added, removed or edited yet.'" min-width="900px">
		<!-- Phones: one card per row, with the row's buttons on it. -->
		<template #cards>
			<li v-for="log in logs" :key="`card-${log.logID}`">
				<div class="relative px-4 py-3.5 transition-colors active:bg-accent-50">
					<button type="button" class="card-cover" :aria-label="`Open the entry for ${log.bookTitle}`" @click="selected = log" />
					<div class="card-body">
						<div class="flex items-start gap-3">
							<!-- A copy shows its accession number; a change to the book's own record (no copy) shows a book. -->
							<span v-if="log.accessionNumber" class="font-data flex h-10 min-w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-stone-100 px-2 text-center leading-none" :title="`Accession no. ${log.accessionNumber}`">
								<span class="text-[9px] font-semibold uppercase tracking-wide text-stone-500">Acc.</span>
								<span class="mt-0.5 text-[14px] font-bold text-stone-900">{{ log.accessionNumber }}</span>
							</span>
							<span v-else class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-500" title="The book's own record"><Icon name="i-tabler-book-2" class="h-5 w-5" /></span>
							<div class="min-w-0 flex-1">
								<p class="break-words text-[14.5px] font-semibold leading-snug text-stone-900">{{ log.bookTitle }}</p>
								<p class="mt-0.5 break-words text-[13px] font-semibold text-stone-700">{{ log.reason ?? '—' }}</p>
							</div>
							<LibrarianStatusPill :label="ACTION[log.action].label" :tone="ACTION[log.action].tone" class="shrink-0" />
						</div>
						<!-- What actually changed, one line each ("Status: Borrowed → Lost", "Reason: ..."), so the card says it without opening. -->
						<ul v-if="noteLines(log).length" class="mt-2 space-y-1 rounded-xl bg-stone-50 px-3 py-2 text-[13px] leading-snug text-stone-700">
							<li v-for="(line, i) in noteLines(log)" :key="i" class="break-words">{{ line }}</li>
						</ul>
						<p class="mt-2 text-[12px] text-stone-500">{{ [log.librarianName, formatDateTime(log.created_at)].filter(Boolean).join(' · ') }}</p>
					</div>
				</div>
			</li>
		</template>
	<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Stock log entry" :title="selected?.bookTitle ?? ''"
			:subtitle="selected ? `Entry #${selected.logID}` : ''"
			:status="selected ? ACTION[selected.action] : undefined"
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

/** The note as separate lines: an edit lists its changes ("Title: A → B; Area: X → Y") and then the reason ("Status: ... . Reason: ..."). */
function noteLines(log: StockLogRow): string[] {
	if (!log.note) return []
	return log.note.split(/;\s+|\.\s+(?=Reason:)/).map((l) => l.trim().replace(/\.$/, '')).filter(Boolean)
}

const ACTION: Record<StockLogRow['action'], { label: string; tone: 'success' | 'danger' | 'neutral' }> = {
	added: { label: 'Added', tone: 'success' },
	removed: { label: 'Removed', tone: 'danger' },
	edited: { label: 'Edited', tone: 'neutral' },
}

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
