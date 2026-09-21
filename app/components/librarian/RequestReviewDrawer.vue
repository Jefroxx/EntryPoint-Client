<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-[60] bg-stone-900/35 backdrop-blur-[2px] transition-opacity duration-200"
			:class="open ? 'opacity-100' : 'pointer-events-none opacity-0'" @click="emit('close')" />

		<aside class="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[420px] flex-col bg-white shadow-overlay transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]"
			:class="open ? 'translate-x-0' : 'translate-x-full'">
			<div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
				<h3 class="text-[17px] font-bold text-accent-700">Review request</h3>
				<ButtonsButton variant="icon" aria-label="Close" @click="emit('close')">
					<Icon name="i-lucide-x" class="h-[18px] w-[18px]" />
				</ButtonsButton>
			</div>

			<div v-if="suggestion" class="flex-1 overflow-y-auto px-5 py-5">
				<div class="mb-5 flex gap-3.5">
					<div class="flex h-[82px] w-[60px] shrink-0 items-center justify-center rounded-lg text-xl font-bold text-white shadow-sm"
						:style="{ background: coverColor(suggestion.title) }">
						{{ coverInitials(suggestion.title) }}
					</div>
					<div>
						<p class="text-[15.5px] font-bold leading-snug text-stone-900">{{ suggestion.title }}</p>
						<p class="mt-0.5 text-[14px] text-stone-500">{{ suggestion.author || 'Author not specified' }}</p>
						<div class="mt-2">
							<LibrarianRequestStatusPill :status="suggestion.status" />
						</div>
					</div>
				</div>

				<div class="mb-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
					<div>
						<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Requested by</p>
						<p class="text-[15px] font-medium text-stone-800">{{ requesterName }}</p>
					</div>
					<div>
						<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Section</p>
						<p class="text-[15px] font-medium text-stone-800">{{ suggestion.student?.academicProgram || '—' }}</p>
					</div>
					<div>
						<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Date requested</p>
						<p class="text-[15px] font-medium text-stone-800">{{ formattedDate }}</p>
					</div>
					<div>
						<p class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Progress</p>
						<p class="text-[15px] font-medium text-stone-800">{{ suggestion.progressStep || suggestion.status }}</p>
					</div>
				</div>

				<div>
					<p class="mb-1.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Student's reason</p>
					<div class="rounded-xl border border-stone-100 bg-stone-50 px-3.5 py-3 text-[14px] leading-relaxed text-stone-600">
						{{ suggestion.reason || 'No reason provided.' }}
					</div>
				</div>
			</div>

			<div v-if="suggestion?.status === 'Pending'" class="flex gap-2.5 border-t border-stone-100 px-5 py-4">
				<ButtonsButton variant="danger" class="flex-1" @click="emit('reject', suggestion)">
					Reject
				</ButtonsButton>
				<ButtonsButton variant="primary" class="flex-[1.4]" @click="emit('approve', suggestion)">
					Approve request
				</ButtonsButton>
			</div>
		</aside>
	</Teleport>
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
	return new Date(props.suggestion.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
})

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

function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>
