<template>
	<LibrarianModalShell :open="open" size="lg" :title="announcement ? 'Edit announcement' : 'New announcement'"
		subtitle="It shows at the top of the page for whoever you choose." :busy="busy" @close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="announce-title" v-model="form.title" label="Title" placeholder="e.g. Closed on Friday" :maxlength="120"
				:error="errors.title" @update:model-value="errors.title = ''" />

			<div>
				<label for="announce-body" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Message<FieldRequired /></label>
				<textarea id="announce-body" v-model="form.body" rows="4" maxlength="1000" placeholder="What do people need to know?"
					class="w-full rounded-[10px] border bg-white px-3 py-2.5 text-[15px] leading-snug text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
					:class="errors.body ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="errors.body = ''" />
				<p v-if="errors.body" class="mt-1 text-[12.5px] text-red-500">{{ errors.body }}</p>
				<p v-else class="mt-1 text-right text-[12px] tabular-nums text-stone-400">{{ form.body.length }}/1000</p>
			</div>

			<fieldset>
				<legend class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Who sees it<FieldRequired /></legend>
				<div class="grid gap-2" role="radiogroup">
					<label v-for="a in AUDIENCES" :key="a.value" class="flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors"
						:class="form.audience === a.value ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-300' : 'border-stone-200 bg-white hover:bg-stone-50'">
						<input v-model="form.audience" type="radio" name="announce-audience" :value="a.value" class="mt-1 accent-accent-500" />
						<span class="min-w-0">
							<span class="block text-[14.5px] font-semibold text-stone-900">{{ a.label }}</span>
							<span class="block text-[12.5px] leading-snug text-stone-500">{{ a.hint }}</span>
						</span>
					</label>
				</div>
			</fieldset>

			<LibrarianTextField id="announce-end" v-model="form.endDate" type="date" label="Stop showing it after" optional
				hint="Leave this empty to keep it up until you remove it." :error="errors.expiresAt" @update:model-value="errors.expiresAt = ''" />
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ announcement ? 'Save changes' : 'Post announcement' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { Announcement, AnnouncementAudience, AnnouncementPayload } from '~/services/announcementService'

const props = defineProps<{
	open: boolean
	announcement: Announcement | null
	busy?: boolean
	serverErrors?: Record<string, string>
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: AnnouncementPayload): void
}>()

const AUDIENCES: { value: AnnouncementAudience; label: string; hint: string }[] = [
	{ value: 'everyone', label: 'Everyone', hint: 'Students, faculty and staff members, and the librarian side.' },
	{ value: 'students', label: 'Students and members', hint: 'The student side: students, faculty and staff members.' },
	{ value: 'staff', label: 'Staff', hint: 'The librarian side: librarians and student assistants.' },
]

const form = reactive({ title: '', body: '', audience: 'everyone' as AnnouncementAudience, endDate: '' })
const errors = reactive<Record<string, string>>({})

// yyyy-mm-dd in the browser's own calendar (a date input has no time zone).
const dateOf = (iso: string | null) => {
	if (!iso) return ''
	const d = new Date(iso)
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.title = props.announcement?.title ?? ''
	form.body = props.announcement?.body ?? ''
	form.audience = props.announcement?.audience ?? 'everyone'
	form.endDate = dateOf(props.announcement?.expiresAt ?? null)
	for (const k of Object.keys(errors)) errors[k] = ''
})

watch(() => props.serverErrors, (incoming) => { if (incoming) Object.assign(errors, incoming) })

function submit() {
	errors.title = form.title.trim() ? '' : 'Give it a title.'
	errors.body = form.body.trim() ? '' : 'Write the message.'
	if (errors.title || errors.body) return

	emit('submit', {
		title: form.title.trim(),
		body: form.body.trim(),
		audience: form.audience,
		// Through the end of that day.
		expiresAt: form.endDate ? `${form.endDate} 23:59:59` : null,
	})
}
</script>
