<template>
	<LibrarianTableShell :columns="['Resource', 'Student', 'Started', 'Ended', 'Duration', 'Status']" :loading="loading"
		:empty="logs.length === 0" empty-text="No sessions match your filters.">
		<tr v-for="(log, index) in logs" :key="log.usageID" tabindex="0" @click="selected = log" @keydown.enter.self="selected = log"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3 text-[15px] font-semibold text-stone-900">{{ log.resource?.name ?? 'Removed resource' }}</td>
			<td class="px-4 py-3">
				<LibrarianPersonCell :name="personName(log.student?.user)" />
			</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDateTime(log.startTime) }}</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ log.endTime ? formatTime(log.endTime) : '—' }}</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDuration(log.startTime, log.endTime, nowMs) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill :label="log.endTime ? 'Ended' : 'Active'" :tone="log.endTime ? 'neutral' : 'warning'" />
			</td>
		</tr>
	<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Session details" :title="selected?.resource?.name ?? 'Removed resource'"
			:subtitle="selected?.resource?.resourceType" :status="selected ? { label: selected.endTime ? 'Ended' : 'Active', tone: selected.endTime ? 'neutral' : 'warning' } : undefined"
			:fields="fields" @close="selected = null" />
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { UsageLogRecord } from '~/services/resourceService'

const props = defineProps<{
	logs: UsageLogRecord[]
	loading: boolean
	nowMs: number
}>()
const selected = ref<UsageLogRecord | null>(null)

const fields = computed(() => {
	const log = selected.value
	if (!log) return []
	return [
		{ label: 'Student', value: personName(log.student?.user), wide: true },
		{ label: 'Started', value: formatDateTime(log.startTime), wide: true },
		{ label: 'Ended', value: log.endTime ? formatDateTime(log.endTime) : null, wide: true },
		{ label: 'Duration', value: formatDuration(log.startTime, log.endTime, props.nowMs) },
		{ label: 'Session ID', value: log.usageID, mono: true },
	]
})
</script>
