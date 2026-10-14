<template>
	<LibrarianModalShell :open="open" size="xl" :title="step === 'confirm' ? words.confirmTitle : words.title"
		:subtitle="step === 'confirm' ? words.confirmSubtitle : words.subtitle" :busy="busy" @close="emit('close')">
		<!-- Step 2: the final confirmation. Nothing has changed yet; the button below is what does it. -->
		<div v-if="student && step === 'confirm'" class="space-y-4">
			<section class="rounded-2xl border p-4" :class="words.confirmBox">
				<p class="text-[12px] font-bold uppercase tracking-wide" :class="words.confirmLabelTone">{{ words.about }}</p>
				<p class="mt-1.5 text-[20px] font-extrabold leading-snug text-stone-900">{{ fullName }}</p>
				<p class="text-[14px] text-stone-700">
					<span class="font-data">{{ student.studentIDNumber }}</span> · {{ student.academicProgram || 'No program' }} · {{ email || 'no email' }}
				</p>
				<p class="mt-2.5 text-[14px]" :class="words.confirmLabelTone">{{ words.outcome }}</p>
			</section>
		</div>

		<!-- Step 1: everything about the student on one screen. -->
		<div v-else-if="student" class="space-y-4">
			<section v-if="blocked" role="alert" class="flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-4">
				<Icon name="i-tabler-mail-x" class="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
				<div>
					<p class="text-[15px] font-bold text-red-900">This student hasn't confirmed their email yet.</p>
					<p class="mt-0.5 text-[14px] text-red-900">They can't be {{ mode === 'approve' ? 'approved' : 'reinstated' }} until they open the link in the email they were sent.</p>
				</div>
			</section>

			<section v-else class="flex items-start gap-3 rounded-2xl border p-4" :class="words.banner">
				<Icon :name="words.icon" class="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
				<div>
					<p class="text-[15px] font-bold">{{ words.bannerTitle }}</p>
					<p class="mt-0.5 text-[14px] leading-snug">{{ words.bannerText }}</p>
				</div>
			</section>

			<div class="grid gap-3 md:grid-cols-3">
				<section class="rounded-xl border border-stone-200 p-4">
					<h3 class="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
						<Icon name="i-tabler-user" class="h-4 w-4" aria-hidden="true" />Student
					</h3>
					<div class="flex items-center gap-3">
						<LibrarianStudentAvatar :name="fullName" />
						<div class="min-w-0">
							<p class="text-[15.5px] font-bold leading-snug text-stone-900">{{ fullName }}</p>
							<p class="font-data text-[13px] text-stone-600">{{ student.studentIDNumber }}</p>
						</div>
					</div>
					<dl class="mt-3 grid grid-cols-1 gap-y-2.5">
						<div v-for="f in studentFields" :key="f.label">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="break-words text-[14px] font-medium text-stone-800">{{ f.value || '—' }}</dd>
						</div>
					</dl>
				</section>

				<section class="rounded-xl border border-stone-200 p-4">
					<h3 class="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
						<Icon name="i-tabler-address-book" class="h-4 w-4" aria-hidden="true" />Contact
					</h3>
					<dl class="grid grid-cols-1 gap-y-2.5">
						<div>
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Email</dt>
							<dd class="break-words text-[14px] font-medium text-stone-800">{{ email || '—' }}</dd>
							<span class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-bold"
								:class="emailConfirmed ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'">
								<Icon :name="emailConfirmed ? 'i-tabler-circle-check' : 'i-tabler-circle-x'" class="h-3.5 w-3.5" aria-hidden="true" />
								{{ emailConfirmed ? 'Email confirmed' : 'Email not confirmed' }}
							</span>
						</div>
						<div v-for="f in contactFields" :key="f.label">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="break-words text-[14px] font-medium text-stone-800">{{ f.value || '—' }}</dd>
						</div>
					</dl>
				</section>

				<section class="rounded-xl border border-stone-200 p-4">
					<div class="mb-2.5 flex items-center justify-between gap-3">
						<h3 class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
							<Icon name="i-tabler-clipboard-check" class="h-4 w-4" aria-hidden="true" />Registration
						</h3>
						<LibrarianStatusPill :label="statusLabel" :tone="statusTone" />
					</div>
					<dl class="grid grid-cols-1 gap-y-2.5">
						<div v-for="f in registrationFields" :key="f.label">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="text-[14px] font-medium text-stone-800">{{ f.value || '—' }}</dd>
						</div>
					</dl>
				</section>
			</div>
		</div>

		<template #footer>
			<template v-if="step === 'confirm'">
				<ButtonsButton variant="ghost" :disabled="busy" @click="step = 'details'">
					<Icon name="i-tabler-arrow-left" class="h-3.5 w-3.5" />Back
				</ButtonsButton>
				<ButtonsButton :variant="mode === 'reject' ? 'danger' : 'primary'" :disabled="busy" @click="emit('submit')">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else :name="words.icon" class="h-3.5 w-3.5" />
					{{ words.confirm }}
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="!student || blocked" @click="step = 'confirm'">
					Continue<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5" />
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { StudentRecord } from '~/services/librarianService'

const props = defineProps<{
	open: boolean
	/** approve a pending registration, reject one, or reinstate a rejected student (which approves them again). */
	mode: 'approve' | 'reject' | 'reinstate'
	student: StudentRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit'): void
}>()

// Two steps: the details, then a last look before anything is changed.
const step = ref<'details' | 'confirm'>('details')
watch(() => [props.open, props.student?.studentID, props.mode], () => { step.value = 'details' })

const WORDS = {
	approve: {
		title: 'Approve this registration?', subtitle: 'Check the details against the student\'s school ID, then continue.',
		confirmTitle: 'Confirm the approval', confirmSubtitle: 'This is the last step. Check it, then approve the student.',
		banner: 'border-emerald-300 bg-emerald-50 text-emerald-900', icon: 'i-tabler-circle-check',
		bannerTitle: 'Check the details against their school ID.', bannerText: 'Once approved, the student can log in, gets a Library ID, and is told by notification and email.',
		about: 'You are about to approve', outcome: 'They can log in right away, and a Library ID with a barcode is created for them.',
		confirmBox: 'border-emerald-300 bg-emerald-50', confirmLabelTone: 'text-emerald-800', confirm: 'Yes, approve the student',
	},
	reject: {
		title: 'Reject this registration?', subtitle: 'Check the details, then continue.',
		confirmTitle: 'Confirm the rejection', confirmSubtitle: 'This is the last step. Check it, then reject the registration.',
		banner: 'border-amber-300 bg-amber-50 text-amber-900', icon: 'i-tabler-circle-x',
		bannerTitle: 'Rejecting stops this student from logging in.', bannerText: 'They are told by notification and email to contact the library. You can reinstate them later from the Rejected tab.',
		about: 'You are about to reject', outcome: 'They stay unable to log in until a librarian reinstates them. They are told to contact the library.',
		confirmBox: 'border-amber-300 bg-amber-50', confirmLabelTone: 'text-amber-900', confirm: 'Yes, reject the registration',
	},
	reinstate: {
		title: 'Reinstate this student?', subtitle: 'Their registration was rejected. Check the details, then continue.',
		confirmTitle: 'Confirm the reinstatement', confirmSubtitle: 'This is the last step. Check it, then reinstate their approval.',
		banner: 'border-emerald-300 bg-emerald-50 text-emerald-900', icon: 'i-tabler-user-check',
		bannerTitle: 'Reinstating approves this student again.', bannerText: 'They can log in again and are told by notification and email.',
		about: 'You are about to reinstate', outcome: 'They are approved again, can log in right away, and are told by notification and email.',
		confirmBox: 'border-emerald-300 bg-emerald-50', confirmLabelTone: 'text-emerald-800', confirm: 'Yes, reinstate approval',
	},
} as const

const words = computed(() => WORDS[props.mode])

const user = computed(() => props.student?.user ?? null)
const fullName = computed(() => {
	const u = user.value
	if (!u) return 'Unknown student'
	return [u.firstName, u.middleInitial ? `${u.middleInitial.replace(/\.$/, '')}.` : '', u.lastName].filter(Boolean).join(' ')
})
const email = computed(() => user.value?.email ?? '')
const emailConfirmed = computed(() => !!user.value?.emailVerifiedAt)

// The server won't approve someone who hasn't confirmed their email, so the window doesn't offer to try.
const blocked = computed(() => props.mode !== 'reject' && !emailConfirmed.value)

const statusLabel = computed(() => {
	const s = props.student?.registrationStatus ?? 'pending'
	return s.charAt(0).toUpperCase() + s.slice(1)
})
const statusTone = computed<'success' | 'warning' | 'danger'>(() => {
	const s = props.student?.registrationStatus
	return s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning'
})

const studentFields = computed(() => [
	{ label: 'Program', value: props.student?.academicProgram ?? '' },
	{ label: 'Birth date', value: user.value?.birthDate ? formatDate(user.value.birthDate) : '' },
])

const contactFields = computed(() => [
	{ label: 'Phone', value: user.value?.phoneNumber ?? '' },
	{ label: 'Address', value: user.value?.address ?? '' },
])

const registrationFields = computed(() => {
	const s = props.student
	if (!s) return []
	return [
		{ label: 'Registered', value: s.created_at ? formatDateTime(s.created_at) : '' },
		...(s.reviewedAt ? [{ label: s.registrationStatus === 'rejected' ? 'Rejected on' : 'Reviewed on', value: formatDateTime(s.reviewedAt) }] : []),
		{ label: 'Visit streak', value: `${s.visitStreak} days` },
		{ label: 'Knowledge score', value: `${s.knowledgeScore} pts` },
	]
})
</script>
