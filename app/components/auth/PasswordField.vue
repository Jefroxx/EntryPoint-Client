<template>
	<div>
		<label :for="id" class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">{{ label }}</label>
		<div class="relative">
			<input :id="id" :value="modelValue" :type="visible ? 'text' : 'password'" :placeholder="placeholder"
				:autocomplete="autocomplete"
				class="h-10 w-full rounded-[10px] border bg-white pl-3 pr-11 text-[13.5px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
				:class="error ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="onInput" />
			<button type="button" :aria-label="visible ? 'Hide password' : 'Show password'" :aria-pressed="visible"
				class="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-[transform,background-color,color] duration-150 ease-out hover:bg-stone-100 hover:text-stone-700 active:scale-90"
				@click="visible = !visible">
				<Icon :name="visible ? 'i-tabler-eye-off' : 'i-tabler-eye'" class="h-4 w-4" />
			</button>
		</div>
		<p v-if="error" class="mt-1 text-[11.5px] text-red-500">{{ error }}</p>
		<p v-else-if="hint" class="mt-1 text-[11.5px] text-stone-400">{{ hint }}</p>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	modelValue: string
	id: string
	label: string
	placeholder?: string
	error?: string
	hint?: string
	autocomplete?: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const visible = ref(false)

function onInput(event: Event) {
	emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
