<template>
	<LibrarianModalShell :open="open" :title="item ? 'Edit Item' : 'Add Item'"
		subtitle="Students spend knowledge points on these rewards." :busy="busy" @close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="item-name" v-model="form.name" label="Name" placeholder="e.g. Free Print Voucher"
				:error="errors.name" @update:model-value="errors.name = ''" />

			<LibrarianTextField id="item-type" v-model="form.type" label="Type" optional placeholder="e.g. Merch, Voucher" />

			<div class="grid grid-cols-2 gap-3">
				<LibrarianTextField id="item-cost" v-model="form.pointCost" type="number" :min="0" label="Cost (points)"
					:error="errors.pointCost" @update:model-value="errors.pointCost = ''" />
				<LibrarianTextField id="item-stock" v-model="form.stock" type="number" :min="0" label="Stock"
					hint="Set to 0 to retire the item." :error="errors.stock" @update:model-value="errors.stock = ''" />
			</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ item ? 'Save changes' : 'Add Item' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { MarketItemPayload, MarketItemRecord } from '~/services/engagementService'

const props = defineProps<{
	open: boolean
	item: MarketItemRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: MarketItemPayload): void
}>()

const form = reactive({ name: '', type: '', pointCost: '', stock: '' })
const errors = reactive({ name: '', pointCost: '', stock: '' })

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	form.name = props.item?.name ?? ''
	form.type = props.item?.type ?? ''
	form.pointCost = String(props.item?.pointCost ?? '')
	form.stock = String(props.item?.stock ?? '')
	errors.name = errors.pointCost = errors.stock = ''
})

const isWhole = (value: string) => value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0

function submit() {
	errors.name = form.name.trim() ? '' : 'Name is required.'
	errors.pointCost = isWhole(form.pointCost) ? '' : 'Enter a whole number, 0 or more.'
	errors.stock = isWhole(form.stock) ? '' : 'Enter a whole number, 0 or more.'
	if (errors.name || errors.pointCost || errors.stock) return

	emit('submit', {
		name: form.name.trim(),
		type: form.type.trim() || null,
		pointCost: Number(form.pointCost),
		stock: Number(form.stock),
	})
}
</script>
