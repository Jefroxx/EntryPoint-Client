<template>
	<div>
		<label :for="id" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
			{{ label }}<FieldRequired v-if="isRequired" />
			<span v-if="optional" class="ml-1 font-normal text-stone-500">(optional)</span>
		</label>
		<!-- A date is picked from a calendar: pressing anywhere on the box opens it (the browser only does that on its tiny icon by default). -->
		<div class="relative">
			<Icon v-if="type === 'date'" name="i-tabler-calendar" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true" />
			<!-- A number box is a plain text box that only takes digits (and one decimal point for money): the browser's own number box
				 also takes e, + and - ("1e3"), and says nothing until the form is sent. -->
			<input :id="id" :value="modelValue" :type="isNumber ? 'text' : type" :inputmode="isNumber ? (decimals ? 'decimal' : 'numeric') : undefined"
				:placeholder="placeholder" :min="isNumber ? undefined : min" :max="isNumber ? undefined : max" :step="isNumber ? undefined : step"
				:autocomplete="isNumber ? 'off' : autocomplete" :maxlength="maxlength" :aria-required="isRequired || undefined"
				class="h-11 w-full rounded-[10px] border bg-white px-3 text-[15px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
				:class="[shownError ? 'border-red-400 bg-red-50' : 'border-stone-200', mono ? 'font-data text-[13.5px]' : '', type === 'date' ? 'cursor-pointer !pl-9' : '']"
				@input="onInput" @blur="checkRange" @click="openCalendar" />
		</div>
		<p v-if="shownError" class="mt-1 text-[12.5px] text-red-500">{{ shownError }}</p>
		<p v-else-if="hint" class="mt-1 text-[12.5px] text-stone-500">{{ hint }}</p>
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
	/** A number field's lowest and highest value; for a date field, the earliest and latest day as "2026-11-11". */
	min?: number | string
	max?: number | string
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

const isNumber = computed(() => props.type === 'number')
// Money ("0.01") takes two decimals, a count takes none.
const decimals = computed(() => decimalsOfStep(props.step))

// What the box says on its own (a number outside its range), when the form hasn't given it a message.
const rangeError = ref('')
const shownError = computed(() => props.error || rangeError.value)

function onInput(event: Event) {
	const input = event.target as HTMLInputElement
	rangeError.value = ''
	if (isNumber.value) {
		// Written back to the box itself: when a wrong key leaves the value as it was, Vue sees no change and wouldn't.
		input.value = decimals.value ? decimalOnly(input.value, decimals.value) : digitsOnly(input.value)
	}
	emit('update:modelValue', input.value)
}

/** Leaving a number box with a value in it says right away if it is out of range (an empty box waits for the form). */
function checkRange() {
	if (!isNumber.value || String(props.modelValue).trim() === '') return
	const value = Number(props.modelValue)
	const low = props.min === undefined || props.min === '' ? null : Number(props.min)
	const high = props.max === undefined || props.max === '' ? null : Number(props.max)
	if (Number.isNaN(value)) rangeError.value = 'Enter a number.'
	else if (low !== null && high !== null && (value < low || value > high)) rangeError.value = `Enter a number from ${low} to ${high}.`
	else if (low !== null && value < low) rangeError.value = `Enter ${low} or more.`
	else if (high !== null && value > high) rangeError.value = `Enter ${high} or less.`
	else rangeError.value = ''
}

// showPicker() opens the browser's calendar; a very old browser lacks it and keeps the typed field.
function openCalendar(event: MouseEvent) {
	if (props.type !== 'date') return
	try { (event.currentTarget as HTMLInputElement).showPicker() } catch { /* typed entry still works */ }
}
</script>
