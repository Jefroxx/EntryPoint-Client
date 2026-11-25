<template>
	<LibrarianModalShell :open="open" size="md" :title="area ? 'Edit Area' : 'Add Area'"
		:subtitle="area ? 'Rename it, change its acronym or how it is lent out.' : 'A part of the library with its own shelf label and lending rule.'"
		:busy="busy" :dirty="dirty" ref="shell" @close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="area-name" v-model="form.name" label="Name of the area" placeholder="e.g. Fiction" :maxlength="80"
				:error="errors.name" @update:model-value="errors.name = ''" />

			<LibrarianTextField id="area-acronym" v-model="form.acronym" label="Acronym" mono placeholder="e.g. FIC" :maxlength="12"
				hint="Printed at the top of the spine label." :error="errors.acronym" @update:model-value="errors.acronym = ''" />

			<div>
				<label for="area-lending" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Lending<FieldRequired /></label>
				<select id="area-lending" v-model="form.loanable" :class="inputClass">
					<option :value="true">Can be borrowed</option>
					<option :value="false">Library use only</option>
				</select>
			</div>

			<!-- The lending period only applies to areas that can be borrowed. -->
			<div v-if="form.loanable" class="grid grid-cols-2 gap-3">
				<LibrarianTextField v-if="form.periodUnit !== 'overnight'" id="area-period" v-model="form.periodValue" type="number" label="Lending period"
					:min="1" :max="365" :error="errors.periodValue" @update:model-value="errors.periodValue = ''" />
				<div :class="form.periodUnit === 'overnight' ? 'col-span-2' : ''">
					<label for="area-unit" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">{{ form.periodUnit === 'overnight' ? 'Lending period' : 'Unit' }}<FieldRequired /></label>
					<select id="area-unit" v-model="form.periodUnit" :class="inputClass">
						<option value="days">Days</option>
						<option value="hours">Hours</option>
						<option value="overnight">Overnight (back at the next opening)</option>
					</select>
				</div>
			</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ area ? 'Save Changes' : 'Add Area' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { AreaPayload, AreaRecord, LendingUnit } from '~/services/areaService'

const props = defineProps<{ open: boolean; area: AreaRecord | null; busy?: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'submit', payload: AreaPayload): void }>()

const inputClass =
	'h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[15px] text-stone-900 outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-200'

const form = reactive({ name: '', acronym: '', loanable: true, periodValue: 3 as string | number, periodUnit: 'days' as LendingUnit })
const errors = reactive({ name: '', acronym: '', periodValue: '' })

const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => form, () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	const a = props.area
	form.name = a?.name ?? ''
	form.acronym = a?.acronym ?? ''
	form.loanable = a?.loanable ?? true
	form.periodValue = a?.periodValue ?? 3
	form.periodUnit = a?.periodUnit ?? 'days'
	errors.name = errors.acronym = errors.periodValue = ''
})

function submit() {
	errors.name = form.name.trim() ? '' : 'Name is required.'
	errors.acronym = form.acronym.trim() ? '' : 'Acronym is required.'
	const days = Number(form.periodValue)
	errors.periodValue = !form.loanable || form.periodUnit === 'overnight' || (Number.isInteger(days) && days >= 1 && days <= 365) ? '' : 'Enter a whole number from 1 to 365.'
	if (errors.name || errors.acronym || errors.periodValue) return

	emit('submit', {
		name: form.name.trim(),
		acronym: form.acronym.trim().toUpperCase(),
		loanable: form.loanable,
		...(form.loanable ? { periodValue: form.periodUnit === 'overnight' ? 1 : days, periodUnit: form.periodUnit } : {}),
	})
}
</script>
