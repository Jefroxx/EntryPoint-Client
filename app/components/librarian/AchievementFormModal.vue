<template>
	<LibrarianModalShell :open="open" :title="achievement ? 'Edit Achievement' : 'Add Achievement'"
		subtitle="Students unlock it automatically once they reach the goal." :busy="busy" @close="emit('close')">
		<div class="space-y-4">
			<LibrarianTextField id="ach-name" v-model="form.name" label="Name" placeholder="e.g. Regular"
				:error="errors.name" @update:model-value="errors.name = ''" />

			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="ach-metric" class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">Unlocks when</label>
					<select id="ach-metric" v-model="form.metric"
						class="h-10 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200">
						<option value="visitStreak">Visit streak reaches</option>
						<option value="knowledgeScore">Knowledge score reaches</option>
					</select>
				</div>
				<LibrarianTextField id="ach-threshold" v-model="form.threshold" type="number" :min="1"
					:label="form.metric === 'visitStreak' ? 'Days' : 'Points'" :error="errors.threshold"
					@update:model-value="errors.threshold = ''" />
			</div>

			<LibrarianTextField id="ach-points" v-model="form.pointsReward" type="number" :min="0" label="Reward points"
				hint="Granted when the student redeems it." :error="errors.pointsReward"
				@update:model-value="errors.pointsReward = ''" />
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ achievement ? 'Save changes' : 'Add Achievement' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { AchievementMetric, AchievementPayload, AchievementRecord } from '~/services/engagementService'

const props = defineProps<{
	open: boolean
	achievement: AchievementRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: AchievementPayload): void
}>()

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
