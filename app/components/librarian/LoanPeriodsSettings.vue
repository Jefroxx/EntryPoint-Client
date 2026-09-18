<template>
	<section class="rounded-2xl border border-stone-200 bg-white p-5">
		<h2 class="text-[15px] font-bold text-stone-900">Loan periods</h2>
		<p class="mb-3 text-[12.5px] text-stone-400">How many days a student can keep a book, by collection. Changes apply to new checkouts.</p>

		<div v-for="collection in COLLECTIONS" :key="collection.area"
			class="flex items-center justify-between border-t border-stone-100 py-3.5">
			<div>
				<p class="text-[13.5px] font-semibold text-stone-800">{{ collection.label }}</p>
				<p class="text-[11.5px] text-stone-400">{{ collection.hint }}</p>
			</div>
			<div class="flex items-center overflow-hidden rounded-[10px] border border-stone-200">
				<button type="button" :aria-label="`Decrease ${collection.label} days`"
					class="flex h-9 w-9 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:scale-90"
					@click="step(collection.area, -1)">–</button>
				<span class="flex h-9 w-16 items-center justify-center border-x border-stone-200 text-[13px] font-bold tabular-nums text-stone-900">
					{{ draft[collection.area] }} days
				</span>
				<button type="button" :aria-label="`Increase ${collection.label} days`"
					class="flex h-9 w-9 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:scale-90"
					@click="step(collection.area, 1)">+</button>
			</div>
		</div>

		<div class="flex items-center justify-between border-t border-stone-100 pt-4">
			<span class="text-[12.5px] text-stone-400">{{ dirty ? 'Unsaved changes' : 'No changes' }}</span>
			<ButtonsButton variant="primary" :disabled="!dirty || saving" @click="save">
				<Icon v-if="saving" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
				Save changes
			</ButtonsButton>
		</div>
	</section>
</template>

<script setup lang="ts">
import { COLLECTIONS, settingsService, type CollectionArea } from '~/services/settingsService'

const props = defineProps<{ periods: Record<CollectionArea, number> }>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const { perform } = useAction()

const draft = reactive<Record<CollectionArea, number>>({ ...props.periods })
const saving = ref(false)

watch(() => props.periods, (periods) => Object.assign(draft, periods))

const dirty = computed(() => COLLECTIONS.some(({ area }) => draft[area] !== props.periods[area]))

function step(area: CollectionArea, delta: number) {
	draft[area] = Math.min(60, Math.max(1, draft[area] + delta))
}

async function save() {
	saving.value = true
	const ok = await perform(() => settingsService.saveLoanPeriods({ ...draft }), 'Loan periods saved', 'Could not save loan periods')
	saving.value = false
	if (ok) emit('saved')
}
</script>
