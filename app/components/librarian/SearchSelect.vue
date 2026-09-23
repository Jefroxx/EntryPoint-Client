<template>
	<div class="relative">
		<div v-if="modelValue"
			class="flex h-11 items-center justify-between gap-2 rounded-[10px] border border-accent-200 bg-accent-50 px-3">
			<div class="min-w-0">
				<p class="truncate text-[14px] font-semibold text-stone-900">{{ getLabel(modelValue) }}</p>
				<p v-if="getSublabel" class="truncate text-[12px] text-stone-500">{{ getSublabel(modelValue) }}</p>
			</div>
			<ButtonsButton variant="icon" size="sm" aria-label="Clear selection" @click="emit('update:modelValue', null)">
				<Icon name="i-tabler-x" class="h-3.5 w-3.5" />
			</ButtonsButton>
		</div>

		<template v-else>
			<div
				class="flex h-10 items-center gap-2 rounded-[10px] border bg-white px-3 transition-shadow focus-within:border-accent-500 focus-within:ring-2 focus-within:ring-accent-200"
				:class="invalid ? 'border-red-400 bg-red-50' : 'border-stone-200'">
				<Icon name="i-tabler-search" class="h-[14px] w-[14px] text-stone-400" />
				<input :id="inputId" v-model="query" type="text" :placeholder="placeholder" autocomplete="off"
					class="w-full border-none bg-transparent text-[15px] text-stone-900 outline-none placeholder:text-stone-400"
					@focus="openList" @blur="isOpen = false" />
			</div>

			<div v-if="isOpen"
				class="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-56 overflow-y-auto rounded-xl border border-stone-200 bg-white p-1 shadow-card">
				<p v-if="loading" class="px-3 py-2 text-[13.5px] text-stone-400">Searching…</p>
				<p v-else-if="results.length === 0" class="px-3 py-2 text-[13.5px] text-stone-400">No matches.</p>
				<button v-for="(item, index) in results" :key="index" type="button"
					class="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors hover:bg-stone-50"
					@mousedown.prevent="choose(item)">
					<span class="text-[14px] font-semibold text-stone-900">{{ getLabel(item) }}</span>
					<span v-if="getSublabel" class="text-[12.5px] text-stone-500">{{ getSublabel(item) }}</span>
				</button>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts" generic="T">
const props = defineProps<{
	modelValue: T | null
	fetcher: (query: string) => Promise<T[]>
	getLabel: (item: T) => string
	getSublabel?: (item: T) => string
	placeholder: string
	inputId: string
	invalid?: boolean
}>()

const emit = defineEmits<{ (e: 'update:modelValue', value: T | null): void }>()

const query = ref('')
const results = shallowRef<T[]>([])
const loading = ref(false)
const isOpen = ref(false)

let timeout: ReturnType<typeof setTimeout>

async function runSearch() {
	loading.value = true
	try {
		results.value = await props.fetcher(query.value.trim())
	} catch {
		results.value = []
	} finally {
		loading.value = false
	}
}

function openList() {
	isOpen.value = true
	runSearch()
}

watch(query, () => {
	isOpen.value = true
	clearTimeout(timeout)
	timeout = setTimeout(runSearch, 250)
})

function choose(item: T) {
	emit('update:modelValue', item)
	query.value = ''
	isOpen.value = false
}
</script>
