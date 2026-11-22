<template>
	<div :class="prominent ? 'flex min-w-0' : 'inline-flex'">
		<!-- `prominent`: a button that fills the room it is given (the parent sets how wide) and has a chevron, in the same
			 white, 36px style as the switches beside it: for a screen where this is the main way to narrow the list. -->
		<ButtonsButton variant="ghost" aria-haspopup="dialog"
			:class="prominent
				? ['w-full justify-between !h-9 !px-3 !text-[13.5px] !bg-white hover:!bg-stone-50', activeCount ? '!border-accent-300 !text-accent-700' : '!border-stone-200 !text-stone-600']
				: activeCount ? '!border-accent-300 !bg-accent-50 !text-accent-700' : ''"
			@click="openWindow">
			<span class="flex min-w-0 items-center gap-2">
				<Icon :name="icon" :class="prominent ? 'h-4 w-4 max-sm:hidden' : 'h-3.5 w-3.5'" />{{ label }}
				<span v-if="activeCount" class="truncate rounded-full bg-accent-500 px-2 py-px text-[11.5px] font-bold leading-4 text-white">{{ badge }}</span>
			</span>
			<Icon v-if="prominent" name="i-tabler-chevron-down" class="h-4 w-4 shrink-0" />
		</ButtonsButton>

		<!-- The same kind of window as "Add member": in the middle of the screen, and filling it on a phone. -->
		<LibrarianModalShell :open="open" size="xl" :title="title" :subtitle="subtitle" @close="open = false">
			<!-- Two panes of a fixed height, so the window never changes size however many filters there are or whichever is open:
				 the filters on the left (each says what it is set to), the choices of the open one on the right.
				 On a phone there is room for one pane at a time: the list of filters, then the choices, with a way back. -->
			<div class="flex h-[min(540px,calc(100dvh-250px))] gap-6 max-sm:h-[calc(100dvh-215px)]">
				<!-- With a single filter there is nothing to pick between, so no list of filters: the choices fill the window. -->
					<nav v-if="!single" :class="mobileChoices ? 'max-sm:hidden' : ''" class="w-[260px] shrink-0 space-y-1 overflow-y-auto max-sm:w-full" aria-label="Filters">
					<button v-for="group in groups" :key="group.key" type="button"
						class="flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-150"
						:class="group.key === current?.key ? 'bg-stone-100 max-sm:bg-transparent' : 'hover:bg-stone-50'" :aria-current="group.key === current?.key"
						@click="showGroup(group.key)">
						<span class="min-w-0">
							<span class="block truncate text-[14px] font-semibold text-stone-900">{{ group.title }}</span>
							<span class="block truncate text-[12.5px]" :class="isSet(group) ? 'font-semibold text-accent-600' : 'text-stone-500'">{{ summary(group) }}</span>
						</span>
						<Icon name="i-tabler-chevron-right" class="h-4 w-4 shrink-0 text-stone-400 sm:hidden" />
					</button>
				</nav>

				<section v-if="current" class="flex min-w-0 flex-1 flex-col"
					:class="[mobileChoices ? '' : 'max-sm:hidden', single ? '' : 'sm:border-l sm:border-stone-100 sm:pl-6']">
					<button v-if="!single" type="button" class="mb-2 inline-flex items-center gap-1 self-start rounded-md py-1 text-[13.5px] font-semibold text-accent-600 sm:hidden" @click="mobileChoices = false">
						<Icon name="i-tabler-chevron-left" class="h-4 w-4" />All filters
					</button>
					<h3 v-if="!single" class="mb-2 text-[13.5px] font-semibold text-stone-800">{{ current.title }}</h3>

					<!-- Type to narrow a long list; Enter picks the first match. -->
					<div v-if="searchable" class="mb-2 flex h-10 shrink-0 items-center gap-2 rounded-[10px] border border-stone-200 bg-white px-3 transition-shadow focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-200">
						<Icon name="i-tabler-search" class="h-[14px] w-[14px] shrink-0 text-stone-400" />
						<input ref="searchRef" v-model="query" type="text" :placeholder="`Search ${current.title.toLowerCase()}`" :aria-label="`Search ${current.title.toLowerCase()}`" autocomplete="off"
							class="w-full border-none bg-transparent text-[14.5px] text-stone-900 outline-none placeholder:text-stone-400"
							@keydown.enter.prevent="pickFirst" />
					</div>

					<div role="radiogroup" :aria-label="current.title" class="grid min-h-0 flex-1 auto-rows-min content-start gap-x-2 gap-y-0.5 overflow-y-auto" :class="current.options.length > 8 ? 'sm:grid-cols-2' : ''">
						<button v-for="option in options" :key="option.value" type="button" role="radio" :aria-checked="draft[current.key] === option.value"
							class="flex w-full items-center justify-between gap-2 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium transition-colors duration-150"
							:class="draft[current.key] === option.value ? 'bg-accent-50 text-accent-700' : 'text-stone-700 hover:bg-stone-50'"
							@click="choose(option.value)">
							{{ option.label }}
							<Icon v-if="draft[current.key] === option.value" name="i-tabler-check" class="h-4 w-4 shrink-0" />
						</button>
						<p v-if="!options.length" class="col-span-full px-3 py-6 text-center text-[14px] text-stone-500">Nothing matches “{{ query.trim() }}”.</p>
					</div>
				</section>
			</div>

			<template #footer>
				<ButtonsButton variant="ghost" :disabled="!draftCount" @click="clearDraft">Clear all</ButtonsButton>
				<ButtonsButton variant="primary" @click="apply">Show results</ButtonsButton>
			</template>
		</LibrarianModalShell>
	</div>
</template>

<script setup lang="ts">
interface FilterOption {
	value: string
	label: string
	/** What the button shows when this is the choice, if shorter than the label ("Biology" for "Biology (5)"). */
	badge?: string
}
interface FilterGroup {
	key: string
	/** The name in the list of filters ("Type", "Account status"). */
	title: string
	options: readonly FilterOption[]
	/** The choice that means "no filter" for this group. */
	allValue?: string
}

/**
 * A "Filter" button that opens a window (like Add member) for any number of filters. The filters are listed on the
 * left, each showing what it is set to; the open one shows its choices on the right (one at a time) with a search box
 * when the list is long. Nothing changes until "Show results"; closing the window leaves the list as it was.
 * The button lights up and shows what is filtered: the choice itself when there is one, or how many.
 */
const props = withDefaults(defineProps<{
	/** The chosen value of each group, by the group's key. */
	modelValue: Record<string, string>
	groups: readonly FilterGroup[]
	label?: string
	/** The icon on the button. */
	icon?: string
	/** A bigger button that fills the width the parent gives it, instead of a small inline one. */
	prominent?: boolean
	title?: string
	subtitle?: string
	/** A search box over the open filter's choices. By default only a list of more than 6 gets one. */
	searchable?: boolean
}>(), { label: 'Filter', icon: 'i-tabler-filter', title: 'Filter', subtitle: 'Pick what to show, then press Show results.', searchable: undefined })

const emit = defineEmits<{ (e: 'update:modelValue', value: Record<string, string>): void }>()

const open = ref(false)
const query = ref('')
const searchRef = ref<HTMLInputElement | null>(null)
// What is picked in the window, before it is applied.
const draft = ref<Record<string, string>>({})
const currentKey = ref('')
// Phones only: whether the choices pane is showing instead of the list of filters.
const mobileChoices = ref(false)

const allOf = (group: FilterGroup) => group.allValue ?? 'all'
const isSet = (group: FilterGroup) => draft.value[group.key] !== allOf(group)
const summary = (group: FilterGroup) => group.options.find((o) => o.value === draft.value[group.key])?.label ?? 'Any'

// A single filter needs no list of filters: its choices fill the window (on a phone too, with no extra step).
const single = computed(() => props.groups.length === 1)
const current = computed(() => props.groups.find((g) => g.key === currentKey.value) ?? props.groups[0])
const searchable = computed(() => props.searchable ?? (current.value?.options.length ?? 0) > 6)
// While typing, "All ..." steps aside: it would match half of what anyone types ("re" is in "areas"), and Enter should pick a real match.
const options = computed(() => {
	const group = current.value
	if (!group) return []
	const q = query.value.trim().toLowerCase()
	return q ? group.options.filter((o) => o.value !== allOf(group) && o.label.toLowerCase().includes(q)) : group.options
})

// On the button: what is applied now (not the draft).
const activeGroups = computed(() => props.groups.filter((g) => props.modelValue[g.key] !== allOf(g)))
const activeCount = computed(() => activeGroups.value.length)
const badge = computed(() => {
	const only = activeGroups.value[0]
	if (activeCount.value !== 1 || !only) return String(activeCount.value)
	const chosen = only.options.find((o) => o.value === props.modelValue[only.key])
	return chosen?.badge ?? chosen?.label ?? '1'
})
const draftCount = computed(() => props.groups.filter(isSet).length)

function openWindow() {
	draft.value = { ...props.modelValue }
	currentKey.value = props.groups[0]?.key ?? ''
	query.value = ''
	mobileChoices.value = single.value
	open.value = true
	focusSearch()
}

function showGroup(key: string) {
	currentKey.value = key
	query.value = ''
	mobileChoices.value = true
	focusSearch()
}

// Ready to type straight away (not on a phone, where the keyboard would cover the choices).
function focusSearch() {
	if (import.meta.client && window.matchMedia('(pointer: fine)').matches) void nextTick(() => setTimeout(() => searchRef.value?.focus(), 60))
}

function choose(value: string) {
	const group = current.value
	if (group) draft.value = { ...draft.value, [group.key]: value }
}

function pickFirst() {
	const first = options.value[0]
	if (first) choose(first.value)
}

function clearDraft() {
	draft.value = Object.fromEntries(props.groups.map((g) => [g.key, allOf(g)]))
}

function apply() {
	emit('update:modelValue', { ...draft.value })
	open.value = false
}
</script>
