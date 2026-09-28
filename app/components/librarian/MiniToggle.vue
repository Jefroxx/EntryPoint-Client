<template>
	<!-- A compact two-or-three way switch for card headers (the page-level tabs are too large here). -->
	<div class="inline-flex rounded-xl bg-stone-100 p-0.5" role="radiogroup" :aria-label="label">
		<button v-for="option in options" :key="option.value" type="button" role="radio" :aria-checked="option.value === modelValue"
			class="h-8 rounded-lg px-3 text-[13px] font-semibold transition-[background-color,color,box-shadow] duration-150 ease-out"
			:class="option.value === modelValue ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'"
			@click="$emit('update:modelValue', option.value)">
			{{ option.label }}
		</button>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	modelValue: string
	options: { label: string; value: string }[]
	label: string
}>()

defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>
