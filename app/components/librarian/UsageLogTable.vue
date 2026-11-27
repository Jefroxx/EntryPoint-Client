<template>
	<LibrarianTableShell :columns="['Resource', 'Student', 'Started', 'Ended', 'Duration', 'Status']" :loading="loading"
		:empty="logs.length === 0" empty-text="No sessions match your filters.">
		<!-- Phones: one card per row, with the row's buttons on it. -->
		<template #cards>
			<li v-for="log in logs" :key="`card-${log.usageID}`">
				<div role="button" tabindex="0" class="h-full px-4 py-3.5 transition-colors duration-150 hover:bg-stone-500/[0.07] active:bg-accent-50" @click="selected = log" @keydown.enter.self="selected = log">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="truncate text-[15px] font-semibold text-stone-900">{{ log.resource?.name ?? 'Removed resource' }}</p>
							<p class="truncate text-[13px] text-stone-500">{{ personName(log.student?.user) }}</p>
						</div>
						<LibrarianStatusPill :label="log.endTime ? 'Ended' : 'Active'" :tone="log.endTime ? 'neutral' : 'warning'" class="shrink-0" />
					</div>
					<p class="font-data mt-1 text-[12.5px] text-stone-500">{{ formatDateTime(log.startTime) }}{{ log.endTime ? ` → ${formatTime(log.endTime)}` : '' }} · {{ formatDuration(log.startTime, log.endTime, nowMs) }}</p>
				</div>
			</li>
		</template>
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
		{ label: 'Student ID', value: log.student?.memberIDNumber, mono: true },
		{ label: log.student?.academicProgram ? 'Program' : 'Department', value: log.student?.academicProgram ?? log.student?.department },
		{ label: 'Started', value: formatDateTime(log.startTime), wide: true },
		{ label: 'Started by', value: log.staff_librarian?.user ? personName(log.staff_librarian.user) : 'Not recorded', wide: true },
		{ label: 'Ended', value: log.endTime ? formatDateTime(log.endTime) : null, wide: true },
		{ label: 'Duration', value: formatDuration(log.startTime, log.endTime, props.nowMs) },
	]
})
</script>
