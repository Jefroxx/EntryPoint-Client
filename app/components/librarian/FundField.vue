<template>
	<div ref="rootRef" class="relative">
		<label :for="id" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
			{{ label }}<FieldRequired />
		</label>

		<!-- Pick-only: the box can't be typed in, the value comes from the list. -->
		<div class="relative">
			<input :id="id" :value="modelValue" type="text" role="combobox" readonly autocomplete="off" :placeholder="placeholder"
				:aria-expanded="open && shownOptions.length > 0" :aria-controls="`${id}-list`" aria-required="true"
				class="h-11 w-full cursor-pointer rounded-[10px] border bg-white pl-3 pr-10 text-[15px] text-stone-900 caret-transparent outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
				:class="error ? 'border-red-400 bg-red-50' : 'border-stone-200'"
				@click="toggleList" @keydown="onKeydown" />
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
}>(), { label: 'Source of fund', placeholder: 'Select a source of fund', maxlength: 255 })

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

// The librarian's own list of sources (Library > Categories) replaces the starting three.
useFundSources()

const rootRef = ref<HTMLElement | null>(null)
const open = ref(false)
const active = ref(-1)

// Nothing can be typed, so the whole list is always shown.
const shownOptions = computed(() => [...FUND_SOURCES])

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
	} else if ((event.key === 'Enter' || event.key === ' ') && !open.value) {
		event.preventDefault()
		openList()
	} else if ((event.key === 'Enter' || event.key === ' ') && open.value && active.value >= 0) {
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
