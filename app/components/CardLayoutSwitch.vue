<template>
	<!-- Grid or one per row, for every list of cards in the app. Two buttons rather than a toggle, so each says what it does. -->
	<div role="radiogroup" :aria-label="label" class="grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1">
		<button v-for="option in OPTIONS" :key="option.value" type="button" role="radio" :aria-checked="layout === option.value"
			class="flex h-9 items-center justify-center gap-1.5 rounded-[9px] text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-150"
			:class="layout === option.value ? 'bg-white text-stone-900 shadow-[0_1px_2px_rgba(40,25,8,.12)]' : 'text-stone-500 hover:text-stone-800'"
			@click="layout = option.value">
			<Icon :name="option.icon" class="h-4 w-4" />{{ option.label }}
		</button>
	</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: 'How cards are shown' })

const OPTIONS: { value: CardLayout; label: string; icon: string }[] = [
	{ value: 'grid', label: 'Grid', icon: 'i-tabler-layout-grid' },
	{ value: 'rows', label: 'One per row', icon: 'i-tabler-layout-list' },
]

const { layout } = useCardLayout()
</script>
