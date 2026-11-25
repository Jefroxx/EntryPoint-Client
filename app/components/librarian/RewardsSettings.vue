<template>
	<div class="space-y-3">
		<section class="rounded-2xl border border-stone-200 bg-white p-5 md:p-6">
			<h2 class="text-[16px] font-bold text-stone-900">Low stock</h2>
			<p class="mt-0.5 text-[14px] text-stone-500">When a reward in the Rewards Market is running low, so it can be topped up before it runs out.</p>

			<div class="mt-5 max-w-[240px]">
				<LibrarianTextField id="low-stock-at" v-model="lowStockAt" type="number" label="Low when this many are left" :min="0" :max="100"
					:error="error" @update:model-value="error = ''" @keydown.enter.prevent="save" />
			</div>
			<p class="mt-1.5 max-w-[420px] text-[12.5px] text-stone-500">A reward with this many left, or fewer, is counted as low and marked in the Rewards Market. Use 0 to be warned only when one is out of stock.</p>
		</section>

		<div class="flex items-center gap-2">
			<ButtonsButton variant="primary" :disabled="busy || !dirty" @click="save">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />Save
			</ButtonsButton>
			<ButtonsButton v-if="dirty" variant="ghost" :disabled="busy" @click="reset">Undo</ButtonsButton>
		</div>
	</div>
</template>

<script setup lang="ts">
import { settingsService } from '~/services/settingsService'

const props = defineProps<{ lowStockAtSaved: number }>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const { perform } = useAction()

const lowStockAt = ref<string | number>(props.lowStockAtSaved)
const error = ref('')
const busy = ref(false)

function reset() {
	lowStockAt.value = props.lowStockAtSaved
}
watch(() => props.lowStockAtSaved, reset)

const dirty = computed(() => Number(lowStockAt.value) !== props.lowStockAtSaved)

async function save() {
	const value = Number(lowStockAt.value)
	error.value = Number.isInteger(value) && value >= 0 && value <= 100 ? '' : 'Enter a whole number from 0 to 100.'
	if (error.value) return

	busy.value = true
	const ok = await perform(() => settingsService.saveRewards(value), 'Rewards settings saved', 'Could not save the rewards settings')
	busy.value = false
	if (ok) emit('saved')
}
</script>
