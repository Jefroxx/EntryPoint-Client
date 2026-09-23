<template>
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<div class="max-h-[480px] overflow-auto">
			<table class="w-full min-w-[760px] border-collapse text-left">
				<thead>
					<tr>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Student</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Program</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Entry Time</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Exit Time</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Duration</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Status</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(log, index) in logs" :key="log.logID"
						class="row-enter border-b border-stone-100 opacity-0 transition-colors duration-150 last:border-0 hover:bg-accent-50"
						:style="{ animationDelay: `${index * 40}ms` }">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<LibrarianStudentAvatar :name="studentName(log)" />
								<div>
									<p class="text-[15px] font-semibold text-stone-900">{{ studentName(log) }}</p>
									<p class="font-data text-[12px] text-stone-400">{{ log.student?.studentIDNumber ?? '—' }}</p>
								</div>
							</div>
						</td>
						<td class="px-4 py-3 text-[14px] text-stone-600">{{ log.student?.academicProgram ?? '—' }}</td>
						<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatTime(log.entryTime) }}</td>
						<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ log.exitTime ? formatTime(log.exitTime) : '—' }}</td>
						<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ duration(log) }}</td>
						<td class="px-4 py-3">
							<span v-if="!log.exitTime"
								class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12.5px] font-semibold text-emerald-600">
								<span class="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />In Library
							</span>
							<span v-else class="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-1 text-[12.5px] font-semibold text-stone-500">
								Checked Out
							</span>
						</td>
					</tr>

					<tr v-if="!loading && logs.length === 0">
						<td colspan="6" class="py-10 text-center text-[15px] text-stone-400">No attendance logs match your search.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<LibrarianLoadingOverlay :loading="loading" />
	</div>
</template>

<script setup lang="ts">
import type { AttendanceLog } from '~/services/librarianService'

const props = defineProps<{
	logs: AttendanceLog[]
	loading: boolean
}>()

function studentName(log: AttendanceLog): string {
	const user = log.student?.user
	return user ? `${user.firstName} ${user.lastName}` : 'Unknown student'
}

function formatTime(value: string): string {
	return new Date(value).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function duration(log: AttendanceLog): string {
	if (!log.exitTime) return '—'
	const minutes = Math.max(0, Math.round((new Date(log.exitTime).getTime() - new Date(log.entryTime).getTime()) / 60000))
	if (minutes < 60) return `${minutes}m`
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
</script>

<style scoped>
.row-enter {
	animation: attendanceRowIn .4s cubic-bezier(.22,1,.36,1) forwards;
}

@keyframes attendanceRowIn {
	to {
		opacity: 1;
	}
}

.pulse-dot {
	animation: attendancePulse 1.8s ease-in-out infinite;
}

@keyframes attendancePulse {
	0%, 100% { opacity: 1; }
	50% { opacity: .35; }
}

@media (prefers-reduced-motion: reduce) {
	.row-enter {
		animation: none !important;
		opacity: 1 !important;
	}
	.pulse-dot {
		animation: none !important;
	}
}
</style>
