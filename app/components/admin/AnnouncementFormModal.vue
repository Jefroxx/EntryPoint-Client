<template>
	<LibrarianModalShell :open="open" size="lg" :title="announcement ? 'Edit Announcement' : 'New Announcement'"
		subtitle="It shows at the top of the page for whoever you choose." :busy="busy" :dirty="dirty" fixed-height ref="shell"
		:discard-title="announcement ? 'Discard Announcement Changes?' : 'Discard This Announcement?'"
		:discard-text="announcement ? 'Your changes to this announcement won\'t be saved.' : 'This announcement won\'t be posted.'"
		@close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="announce-title" v-model="form.title" label="Title" placeholder="e.g. Closed on Friday" :maxlength="120"
				:error="errors.title" @update:model-value="errors.title = ''" />

			<div>
				<label for="announce-body" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Message<FieldRequired /></label>
				<textarea id="announce-body" v-model="form.body" rows="4" maxlength="1000" placeholder="What do people need to know?"
					class="w-full rounded-[10px] border bg-white px-3 py-2.5 text-[15px] leading-snug text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
					:class="errors.body ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="errors.body = ''" />
				<p v-if="errors.body" class="mt-1 text-[12.5px] text-red-500">{{ errors.body }}</p>
				<p v-else class="mt-1 text-right text-[12px] tabular-nums text-stone-500">{{ form.body.length }}/1000</p>
			</div>

			<fieldset>
				<legend class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Who sees it<FieldRequired /></legend>
				<!-- Three short choices in one row, with what the chosen one means written once underneath: the window then
					 fits a 768px-tall screen without scrolling. -->
				<div class="grid grid-cols-3 gap-2" role="radiogroup">
					<label v-for="a in AUDIENCES" :key="a.value"
						class="flex h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-[14px] font-semibold transition-colors focus-within:ring-2 focus-within:ring-accent-200"
						:class="form.audience === a.value ? 'border-accent-500 bg-accent-50 text-accent-700 ring-1 ring-accent-300' : 'border-stone-200 bg-white text-stone-800 hover:bg-stone-50'">
						<input v-model="form.audience" type="radio" name="announce-audience" :value="a.value" class="sr-only" />
						{{ a.label }}
					</label>
				</div>
				<p class="mt-1.5 text-[12.5px] leading-snug text-stone-500">{{ AUDIENCES.find((a) => a.value === form.audience)?.hint }}</p>
			</fieldset>

			<LibrarianTextField id="announce-end" v-model="form.endDate" type="date" :min="toYmd()" label="Stop showing it after" optional
				hint="Leave this empty to keep it up until you remove it." :error="errors.expiresAt" @update:model-value="errors.expiresAt = ''" />
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
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
	{ value: 'students', label: 'Students', hint: 'The student side: students, faculty and staff members.' },
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

// What is typed in this window: closing it with changes asks "Discard Changes?" first (see ModalShell, useUnsavedChanges).
const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => form, () => props.open)

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
