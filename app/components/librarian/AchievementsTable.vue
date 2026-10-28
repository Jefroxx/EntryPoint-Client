<template>
	<LibrarianTableShell :columns="['Achievement', 'Unlocks when', 'Reward', 'Unlocked', 'Redeemed', '']" :loading="loading"
		:empty="achievements.length === 0" empty-text="No achievements yet. Add one to start rewarding students.">
		<!-- Phones: one card per row, with the row's buttons on it. -->
		<template #cards>
			<li v-for="achievement in achievements" :key="`card-${achievement.achievementID}`">
				<div role="button" tabindex="0" class="px-4 py-3.5 transition-colors active:bg-accent-50" @click="selected = achievement" @keydown.enter.self="selected = achievement">
					<div class="flex items-start justify-between gap-3">
						<div class="min-w-0">
							<p class="text-[15px] font-semibold text-stone-900">{{ achievement.name }}</p>
							<p class="mt-0.5 text-[13px] text-stone-500">{{ criteria(achievement) }}</p>
						</div>
						<span class="shrink-0 rounded-full bg-accent-100 px-2.5 py-1 text-[12px] font-bold text-accent-700">+{{ achievement.pointsReward }} pts</span>
					</div>
					<div class="mt-2.5 flex items-center justify-between gap-2" @click.stop>
						<p class="text-[12.5px] text-stone-500"><b class="tabular-nums text-stone-900">{{ achievement.unlockedCount }}</b> unlocked · <b class="tabular-nums text-stone-900">{{ achievement.redeemedCount }}</b> redeemed</p>
						<div class="flex items-center gap-1.5">
							<ButtonsButton variant="ghost" size="sm" @click="emit('edit', achievement)">Edit</ButtonsButton>
							<ButtonsButton variant="danger" size="sm" @click="emit('delete', achievement)">Delete</ButtonsButton>
						</div>
					</div>
				</div>
			</li>
		</template>
		<tr v-for="(achievement, index) in achievements" :key="achievement.achievementID" tabindex="0" @click="selected = achievement" @keydown.enter.self="selected = achievement"
			class="row-fade-in cursor-pointer border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3 text-[15px] font-semibold text-stone-900">{{ achievement.name }}</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ criteria(achievement) }}</td>
			<td class="px-4 py-3">
				<span class="rounded-full bg-accent-100 px-2.5 py-1 text-[12px] font-bold text-accent-700">+{{ achievement.pointsReward }} pts</span>
			</td>
			<td class="px-4 py-3 font-bold tabular-nums text-stone-900">{{ achievement.unlockedCount }}</td>
			<td class="px-4 py-3 font-bold tabular-nums text-stone-900">{{ achievement.redeemedCount }}</td>
			<td class="px-4 py-3" @click.stop>
				<div class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="ghost" size="sm" @click="emit('edit', achievement)">Edit</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" @click="emit('delete', achievement)">Delete</ButtonsButton>
				</div>
			</td>
		</tr>
	<!-- Teleports to <body>; it lives in the slot only so the table keeps a single root element. -->
		<LibrarianRecordDrawer :open="!!selected" heading="Achievement details" :title="selected?.name ?? ''"
			:subtitle="selected ? criteria(selected) : ''" :fields="fields" @close="selected = null">
			<section class="mt-6 border-t border-stone-100 pt-5">
				<h4 class="text-[12px] font-bold uppercase tracking-wide text-stone-500">Students</h4>

				<div class="mt-2.5 flex flex-wrap gap-1.5">
					<button v-for="chip in chips" :key="chip.value" type="button"
						class="rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
						:class="studentFilter === chip.value ? 'bg-accent-500 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'"
						@click="studentFilter = chip.value">
						{{ chip.label }} <span class="tabular-nums">{{ chip.count }}</span>
					</button>
				</div>

				<input v-model="studentSearch" type="search" placeholder="Search name or student ID" aria-label="Search students"
					class="mt-3 h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-[14px] text-stone-700 placeholder:text-stone-400 focus:border-accent-300 focus:outline-none" />

				<p v-if="studentsLoading" class="py-6 text-center text-[13.5px] text-stone-500">Loading students…</p>
				<p v-else-if="studentsError" class="py-6 text-center text-[13.5px] text-red-600">{{ studentsError }}</p>
				<p v-else-if="visibleStudents.length === 0" class="py-6 text-center text-[13.5px] text-stone-500">
					{{ students.length === 0 ? 'No student has unlocked this yet.' : 'No students match.' }}
				</p>
				<ul v-else class="mt-2 divide-y divide-stone-100">
					<li v-for="s in pagedStudents" :key="s.studentID" class="flex items-start justify-between gap-3 py-2.5">
						<div class="min-w-0">
							<p class="truncate text-[14px] font-semibold text-stone-900">{{ s.name }}</p>
							<p class="text-[12px] text-stone-500"><span class="font-data">{{ s.studentIDNumber ?? '—' }}</span><template v-if="s.earnedAt"> · Unlocked {{ formatDate(s.earnedAt) }}</template></p>
						</div>
						<div class="shrink-0 text-right">
							<LibrarianStatusPill :label="s.redeemedAt ? 'Redeemed' : 'Not redeemed'" :tone="s.redeemedAt ? 'success' : 'neutral'" />
							<p v-if="s.redeemedAt" class="mt-0.5 text-[11.5px] text-stone-500">{{ formatDate(s.redeemedAt) }}</p>
						</div>
					</li>
				</ul>
					<LibrarianPagination v-if="visibleStudents.length > STUDENTS_PER_PAGE" :shown="pagedStudents.length" :total="visibleStudents.length"
						noun="students" :page="studentPage" :last-page="studentPages" @change="studentPage = $event" />
			</section>
		</LibrarianRecordDrawer>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import { engagementService, type AchievementRecord, type AchievementStudent } from '~/services/engagementService'

defineProps<{
	achievements: AchievementRecord[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'edit', achievement: AchievementRecord): void
	(e: 'delete', achievement: AchievementRecord): void
}>()

// The goal in plain words, as the server words it for students.
function criteria(achievement: AchievementRecord): string {
	if (achievement.description) return achievement.description
	const { metric, threshold } = achievement.criteriaJSON
	return `${metric} ≥ ${threshold}`
}
const selected = ref<AchievementRecord | null>(null)

// The drawer's student list: loaded each time an achievement is opened.
const students = ref<AchievementStudent[]>([])
const studentsLoading = ref(false)
const studentsError = ref('')
const studentFilter = ref<'all' | 'redeemed' | 'not'>('all')
const studentSearch = ref('')

watch(selected, async (achievement) => {
	students.value = []
	studentsError.value = ''
	studentFilter.value = 'all'
	studentSearch.value = ''
	if (!achievement) return

	studentsLoading.value = true
	try {
		const { students: list } = await engagementService.fetchAchievementStudents(achievement.uuid)
		// Another achievement may have been opened while this one was loading.
		if (selected.value?.uuid === achievement.uuid) students.value = list
	} catch {
		if (selected.value?.uuid === achievement.uuid) studentsError.value = 'Could not load the students.'
	} finally {
		if (selected.value?.uuid === achievement.uuid) studentsLoading.value = false
	}
})

const chips = computed(() => {
	const redeemed = students.value.filter((s) => s.redeemedAt).length
	return [
		{ value: 'all' as const, label: 'All', count: students.value.length },
		{ value: 'redeemed' as const, label: 'Redeemed', count: redeemed },
		{ value: 'not' as const, label: 'Not redeemed', count: students.value.length - redeemed },
	]
})

const visibleStudents = computed(() => {
	const term = studentSearch.value.trim().toLowerCase()
	return students.value.filter((s) => {
		if (studentFilter.value === 'redeemed' && !s.redeemedAt) return false
		if (studentFilter.value === 'not' && s.redeemedAt) return false
		return !term || s.name.toLowerCase().includes(term) || (s.studentIDNumber ?? '').toLowerCase().includes(term)
	})
})

// Five students at a time, so a long list never turns into a long scroll. Any change to the list starts again at page 1.
const STUDENTS_PER_PAGE = 5
const studentPage = ref(1)
const studentPages = computed(() => Math.max(1, Math.ceil(visibleStudents.value.length / STUDENTS_PER_PAGE)))
const pagedStudents = computed(() => visibleStudents.value.slice((studentPage.value - 1) * STUDENTS_PER_PAGE, studentPage.value * STUDENTS_PER_PAGE))
watch([studentFilter, studentSearch, selected], () => { studentPage.value = 1 })

const fields = computed(() => {
	const a = selected.value
	if (!a) return []
	return [
		{ label: 'Unlocks when', value: criteria(a), wide: true },
		{ label: 'Reward', value: `+${a.pointsReward} pts` },
		{ label: 'Achievement ID', value: a.achievementID, mono: true },
		{ label: 'Students unlocked', value: a.unlockedCount },
		{ label: 'Rewards redeemed', value: a.redeemedCount },
	]
})
</script>
