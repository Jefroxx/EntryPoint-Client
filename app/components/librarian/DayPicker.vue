<template>
	<!-- Day by day: step back through a log, pick a date from a calendar, or go back to the default. -->
	<div class="flex items-center gap-1" role="group" aria-label="Choose a day">
		<ButtonsButton v-if="modelValue" variant="icon" size="md" aria-label="Previous day" @click="shift(-1)">
			<Icon name="i-tabler-chevron-left" class="h-4 w-4" />
		</ButtonsButton>

		<!-- Pressing anywhere on the field opens the calendar (the browser only does that on its tiny icon by default). -->
		<div class="relative">
			<Icon name="i-tabler-calendar" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
			<input :value="modelValue" type="date" :max="max" aria-label="Choose a date, opens a calendar"
				class="h-[42px] cursor-pointer rounded-xl border bg-white pl-9 pr-3 text-[14.5px] outline-none transition-shadow focus:ring-2 focus:ring-accent-200"
				:class="modelValue ? 'border-accent-300 text-stone-800' : 'border-stone-200 text-stone-500'"
				@input="onInput" @click="openCalendar" />
		</div>

		<ButtonsButton v-if="modelValue" variant="icon" size="md" aria-label="Next day" :disabled="modelValue >= max" @click="shift(1)">
			<Icon name="i-tabler-chevron-right" class="h-4 w-4" />
		</ButtonsButton>
		<ButtonsButton v-if="modelValue !== emptyValue" variant="ghost" @click="emit('update:modelValue', emptyValue)">{{ resetLabel }}</ButtonsButton>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	/** The chosen day as Y-m-d; empty means no day is chosen. */
	modelValue: string
	/** The latest day that can be picked (today), as Y-m-d. */
	max: string
	/** What "no choice" is: today for a log that opens on today, empty for "all dates". */
	emptyValue: string
	/** The label of the button that goes back to `emptyValue` ("Today", "All dates"). */
	resetLabel: string
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

// Local Y-m-d (not toISOString, which is UTC and can land on the wrong day in the evening).
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// A cleared date box means "back to the default".
function onInput(event: Event) {
	const value = (event.target as HTMLInputElement).value
	emit('update:modelValue', value || props.emptyValue)
}

function shift(by: number) {
	const [y, m, d] = props.modelValue.split('-').map(Number)
	if (!y || !m || !d) return
	const next = ymd(new Date(y, m - 1, d + by))
	if (next <= props.max) emit('update:modelValue', next)
}

// showPicker() opens the browser's calendar; very old browsers lack it and keep the usual typed field.
function openCalendar(event: MouseEvent) {
	try { (event.currentTarget as HTMLInputElement).showPicker() } catch { /* typed entry still works */ }
}
</script>
