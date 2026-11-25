<template>
	<!-- A copy's barcode drawn as the scanner will read it (Code 128, the same as the printed labels), with the code under it. -->
	<figure class="rounded-xl border border-stone-200 bg-white px-4 py-3 text-center">
		<svg v-if="drawn" :viewBox="`0 0 ${drawn.width} 64`" preserveAspectRatio="none" role="img" :aria-label="`Barcode ${value}`"
			class="mx-auto block h-16 w-full max-w-[320px]">
			<rect v-for="([x, w], i) in drawn.bars" :key="i" :x="x" y="0" :width="w" height="64" fill="#000" />
		</svg>
		<p v-else class="py-5 text-[13.5px] text-stone-500">This copy has no barcode yet.</p>
		<figcaption v-if="drawn" class="font-data mt-1.5 text-[13px] font-semibold tracking-wide text-stone-800">{{ value }}</figcaption>
	</figure>
</template>

<script setup lang="ts">
import { code128 } from '~/utils/code128'

const props = defineProps<{ value?: string | null }>()

const drawn = computed(() => (props.value ? code128(props.value) : null))
</script>
