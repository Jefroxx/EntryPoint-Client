<template>
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<div class="max-h-[480px] overflow-auto">
			<table class="w-full min-w-[860px] border-collapse text-left">
				<thead>
					<tr>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Title</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Author</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Reason</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Requested By</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Date Requested</th>
						<th class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Status</th>
						<th class="sticky top-0 z-10 border-b border-stone-100 bg-stone-50 px-4 py-3"></th>
					</tr>
				</thead>
				<tbody>
					<tr v-for="(suggestion, index) in suggestions" :key="suggestion.suggestionID"
						class="row-enter border-b border-stone-100 opacity-0 transition-colors duration-150 last:border-0 hover:bg-stone-50"
						:style="{ animationDelay: `${index * 40}ms` }">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<div class="flex h-11 w-8 shrink-0 items-center justify-center rounded-[4px] text-[11px] font-bold text-white shadow-sm"
									:style="{ background: coverColor(suggestion.title) }">
									{{ coverInitials(suggestion.title) }}
								</div>
								<p class="max-w-[220px] truncate text-[13.5px] font-semibold text-stone-900">{{ suggestion.title }}</p>
							</div>
						</td>
						<td class="px-4 py-3 text-[13px] text-stone-600">{{ suggestion.author || '—' }}</td>
						<td class="px-4 py-3">
							<p class="max-w-[220px] truncate text-[13px] text-stone-500" :title="suggestion.reason || ''">
								{{ suggestion.reason || '—' }}
							</p>
						</td>
						<td class="px-4 py-3">
							<p class="text-[13px] font-medium text-stone-800">{{ requesterName(suggestion) }}</p>
							<p v-if="suggestion.student?.academicProgram" class="text-[11.5px] text-stone-400">{{ suggestion.student.academicProgram }}</p>
						</td>
						<td class="px-4 py-3 text-[12.5px] text-stone-500">{{ formatDate(suggestion.submittedAt) }}</td>
						<td class="px-4 py-3">
							<LibrarianRequestStatusPill :status="suggestion.status" />
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center justify-end gap-1.5">
								<ButtonsButton variant="primary" size="sm" @click="emit('review', suggestion)">
									Review
								</ButtonsButton>
								<div class="relative">
									<ButtonsButton variant="icon" size="sm" aria-label="More actions" @click.stop="toggleMenu(suggestion.suggestionID)">
										<Icon name="i-lucide-ellipsis-vertical" class="h-[15px] w-[15px]" />
									</ButtonsButton>
									<div class="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[150px] origin-top-right rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg transition-all duration-150"
										:class="openMenuId === suggestion.suggestionID ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'">
										<button type="button" :disabled="suggestion.status !== 'Pending'"
											class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-emerald-600 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
											@click="closeMenu(); emit('approve', suggestion)">
											<Icon name="i-lucide-check" class="h-[14px] w-[14px] opacity-70" />Approve
										</button>
										<button type="button" :disabled="suggestion.status !== 'Pending'"
											class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
											@click="closeMenu(); emit('reject', suggestion)">
											<Icon name="i-lucide-x" class="h-[14px] w-[14px] opacity-70" />Reject
										</button>
									</div>
								</div>
							</div>
						</td>
					</tr>

					<tr v-if="!loading && suggestions.length === 0">
						<td colspan="7" class="py-10 text-center text-sm text-stone-400">No book requests match your filters.</td>
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

const openMenuId = ref<number | null>(null)

function toggleMenu(id: number) {
	openMenuId.value = openMenuId.value === id ? null : id
}

function closeMenu() {
	openMenuId.value = null
}

onMounted(() => window.addEventListener('click', closeMenu))
onUnmounted(() => window.removeEventListener('click', closeMenu))

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
