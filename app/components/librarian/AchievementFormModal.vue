<template>
	<LibrarianModalShell :open="open" size="xl" :title="confirming ? 'Confirm Changes' : achievement ? 'Edit Achievement' : 'Add Achievement'"
		:subtitle="confirming ? 'Check the changes before they are saved.' : 'Students unlock it automatically once they reach the goal.'" :busy="busy" :dirty="dirty" ref="shell" @close="emit('close')">
		<!-- Step 2 (editing only): what will change. It replaces the form in this same window (no second pop-up). -->
		<div v-if="confirming" class="space-y-4">
			<div class="rounded-xl bg-stone-50 px-4 py-3">
				<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Achievement</p>
				<p class="text-[15px] font-semibold text-stone-900">{{ achievement?.name }}</p>
			</div>
			<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
				<div v-for="change in changes" :key="change.label" class="px-4 py-2.5">
					<dt class="text-[12.5px] text-stone-500">{{ change.label }}</dt>
					<dd class="mt-0.5 flex flex-wrap items-center gap-x-2 text-stone-900">
						<span class="text-stone-500 line-through decoration-stone-300">{{ change.from }}</span>
						<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5 shrink-0 text-stone-400" />
						<span class="font-semibold">{{ change.to }}</span>
					</dd>
				</div>
			</dl>
			<p class="flex items-start gap-2 rounded-xl bg-stone-100 px-3.5 py-2.5 text-[13.5px] text-stone-700">
				<Icon name="i-tabler-target-arrow" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
				<span>Students will see: <b class="text-stone-900">{{ preview }}</b></span>
			</p>
		</div>

		<div v-else class="space-y-4">
			<LibrarianTextField id="ach-name" v-model="form.name" label="Name" placeholder="e.g. Regular"
				:error="errors.name" @update:model-value="errors.name = ''" />

			<div class="grid grid-cols-2 gap-3">
				<fieldset class="col-span-2">
					<legend class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Unlocks when<FieldRequired /></legend>
					<div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup">
						<label v-for="m in choices" :key="m.key"
							class="flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-colors"
							:class="form.metric === m.key ? 'border-accent-500 bg-accent-50 ring-1 ring-accent-300' : 'border-stone-200 bg-white hover:bg-stone-50'">
							<input v-model="form.metric" type="radio" name="ach-metric" :value="m.key" class="accent-accent-500" />
							<span class="min-w-0">
								<span class="block text-[14px] font-semibold leading-snug text-stone-900">{{ shortLabel(m.label) }}</span>
								<span class="block text-[12px] text-stone-500">counted in {{ m.unit.toLowerCase() }}</span>
							</span>
						</label>
					</div>
				</fieldset>
				<LibrarianTextField id="ach-threshold" v-model="form.threshold" type="number" :min="1"
					:label="unit" :error="errors.threshold"
					@update:model-value="errors.threshold = ''" />
				<LibrarianTextField id="ach-points" v-model="form.pointsReward" type="number" :min="0" label="Reward points"
					hint="Granted when the student redeems it." :error="errors.pointsReward"
					@update:model-value="errors.pointsReward = ''" />
			</div>

			<!-- How students will read the goal -->
			<p class="flex items-start gap-2 rounded-xl bg-stone-100 px-3.5 py-2.5 text-[13.5px] text-stone-700">
				<Icon name="i-tabler-target-arrow" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
				<span>Students will see: <b class="text-stone-900">{{ preview }}</b></span>
			</p>
		</div>

		<template #footer>
			<template v-if="confirming">
				<ButtonsButton variant="ghost" :disabled="busy" @click="confirming = false">Back</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="emit('submit', buildPayload())">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
					Yes, save changes
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy || (!!achievement && !hasChanges)" @click="submit">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else-if="achievement" name="i-tabler-arrow-right" class="h-3.5 w-3.5" />
					{{ achievement ? 'Review' : 'Add Achievement' }}
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { AchievementMetric, AchievementMetricInfo, AchievementPayload, AchievementRecord } from '~/services/engagementService'

const props = defineProps<{
	open: boolean
	achievement: AchievementRecord | null
	/** What an achievement can be about, from the server. */
	metrics?: AchievementMetricInfo[]
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: AchievementPayload): void
}>()

// Until the list arrives (or if it can't), the two original goals are always there.
const FALLBACK: AchievementMetricInfo[] = [
	{ key: 'visitStreak', label: 'Visit streak reaches', unit: 'Days' },
	{ key: 'knowledgeScore', label: 'Knowledge score reaches', unit: 'Points' },
]
const choices = computed(() => (props.metrics?.length ? props.metrics : FALLBACK))
// "Books borrowed reaches" reads as "Books borrowed" on a card.
const shortLabel = (label: string) => label.replace(/ reaches$/, '')

const unit = computed(() => choices.value.find((m) => m.key === form.metric)?.unit ?? 'Amount')

// The goal as a student reads it ("Borrow books from 4 different genres"), from the chosen goal and number.
const preview = computed(() => {
	const n = Number(form.threshold)
	const choice = choices.value.find((m) => m.key === form.metric)
	if (!Number.isInteger(n) || n < 1) return 'enter a number to see the goal'
	if (n === 1 && choice?.one) return choice.one
	return choice?.goal ? choice.goal.replace('{n}', String(n)) : `${choice?.label ?? ''} ${n}`
})

const form = reactive({ name: '', metric: 'visitStreak' as AchievementMetric, threshold: '', pointsReward: '' })
const errors = reactive({ name: '', threshold: '', pointsReward: '' })
// Editing asks once more before saving: this is the summary of what is about to change.
const confirming = ref(false)

// What differs from the saved achievement, as "from → to" rows.
const changes = computed(() => {
	const a = props.achievement
	if (!a) return []
	const label = (key: AchievementMetric) => shortLabel(choices.value.find((m) => m.key === key)?.label ?? key)
	const unitOf = (key: AchievementMetric) => choices.value.find((m) => m.key === key)?.unit ?? 'Amount'
	const rows: { label: string; from: string; to: string }[] = []

	if (form.name.trim() !== a.name) rows.push({ label: 'Name', from: a.name, to: form.name.trim() })
	if (form.metric !== a.criteriaJSON.metric) rows.push({ label: 'Unlocks when', from: label(a.criteriaJSON.metric), to: label(form.metric) })
	if (Number(form.threshold) !== Number(a.criteriaJSON.threshold)) {
		rows.push({ label: unitOf(form.metric), from: String(a.criteriaJSON.threshold), to: String(Number(form.threshold)) })
	}
	if (Number(form.pointsReward) !== Number(a.pointsReward)) rows.push({ label: 'Reward points', from: String(a.pointsReward), to: String(Number(form.pointsReward)) })
	return rows
})
const hasChanges = computed(() => changes.value.length > 0)

// What is typed in this window: closing it with changes asks "Discard Changes?" first (see ModalShell, useUnsavedChanges).
const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => form, () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	confirming.value = false
	form.name = props.achievement?.name ?? ''
	form.metric = props.achievement?.criteriaJSON.metric ?? 'visitStreak'
	form.threshold = String(props.achievement?.criteriaJSON.threshold ?? '')
	form.pointsReward = String(props.achievement?.pointsReward ?? '')
	errors.name = errors.threshold = errors.pointsReward = ''
})

function submit() {
	const threshold = Number(form.threshold)
	const points = Number(form.pointsReward)

	errors.name = form.name.trim() ? '' : 'Name is required.'
	errors.threshold = Number.isInteger(threshold) && threshold >= 1 ? '' : 'Enter a whole number of at least 1.'
	errors.pointsReward = form.pointsReward !== '' && Number.isInteger(points) && points >= 0 ? '' : 'Enter a whole number, 0 or more.'
	if (errors.name || errors.threshold || errors.pointsReward) return

	// Adding saves straight away; editing shows what will change and asks first.
	if (props.achievement) confirming.value = true
	else emit('submit', buildPayload())
}

function buildPayload(): AchievementPayload {
	return {
		name: form.name.trim(),
		criteriaJSON: { metric: form.metric, threshold: Number(form.threshold) },
		pointsReward: Number(form.pointsReward),
	}
}
</script>
