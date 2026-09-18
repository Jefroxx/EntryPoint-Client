<template>
	<div>
		<label :for="id" class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">
			{{ label }}
			<span v-if="optional" class="font-normal text-stone-400">(optional)</span>
		</label>
		<input :id="id" :value="modelValue" :type="type" :placeholder="placeholder" :min="min" :max="max"
			:autocomplete="autocomplete" :maxlength="maxlength"
			class="h-10 w-full rounded-[10px] border bg-white px-3 text-[13.5px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
			:class="[error ? 'border-red-400 bg-red-50' : 'border-stone-200', mono ? 'font-data text-[12.5px]' : '']"
			@input="onInput" />
		<p v-if="error" class="mt-1 text-[11.5px] text-red-500">{{ error }}</p>
		<p v-else-if="hint" class="mt-1 text-[11.5px] text-stone-400">{{ hint }}</p>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	modelValue: string | number
	id: string
	label: string
	type?: string
	placeholder?: string
	error?: string
	hint?: string
	optional?: boolean
	mono?: boolean
	min?: number
	max?: number
	autocomplete?: string
	maxlength?: number
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

function onInput(event: Event) {
	emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
