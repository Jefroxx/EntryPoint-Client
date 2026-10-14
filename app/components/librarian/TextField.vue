<template>
	<div>
		<label :for="id" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
			{{ label }}<FieldRequired v-if="isRequired" />
			<span v-if="optional" class="ml-1 font-normal text-stone-400">(optional)</span>
		</label>
		<input :id="id" :value="modelValue" :type="type" :placeholder="placeholder" :min="min" :max="max" :step="step"
			:autocomplete="autocomplete" :maxlength="maxlength" :aria-required="isRequired || undefined"
			class="h-11 w-full rounded-[10px] border bg-white px-3 text-[15px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
			:class="[error ? 'border-red-400 bg-red-50' : 'border-stone-200', mono ? 'font-data text-[13.5px]' : '']"
			@input="onInput" />
		<p v-if="error" class="mt-1 text-[12.5px] text-red-500">{{ error }}</p>
		<p v-else-if="hint" class="mt-1 text-[12.5px] text-stone-400">{{ hint }}</p>
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	modelValue: string | number
	id: string
	label: string
	type?: string
	placeholder?: string
	error?: string
	hint?: string
	/** Says "(optional)". A field that is not optional is required and gets the red asterisk. */
	optional?: boolean
	/** Overrides the rule above, for the rare field that is neither (leave it out and it follows `optional`). */
	required?: boolean
	mono?: boolean
	min?: number
	max?: number
	/** For number fields: how far the arrows move the value ("0.01" for money). */
	step?: number | string
	autocomplete?: string
	maxlength?: number
}>(), {
	// Not passed means "follow optional", not false (Vue turns a missing boolean into false).
	required: undefined,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

const isRequired = computed(() => props.required ?? !props.optional)

function onInput(event: Event) {
	emit('update:modelValue', (event.target as HTMLInputElement).value)
}
</script>
