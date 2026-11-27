<template>
	<div class="relative shrink-0 overflow-hidden rounded-l-[5px] rounded-r-[9px] text-white shadow-[0_8px_18px_-10px_rgba(0,0,0,.55),inset_0_0_0_1px_rgba(255,255,255,.08)]"
		:style="{ width: `${width}px`, height: `${Math.round(width * 1.4)}px`, background }" role="img"
		:aria-label="`Cover of ${book.title}`">
		<img v-if="book.coverImageURL && !failed" :src="book.coverImageURL" alt="" loading="lazy"
			class="h-full w-full object-cover" @error="failed = true">
		<template v-else>
			<span class="absolute inset-y-0 left-[5px] w-px bg-white/30" />
			<span v-if="small" class="dashboard-heading absolute inset-0 flex items-center justify-center pl-1 font-bold tracking-tight"
				:style="{ fontSize: `${Math.round(width * (initials.length > 2 ? 0.3 : 0.38))}px` }">{{ initials }}</span>
			<span v-else lang="en" class="dashboard-heading absolute inset-0 flex items-end hyphens-auto p-2 pl-3 [overflow-wrap:anywhere] font-bold leading-[1.12] tracking-tight"
				:style="{ fontSize: `${titleSize}px` }">{{ printedTitle }}</span>
		</template>
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	book: { title: string; coverImageURL?: string | null; subject?: { name: string } | null }
	width?: number
}>(), { width: 56 })

const failed = ref(false)

// The title printed on a cover without a picture: a size by the cover's width, but small enough that the longest
// word ("Microeconomics") fits across it instead of being cut off at the edge.
// Covers narrower than this are too small for a readable title, so they show its initials instead.
const small = computed(() => props.width < 72)
const MINOR = new Set(['a', 'an', 'the', 'of', 'in', 'on', 'and', '&', 'for', 'to', 'with', 'at', 'by', 'or'])
const initials = computed(() => {
	const words = props.book.title.replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
	const major = words.filter((w) => !MINOR.has(w.toLowerCase()))
	return ((major.length ? major : words).slice(0, 3).map((w) => w[0]).join('') || '?').toUpperCase()
})

const MAX_TITLE = 50 // longer titles are shortened to about this many characters, at a word, with "…"
const printedTitle = computed(() => {
	const t = props.book.title.trim()
	if (t.length <= MAX_TITLE) return t
	const cut = t.slice(0, MAX_TITLE)
	const atWord = cut.lastIndexOf(' ')
	return `${(atWord > 20 ? cut.slice(0, atWord) : cut).replace(/[\s,:;(-]+$/, '')}…`
})

const titleSize = computed(() => {
	const longest = Math.max(1, ...printedTitle.value.split(/\s+/).map((word) => word.length))
	const byWidth = Math.round(props.width * 0.13)
	const toFit = Math.floor((props.width - 24) / (longest * 0.7))
	return Math.max(7, Math.min(byWidth, toFit))
})

// One stable colour per subject, so a subject always looks the same on every shelf.
const background = computed(() => {
	const base = subjectSwatch(props.book.subject?.name ?? props.book.title)
	return `linear-gradient(155deg, color-mix(in srgb, ${base} 80%, black), ${base})`
})
</script>
