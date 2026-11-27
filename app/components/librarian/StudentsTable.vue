<template>
	<div class="relative rounded-2xl">
		<!-- Too narrow for the table: one card per student, with the approve / reject / reinstate buttons on it. -->
		<LibrarianCardSkeleton v-if="loading" />
		<ul v-else class="card-grid grid gap-3 sm:grid-cols-2 2xl:grid-cols-3 [&>li]:overflow-hidden [&>li]:rounded-2xl [&>li]:border [&>li]:border-stone-200 [&>li]:bg-white">
			<li v-for="student in students" :key="`card-${student.studentID}`">
				<div role="button" tabindex="0" class="px-4 py-3.5 transition-colors active:bg-accent-50"
					@click="emit('view', student)" @keydown.enter.self="emit('view', student)">
					<div class="flex items-start gap-3">
						<LibrarianStudentAvatar :name="studentName(student)" />
						<div class="min-w-0 flex-1">
							<p class="truncate text-[15px] font-semibold text-stone-900">{{ studentName(student) }}</p>
							<p class="font-data text-[12px] text-stone-500">{{ student.memberIDNumber }}</p>
							<p class="mt-0.5 truncate text-[13px] text-stone-500">{{ student.academicProgram ?? student.department ?? '—' }}</p>
							<p v-if="members" class="font-data truncate text-[12px] text-stone-500">{{ student.user?.email ?? '—' }}</p>
							<!-- A streak and points only mean something once the student is approved and using the library. -->
							<p v-if="!members && student.registrationStatus === 'approved'" class="mt-1 flex items-center gap-3 text-[12.5px] text-stone-500">
								<span class="inline-flex items-center gap-1"><Icon name="i-tabler-flame" class="h-3 w-3 text-amber-500" />{{ student.visitStreak }}-day streak</span>
								<span class="tabular-nums">{{ student.knowledgeScore }} pts</span>
							</p>
						</div>
						<!-- A student's tab already says where they stand, so the pill is only for faculty and staff (Faculty or Staff). -->
						<span v-if="members" class="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-[12px] font-bold text-sky-700">
							<span class="h-1.5 w-1.5 rounded-full bg-sky-500" />{{ typeLabel(student) }}
						</span>
					</div>
					<div v-if="student.registrationStatus === 'pending'" class="mt-3 flex gap-2" @click.stop>
						<ButtonsButton variant="danger" class="flex-1" @click="emit('reject', student)">Reject</ButtonsButton>
						<ButtonsButton variant="primary" class="flex-[1.4]" @click="emit('approve', student)">Approve</ButtonsButton>
					</div>
					<div v-else-if="student.registrationStatus === 'rejected'" class="mt-3" @click.stop>
						<ButtonsButton variant="primary" class="w-full" @click="emit('reinstate', student)">Reinstate</ButtonsButton>
					</div>
				</div>
			</li>
		</ul>
		<p v-if="!loading && students.length === 0" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">{{ emptyText ?? 'No students match your search.' }}</p>
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

</script>
