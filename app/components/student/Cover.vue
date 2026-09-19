<template>
	<div class="relative shrink-0 overflow-hidden rounded-l-[5px] rounded-r-[9px] text-white shadow-[0_8px_18px_-10px_rgba(0,0,0,.55),inset_0_0_0_1px_rgba(255,255,255,.08)]"
		:style="{ width: `${width}px`, height: `${Math.round(width * 1.4)}px`, background }" role="img"
		:aria-label="`Cover of ${book.title}`">
		<img v-if="book.coverImageURL && !failed" :src="book.coverImageURL" alt="" loading="lazy"
			class="h-full w-full object-cover" @error="failed = true">
		<template v-else>
			<span class="absolute inset-y-0 left-[5px] w-px bg-white/30" />
			<span class="dashboard-heading absolute inset-0 flex items-end p-2 pl-3 font-bold leading-[1.12] tracking-tight"
				:style="{ fontSize: `${Math.max(8, Math.round(width * 0.13))}px` }">{{ book.title }}</span>
		</template>
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	book: { title: string; coverImageURL?: string | null; subject?: { name: string } | null }
	width?: number
}>(), { width: 56 })

const failed = ref(false)

// One stable colour per subject, so a subject always looks the same on every shelf.
const background = computed(() => {
	const base = subjectSwatch(props.book.subject?.name ?? props.book.title)
	return `linear-gradient(155deg, color-mix(in srgb, ${base} 80%, black), ${base})`
})
</script>
