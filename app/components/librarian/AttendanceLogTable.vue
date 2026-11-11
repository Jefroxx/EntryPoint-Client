<template>
	<div class="relative rounded-2xl">
		<!-- Too narrow for the table: one card per row. -->
		<LibrarianCardSkeleton v-if="loading" />
		<ul v-else class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3 [&>li]:overflow-hidden [&>li]:rounded-2xl [&>li]:border [&>li]:border-stone-200 [&>li]:bg-white">
			<li v-for="log in logs" :key="`card-${log.logID}`">
				<div role="button" tabindex="0" class="px-4 py-3.5 transition-colors active:bg-accent-50" @click="selected = log" @keydown.enter.self="selected = log">
					<div class="flex items-start gap-3">
						<LibrarianStudentAvatar :name="studentName(log)" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-[15px] font-semibold text-stone-900">{{ studentName(log) }}</p>
							<p class="font-data text-[12px] text-stone-500">{{ log.student?.memberIDNumber ?? '—' }}</p>
							<p class="truncate text-[13px] text-stone-500">{{ isVisitor(log) ? `Visitor · ${log.visitorPurpose}` : (log.student?.academicProgram ?? '—') }}</p>
								<!-- A visitor has no card to scan on the way out, so the librarian checks them out here. -->
								<ButtonsButton v-if="isVisitor(log) && !log.exitTime" variant="ghost" size="sm" class="mt-2"
									:disabled="checkingOut === log.uuid" @click.stop="emit('checkOut', log.uuid)">
									<Icon :name="checkingOut === log.uuid ? 'i-tabler-loader-2' : 'i-tabler-logout'" class="h-3.5 w-3.5" :class="{ 'animate-spin': checkingOut === log.uuid }" />Check out
								</ButtonsButton>
							<p class="font-data mt-1 text-[12.5px] text-stone-500">In {{ formatTime(log.entryTime) }} · Out {{ log.exitTime ? formatTime(log.exitTime) : '—' }} · {{ duration(log) }}</p>
							<!-- Which staff account scanned the visit in (and out), so a desk shared by several accounts can tell who did what. -->
							<p class="mt-1 flex items-start gap-1.5 text-[12.5px] leading-snug" :class="log.checkedInByStaff ? 'text-stone-600' : 'text-stone-400'">
								<Icon name="i-tabler-user-check" class="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
								<span class="min-w-0">
									<template v-if="log.checkedInByStaff">In by <b class="font-semibold text-stone-700">{{ log.checkedInByStaff.name }}</b> <span class="text-stone-400">· {{ staffRoleLabel(log.checkedInByStaff.role) }}</span></template>
									<template v-else>Checked in by: not recorded</template>
									<template v-if="log.checkedOutByStaff"><br />Out by <b class="font-semibold text-stone-700">{{ log.checkedOutByStaff.name }}</b> <span class="text-stone-400">· {{ staffRoleLabel(log.checkedOutByStaff.role) }}</span></template>
								</span>
							</p>
						</div>
						<span v-if="!log.exitTime" class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-600">
							<span class="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />In Library
						</span>
						<span v-else class="inline-flex shrink-0 items-center rounded-full bg-stone-100 px-2.5 py-1 text-[12px] font-semibold text-stone-500">Checked Out</span>
					</div>
				</div>
			</li>
		</ul>
		<p v-if="!loading && logs.length === 0" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">No attendance was logged for this day, or nothing matches your search.</p>

		<div class="scroll-shadow-x max-h-[480px] overflow-auto hidden">
			<table class="w-full min-w-[760px] border-collapse text-left">
				<thead>
					<tr>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Student</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Program</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Entry Time</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Exit Time</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Duration</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-500">Status</th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(log, index) in logs" :key="log.logID" tabindex="0" @click="selected = log" @keydown.enter.self="selected = log"
						class="row-enter cursor-pointer border-b border-stone-100 opacity-0 transition-colors duration-150 last:border-0 hover:bg-accent-50"
						:style="{ animationDelay: `${index * 40}ms` }">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<LibrarianStudentAvatar :name="studentName(log)" />
								<div>
									<p class="text-[15px] font-semibold text-stone-900">{{ studentName(log) }}</p>
									<p class="font-data text-[12px] text-stone-500">{{ log.student?.memberIDNumber ?? '—' }}</p>
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
						<td colspan="6" class="py-10 text-center text-[15px] text-stone-500">No attendance logs match your search.</td>
					</tr>
				</tbody>
			</table>
		</div>


		<LibrarianRecordDrawer :open="!!selected" heading="Visit details" :title="selected ? studentName(selected) : ''"
			:subtitle="selected?.student?.memberIDNumber"
			:status="selected ? (selected.exitTime ? { label: 'Checked out', tone: 'neutral' } : { label: 'In library', tone: 'success' }) : undefined"
			:fields="fields" @close="selected = null" />
	</div>
</template>

<script setup lang="ts">
import type { AttendanceLog } from '~/services/librarianService'

const props = defineProps<{
	logs: AttendanceLog[]
	loading: boolean
	/** uuid of the visitor whose check-out is in flight. */
	checkingOut?: string | null
}>()

const emit = defineEmits<{ (e: 'checkOut', uuid: string): void }>()

const isVisitor = (log: AttendanceLog) => !log.student && !!log.visitorName


const selected = ref<AttendanceLog | null>(null)

const fields = computed(() => {
	const log = selected.value
	if (!log) return []
	return [
		isVisitor(log)
			? { label: 'Purpose of visit', value: log.visitorPurpose, wide: true }
			: { label: 'Program', value: log.student?.academicProgram, wide: true },
		{ label: 'Entered', value: formatDateTime(log.entryTime), wide: true },
		{ label: 'Checked in by', value: log.checkedInByStaff ? staffLabel(log.checkedInByStaff) : 'Not recorded', wide: true },
		{ label: 'Left', value: log.exitTime ? formatDateTime(log.exitTime) : null, wide: true },
		...(log.exitTime ? [{ label: 'Checked out by', value: log.checkedOutByStaff ? staffLabel(log.checkedOutByStaff) : 'Not recorded, or closed automatically at the end of the day', wide: true }] : []),
		{ label: 'Time in library', value: log.exitTime ? duration(log) : 'Still inside' },
		{ label: 'Log ID', value: log.logID, mono: true },
	]
})

function studentName(log: AttendanceLog): string {
	if (log.visitorName && !log.student) return log.visitorName
	const user = log.student?.user
	return user ? `${user.firstName} ${user.lastName}` : 'Unknown student'
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
