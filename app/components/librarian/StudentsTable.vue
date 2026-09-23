<template>
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<div class="max-h-[480px] overflow-auto">
			<table class="w-full min-w-[920px] border-collapse text-left">
				<thead>
					<tr>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Student</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Program</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Email</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Visit Streak</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Knowledge Score</th>
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
						<td class="px-4 py-3 text-[14px] text-stone-600">{{ student.academicProgram ?? '—' }}</td>
						<td class="font-data px-4 py-3 text-[13px] text-stone-500">{{ student.user?.email ?? '—' }}</td>
						<td class="px-4 py-3">
							<span class="inline-flex items-center gap-1 font-semibold tabular-nums text-stone-700">
								<Icon name="i-tabler-flame" class="h-3 w-3 text-amber-500" />{{ student.visitStreak }}
							</span>
						</td>
						<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ student.knowledgeScore }}</td>
						<td class="px-4 py-3">
							<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold" :class="statusClass(student.registrationStatus)">
								<span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(student.registrationStatus)" />
								{{ statusLabel(student.registrationStatus) }}
							</span>
						</td>
						<td class="px-4 py-3">
							<div v-if="student.registrationStatus === 'pending'" class="flex items-center justify-end gap-1.5" @click.stop>
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
						<td colspan="7" class="py-10 text-center text-[15px] text-stone-400">No students match your search.</td>
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
}>()

const emit = defineEmits<{
	(e: 'view', student: StudentRecord): void
	(e: 'approve', student: StudentRecord): void
	(e: 'reject', student: StudentRecord): void
}>()

function studentName(student: StudentRecord): string {
	return student.user ? `${student.user.firstName} ${student.user.lastName}` : 'Unknown student'
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
