<template>
	<LibrarianModalShell :open="open" size="sm" :title="title" subtitle="Give this to them in person. It is shown once." @close="emit('close')">
		<div v-if="credentials" class="space-y-4">
			<dl class="rounded-xl border border-stone-200 bg-stone-50 p-4">
				<div>
					<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Account</dt>
					<dd class="mt-0.5 text-[15px] font-semibold text-stone-900">{{ credentials.name }}</dd>
					<dd v-if="credentials.email" class="font-data text-[13px] text-stone-600">{{ credentials.email }}</dd>
				</div>
				<div v-if="credentials.username" class="mt-3.5">
					<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Username</dt>
					<dd class="mt-1">
						<code class="font-data block select-all break-all rounded-lg bg-white px-3 py-2.5 text-[17px] font-bold tracking-wide text-stone-900 ring-1 ring-stone-200">{{ credentials.username }}</code>
					</dd>
				</div>
				<div class="mt-3.5">
					<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Temporary password</dt>
					<dd class="mt-1 flex items-center gap-2">
						<code class="font-data min-w-0 flex-1 select-all break-all rounded-lg bg-white px-3 py-2.5 text-[17px] font-bold tracking-wider text-stone-900 ring-1 ring-stone-200">{{ credentials.password }}</code>
						<ButtonsButton variant="ghost" size="sm" @click="copy">
							<Icon :name="copied ? 'i-tabler-check' : 'i-tabler-copy'" class="h-3.5 w-3.5" />{{ copied ? 'Copied' : 'Copy' }}
						</ButtonsButton>
					</dd>
				</div>
			</dl>

			<!-- Accounts with an email: the sign-in stays closed until the mailed link is clicked. -->
			<p v-if="credentials.verificationSent === true" class="flex items-start gap-2 rounded-xl bg-emerald-50 px-3.5 py-3 text-[13.5px] leading-snug text-emerald-900">
				<Icon name="i-tabler-mail-check" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
				<span>We emailed a confirmation link to {{ credentials.email }}. They can sign in once they've clicked it.</span>
			</p>
			<p v-else-if="credentials.verificationSent === false && credentials.email" class="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-[13.5px] leading-snug text-red-800">
				<Icon name="i-tabler-mail-x" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
				<span>The confirmation email couldn't be sent. On the sign-in page they can choose <b>Send a new link</b> once the email works.</span>
			</p>

			<p class="flex items-start gap-2 rounded-xl bg-amber-50 px-3.5 py-3 text-[13.5px] leading-snug text-amber-900">
				<Icon name="i-tabler-alert-triangle" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
				<span>This password can't be shown again. They should change it after signing in. If it is lost, reset it from the account's menu.</span>
			</p>
		</div>

		<template #footer>
			<ButtonsButton variant="primary" @click="emit('close')">Done</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
export interface Credentials {
	name: string
	email?: string | null
	/** A student assistant's sign-in name (they have no email). */
	username?: string | null
	password: string
	/** Set when the account was just made with an email: whether the confirmation link went out. */
	verificationSent?: boolean
}

const props = defineProps<{
	open: boolean
	title: string
	credentials: Credentials | null
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const copied = ref(false)
watch(() => props.open, () => { copied.value = false })

async function copy() {
	try {
		await navigator.clipboard.writeText(props.credentials?.password ?? '')
		copied.value = true
		setTimeout(() => { copied.value = false }, 2000)
	} catch {
		// The password is selectable (select-all), so it can still be copied by hand.
	}
}
</script>
