<template>
	<LibrarianModalShell :open="open" size="lg" :title="account ? 'Edit staff account' : 'Add staff account'"
		:subtitle="account ? 'Change their details or role.' : 'They sign in on the librarian side with a temporary password you give them.'"
		:busy="busy" @close="emit('close')">
		<div class="space-y-4">
			<div class="name-row">
				<LibrarianTextField id="staff-first" v-model="form.firstName" label="First name" :error="errors.firstName" autocomplete="off"
					@update:model-value="errors.firstName = ''" />
				<LibrarianTextField id="staff-mi" v-model="form.middleInitial" label="M.I." optional :maxlength="1" :error="errors.middleInitial"
					@update:model-value="errors.middleInitial = ''" />
				<LibrarianTextField id="staff-last" v-model="form.lastName" label="Last name" :error="errors.lastName" autocomplete="off"
					@update:model-value="errors.lastName = ''" />
			</div>

			<div class="grid gap-3 sm:grid-cols-2">
				<LibrarianTextField id="staff-email" v-model="form.email" type="email" label="Email" placeholder="name@stidavao.edu.ph"
					:error="errors.email" autocomplete="off" @update:model-value="errors.email = ''" />
				<LibrarianTextField id="staff-phone" v-model="form.phoneNumber" type="tel" label="Phone" optional :error="errors.phoneNumber"
					@update:model-value="errors.phoneNumber = ''" />
			</div>

			<fieldset>
				<legend class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Role<FieldRequired /></legend>
				<div class="grid gap-2" role="radiogroup">
					<label v-for="r in ROLES" :key="r.value"
						class="flex items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors"
						:class="[
							form.role === r.value ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-300' : 'border-stone-200 bg-white',
							roleLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-stone-50',
						]">
						<input v-model="form.role" type="radio" name="staff-role" :value="r.value" :disabled="roleLocked" class="mt-1 accent-accent-500"
							@change="errors.role = ''" />
						<span class="min-w-0">
							<span class="block text-[14.5px] font-semibold text-stone-900">{{ r.label }}</span>
							<span class="block text-[12.5px] leading-snug text-stone-500">{{ r.hint }}</span>
						</span>
					</label>
				</div>
				<p v-if="errors.role" class="mt-1 text-[12.5px] text-red-500">{{ errors.role }}</p>
				<p v-else-if="roleLocked" class="mt-1 text-[12.5px] text-stone-500">You can't change your own role. Ask another administrator.</p>
			</fieldset>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ account ? 'Save changes' : 'Create account' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { StaffAccount, StaffPayload, StaffRole } from '~/services/adminService'

const props = defineProps<{
	open: boolean
	account: StaffAccount | null
	busy?: boolean
	/** Messages from the server (a taken email, say), per field. */
	serverErrors?: Record<string, string>
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: StaffPayload): void
}>()

const ROLES: { value: StaffRole; label: string; hint: string }[] = [
	{ value: 'assistant', label: 'Student assistant', hint: 'Works the desk: loans, returns and attendance. Limited access.' },
	{ value: 'librarian', label: 'Librarian', hint: 'Runs the library: every area of the librarian side.' },
	{ value: 'admin', label: 'Administrator', hint: 'Everything, plus the admin side: accounts, roles and the audit log.' },
]

const form = reactive({ firstName: '', middleInitial: '', lastName: '', email: '', phoneNumber: '', role: 'assistant' as StaffRole })
const errors = reactive<Record<string, string>>({})

// You can't change your own role (the server refuses it too).
const roleLocked = computed(() => !!props.account?.isYou)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	const a = props.account
	form.firstName = a?.firstName ?? ''
	form.middleInitial = a?.middleInitial ?? ''
	form.lastName = a?.lastName ?? ''
	form.email = a?.email ?? ''
	form.phoneNumber = a?.phoneNumber ?? ''
	form.role = a?.role ?? 'assistant'
	for (const k of Object.keys(errors)) errors[k] = ''
})

watch(() => props.serverErrors, (incoming) => { if (incoming) Object.assign(errors, incoming) })

function submit() {
	errors.firstName = form.firstName.trim() ? '' : 'First name is required.'
	errors.lastName = form.lastName.trim() ? '' : 'Last name is required.'
	errors.email = /^\S+@\S+\.\S+$/.test(form.email.trim()) ? '' : 'Enter a valid email address.'
	if (errors.firstName || errors.lastName || errors.email) return

	emit('submit', {
		firstName: form.firstName.trim(),
		middleInitial: form.middleInitial.trim() || null,
		lastName: form.lastName.trim(),
		email: form.email.trim(),
		phoneNumber: form.phoneNumber.trim() || null,
		role: form.role,
	})
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
