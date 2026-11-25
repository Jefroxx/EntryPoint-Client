<template>
	<div ref="rootRef" class="relative">
		<label :for="id" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
			{{ label }}<FieldRequired />
		</label>

		<!-- A box you can type in, with the usual answers one tap away. -->
		<div class="relative">
			<input :id="id" :value="modelValue" type="text" role="combobox" autocomplete="off" :maxlength="maxlength" :placeholder="placeholder"
				:aria-expanded="open && shownOptions.length > 0" :aria-controls="`${id}-list`" aria-autocomplete="list" aria-required="true"
				class="h-11 w-full rounded-[10px] border bg-white pl-3 pr-10 text-[15px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
				:class="error ? 'border-red-400 bg-red-50' : 'border-stone-200'"
				@input="onInput" @focus="openList" @click="openList" @keydown="onKeydown" @blur="tidy" />
			<button type="button" tabindex="-1" aria-label="Show the usual sources"
				class="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
				@mousedown.prevent @click="toggleList">
				<Icon name="i-tabler-chevron-down" class="h-4 w-4 transition-transform duration-150" :class="open ? 'rotate-180' : ''" />
			</button>
		</div>

		<ul v-if="open && shownOptions.length" :id="`${id}-list`" role="listbox"
			class="absolute left-0 right-0 z-30 mt-1 overflow-hidden rounded-[10px] border border-stone-200 bg-white p-1 shadow-card">
			<li v-for="(option, index) in shownOptions" :key="option" role="option" :aria-selected="option === modelValue">
				<button type="button" tabindex="-1"
					class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-[14.5px] font-medium transition-colors duration-100"
					:class="[index === active ? 'bg-stone-100' : '', option === modelValue ? 'text-accent-700' : 'text-stone-700 hover:bg-stone-50']"
					@mousedown.prevent @click="pick(option)" @mouseenter="active = index">
					{{ option }}
					<Icon v-if="option === modelValue" name="i-tabler-check" class="h-4 w-4 shrink-0" />
				</button>
			</li>
		</ul>

		<p v-if="error" class="mt-1 text-[12.5px] text-red-500">{{ error }}</p>
		<p v-else-if="hint" class="mt-1 text-[12.5px] text-stone-500">{{ hint }}</p>
	</div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	modelValue: string
	id: string
	label?: string
	placeholder?: string
	error?: string
	hint?: string
	maxlength?: number
}>(), { label: 'Source of fund', placeholder: 'Pick one, or type another reason', maxlength: 255 })

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

// The librarian's own list of sources (Library > Categories) replaces the starting three.
useFundSources()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const active = ref(-1)

// All of them, until what is typed narrows it down (once it IS one of them, the others come back so it can be changed).
const shownOptions = computed(() => {
	const typed = props.modelValue.trim().toLowerCase()
	if (!typed || FUND_SOURCES.some((o) => o.toLowerCase() === typed)) return [...FUND_SOURCES]
	return FUND_SOURCES.filter((o) => o.toLowerCase().includes(typed))
})

function openList() {
	open.value = true
	active.value = -1
}

function toggleList() {
	if (open.value) open.value = false
	else {
		openList()
		;(rootRef.value?.querySelector('input') as HTMLInputElement | null)?.focus()
	}
}

function onInput(event: Event) {
	open.value = true
	active.value = -1
	emit('update:modelValue', (event.target as HTMLInputElement).value)
}

// Leaving the box: "donated" typed by hand is saved as the usual "Donated" (same words, same spelling everywhere).
function tidy() {
	const typed = props.modelValue.trim()
	// "Donation" and "donated" are the same thing: they become the listed "Donated". Other names match the list loosely.
	const loose = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '')
	const usual = isDonatedFund(typed) ? FUND_SOURCES.find((o) => isDonatedFund(o)) : FUND_SOURCES.find((o) => loose(o) === loose(typed))
	if (usual && usual !== props.modelValue) emit('update:modelValue', usual)
	else if (typed !== props.modelValue) emit('update:modelValue', typed)
}

function pick(option: string) {
	emit('update:modelValue', option)
	open.value = false
}

function onKeydown(event: KeyboardEvent) {
	const count = shownOptions.value.length
	if (event.key === 'ArrowDown') {
		event.preventDefault()
		if (!open.value) openList()
		else if (count) active.value = (active.value + 1) % count
	} else if (event.key === 'ArrowUp') {
		event.preventDefault()
		if (open.value && count) active.value = (active.value - 1 + count) % count
	} else if (event.key === 'Enter' && open.value && active.value >= 0) {
		// Only when an option is highlighted: otherwise Enter does what it does in the rest of the form.
		event.preventDefault()
		const option = shownOptions.value[active.value]
		if (option) pick(option)
	} else if (event.key === 'Escape' && open.value) {
		// Closes the list, not the whole window.
		event.stopPropagation()
		open.value = false
	} else if (event.key === 'Tab') {
		open.value = false
	}
}

function closeOutside(event: MouseEvent) {
	if (rootRef.value && !rootRef.value.contains(event.target as Node)) open.value = false
}
onMounted(() => document.addEventListener('mousedown', closeOutside))
onBeforeUnmount(() => document.removeEventListener('mousedown', closeOutside))
</script>
