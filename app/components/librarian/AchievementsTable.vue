<template>
	<LibrarianTableShell :columns="['Achievement', 'Unlocks when', 'Reward', 'Unlocked', 'Redeemed', '']" :loading="loading"
		:empty="achievements.length === 0" empty-text="No achievements yet. Add one to start rewarding students.">
		<tr v-for="(achievement, index) in achievements" :key="achievement.achievementID"
			class="row-fade-in border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-stone-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3 text-[13.5px] font-semibold text-stone-900">{{ achievement.name }}</td>
			<td class="font-data px-4 py-3 text-[12.5px] text-stone-500">{{ criteria(achievement) }}</td>
			<td class="px-4 py-3">
				<span class="rounded-full bg-accent-100 px-2.5 py-1 text-[11px] font-bold text-accent-700">+{{ achievement.pointsReward }} pts</span>
			</td>
			<td class="px-4 py-3 font-bold tabular-nums text-stone-900">{{ achievement.unlockedCount }}</td>
			<td class="px-4 py-3 font-bold tabular-nums text-stone-900">{{ achievement.redeemedCount }}</td>
			<td class="px-4 py-3">
				<div class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="ghost" size="sm" @click="emit('edit', achievement)">Edit</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" @click="emit('delete', achievement)">Delete</ButtonsButton>
				</div>
			</td>
		</tr>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { AchievementRecord } from '~/services/engagementService'

defineProps<{
	achievements: AchievementRecord[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'edit', achievement: AchievementRecord): void
	(e: 'delete', achievement: AchievementRecord): void
}>()

function criteria(achievement: AchievementRecord): string {
	const { metric, threshold } = achievement.criteriaJSON
	return metric === 'visitStreak' ? `Visit streak ≥ ${threshold} days` : `Knowledge score ≥ ${threshold}`
}
</script>
