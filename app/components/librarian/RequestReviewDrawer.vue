<template>
	<!-- A pop-up on a computer, a full page on a phone (the shared modal shell does both). -->
	<LibrarianModalShell :open="open" size="lg" title="Review Request" :subtitle="suggestion ? 'A student asked the library to get this book.' : ''" @close="emit('close')">
		<div v-if="suggestion" class="space-y-5">
			<div class="flex gap-4">
				<div class="flex h-[96px] w-[70px] shrink-0 items-center justify-center rounded-lg text-2xl font-bold text-white shadow-sm"
					:style="{ background: coverColor(suggestion.title) }">
					{{ coverInitials(suggestion.title) }}
				</div>
				<div class="min-w-0">
					<p class="text-[17px] font-bold leading-snug text-stone-900">{{ suggestion.title }}</p>
					<p class="mt-0.5 text-[14.5px] text-stone-500">{{ suggestion.author || 'Author not specified' }}</p>
					<div class="mt-2.5">
						<LibrarianRequestStatusPill :status="suggestion.status" />
					</div>
				</div>
			</div>

			<div class="grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl border border-stone-200 p-4 sm:grid-cols-2">
				<div>
					<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-500">Requested by</p>
					<p class="text-[15px] font-medium text-stone-800">{{ requesterName }}</p>
				</div>
				<div>
					<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-500">Section</p>
					<p class="text-[15px] font-medium text-stone-800">{{ suggestion.student?.academicProgram || '—' }}</p>
				</div>
				<div>
					<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-500">Date requested</p>
					<p class="text-[15px] font-medium text-stone-800">{{ formattedDate }}</p>
				</div>
				<div>
					<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-500">Progress</p>
					<p class="text-[15px] font-medium text-stone-800">{{ suggestion.progressStep || suggestion.status }}</p>
				</div>
			</div>

			<div>
				<p class="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-stone-500">Student's reason</p>
				<div class="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3.5 text-[14.5px] leading-relaxed text-stone-600">
					{{ suggestion.reason || 'No reason provided.' }}
				</div>
			</div>
		</div>

		<template #footer>
			<template v-if="suggestion?.status === 'Pending'">
				<ButtonsButton variant="danger" @click="emit('reject', suggestion)">Reject</ButtonsButton>
				<ButtonsButton variant="primary" @click="emit('approve', suggestion)">Approve request</ButtonsButton>
			</template>
			<ButtonsButton v-else variant="ghost" @click="emit('close')">Close</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { BookSuggestion } from '~/services/librarianService'

const props = defineProps<{
	open: boolean
	suggestion: BookSuggestion | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'approve', suggestion: BookSuggestion): void
	(e: 'reject', suggestion: BookSuggestion): void
}>()

const requesterName = computed(() => {
	const user = props.suggestion?.student?.user
	return user ? `${user.firstName} ${user.lastName}` : '—'
})

const formattedDate = computed(() => {
	if (!props.suggestion) return '—'
	return formatDate(props.suggestion.submittedAt)
})

const COVER_COLORS = ['#532c2e', '#4a1f24', '#34000b', '#855e56', '#1e423f']

function coverInitials(title: string): string {
	const words = title.split(/\s+/).filter((w) => w.length > 2)
	const initials = words.slice(0, 2).map((w) => w[0]).join('')
	return (initials || title[0] || '?').toUpperCase()
}

function coverColor(title: string): string {
	let hash = 0
	for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash)
	return COVER_COLORS[Math.abs(hash) % COVER_COLORS.length]!
}
</script>
