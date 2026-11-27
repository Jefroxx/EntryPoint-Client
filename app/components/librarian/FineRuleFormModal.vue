<template>
	<LibrarianModalShell :open="open" size="md" :title="rule ? 'Edit Fine Rule' : 'Add Fine Rule'"
		:subtitle="rule ? `Late returns in ${rule.areaName}.` : 'Pick an area of the library and what a late return costs there.'"
		:busy="busy" :dirty="dirty" ref="shell" @close="emit('close')">
		<div class="space-y-4" @keydown.enter.prevent="submit">
			<!-- The area is chosen once; to move a rule to another area, remove it and add a new one. -->
			<div v-if="rule">
				<p class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Area of the library</p>
				<p class="flex h-11 items-center rounded-[10px] border border-stone-200 bg-stone-100 px-3 text-[15px] text-stone-600">{{ rule.areaName }}</p>
			</div>
			<div v-else>
				<label for="fine-area" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Area of the library<FieldRequired /></label>
				<select id="fine-area" v-model="form.area" :class="[inputClass, errors.area ? 'border-red-400 bg-red-50' : 'border-stone-200']"
					@change="errors.area = ''">
					<option value="" disabled>Choose an area</option>
					<option v-for="a in areas" :key="a.area" :value="a.area">{{ a.areaName }}</option>
				</select>
				<p v-if="errors.area" class="mt-1 text-[12.5px] text-red-500">{{ errors.area }}</p>
				<p v-else class="mt-1 text-[12.5px] text-stone-500">Only areas that can be borrowed and have no rule yet are listed. Add or change areas in Library.</p>
			</div>

			<div class="grid grid-cols-2 gap-3">
				<LibrarianTextField id="fine-rate" v-model="form.rate" type="number" step="0.01" :min="0" :max="10000" label="Rate (₱)"
					placeholder="e.g. 5.00" :error="errors.rate" @update:model-value="errors.rate = ''" />
				<div>
					<label for="fine-unit" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Charged per<FieldRequired /></label>
					<select id="fine-unit" v-model="form.rateUnit" :class="[inputClass, 'border-stone-200']">
						<option value="day">Day late</option>
						<option value="hour">Hour late</option>
					</select>
				</div>
			</div>

			<LibrarianTextField id="fine-grace" v-model="form.grace" type="number" :min="0" :max="30" label="Grace period (days)"
				hint="Days after the due date before the fine starts. Use 0 to charge from the first day." :error="errors.grace"
				@update:model-value="errors.grace = ''" />
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ rule ? 'Save Changes' : 'Add Rule' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { FineRule } from '~/services/settingsService'

const props = defineProps<{
	open: boolean
	/** The rule being edited, or null to add one. */
	rule: FineRule | null
	/** The areas a rule can still be added for. */
	areas: FineRule[]
	busy?: boolean
	/** Messages from the server, by field (a refused area, say), to show under the box. */
	serverErrors?: Record<string, string> | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { area: string; rate: number; rateUnit: 'day' | 'hour'; gracePeriodDays: number }): void
}>()

const inputClass =
	'h-11 w-full rounded-[10px] border bg-white px-3 text-[15px] text-stone-900 outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-200'

const form = reactive({ area: '', rate: '' as string | number, rateUnit: 'day' as 'day' | 'hour', grace: '0' as string | number })
const errors = reactive({ area: '', rate: '', grace: '' })

const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => form, () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.area = props.rule?.area ?? ''
	form.rate = props.rule?.rate != null ? String(props.rule.rate) : ''
	form.rateUnit = props.rule?.rateUnit ?? 'day'
	form.grace = String(props.rule?.gracePeriodDays ?? 0)
	errors.area = errors.rate = errors.grace = ''
})

// A refusal from the server lands under the box it is about.
watch(() => props.serverErrors, (incoming) => {
	if (!incoming) return
	errors.area = incoming.area ?? ''
	errors.rate = incoming.rate ?? ''
	errors.grace = incoming.gracePeriodDays ?? ''
})

function submit() {
	if (props.busy) return
	const rate = Number(form.rate)
	const grace = Number(form.grace)

	errors.area = form.area ? '' : 'Choose an area of the library.'
	errors.rate = String(form.rate).trim() !== '' && Number.isFinite(rate) && rate >= 0 && rate <= 10000 ? '' : 'Enter a rate from 0 to 10,000.'
	errors.grace = String(form.grace).trim() !== '' && Number.isInteger(grace) && grace >= 0 && grace <= 30 ? '' : 'Enter a whole number of days from 0 to 30.'
	if (errors.area || errors.rate || errors.grace) return

	emit('submit', { area: form.area, rate, rateUnit: form.rateUnit, gracePeriodDays: grace })
}
</script>
