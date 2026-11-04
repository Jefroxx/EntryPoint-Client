<template>
	<LibrarianModalShell :open="open" size="xl" :title="step === PAGES.length ? 'Confirm Deletion' : 'Delete This Achievement?'"
		:subtitle="achievement?.name" :busy="busy" @close="emit('close')">
		<div v-if="loading" class="grid min-h-[260px] place-items-center text-[14px] text-stone-500">
			<span class="flex items-center gap-2"><Icon name="i-tabler-loader-2" class="h-4 w-4 animate-spin" />Gathering everything tied to this achievement…</span>
		</div>
		<div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">{{ loadError }}</div>

		<!-- A fixed minimum height, so the window does not jump in size from page to page. -->
		<div v-else-if="achievement" class="min-h-[400px] space-y-5">
			<ol class="grid grid-cols-3 gap-2.5" aria-label="Pages">
				<li v-for="(page, i) in PAGES" :key="page" :aria-current="step === i + 1 ? 'step' : undefined">
					<button type="button" class="group w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200" @click="step = i + 1">
						<span class="block h-1 rounded-full transition-colors duration-300" :class="i + 1 <= step ? 'bg-accent-500' : 'bg-stone-200'" />
						<span class="mt-2 block text-[12.5px] font-semibold transition-colors duration-300" :class="step === i + 1 ? 'text-accent-600' : 'text-stone-700 group-hover:text-accent-600'">
							<span class="tabular-nums">{{ i + 1 }}.</span> {{ page }}<span v-if="i === 1" class="font-normal text-stone-500"> ({{ students.length }})</span>
						</span>
					</button>
				</li>
			</ol>

			<!-- ===== 1. The achievement ===== -->
			<div v-if="step === 1" class="space-y-4">
				<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Name</dt><dd class="text-right font-semibold text-stone-900">{{ achievement.name }}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Unlocks when</dt><dd class="text-right font-semibold text-stone-900">{{ achievement.description ?? `${achievement.criteriaJSON.metric} ${achievement.criteriaJSON.threshold}` }}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Reward</dt><dd class="font-semibold text-stone-900">+{{ achievement.pointsReward }} points</dd></div>
				</dl>
				<div class="grid gap-3 sm:grid-cols-3">
					<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Unlocked</p><p class="text-[24px] font-bold text-stone-900">{{ students.length }}</p></div>
					<div class="rounded-xl bg-stone-50 px-4 py-3"><p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Reward claimed</p><p class="text-[24px] font-bold text-stone-900">{{ claimed.length }}</p></div>
					<div class="rounded-xl px-4 py-3" :class="unclaimed.length ? 'bg-amber-50' : 'bg-stone-50'"><p class="text-[12px] font-semibold uppercase tracking-wide" :class="unclaimed.length ? 'text-amber-800' : 'text-stone-500'">Not claimed yet</p><p class="text-[24px] font-bold" :class="unclaimed.length ? 'text-amber-800' : 'text-stone-900'">{{ unclaimed.length }}</p></div>
				</div>
			</div>

			<!-- ===== 2. Students ===== -->
			<div v-else-if="step === 2" class="space-y-3">
				<p class="text-[14px] text-stone-600">Every student who unlocked it, and whether they have claimed the reward.</p>
				<div v-if="students.length" class="overflow-hidden rounded-xl border border-stone-200">
					<div v-for="s in pageOfStudents" :key="s.studentID" class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-stone-100 px-4 py-2.5 text-[14px] last:border-0">
						<span class="min-w-0 flex-1">
							<span class="block truncate font-semibold text-stone-900">{{ s.name }}</span>
							<span class="block text-[12.5px] text-stone-500"><span class="font-data">{{ s.memberIDNumber ?? '—' }}</span> · {{ s.academicProgram ?? '—' }}<span v-if="s.earnedAt"> · unlocked {{ formatDate(s.earnedAt) }}</span></span>
						</span>
						<LibrarianStatusPill :label="s.redeemedAt ? 'Claimed' : 'Not claimed'" :tone="s.redeemedAt ? 'success' : 'warning'" />
					</div>
				</div>
				<p v-else class="rounded-xl border border-stone-200 px-4 py-6 text-center text-[14px] text-stone-500">Nobody has unlocked this achievement yet.</p>
				<LibrarianListPager v-model:page="studentPage" :total="students.length" :page-size="STUDENTS_PER_PAGE" />
			</div>

			<!-- ===== 3. Confirm ===== -->
			<div v-else class="space-y-4">
				<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Students' progress removed</dt><dd class="font-semibold text-stone-900">{{ students.length }}</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Points already claimed</dt><dd class="text-right font-semibold text-stone-900">{{ claimed.length * achievement.pointsReward }} pts stay with the students</dd></div>
					<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Rewards not claimed yet</dt><dd class="text-right font-semibold" :class="unclaimed.length ? 'text-amber-700' : 'text-stone-900'">{{ unclaimed.length }}<span v-if="unclaimed.length"> ({{ unclaimed.length * achievement.pointsReward }} pts lost)</span></dd></div>
				</dl>
				<div class="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-800">
					<Icon name="i-tabler-alert-triangle" class="mt-0.5 h-4 w-4 shrink-0" />
					<p>"{{ achievement.name }}" is deleted, along with every student's progress toward it. This can't be undone.</p>
				</div>
			</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="step > 1 && achievement ? step-- : emit('close')">{{ step > 1 && achievement ? 'Back' : 'Cancel' }}</ButtonsButton>
			<ButtonsButton v-if="achievement && !loading && !loadError && step < PAGES.length" variant="primary" @click="step++">
				Next<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
			</ButtonsButton>
			<ButtonsButton v-else-if="achievement && !loading && !loadError" variant="primary" class="!border-red-500 !bg-red-500 hover:!bg-red-600" :disabled="busy" @click="emit('confirm')">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
				Yes, delete achievement
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { engagementService, type AchievementRecord, type AchievementStudent } from '~/services/engagementService'

const props = defineProps<{
	open: boolean
	achievement: AchievementRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'confirm'): void
}>()

const PAGES = ['Achievement', 'Students', 'Confirm']

const step = ref(1)
const students = ref<AchievementStudent[]>([])
const loading = ref(false)
const loadError = ref('')

// A long list is shown a few at a time, so the window never has to scroll.
const STUDENTS_PER_PAGE = 6
const studentPage = ref(1)
const pageOfStudents = computed(() => students.value.slice((studentPage.value - 1) * STUDENTS_PER_PAGE, studentPage.value * STUDENTS_PER_PAGE))

const claimed = computed(() => students.value.filter((s) => s.redeemedAt))
const unclaimed = computed(() => students.value.filter((s) => !s.redeemedAt))

watch(() => [props.open, props.achievement?.uuid] as const, async ([isOpen, uuid]) => {
	if (!isOpen || !uuid) return
	step.value = 1
	studentPage.value = 1
	students.value = []
	loadError.value = ''
	loading.value = true
	try {
		students.value = (await engagementService.fetchAchievementStudents(uuid)).students
	} catch (error: any) {
		loadError.value = error?.data?.message ?? "Couldn't load who unlocked this achievement. Close this and try again."
	} finally {
		loading.value = false
	}
}, { immediate: true })
</script>
