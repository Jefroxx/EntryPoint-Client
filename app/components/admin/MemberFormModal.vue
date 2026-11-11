<template>
	<LibrarianModalShell :open="open" size="lg" :title="reviewing ? 'Create This Member?' : member ? 'Edit Member' : 'Add Faculty or Staff Member'"
		:subtitle="subtitle" :busy="busy" @close="emit('close')">
		<!-- Step 2 (new members only): look it over before anything is created. Back returns to the form with everything kept. -->
		<div v-if="reviewing" class="space-y-4">
			<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
				<div v-for="row in reviewRows" :key="row.label" class="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
					<dt class="w-32 shrink-0 text-[12px] font-semibold uppercase tracking-wide text-stone-500">{{ row.label }}</dt>
					<dd class="min-w-0 break-words text-[15px] font-semibold text-stone-900">{{ row.value }}</dd>
				</div>
			</dl>
			<p class="flex items-start gap-2 rounded-xl bg-stone-50 px-3.5 py-3 text-[13.5px] leading-snug text-stone-600">
				<Icon name="i-tabler-mail-check" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
				<span>A confirmation link is emailed to them, and a temporary password is made that you'll see once, to hand over. No approval is needed after they confirm.</span>
			</p>
		</div>

		<div v-else class="space-y-4">
			<fieldset>
				<legend class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Type<FieldRequired /></legend>
				<div class="grid grid-cols-2 gap-2" role="radiogroup">
					<label v-for="t in TYPES" :key="t.value"
						class="flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors"
						:class="form.memberType === t.value ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-300' : 'border-stone-200 bg-white hover:bg-stone-50'">
						<input v-model="form.memberType" type="radio" name="member-type" :value="t.value" class="accent-accent-500" />
						<span class="min-w-0">
							<span class="block text-[14.5px] font-semibold text-stone-900">{{ t.label }}</span>
							<span class="block text-[12.5px] text-stone-500">{{ t.hint }}</span>
						</span>
					</label>
				</div>
			</fieldset>

			<div class="name-row">
				<LibrarianTextField id="member-first" v-model="form.firstName" label="First name" :error="errors.firstName" autocomplete="off"
					@update:model-value="errors.firstName = ''" />
				<LibrarianTextField id="member-mi" v-model="form.middleInitial" label="M.I." optional :maxlength="1" :error="errors.middleInitial"
					@update:model-value="errors.middleInitial = ''" />
				<LibrarianTextField id="member-last" v-model="form.lastName" label="Last name" :error="errors.lastName" autocomplete="off"
					@update:model-value="errors.lastName = ''" />
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<LibrarianTextField id="member-employee" v-model="form.employeeIDNumber" label="Employee ID" placeholder="e.g. EMP-2019-014" mono
					:error="errors.employeeIDNumber" autocomplete="off" @update:model-value="errors.employeeIDNumber = ''" />
				<LibrarianTextField id="member-department" v-model="form.department" label="Department" placeholder="e.g. Information Technology"
					:error="errors.department" @update:model-value="errors.department = ''" />
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<LibrarianTextField id="member-email" v-model="form.email" type="email" label="Email" placeholder="name@davao.sti.edu.ph"
					:error="errors.email" autocomplete="off" @update:model-value="errors.email = ''" />
				<LibrarianTextField id="member-phone" v-model="form.phoneNumber" type="tel" label="Phone" optional :error="errors.phoneNumber"
					@update:model-value="errors.phoneNumber = ''" />
			</div>
		</div>

		<template #footer>
			<template v-if="reviewing">
				<ButtonsButton variant="ghost" :disabled="busy" @click="reviewing = false">Back</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="confirmCreate">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					Yes, create member
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="submit">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					{{ member ? 'Save changes' : 'Create member' }}
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { MemberAccount, MemberKind, MemberPayload } from '~/services/adminService'

const props = defineProps<{
	open: boolean
	member: MemberAccount | null
	busy?: boolean
	serverErrors?: Record<string, string>
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: MemberPayload): void
}>()

const TYPES: { value: MemberKind; label: string; hint: string }[] = [
	{ value: 'faculty', label: 'Faculty', hint: 'Teaching staff' },
	{ value: 'staff', label: 'Staff', hint: 'Non-teaching staff' },
]

const form = reactive({ memberType: 'faculty' as MemberKind, firstName: '', middleInitial: '', lastName: '', employeeIDNumber: '', department: '', email: '', phoneNumber: '' })
const errors = reactive<Record<string, string>>({})

/* ---------- step 2: review before creating (new members only) ---------- */
const reviewing = ref(false)
const pending = ref<MemberPayload | null>(null)

const reviewRows = computed(() => {
	const p = pending.value
	if (!p) return []
	const name = [p.firstName, p.middleInitial ? `${p.middleInitial}.` : '', p.lastName].filter(Boolean).join(' ')
	return [
		{ label: 'Type', value: TYPES.find((t) => t.value === p.memberType)?.label ?? p.memberType },
		{ label: 'Name', value: name },
		{ label: 'Employee ID', value: p.employeeIDNumber },
		{ label: 'Department', value: p.department },
		{ label: 'Email', value: p.email },
		...(p.phoneNumber ? [{ label: 'Phone', value: p.phoneNumber }] : []),
	]
})

const subtitle = computed(() => {
	if (reviewing.value) return 'Check these details. Nothing is created until you confirm.'
	return props.member
		? 'Change their details.'
		: 'They borrow and visit like students, with an employee ID. No points or rewards. We email them a link to confirm their address before they can sign in.'
})

function confirmCreate() {
	if (pending.value) emit('submit', pending.value)
}

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	const m = props.member
	form.memberType = m?.memberType ?? 'faculty'
	form.firstName = m?.firstName ?? ''
	form.middleInitial = m?.middleInitial ?? ''
	form.lastName = m?.lastName ?? ''
	form.employeeIDNumber = m?.employeeIDNumber ?? ''
	form.department = m?.department ?? ''
	form.email = m?.email ?? ''
	form.phoneNumber = m?.phoneNumber ?? ''
	for (const k of Object.keys(errors)) errors[k] = ''
	reviewing.value = false
	pending.value = null
})

// The server refused something (a taken email or employee ID, say): back to the form, where the message sits under the field.
watch(() => props.serverErrors, (incoming) => {
	if (!incoming) return
	Object.assign(errors, incoming)
	if (Object.keys(incoming).length) reviewing.value = false
})

function submit() {
	errors.firstName = form.firstName.trim() ? '' : 'First name is required.'
	errors.lastName = form.lastName.trim() ? '' : 'Last name is required.'
	errors.employeeIDNumber = form.employeeIDNumber.trim() ? '' : 'Employee ID is required.'
	errors.department = form.department.trim() ? '' : 'Department is required.'
	errors.email = /^\S+@\S+\.\S+$/.test(form.email.trim()) ? '' : 'Enter a valid email address.'
	if (errors.firstName || errors.lastName || errors.employeeIDNumber || errors.department || errors.email) return

	const payload: MemberPayload = {
		memberType: form.memberType,
		firstName: form.firstName.trim(),
		middleInitial: form.middleInitial.trim() || null,
		lastName: form.lastName.trim(),
		employeeIDNumber: form.employeeIDNumber.trim(),
		department: form.department.trim(),
		email: form.email.trim(),
		phoneNumber: form.phoneNumber.trim() || null,
	}

	// A new member goes to the review step; an edit saves straight away.
	if (props.member) {
		emit('submit', payload)
		return
	}
	pending.value = payload
	reviewing.value = true
}
</script>

<style scoped>
/* First name, middle initial (narrow) and last name: one row from 640px up, stacked on a phone. */
.name-row {
	display: grid;
	gap: 0.75rem;
}

@media (min-width: 640px) {
	.name-row {
		grid-template-columns: 1fr 112px 1fr;
	}
}
</style>
