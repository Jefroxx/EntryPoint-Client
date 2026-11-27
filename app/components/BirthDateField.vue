<template>
	<div role="group" :aria-labelledby="`${id}-label`">
		<span :id="`${id}-label`" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
			{{ label }}<span v-if="optional" class="ml-1 font-normal text-stone-500">(optional)</span>
		</span>

		<!-- Three boxes you can type into (or open for a list): "nov" or "11", then the day, then the year. -->
		<!-- 1.5 / 1 / 1.2: on a 360px phone the old .8 share left the Day box ~20px of text room, so it read "D". -->
		<div class="grid grid-cols-[1.5fr_1fr_1.2fr] gap-2" @focusout="onFocusOut">
			<BirthDatePart :id="id" ref="monthBox" v-model="month" kind="month" label="Month" placeholder="Month" autocomplete="bday-month"
				:options="monthOptions" :invalid="!!shownError" @advance="dayBox?.focus()" />
			<BirthDatePart :id="`${id}-day`" ref="dayBox" v-model="day" kind="day" label="Day" placeholder="Day" autocomplete="bday-day"
				:options="dayOptions" :invalid="!!shownError" @advance="yearBox?.focus()" />
			<BirthDatePart :id="`${id}-year`" ref="yearBox" v-model="year" kind="year" label="Year" placeholder="Year" autocomplete="bday-year"
				:options="yearOptions" :invalid="!!shownError" />
		</div>

		<p v-if="shownError" class="mt-1 text-[12.5px] text-red-500">{{ shownError }}</p>
	</div>
</template>

<script setup lang="ts">
/** A birth date as "YYYY-MM-DD" ('' while unset). `incomplete` is true while only some of the three are chosen. */
const props = defineProps<{
	id: string
	label: string
	error?: string
	optional?: boolean
}>()

const model = defineModel<string>({ default: '' })
const incomplete = defineModel<boolean>('incomplete', { default: false })

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const thisYear = new Date().getFullYear()

const month = ref('')
const day = ref('')
const year = ref('')

const monthBox = ref<{ focus: () => void } | null>(null)
const dayBox = ref<{ focus: () => void } | null>(null)
const yearBox = ref<{ focus: () => void } | null>(null)

// Fewer days in the short months; February depends on the year (29 when the year isn't chosen yet).
const daysInMonth = computed(() => {
	if (!month.value) return 31
	return new Date(year.value ? Number(year.value) : 2000, Number(month.value), 0).getDate()
})

const monthOptions = MONTHS.map((name, i) => ({ value: String(i + 1), label: name }))
const dayOptions = computed(() => Array.from({ length: daysInMonth.value }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })))
const yearOptions = Array.from({ length: thisYear - 1919 }, (_, i) => ({ value: String(thisYear - i), label: String(thisYear - i) }))

const complete = () => !!(month.value && day.value && year.value)
const pad = (n: string) => n.padStart(2, '0')

function composed() {
	return complete() ? `${year.value}-${pad(month.value)}-${pad(day.value)}` : ''
}

function parse(value: string) {
	const [y, m, d] = (value || '').split('-')
	year.value = y ? String(Number(y)) : ''
	month.value = m ? String(Number(m)) : ''
	day.value = d ? String(Number(d)) : ''
}

// A set value from outside (the saved profile) fills the boxes; a reset to '' clears them, but never a half-picked date.
watch(model, (value) => {
	if (value) {
		if (value !== composed()) parse(value)
	} else if (complete()) {
		parse('')
	}
}, { immediate: true })

function settle() {
	// Picking February after the 30th (or a non-leap year after the 29th) moves the day to the last one that exists.
	if (day.value && Number(day.value) > daysInMonth.value) day.value = String(daysInMonth.value)

	const value = composed()
	incomplete.value = !value && !!(month.value || day.value || year.value)
	if (value !== model.value) model.value = value
	touchedIncomplete.value = false
}
watch([month, day, year], settle)

// "Pick all three" is only said once the person has left the group, not while they are still choosing.
const touchedIncomplete = ref(false)
function onFocusOut(event: FocusEvent) {
	const group = event.currentTarget as HTMLElement
	if (event.relatedTarget && group.contains(event.relatedTarget as Node)) return
	// A part is committed in its own blur, which runs just before this one reads the result.
	nextTick(() => { touchedIncomplete.value = incomplete.value })
}

const shownError = computed(() => props.error || (touchedIncomplete.value ? 'Pick the month, day and year, or leave all three empty.' : ''))
</script>
