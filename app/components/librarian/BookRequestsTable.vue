<template>
	<div class="relative rounded-2xl">
		<LibrarianCardSkeleton v-if="loading" />
		<ul v-else class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
			<!-- The whole card opens the request; only the buttons at the bottom do something else. -->
			<li v-for="suggestion in suggestions" :key="`card-${suggestion.suggestionID}`"
				class="relative flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white transition-shadow duration-150 hover:shadow-card">
				<button type="button" class="card-cover" :aria-label="`Open the request for ${suggestion.title}`" @click="emit('review', suggestion)" />
				<div class="card-body flex flex-1 flex-col">
					<div class="flex items-start gap-3 px-4 pt-4">
						<div class="flex h-[58px] w-10 shrink-0 items-center justify-center rounded-[5px] text-[12px] font-bold text-white shadow-sm" :style="{ background: coverColor(suggestion.title) }">
							{{ coverInitials(suggestion.title) }}
						</div>
						<div class="min-w-0 flex-1">
							<p class="line-clamp-2 break-words text-[15px] font-semibold leading-snug text-stone-900" :title="suggestion.title">{{ suggestion.title }}</p>
							<p class="break-words text-[13px] text-stone-500">{{ suggestion.author || 'No author listed' }}</p>
						</div>
						<LibrarianRequestStatusPill :status="suggestion.status" class="shrink-0" />
						<!-- The ⋮ menu is in the top right corner, as on the other cards. -->
						<div class="card-action -mr-1.5 -mt-1 shrink-0">
							<LibrarianRowMenu :items="menuItems(suggestion)" @select="onAction(suggestion, $event)" />
						</div>
					</div>

					<dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 px-4 text-[13px]">
						<div class="min-w-0">
							<dt class="text-[11.5px] font-bold uppercase tracking-wide text-stone-500">Requested by</dt>
							<dd class="break-words font-semibold text-stone-800">{{ requesterName(suggestion) }}</dd>
							<dd v-if="suggestion.student?.academicProgram" class="break-words text-[12.5px] text-stone-500">{{ suggestion.student.academicProgram }}</dd>
						</div>
						<div class="min-w-0">
							<dt class="text-[11.5px] font-bold uppercase tracking-wide text-stone-500">Date requested</dt>
							<dd class="font-semibold text-stone-800">{{ formatDate(suggestion.submittedAt) }}</dd>
						</div>
					</dl>

					<!-- The footer is part of the card, so pressing anywhere around the buttons opens the request too. -->
					<div class="mt-auto flex items-center justify-end gap-1.5 px-4 pb-3.5 pt-3">
						<!-- Review, View and Mark Arrived share one width, so the cards line up whichever one they show. -->
						<ButtonsButton v-if="suggestion.status === 'Approved'" variant="primary" size="sm" class="card-action w-[120px] justify-center" @click="emit('arrived', suggestion)">
							Mark Arrived
						</ButtonsButton>
						<ButtonsButton v-else variant="primary" size="sm" class="card-action w-[120px] justify-center" @click="emit('review', suggestion)">
							{{ suggestion.status === 'Pending' ? 'Review' : 'View' }}
						</ButtonsButton>
					</div>
				</div>
			</li>
		</ul>
		<p v-if="!loading && suggestions.length === 0" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">No book requests match your filters.</p>
	</div>
</template>

<script setup lang="ts">
import type { BookSuggestion } from '~/services/librarianService'

defineProps<{
	suggestions: BookSuggestion[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'review', suggestion: BookSuggestion): void
	(e: 'approve', suggestion: BookSuggestion): void
	(e: 'reject', suggestion: BookSuggestion): void
	(e: 'arrived', suggestion: BookSuggestion): void
}>()

// Each step is only open at its own stage: pending ones are approved or rejected, approved ones are marked as arrived.
function menuItems(suggestion: BookSuggestion) {
	const pending = suggestion.status === 'Pending'
	return [
		{ key: 'approve', label: 'Approve', icon: 'i-tabler-check', tone: 'success' as const, disabled: !pending },
		{ key: 'arrived', label: 'Mark as arrived', icon: 'i-tabler-books', disabled: suggestion.status !== 'Approved' },
		{ key: 'reject', label: 'Reject', icon: 'i-tabler-x', tone: 'danger' as const, disabled: !pending, separator: true },
	]
}

function onAction(suggestion: BookSuggestion, key: string) {
	if (key === 'approve') emit('approve', suggestion)
	else if (key === 'arrived') emit('arrived', suggestion)
	else emit('reject', suggestion)
}

function requesterName(suggestion: BookSuggestion): string {
	const user = suggestion.student?.user
	return user ? `${user.firstName} ${user.lastName}` : '—'
}

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
