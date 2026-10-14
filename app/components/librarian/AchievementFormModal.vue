<template>
	<LibrarianModalShell :open="open" size="xl" :title="achievement ? 'Edit Achievement' : 'Add Achievement'"
		subtitle="Students unlock it automatically once they reach the goal." :busy="busy" @close="emit('close')">
		<div class="space-y-4">
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
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ achievement ? 'Save changes' : 'Add Achievement' }}
			</ButtonsButton>
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

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
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

	emit('submit', {
		name: form.name.trim(),
		criteriaJSON: { metric: form.metric, threshold },
		pointsReward: points,
	})
}
</script>
