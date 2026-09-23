<template>
	<div
		class="flex h-[42px] min-w-[200px] max-w-[300px] flex-1 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 transition-shadow focus-within:ring-2 focus-within:ring-accent-200">
		<Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
		<input :id="id" :value="modelValue" type="text" :placeholder="placeholder"
			class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400"
			@input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
	</div>
</template>

<script setup lang="ts">
defineProps<{
	modelValue: string
	id: string
	placeholder: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()
</script>
