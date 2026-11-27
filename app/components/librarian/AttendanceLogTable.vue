<template>
	<div class="relative rounded-2xl">
		<!-- One card per visit. -->
		<LibrarianCardSkeleton v-if="loading" />
		<ul v-else class="card-grid grid gap-3 sm:grid-cols-2 2xl:grid-cols-3 [&>li]:overflow-hidden [&>li]:rounded-2xl [&>li]:border [&>li]:border-stone-200 [&>li]:bg-white">
			<li v-for="log in logs" :key="`card-${log.logID}`">
				<div role="button" tabindex="0" class="flex h-full flex-col px-4 py-3.5 transition-colors duration-150 hover:bg-stone-500/[0.07] active:bg-accent-50" @click="selected = log" @keydown.enter.self="selected = log">
					<div class="flex items-start gap-3">
						<LibrarianStudentAvatar :name="studentName(log)" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-[15px] font-semibold text-stone-900">{{ studentName(log) }}</p>
							<!-- A visitor has no ID number, so their line says what they are instead of a lone dash. -->
							<p v-if="isVisitor(log)" class="text-[12px] font-semibold uppercase tracking-wide text-stone-400">Walk-in visitor</p>
							<p v-else class="font-data text-[12px] text-stone-500">{{ log.student?.memberIDNumber ?? '—' }}</p>
							<!-- A student's program, a faculty or staff member's department, or a visitor's reason for coming. -->
							<p class="truncate text-[13px] text-stone-500" :title="isVisitor(log) ? log.visitorPurpose ?? '' : undefined">{{ isVisitor(log) ? (log.visitorPurpose || 'No reason given') : (log.student?.academicProgram ?? log.student?.department ?? '—') }}</p>
						</div>
						<span v-if="!log.exitTime" class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[12px] font-semibold text-emerald-600">
							<span class="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-500" />In Library
						</span>
						<span v-else class="inline-flex shrink-0 items-center rounded-full bg-stone-100 px-2.5 py-1 text-[12px] font-semibold text-stone-500">Checked Out</span>
					</div>

					<!-- The times, and who scanned them, use the whole width of the card, under the name. -->
					<div class="mt-2.5 space-y-1">
						<!-- Still inside: no "Out — · —", just when they came in and how long they have been here. -->
						<p v-if="log.exitTime" class="font-data text-[12.5px] text-stone-500">In {{ formatTime(log.entryTime) }} · Out {{ formatTime(log.exitTime) }} · {{ duration(log) }}</p>
						<p v-else class="font-data text-[12.5px] text-stone-500">In {{ formatTime(log.entryTime) }} · <span class="text-emerald-600">here for {{ elapsed(log) }}</span></p>
						<!-- Which staff account scanned the visit in (and out), so a desk shared by several accounts can tell who did what. -->
						<p v-if="log.checkedInByStaff || log.checkedOutByStaff" class="flex items-start gap-1.5 text-[12.5px] leading-snug text-stone-600">
							<Icon name="i-tabler-user-check" class="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />
							<span class="min-w-0">
								<template v-if="log.checkedInByStaff">In by <b class="font-semibold text-stone-700">{{ log.checkedInByStaff.name }}</b> <span class="text-stone-400">· {{ staffRoleLabel(log.checkedInByStaff.role) }}</span></template>
								<template v-if="log.checkedOutByStaff"><br v-if="log.checkedInByStaff" />Out by <b class="font-semibold text-stone-700">{{ log.checkedOutByStaff.name }}</b> <span class="text-stone-400">· {{ staffRoleLabel(log.checkedOutByStaff.role) }}</span></template>
							</span>
						</p>
					</div>

					<!-- A visitor has no card to scan on the way out, so the librarian checks them out here. -->
					<!-- Pinned to the bottom of the card, so it lines up however tall the cards in the row are. -->
					<div v-if="isVisitor(log) && !log.exitTime" class="mt-auto pt-3">
						<ButtonsButton variant="ghost" size="sm" class="w-full"
							:disabled="checkingOut === log.uuid" @click.stop="emit('checkOut', log.uuid)">
							<Icon :name="checkingOut === log.uuid ? 'i-tabler-loader-2' : 'i-tabler-logout'" class="h-3.5 w-3.5" :class="{ 'animate-spin': checkingOut === log.uuid }" />Check out
						</ButtonsButton>
					</div>
				</div>
			</li>
		</ul>
		<p v-if="!loading && logs.length === 0" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">No attendance was logged for this day, or nothing matches your search.</p>

		<LibrarianRecordDrawer :open="!!selected" heading="Visit details" :title="selected ? studentName(selected) : ''"
			:subtitle="selected?.student?.memberIDNumber"
			:status="selected ? (selected.exitTime ? { label: 'Checked out', tone: 'neutral' } : { label: 'In library', tone: 'success' }) : undefined"
			:fields="fields" @close="selected = null">
			<!-- The same button as on the card: a visitor still inside is checked out by hand. -->
			<template v-if="selected && isVisitor(selected) && !selected.exitTime" #footer>
				<ButtonsButton variant="primary" class="w-full" @click="checkOutSelected(selected)">
					<Icon name="i-tabler-logout" class="h-4 w-4" />Check out
				</ButtonsButton>
			</template>
		</LibrarianRecordDrawer>
	</div>
</template>

<script setup lang="ts">
import type { AttendanceLog } from '~/services/librarianService'

defineProps<{
	logs: AttendanceLog[]
	loading: boolean
	/** uuid of the visitor whose check-out is in flight. */
	checkingOut?: string | null
}>()

const emit = defineEmits<{ (e: 'checkOut', uuid: string): void }>()

const isVisitor = (log: AttendanceLog) => !log.student && !!log.visitorName

const selected = ref<AttendanceLog | null>(null)

/** The details panel's button closes it, then does the same as the card's. */
function checkOutSelected(log: AttendanceLog) {
	selected.value = null
	emit('checkOut', log.uuid)
}

const fields = computed(() => {
	const log = selected.value
	if (!log) return []
	return [
		isVisitor(log)
			? { label: 'Purpose of visit', value: log.visitorPurpose, wide: true }
			: { label: log.student?.academicProgram ? 'Program' : 'Department', value: log.student?.academicProgram ?? log.student?.department, wide: true },
		{ label: 'Entered', value: formatDateTime(log.entryTime), wide: true },
		{ label: 'Checked in by', value: log.checkedInByStaff ? staffLabel(log.checkedInByStaff) : 'Not recorded', wide: true },
		{ label: 'Left', value: log.exitTime ? formatDateTime(log.exitTime) : null, wide: true },
		...(log.exitTime ? [{ label: 'Checked out by', value: log.checkedOutByStaff ? staffLabel(log.checkedOutByStaff) : 'Not recorded, or closed automatically at the end of the day', wide: true }] : []),
		{ label: 'Time in library', value: log.exitTime ? duration(log) : 'Still inside' },
	]
})

function studentName(log: AttendanceLog): string {
	if (log.visitorName && !log.student) return log.visitorName
	const user = log.student?.user
	return user ? `${user.firstName} ${user.lastName}` : 'Unknown student'
}

// How long someone still inside has been here, counted to now (the list refreshes, so this moves along with it).
function elapsed(log: AttendanceLog): string {
	const minutes = Math.max(0, Math.round((Date.now() - new Date(log.entryTime).getTime()) / 60000))
	if (minutes < 1) return 'under a minute'
	if (minutes < 60) return `${minutes}m`
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function duration(log: AttendanceLog): string {
	if (!log.exitTime) return '—'
	const minutes = Math.max(0, Math.round((new Date(log.exitTime).getTime() - new Date(log.entryTime).getTime()) / 60000))
	if (minutes < 60) return `${minutes}m`
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
</script>

<style scoped>
.pulse-dot {
	animation: attendancePulse 1.8s ease-in-out infinite;
}

@keyframes attendancePulse {
	0%, 100% { opacity: 1; }
	50% { opacity: .35; }
}

@media (prefers-reduced-motion: reduce) {
	.pulse-dot {
		animation: none !important;
	}
}
</style>
