<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-[60] bg-stone-900/35 backdrop-blur-[2px] transition-opacity duration-200"
			:class="open ? 'opacity-100' : 'pointer-events-none opacity-0'" @click="emit('close')" />

		<aside class="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[400px] flex-col bg-white shadow-overlay transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]"
			:class="open ? 'translate-x-0' : 'translate-x-full'">
			<div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
				<h3 class="text-[17px] font-bold text-accent-700">Student details</h3>
				<ButtonsButton variant="icon" aria-label="Close" @click="emit('close')">
					<Icon name="i-tabler-x" class="h-[18px] w-[18px]" />
				</ButtonsButton>
			</div>

			<div v-if="student" class="flex-1 overflow-y-auto px-5 py-5">
				<div class="mb-1">
					<LibrarianStudentAvatar :name="studentName" class="!h-16 !w-16 !text-xl" />
				</div>
				<p class="mt-3 text-[16px] font-bold text-stone-900">{{ studentName }}</p>
				<p class="text-[13.5px] text-stone-500">{{ student.studentIDNumber }} · {{ student.academicProgram ?? '—' }}</p>

				<div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5">
					<div class="col-span-2">
						<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Email</p>
						<p class="font-data text-[13.5px] font-medium text-stone-800">{{ student.user?.email ?? '—' }}</p>
					</div>
					<div>
						<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Status</p>
						<p class="text-[15px] font-medium capitalize text-stone-800">{{ student.registrationStatus }}</p>
					</div>
					<div>
						<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Visit streak</p>
						<p class="text-[15px] font-medium text-stone-800">{{ student.visitStreak }} days</p>
					</div>
					<div>
						<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Knowledge score</p>
						<p class="text-[15px] font-medium text-stone-800">{{ student.knowledgeScore }} pts</p>
					</div>
				</div>
			</div>

			<div v-if="student?.registrationStatus === 'pending'" class="flex gap-2.5 border-t border-stone-100 px-5 py-4">
				<ButtonsButton variant="danger" class="flex-1" @click="emit('reject', student)">
					Reject
				</ButtonsButton>
				<ButtonsButton variant="primary" class="flex-[1.4]" @click="emit('approve', student)">
					Approve student
				</ButtonsButton>
			</div>
		</aside>
	</Teleport>
</template>

<script setup lang="ts">
import type { StudentRecord } from '~/services/librarianService'

const props = defineProps<{
	open: boolean
	student: StudentRecord | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'approve', student: StudentRecord): void
	(e: 'reject', student: StudentRecord): void
}>()

const studentName = computed(() => {
	const user = props.student?.user
	return user ? `${user.firstName} ${user.lastName}` : 'Unknown student'
})

function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>
