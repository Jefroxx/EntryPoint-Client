<template>
	<div class="space-y-3">
		<div v-if="!anyConfigured"
			class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-800">
			<strong>No fine rules are set up yet.</strong> Late returns are currently not being charged, because a fine
			only accrues when a collection has a rule.
		</div>

		<section class="rounded-2xl border border-stone-200 bg-white p-5">
			<h2 class="text-[15px] font-bold text-stone-900">Fine rules</h2>
			<p class="mb-3 text-[13.5px] text-stone-400">Charged per unit of lateness, after the grace period.</p>

			<div class="overflow-x-auto">
				<table class="w-full min-w-[560px] border-collapse text-left">
					<thead>
						<tr class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-400">
							<th class="pb-2 pr-3">Collection</th>
							<th class="pb-2 pr-3">Rate (₱)</th>
							<th class="pb-2 pr-3">Per</th>
							<th class="pb-2 pr-3">Grace (days)</th>
							<th class="pb-2"></th>
						</tr>
					</thead>
					<tbody>
						<tr v-for="collection in COLLECTIONS" :key="collection.area" class="border-t border-stone-100">
							<td class="py-3 pr-3 text-[15px] font-semibold text-stone-800">{{ collection.label }}</td>
							<td class="py-3 pr-3">
								<input v-model="drafts[collection.area].rate" type="number" min="0" step="0.5" placeholder="0.00"
									:aria-label="`${collection.label} rate`" class="rule-input w-24" />
							</td>
							<td class="py-3 pr-3">
								<select v-model="drafts[collection.area].rateUnit" :aria-label="`${collection.label} rate unit`"
									class="rule-input w-24">
									<option value="day">Day</option>
									<option value="hour">Hour</option>
								</select>
							</td>
							<td class="py-3 pr-3">
								<input v-model="drafts[collection.area].grace" type="number" min="0" max="60"
									:aria-label="`${collection.label} grace days`" class="rule-input w-20" />
							</td>
							<td class="py-3">
								<div class="flex items-center justify-end gap-1.5">
									<ButtonsButton variant="primary" size="sm" :disabled="!isDirty(collection.area) || busyArea === collection.area"
										@click="save(collection.area)">
										{{ ruleFor(collection.area)?.configured ? 'Save' : 'Add rule' }}
									</ButtonsButton>
									<ButtonsButton v-if="ruleFor(collection.area)?.configured" variant="danger" size="sm"
										:disabled="busyArea === collection.area" @click="askRemove(collection.area)">
										Remove
									</ButtonsButton>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<LibrarianConfirmModal :open="removeOpen" title="Remove fine rule?"
			:message="`Late returns in ${collectionLabel(removeArea)} will stop being charged. Fines already recorded stay as they are.`"
			confirm-label="Remove" :loading="busyArea === removeArea" @close="removeOpen = false" @confirm="remove" />
	</div>
</template>

<script setup lang="ts">
import { COLLECTIONS, settingsService, type CollectionArea, type FineRule } from '~/services/settingsService'
import { useAlert } from '~/api/alert/useAlert'

const props = defineProps<{ rules: FineRule[] }>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const { perform } = useAction()
const alert = useAlert()

const ruleFor = (area: CollectionArea) => props.rules.find((r) => r.area === area)
const anyConfigured = computed(() => props.rules.some((r) => r.configured))

interface Draft { rate: string; rateUnit: 'day' | 'hour'; grace: string }

function draftFrom(area: CollectionArea): Draft {
	const rule = ruleFor(area)
	return {
		rate: rule?.rate != null ? String(rule.rate) : '',
		rateUnit: rule?.rateUnit ?? 'day',
		grace: String(rule?.gracePeriodDays ?? 0),
	}
}

const drafts = reactive<Record<CollectionArea, Draft>>({
	circulation: draftFrom('circulation'),
	reserved: draftFrom('reserved'),
	filipiniana: draftFrom('filipiniana'),
})

watch(() => props.rules, () => {
	for (const { area } of COLLECTIONS) drafts[area] = draftFrom(area)
})

function isDirty(area: CollectionArea): boolean {
	const saved = draftFrom(area)
	const draft = drafts[area]
	// An unconfigured collection can only be saved once a rate is entered.
	if (!ruleFor(area)?.configured) return draft.rate !== ''
	return draft.rate !== saved.rate || draft.rateUnit !== saved.rateUnit || draft.grace !== saved.grace
}

const busyArea = ref<CollectionArea | null>(null)

async function save(area: CollectionArea) {
	const draft = drafts[area]
	const rate = Number(draft.rate)
	const grace = Number(draft.grace)

	if (draft.rate === '' || Number.isNaN(rate) || rate < 0) {
		alert.error('Check the rate', 'Enter a rate of 0 or more.')
		return
	}
	if (!Number.isInteger(grace) || grace < 0) {
		alert.error('Check the grace period', 'Enter a whole number of days, 0 or more.')
		return
	}

	busyArea.value = area
	const ok = await perform(
		() => settingsService.saveFineRule(area, { rate, rateUnit: draft.rateUnit, gracePeriodDays: grace }),
		'Fine rule saved',
		'Could not save fine rule',
	)
	busyArea.value = null
	if (ok) emit('saved')
}

const removeOpen = ref(false)
const removeArea = ref<CollectionArea>('circulation')
const collectionLabel = (area: CollectionArea) => COLLECTIONS.find((c) => c.area === area)?.label ?? area

function askRemove(area: CollectionArea) {
	removeArea.value = area
	removeOpen.value = true
}

async function remove() {
	const area = removeArea.value
	busyArea.value = area
	const ok = await perform(() => settingsService.deleteFineRule(area), 'Fine rule removed', 'Could not remove fine rule')
	busyArea.value = null
	if (ok) {
		removeOpen.value = false
		emit('saved')
	}
}
</script>

<style scoped>
.rule-input {
	height: 36px;
	border-radius: 10px;
	border: 1px solid #e7e5e4;
	background: #fff;
	padding: 0 0.625rem;
	font-size: 13px;
	color: #1c1917;
	outline: none;
	transition: border-color 150ms, box-shadow 150ms;
}

.rule-input:focus {
	border-color: #9a5323;
	box-shadow: 0 0 0 3px #f3e2cd;
}
</style>
