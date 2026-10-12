<template>
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<!-- Phones: one card per student, with the approve / reject / reinstate buttons on it. -->
		<ul class="divide-y divide-stone-100 sm:hidden">
			<li v-for="student in students" :key="`card-${student.studentID}`">
				<div role="button" tabindex="0" class="px-4 py-3.5 transition-colors active:bg-accent-50"
					@click="emit('view', student)" @keydown.enter.self="emit('view', student)">
					<div class="flex items-start gap-3">
						<LibrarianStudentAvatar :name="studentName(student)" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-[15px] font-semibold text-stone-900">{{ studentName(student) }}</p>
							<p class="font-data text-[12px] text-stone-400">{{ student.studentIDNumber }}</p>
							<p class="mt-0.5 truncate text-[13px] text-stone-500">{{ student.academicProgram ?? student.department ?? '—' }}</p>
							<p v-if="!members" class="mt-1 flex items-center gap-3 text-[12.5px] text-stone-500">
								<span class="inline-flex items-center gap-1"><Icon name="i-tabler-flame" class="h-3 w-3 text-amber-500" />{{ student.visitStreak }} day streak</span>
								<span class="tabular-nums">{{ student.knowledgeScore }} pts</span>
							</p>
						</div>
						<span class="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold" :class="members ? 'bg-sky-50 text-sky-700' : statusClass(student.registrationStatus)">
							<span class="h-1.5 w-1.5 rounded-full" :class="members ? 'bg-sky-500' : statusDotClass(student.registrationStatus)" />
							{{ members ? typeLabel(student) : statusLabel(student.registrationStatus) }}
						</span>
					</div>
					<div v-if="student.registrationStatus === 'pending'" class="mt-3 flex gap-2" @click.stop>
						<button type="button" class="h-10 flex-1 rounded-xl bg-red-50 text-[14px] font-bold text-red-600 active:scale-[.98]" @click="emit('reject', student)">Reject</button>
						<button type="button" class="h-10 flex-[1.4] rounded-xl bg-emerald-600 text-[14px] font-bold text-white active:scale-[.98]" @click="emit('approve', student)">Approve</button>
					</div>
					<div v-else-if="student.registrationStatus === 'rejected'" class="mt-3" @click.stop>
						<button type="button" class="h-10 w-full rounded-xl bg-emerald-600 text-[14px] font-bold text-white active:scale-[.98]" @click="emit('reinstate', student)">Reinstate</button>
					</div>
				</div>
			</li>
		</ul>
		<p v-if="!loading && students.length === 0" class="px-4 py-10 text-center text-[15px] text-stone-400 sm:hidden">{{ emptyText ?? 'No students match your search.' }}</p>

		<div class="max-h-[480px] overflow-auto max-sm:hidden">
			<table class="w-full border-collapse text-left" :class="members ? 'min-w-[760px]' : 'min-w-[920px]'">
				<thead>
					<tr>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Student</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">{{ members ? 'Department' : 'Program' }}</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Email</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400" v-if="!members">Visit Streak</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400" v-if="!members">Knowledge Score</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Status</th>
						<th class="sticky top-0 z-10 border-b border-stone-100 bg-stone-50 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(student, index) in students" :key="student.studentID"
						class="row-enter cursor-pointer border-b border-stone-100 opacity-0 transition-colors duration-150 last:border-0 hover:bg-accent-50"
						:style="{ animationDelay: `${index * 40}ms` }" @click="emit('view', student)">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<LibrarianStudentAvatar :name="studentName(student)" />
								<div>
									<p class="text-[15px] font-semibold text-stone-900">{{ studentName(student) }}</p>
									<p class="font-data text-[12px] text-stone-400">{{ student.studentIDNumber }}</p>
								</div>
							</div>
						</td>
						<td class="px-4 py-3 text-[14px] text-stone-600">{{ student.academicProgram ?? student.department ?? '—' }}</td>
						<td class="font-data px-4 py-3 text-[13px] text-stone-500">{{ student.user?.email ?? '—' }}</td>
						<td v-if="!members" class="px-4 py-3">
							<span class="inline-flex items-center gap-1 font-semibold tabular-nums text-stone-700">
								<Icon name="i-tabler-flame" class="h-3 w-3 text-amber-500" />{{ student.visitStreak }}
							</span>
						</td>
						<td v-if="!members" class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ student.knowledgeScore }}</td>
						<td class="px-4 py-3">
							<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold" :class="members ? 'bg-sky-50 text-sky-700' : statusClass(student.registrationStatus)">
								<span class="h-1.5 w-1.5 rounded-full" :class="members ? 'bg-sky-500' : statusDotClass(student.registrationStatus)" />
								{{ members ? typeLabel(student) : statusLabel(student.registrationStatus) }}
							</span>
						</td>
						<td class="px-4 py-3">
							<div v-if="student.registrationStatus === 'rejected'" class="flex items-center justify-end" @click.stop>
								<button type="button"
									class="h-7 rounded-lg bg-emerald-600 px-2.5 text-[12.5px] font-bold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-95"
									@click="emit('reinstate', student)">
									Reinstate
								</button>
							</div>
							<div v-else-if="student.registrationStatus === 'pending'" class="flex items-center justify-end gap-1.5" @click.stop>
								<button type="button"
									class="h-7 rounded-lg bg-emerald-600 px-2.5 text-[12.5px] font-bold text-white transition-all duration-150 hover:bg-emerald-700 active:scale-95"
									@click="emit('approve', student)">
									Approve
								</button>
								<button type="button"
									class="h-7 rounded-lg bg-red-50 px-2.5 text-[12.5px] font-bold text-red-600 transition-all duration-150 hover:bg-red-100 active:scale-95"
									@click="emit('reject', student)">
									Reject
								</button>
							</div>
						</td>
					</tr>

					<tr v-if="!loading && students.length === 0">
						<td :colspan="members ? 5 : 7" class="py-10 text-center text-[15px] text-stone-400">{{ emptyText ?? 'No students match your search.' }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<LibrarianLoadingOverlay :loading="loading" />
	</div>
</template>

<script setup lang="ts">
import type { StudentRecord } from '~/services/librarianService'

defineProps<{
	students: StudentRecord[]
	loading: boolean
	/** The read-only list of faculty and staff members: department instead of program, and no points or streak. */
	members?: boolean
	/** Shown when the list is empty (it differs by tab). */
	emptyText?: string
}>()

const emit = defineEmits<{
	(e: 'view', student: StudentRecord): void
	(e: 'approve', student: StudentRecord): void
	(e: 'reject', student: StudentRecord): void
	(e: 'reinstate', student: StudentRecord): void
}>()

function studentName(student: StudentRecord): string {
	return student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown student'
}

function typeLabel(student: StudentRecord): string {
	return student.memberType === 'staff' ? 'Staff' : 'Faculty'
}

function statusLabel(status: StudentRecord['registrationStatus']): string {
	return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusClass(status: StudentRecord['registrationStatus']): string {
	if (status === 'pending') return 'bg-amber-50 text-amber-700'
	if (status === 'rejected') return 'bg-red-50 text-red-600'
	return 'bg-emerald-50 text-emerald-700'
}

function statusDotClass(status: StudentRecord['registrationStatus']): string {
	if (status === 'pending') return 'bg-amber-500'
	if (status === 'rejected') return 'bg-red-500'
	return 'bg-emerald-500'
}
</script>

<style scoped>
.row-enter {
	animation: studentRowIn .4s cubic-bezier(.22,1,.36,1) forwards;
}

@keyframes studentRowIn {
	to {
		opacity: 1;
	}
}

@media (prefers-reduced-motion: reduce) {
	.row-enter {
		animation: none !important;
		opacity: 1 !important;
	}
}
</style>
