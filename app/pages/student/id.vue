<template>
	<div>
		<div class="st-in mb-5">
			<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Student Barcode</h1>
			<p class="dashboard-heading mt-1 text-amber-900">Show this at the entrance to check in and out.</p>
		</div>

		<div class="md:grid md:grid-cols-[minmax(0,420px)_minmax(0,1fr)] md:items-start md:gap-10">
			<div class="st-in" style="animation-delay: 35ms">
				<div
					class="max-w-[420px] overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-[0_24px_44px_-30px_rgba(60,35,10,.55)]">
					<div
						class="flex items-center justify-between bg-gradient-to-br from-accent-600 to-accent-500 px-[22px] py-[18px] text-white">
						<b class="dashboard-heading text-[18px]">EntryPoint</b>
						<span class="text-[12px] opacity-90">Student</span>
					</div>
					<div class="p-[22px]">
						<p class="dashboard-heading text-[22px] font-extrabold leading-tight text-amber-900">{{
							profile?.fullName ?? '…' }}</p>
						<p class="font-data mt-0.5 text-[13px] text-stone-500">{{ profile?.studentIDNumber }}{{
							profile?.academicProgram ? ` · ${profile.academicProgram}` : '' }}</p>

						<div v-if="profile?.barcodeValue"
							class="mt-[18px] rounded-2xl border border-stone-200 bg-white px-3 pb-2 pt-3.5">
							<svg :viewBox="`0 0 ${barcode.width} 64`" preserveAspectRatio="none" role="img"
								:aria-label="`Barcode ${profile.barcodeValue}`" class="block h-16 w-full">
								<rect v-for="([x, w], i) in barcode.bars" :key="i" :x="x" y="0" :width="w" height="64"
									fill="#1c1917" />
							</svg>
							<p class="font-data mt-1.5 text-center text-12px tracking-[.16em] text-stone-900">{{
								profile.barcodeValue }}</p>
						</div>
						<p v-else-if="profile"
							class="mt-[18px] rounded-2xl bg-amber-50 px-3.5 py-3 text-[13px] text-amber-700">
							Your barcode isn't ready yet. Ask a librarian at the desk to issue it.
						</p>
						<div v-else class="mt-[18px] h-[104px] animate-pulse rounded-2xl bg-stone-200/70"
							aria-busy="true" />
					</div>
				</div>

				<div
					class="mt-3.5 flex max-w-[420px] items-start gap-2.5 rounded-2xl bg-accent-100 px-3.5 py-3 text-[13px] leading-snug text-accent-600">
					<Icon name="i-lucide-scan-barcode" class="mt-px h-4 w-4 shrink-0" />
					<span>On a phone, raise the screen brightness so the scanner can read it.</span>
				</div>
			</div>

			<div class="st-in mt-2 md:mt-0" style="animation-delay: 70ms">
				<h2
					class="mb-2.5 mt-5 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400 md:mt-0">
					Visit streak</h2>
				<div class="rounded-2xl border border-stone-200 bg-white p-4">
					<div class="flex items-center gap-2.5">
						<span
							class="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-accent-100 text-accent-600">
							<Icon name="i-lucide-flame" class="h-[17px] w-[17px]" />
						</span>
						<div>
							<b class="text-[15px]">{{ streak }} day{{ streak === 1 ? '' : 's' }} in a row</b>
							<p class="text-[12.5px] text-stone-400">{{ streakHint }}</p>
						</div>
					</div>
					<div class="mt-3.5 flex justify-between">
						<div v-for="(day, i) in week" :key="i"
							class="flex flex-col items-center gap-1.5 text-[11px] text-stone-400">
							<i class="flex h-7 w-7 items-center justify-center rounded-full text-white"
								:class="day.visited ? 'bg-accent-500' : 'bg-stone-100'">
								<Icon v-if="day.visited" name="i-lucide-check" class="h-3.5 w-3.5" />
							</i>
							{{ day.label }}
						</div>
					</div>
				</div>

				<h2 class="mb-2.5 mt-6 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">
					Recent visits</h2>
				<div v-if="pending && !data" class="h-28 animate-pulse rounded-2xl bg-stone-200/70" aria-busy="true" />
				<p v-else-if="!data?.visits.length"
					class="rounded-2xl bg-stone-100 px-4 py-6 text-center text-[13.5px] text-stone-500">
					No visits yet. Scan your ID at the entrance to start your streak.
				</p>
				<div v-else class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
					<div v-for="v in data.visits" :key="v.logID"
						class="flex items-center gap-3.5 border-b border-stone-100 px-4 py-3 last:border-0">
						<span
							class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-stone-100 text-stone-500">
							<Icon name="i-lucide-door-open" class="h-[17px] w-[17px]" />
						</span>
						<div class="min-w-0 flex-1">
							<p class="text-[14px] font-medium text-stone-900">{{ timeAgo(v.entryTime) }}</p>
							<p class="text-[12.5px] text-stone-400">In {{ formatTime(v.entryTime) }}{{ v.exitTime ? ` ·
								Out ${formatTime(v.exitTime)}` : ' · Still inside' }}</p>
						</div>
						<span class="text-[12.5px] tabular-nums text-stone-400">{{ formatDuration(v.entryTime,
							v.exitTime) }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { studentService } from '~/services/studentService'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Student Barcode', nav: 'home', tab: 'me' })
useHead({ title: 'Student Barcode' })

const { summary, streak } = useStudent()
const profile = computed(() => summary.value?.profile ?? null)

const { data, pending } = useStudentData('student-attendance', async () => {
	const [attendance, achievements] = await Promise.all([studentService.attendance(), studentService.achievements()])
	return { ...attendance, achievements: achievements.achievements }
})

const barcode = computed(() => code128(profile.value?.barcodeValue ?? ''))
const week = computed(() => lastSevenDays(data.value?.recentDates ?? []))

const streakHint = computed(() => {
	const ahead = (data.value?.achievements ?? [])
		.filter((a) => a.criteria?.metric === 'visitStreak' && a.status === 'Locked' && a.criteria.threshold > streak.value)
		.sort((a, b) => a.criteria!.threshold - b.criteria!.threshold)[0]

	return ahead ? `${ahead.criteria!.threshold - streak.value} more to unlock ${ahead.name}` : 'Keep visiting to grow it'
})
</script>
