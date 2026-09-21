<template>
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<div class="max-h-[480px] overflow-auto">
			<table class="w-full min-w-[860px] border-collapse text-left">
				<thead>
					<tr>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Title</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Author</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Reason</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Requested By</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Date Requested</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">Status</th>
						<th class="sticky top-0 z-10 border-b border-stone-100 bg-stone-50 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(suggestion, index) in suggestions" :key="suggestion.suggestionID"
						class="row-enter border-b border-stone-100 opacity-0 transition-colors duration-150 last:border-0 hover:bg-accent-50"
						:style="{ animationDelay: `${index * 40}ms` }">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<div class="flex h-11 w-8 shrink-0 items-center justify-center rounded-[4px] text-[12px] font-bold text-white shadow-sm"
									:style="{ background: coverColor(suggestion.title) }">
									{{ coverInitials(suggestion.title) }}
								</div>
								<p class="max-w-[220px] truncate text-[15px] font-semibold text-stone-900">{{ suggestion.title }}</p>
							</div>
						</td>
						<td class="px-4 py-3 text-[14px] text-stone-600">{{ suggestion.author || '—' }}</td>
						<td class="px-4 py-3">
							<p class="max-w-[220px] truncate text-[14px] text-stone-500" :title="suggestion.reason || ''">
								{{ suggestion.reason || '—' }}
							</p>
						</td>
						<td class="px-4 py-3">
							<p class="text-[14px] font-medium text-stone-800">{{ requesterName(suggestion) }}</p>
							<p v-if="suggestion.student?.academicProgram" class="text-[12.5px] text-stone-400">{{ suggestion.student.academicProgram }}</p>
						</td>
						<td class="px-4 py-3 text-[13.5px] text-stone-500">{{ formatDate(suggestion.submittedAt) }}</td>
						<td class="px-4 py-3">
							<LibrarianRequestStatusPill :status="suggestion.status" />
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center justify-end gap-1.5">
								<ButtonsButton variant="primary" size="sm" @click="emit('review', suggestion)">
									Review
								</ButtonsButton>
								<LibrarianRowMenu :items="menuItems(suggestion)" @select="onAction(suggestion, $event)" />
							</div>
						</td>
					</tr>

					<tr v-if="!loading && suggestions.length === 0">
						<td colspan="7" class="py-10 text-center text-[15px] text-stone-400">No book requests match your filters.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<LibrarianLoadingOverlay :loading="loading" />
	</div>
</template>

<script setup lang="ts">
import type { BookSuggestion } from '~/services/librarianService'

const props = defineProps<{
	suggestions: BookSuggestion[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'review', suggestion: BookSuggestion): void
	(e: 'approve', suggestion: BookSuggestion): void
	(e: 'reject', suggestion: BookSuggestion): void
}>()

function menuItems(suggestion: BookSuggestion) {
	const locked = suggestion.status !== 'Pending'
	return [
		{ key: 'approve', label: 'Approve', icon: 'i-lucide-check', tone: 'success' as const, disabled: locked },
		{ key: 'reject', label: 'Reject', icon: 'i-lucide-x', tone: 'danger' as const, disabled: locked, separator: true },
	]
}

function onAction(suggestion: BookSuggestion, key: string) {
	if (key === 'approve') emit('approve', suggestion)
	else emit('reject', suggestion)
}

function requesterName(suggestion: BookSuggestion): string {
	const user = suggestion.student?.user
	return user ? `${user.firstName} ${user.lastName}` : '—'
}

function formatDate(value: string): string {
	return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const COVER_COLORS = ['#7a3f18', '#9a5323', '#4E220A', '#c07a3e', '#6f3a15']

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

<style scoped>
.row-enter {
	animation: requestRowIn .4s cubic-bezier(.22,1,.36,1) forwards;
}

@keyframes requestRowIn {
	to {
		opacity: 1;
	}
}

@media (prefers-reduced-motion: reduce) {
	.row-enter {
		animation: none !important;
		opacity: 1 !important;
	}
}
</style>
