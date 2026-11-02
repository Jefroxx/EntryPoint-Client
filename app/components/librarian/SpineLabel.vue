<template>
	<!-- The label as it goes on the book's spine, top to bottom: area of the library, Dewey number, author Cutter, year. -->
	<div class="inline-flex w-[88px] flex-col items-center rounded-md border border-stone-300 bg-white px-2 py-2.5 text-center leading-tight shadow-sm"
		role="img" :aria-label="ariaLabel">
		<span class="text-[9.5px] font-bold uppercase tracking-[.08em] text-stone-500">{{ label.area }}</span>
		<span class="my-1.5 h-px w-full bg-stone-200" aria-hidden="true" />
		<template v-if="label.pending">
			<span class="font-data text-[12px] font-semibold text-amber-700">Pending</span>
			<span class="mt-1 text-[10px] leading-snug text-stone-400">Dewey number not checked yet</span>
		</template>
		<template v-else>
			<span class="font-data text-[15px] font-semibold text-stone-900">{{ label.dewey }}</span>
			<span v-if="label.cutter" class="font-data text-[14px] font-semibold text-stone-900">{{ label.cutter }}</span>
		</template>
		<span v-if="label.year" class="font-data mt-1 text-[12px] text-stone-600">{{ label.year }}</span>
	</div>
</template>

<script setup lang="ts">
import type { SpineLabelData } from '~/services/librarianService'

const props = defineProps<{ label: SpineLabelData }>()

const ariaLabel = computed(() => props.label.pending
	? `${props.label.area}, call number pending`
	: [props.label.area, props.label.dewey, props.label.cutter, props.label.year].filter(Boolean).join(', '))
</script>
