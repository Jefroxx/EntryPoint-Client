<template>
	<div>
		<div class="st-in mb-5">
			<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Suggest a book</h1>
			<p class="dashboard-heading mt-1 text-amber-900">Can't find it? Tell the librarians what to add next.</p>
		</div>

		<div class="md:grid md:grid-cols-[minmax(0,520px)_minmax(0,1fr)] md:items-start md:gap-10">
			<form class="st-in rounded-2xl border border-stone-200 bg-white p-[18px] md:p-5" style="animation-delay: 35ms" novalidate @submit.prevent="submit">
				<div class="grid gap-3.5">
					<LibrarianTextField id="s-title" v-model="form.title" label="Title" placeholder="e.g. Refactoring" autocomplete="off"
						:error="titleError" @update:model-value="serverErrors.title = ''" @focusout="titleTouched = true" />
					<LibrarianTextField id="s-author" v-model="form.author" label="Author" optional placeholder="e.g. Martin Fowler" autocomplete="off"
						:error="serverErrors.author" />
					<div>
						<label for="s-reason" class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">
							Why should we get it? <span class="font-normal text-stone-400">(optional)</span>
						</label>
						<textarea id="s-reason" v-model="form.reason" rows="4" maxlength="1000" placeholder="It's on our syllabus for Software Engineering 2."
							class="w-full resize-none rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-[13.5px] leading-relaxed outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
					</div>
					<ButtonsButton type="submit" class="!h-[46px] w-full !text-[15px]" :disabled="submitting">
						<span v-if="submitting" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
						{{ submitting ? 'Sending…' : 'Send suggestion' }}
					</ButtonsButton>
				</div>
			</form>

			<section class="st-in mt-6 md:mt-0" style="animation-delay: 70ms">
				<h2 class="mb-2.5 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Your suggestions</h2>

				<div v-if="pending && !data" class="h-24 animate-pulse rounded-2xl bg-stone-200/70" aria-busy="true" />
				<p v-else-if="!data?.suggestions.length" class="rounded-2xl bg-stone-100 px-4 py-6 text-center text-[13.5px] text-stone-500">
					Nothing suggested yet. Your ideas will show up here with their status.
				</p>
				<TransitionGroup v-else tag="div" class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white"
					enter-active-class="transition-[transform,opacity] duration-[250ms] ease-out" enter-from-class="-translate-y-2 opacity-0" move-class="transition-transform duration-200 ease-out">
					<div v-for="s in data.suggestions" :key="s.suggestionID" class="flex items-center gap-3.5 border-b border-stone-100 bg-white px-4 py-3.5 last:border-0">
						<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" :class="s.status === 'Approved' ? TONE_SOFT.good : s.status === 'Rejected' ? TONE_SOFT.bad : TONE_SOFT.warn">
							<Icon :name="s.status === 'Approved' ? 'i-lucide-check' : s.status === 'Rejected' ? 'i-lucide-x' : 'i-lucide-clock'" class="h-[17px] w-[17px]" />
						</span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-[14px] font-medium text-stone-900">{{ s.title }}</p>
							<p class="truncate text-[12.5px] text-stone-400">{{ s.author || 'Unknown author' }} · {{ formatDate(s.submittedAt) }}</p>
						</div>
						<StudentPill :tone="s.status === 'Approved' ? 'good' : s.status === 'Rejected' ? 'bad' : 'warn'">{{ s.status }}</StudentPill>
					</div>
				</TransitionGroup>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { studentService } from '~/services/studentService'
import { TONE_SOFT } from '~/utils/studentNotifications'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Suggest a book', nav: 'home', tab: 'me' })
useHead({ title: 'Suggest a book · EntryPoint' })

const alert = useAlert()
const { data, pending, refresh } = useStudentData('student-suggestions', () => studentService.suggestions())

const form = reactive({ title: '', author: '', reason: '' })
const serverErrors = reactive<Record<string, string>>({ title: '', author: '' })
const titleTouched = ref(false)
const submitting = ref(false)

// Inline, on blur: "required" shows once you've left the field, server messages show at once.
const titleError = computed(() => serverErrors.title || (titleTouched.value && !form.title.trim() ? "Enter the book's title." : ''))

async function submit() {
	titleTouched.value = true
	if (!form.title.trim() || submitting.value) return

	submitting.value = true
	try {
		const { message } = await studentService.suggestBook({
			title: form.title.trim(),
			author: form.author.trim() || undefined,
			reason: form.reason.trim() || undefined,
		})
		alert.success('Suggestion sent', message)
		Object.assign(form, { title: '', author: '', reason: '' })
		titleTouched.value = false
		await refresh()
	} catch (error: any) {
		const fields = apiFieldErrors(error)
		serverErrors.title = fields.title ?? ''
		serverErrors.author = fields.author ?? ''
		if (!Object.keys(fields).length) alert.error('Could not send it', apiErrorMessage(error))
	} finally {
		submitting.value = false
	}
}
</script>
