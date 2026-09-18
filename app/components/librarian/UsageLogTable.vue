<template>
	<LibrarianTableShell :columns="['Resource', 'Student', 'Started', 'Ended', 'Duration', 'Status']" :loading="loading"
		:empty="logs.length === 0" empty-text="No sessions match your filters.">
		<tr v-for="(log, index) in logs" :key="log.usageID"
			class="row-fade-in border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-stone-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3 text-[13.5px] font-semibold text-stone-900">{{ log.resource?.name ?? 'Removed resource' }}</td>
			<td class="px-4 py-3">
				<LibrarianPersonCell :name="personName(log.student?.user)" />
			</td>
			<td class="font-data px-4 py-3 text-[12.5px] text-stone-500">{{ formatDateTime(log.startTime) }}</td>
			<td class="font-data px-4 py-3 text-[12.5px] text-stone-500">{{ log.endTime ? formatTime(log.endTime) : '—' }}</td>
			<td class="font-data px-4 py-3 text-[12.5px] text-stone-500">{{ formatDuration(log.startTime, log.endTime, nowMs) }}</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill :label="log.endTime ? 'Ended' : 'Active'" :tone="log.endTime ? 'neutral' : 'warning'" />
			</td>
		</tr>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { UsageLogRecord } from '~/services/resourceService'

defineProps<{
	logs: UsageLogRecord[]
	loading: boolean
	nowMs: number
}>()
</script>
