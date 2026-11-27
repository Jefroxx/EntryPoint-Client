<template>
	<div class="relative">
		<input :id="id" ref="input" :value="shown" type="text" role="combobox" :inputmode="kind === 'month' ? 'text' : 'numeric'" :autocomplete="autocomplete"
			:placeholder="placeholder" :maxlength="kind === 'month' ? 9 : kind === 'day' ? 2 : 4" :aria-label="label" aria-autocomplete="list" :aria-expanded="open"
			:aria-controls="`${id}-list`" :aria-activedescendant="open && filtered[active] ? `${id}-opt-${filtered[active]?.value}` : undefined"
			class="h-11 w-full min-w-0 rounded-[10px] border bg-white pl-2.5 pr-6 text-[16px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200 sm:text-[15px]"
			:class="invalid ? 'border-red-400 bg-red-50' : 'border-stone-200'"
			@focus="onFocus" @blur="onBlur" @input="onInput" @keydown="onKeydown" @click="open = true" />
		<Icon name="i-tabler-chevron-down" class="pointer-events-none absolute right-1.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" aria-hidden="true" />

		<ul v-if="open && filtered.length" :id="`${id}-list`" role="listbox" :aria-label="label"
			class="absolute left-0 z-30 mt-1 max-h-52 min-w-full overflow-auto rounded-xl border border-stone-200 bg-white py-1 shadow-overlay">
			<!-- mousedown, not click: the box must keep focus, or leaving it would close the list before the choice lands. -->
			<li v-for="(option, i) in filtered" :id="`${id}-opt-${option.value}`" :key="option.value" role="option" :aria-selected="option.value === modelValue"
				class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-[14.5px] text-stone-800"
				:class="[i === active ? 'bg-accent-50' : '', option.value === modelValue ? 'font-semibold text-accent-700' : '']"
				@mousedown.prevent="commit(option)" @mousemove="active = i">
				{{ option.label }}
			</li>
		</ul>
	</div>
</template>

<script setup lang="ts">
/**
 * One part of a birth date (month, day or year): a box you can type in that also opens a list.
 * Typing narrows the list ("nov" or "11" both find November), and the part is chosen as soon as what was typed can only
 * mean one thing; it then asks the next box to take over (`advance`). Leaving the box, or Enter, takes the top match.
 */
type Option = { value: string; label: string }

const props = defineProps<{
	id: string
	label: string
	kind: 'month' | 'day' | 'year'
	options: Option[]
	placeholder: string
	autocomplete?: string
	invalid?: boolean
}>()

const model = defineModel<string>({ default: '' })
const emit = defineEmits<{ (e: 'advance'): void }>()

const input = ref<HTMLInputElement | null>(null)
const open = ref(false)
const active = ref(0)
const typing = ref(false)
const query = ref('')

const selectedLabel = computed(() => props.options.find((o) => o.value === model.value)?.label ?? (model.value || ''))
const shown = computed(() => (typing.value ? query.value : selectedLabel.value))

/** The list while typing: months match their name or number, days and years match the digits typed so far. */
const filtered = computed(() => {
	const q = query.value.trim().toLowerCase()
	if (!typing.value || !q) return props.options

	if (/^\d+$/.test(q)) {
		const n = String(Number(q))
		// "01" means exactly 1; "1" could still become 10, 11 or 12.
		if (props.kind !== 'year' && q.length > 1 && q.startsWith('0')) return props.options.filter((o) => o.value === n)
		return props.options.filter((o) => o.value.startsWith(props.kind === 'year' ? q : n))
	}
	return props.kind === 'month' ? props.options.filter((o) => o.label.toLowerCase().startsWith(q)) : []
})

watch(filtered, () => { active.value = 0 })
watch(active, async () => {
	await nextTick()
	document.getElementById(`${props.id}-opt-${filtered.value[active.value]?.value}`)?.scrollIntoView({ block: 'nearest' })
})

function onFocus() {
	typing.value = false
	open.value = true
	const at = props.options.findIndex((o) => o.value === model.value)
	active.value = at >= 0 ? at : 0
	// Selected, so typing replaces what is there.
	nextTick(() => {
		input.value?.select()
		document.getElementById(`${props.id}-opt-${filtered.value[active.value]?.value}`)?.scrollIntoView({ block: 'nearest' })
	})
}

function commit(option: Option) {
	model.value = option.value
	typing.value = false
	open.value = false
}

function onInput(event: Event) {
	let value = (event.target as HTMLInputElement).value
	if (props.kind !== 'month') value = value.replace(/\D/g, '')
	query.value = value
	typing.value = true
	open.value = true
	// The box shows what was typed; keep it in step when digits were stripped.
	;(event.target as HTMLInputElement).value = value

	if (isSettled(value)) {
		const option = filtered.value[0]
		if (option) {
			commit(option)
			emit('advance')
		}
	}
}

/** Typed enough that nothing else could be meant: "5" for a month, "4" for a day, "nov", "2004". */
function isSettled(value: string): boolean {
	const q = value.trim().toLowerCase()
	if (!q) return false
	const max = Number(props.options[props.options.length - 1]?.value ?? 0)

	if (props.kind === 'year') return q.length === 4 && props.options.some((o) => o.value === q)
	if (/^\d+$/.test(q)) {
		const n = Number(q)
		if (n < 1 || n > max) return false
		// Month and day: two digits, or one digit that cannot grow into another valid number ("4" for a day, "2" for a month).
		return q.length >= 2 || n * 10 > max
	}
	return props.kind === 'month' && q.length >= 3 && filtered.value.length === 1
}

function onBlur() {
	open.value = false
	if (!typing.value) return
	const q = query.value.trim()

	if (q === '') model.value = ''
	else if (props.kind === 'year') {
		const exact = props.options.find((o) => o.value === q)
		if (exact) model.value = exact.value
	} else if (filtered.value[0]) {
		model.value = filtered.value[0].value
	}
	typing.value = false
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
		event.preventDefault()
		open.value = true
		const step = event.key === 'ArrowDown' ? 1 : -1
		active.value = Math.min(Math.max(active.value + step, 0), Math.max(filtered.value.length - 1, 0))
	} else if (event.key === 'Enter') {
		// Choosing from the list, not sending the form.
		if (open.value && filtered.value[active.value]) {
			event.preventDefault()
			commit(filtered.value[active.value]!)
			emit('advance')
		}
	} else if (event.key === 'Escape') {
		typing.value = false
		open.value = false
	}
}

defineExpose({ focus: () => input.value?.focus() })
</script>
