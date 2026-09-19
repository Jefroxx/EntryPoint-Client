<template>
	<div>
		<div class="st-in mb-6 flex items-end justify-between gap-4">
			<div class="min-w-0">
				<p class="text-[12.5px] text-stone-400">{{ today }}</p>
				<h1 class="dashboard-heading mt-1 text-3xl font-bold text-amber-900">
					{{ greeting() }}, {{ profile?.firstName ?? firstName }}
				</h1>
			</div>
			<NuxtLink to="/student/id" class="hidden shrink-0 md:block">
				<ButtonsButton variant="ghost"><Icon name="i-lucide-id-card" class="h-4 w-4" />Show Library ID</ButtonsButton>
			</NuxtLink>
		</div>

		<div class="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-5">
			<div class="space-y-4">
				<!-- Points + streak -->
				<section class="st-in relative overflow-hidden rounded-[22px] bg-gradient-to-br from-accent-600 via-accent-500 to-accent-400 p-5 text-white lg:p-[22px]" style="animation-delay: 35ms">
					<span class="pointer-events-none absolute -right-10 -top-10 h-[150px] w-[150px] rounded-full bg-white/10" />
					<p class="text-[12.5px] font-medium opacity-85">Knowledge points</p>
					<p class="dashboard-heading mb-3.5 mt-1 text-[44px] font-extrabold leading-none tracking-tight tabular-nums">{{ points }}</p>
					<div class="mb-2 flex items-center justify-between gap-3 text-[12.5px]">
						<span class="flex items-center gap-1.5"><Icon name="i-lucide-flame" class="h-4 w-4" />{{ streak }}-day visit streak</span>
						<span v-if="nextStreak" class="text-right opacity-85">{{ nextStreak.threshold - streak }} more → {{ nextStreak.name }}</span>
					</div>
					<StudentMeter light :value="nextStreak ? streak / nextStreak.threshold : 1" />
					<NuxtLink to="/student/rewards" class="mt-4 hidden lg:inline-block">
						<ButtonsButton size="sm" variant="ghost" class="!border-white !bg-white !text-accent-600">
							<Icon name="i-lucide-gift" class="h-3.5 w-3.5" />Spend points
						</ButtonsButton>
					</NuxtLink>
				</section>

				<!-- Week strip (wide screens) -->
				<section class="st-in hidden rounded-2xl border border-stone-200 bg-white p-[18px] lg:block" style="animation-delay: 70ms">
					<b class="text-[14px]">Last 7 days</b>
					<div class="mt-3 flex justify-between">
						<div v-for="(day, i) in week" :key="i" class="flex flex-col items-center gap-1.5 text-[11px] text-stone-400">
							<i class="flex h-7 w-7 items-center justify-center rounded-full text-white" :class="day.visited ? 'bg-accent-500' : 'bg-stone-100'">
								<Icon v-if="day.visited" name="i-lucide-check" class="h-3.5 w-3.5" />
							</i>
							{{ day.label }}
						</div>
					</div>
				</section>
			</div>

			<div class="mt-6 space-y-4 lg:mt-0">
				<section class="st-in" style="animation-delay: 70ms">
					<h2 class="mb-2.5 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Needs your attention</h2>

					<div v-if="pending && !data" class="h-[132px] animate-pulse rounded-2xl bg-stone-200/70" aria-busy="true" />

					<div v-else class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
						<template v-if="attentionItems.length">
							<div v-for="item in attentionItems" :key="item.key" class="flex items-center gap-3 border-b border-stone-100 last:border-0">
								<NuxtLink :to="item.to" class="flex min-w-0 flex-1 items-center gap-3 px-4 py-3.5 transition-colors duration-150 hover:bg-stone-50 active:bg-stone-100">
									<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" :class="TONE_SOFT[item.tone]">
										<Icon :name="item.icon" class="h-[17px] w-[17px]" />
									</span>
									<span class="min-w-0 flex-1">
										<span class="block truncate text-[14.5px] font-medium text-stone-900">{{ item.title }}</span>
										<span class="block truncate text-[12.5px] text-stone-400">{{ item.sub }}</span>
									</span>
									<Icon name="i-lucide-chevron-right" class="h-4 w-4 shrink-0 text-stone-300 md:hidden" />
								</NuxtLink>
								<ButtonsButton v-if="item.loan" size="sm" variant="ghost" class="mr-4 hidden !border-accent-100 !bg-accent-100 !text-accent-600 md:inline-flex"
									@click="returning = item.loan!">
									<Icon name="i-lucide-undo-2" class="h-3.5 w-3.5" />I returned this
								</ButtonsButton>
							</div>
						</template>
						<div v-else class="flex items-center gap-3 px-4 py-3.5">
							<span class="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]" :class="TONE_SOFT.good"><Icon name="i-lucide-check" class="h-[17px] w-[17px]" /></span>
							<span class="text-[14.5px] font-medium text-stone-900">You're all caught up</span>
						</div>
					</div>
				</section>

				<!-- Quick tiles (phones) -->
				<section class="st-in grid grid-cols-4 gap-2 md:hidden" style="animation-delay: 105ms">
					<component :is="tile.to ? NuxtLink : 'button'" v-for="tile in tiles" :key="tile.label" :to="tile.to" :type="tile.to ? undefined : 'button'"
						class="flex flex-col items-center gap-2 rounded-2xl border border-stone-200 bg-white px-1 py-3 text-[12px] font-medium transition-transform duration-150 ease-out active:scale-95"
						@click="tile.action?.()">
						<span class="flex h-9 w-9 items-center justify-center rounded-[10px] bg-accent-100 text-accent-600"><Icon :name="tile.icon" class="h-[18px] w-[18px]" /></span>
						{{ tile.label }}
					</component>
				</section>

				<div class="grid gap-4 lg:grid-cols-2">
					<NuxtLink to="/student/spaces"
						class="st-in flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 transition-colors duration-150 hover:bg-stone-50 active:bg-stone-100" style="animation-delay: 140ms">
						<span class="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]" :class="TONE_SOFT.good"><Icon name="i-lucide-monitor" class="h-[17px] w-[17px]" /></span>
						<span class="min-w-0 flex-1">
							<span class="block text-[14.5px] font-medium text-stone-900">In the library right now</span>
							<span class="block text-[12.5px] text-stone-400">{{ spaceSummary }}</span>
						</span>
						<Icon name="i-lucide-chevron-right" class="h-4 w-4 text-stone-300" />
					</NuxtLink>
					<NuxtLink to="/student/notifications"
						class="st-in hidden items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 transition-colors duration-150 hover:bg-stone-50 active:bg-stone-100 lg:flex" style="animation-delay: 175ms">
						<span class="flex h-[34px] w-[34px] items-center justify-center rounded-[10px]" :class="TONE_SOFT.accent"><Icon name="i-lucide-bell" class="h-[17px] w-[17px]" /></span>
						<span class="min-w-0 flex-1">
							<span class="block text-[14.5px] font-medium text-stone-900">Notifications</span>
							<span class="block text-[12.5px] text-stone-400">{{ unreadCount ? `${unreadCount} unread` : 'All read' }}</span>
						</span>
						<Icon name="i-lucide-chevron-right" class="h-4 w-4 text-stone-300" />
					</NuxtLink>
				</div>
			</div>
		</div>

		<section v-if="data?.shelf.length" class="st-in" style="animation-delay: 210ms">
			<div class="mb-3 mt-7 flex items-baseline justify-between px-0.5">
				<h2 class="text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Available now</h2>
				<NuxtLink to="/student/discover" class="text-[13px] font-medium text-accent-500 hover:underline">See all</NuxtLink>
			</div>
			<div class="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-[repeat(auto-fill,minmax(130px,1fr))] md:gap-[18px] md:overflow-visible md:px-0">
				<button v-for="book in data.shelf" :key="book.bookID" type="button"
					class="w-[104px] shrink-0 text-left transition-transform duration-200 ease-out active:scale-[.97] md:w-auto hover:-translate-y-[3px]"
					@click="drawer.open('book', book.bookID)">
					<StudentCover :book="book" :width="104" class="md:!h-[182px] md:!w-[130px]" />
					<span class="mt-2 block text-[12.5px] font-semibold leading-snug text-stone-900">{{ book.title }}</span>
					<span class="mt-0.5 block truncate text-[11.5px] text-stone-400">{{ book.authors[0] ?? 'Unknown author' }}</span>
				</button>
			</div>
		</section>

		<StudentReturnSheet :loan="returning" @close="returning = null" />
	</div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'
import { studentService, type LoanRow } from '~/services/studentService'
import { TONE_SOFT, type StudentTone } from '~/utils/studentNotifications'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Home', nav: 'home', tab: 'home' })
useHead({ title: 'Home · EntryPoint' })

const drawer = useDrawer()
const { firstName } = useAuthSession('student')
const { summary, points, streak, wishlist } = useStudent()
const { unreadCount } = useNotifications()

const profile = computed(() => summary.value?.profile ?? null)
const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

const { data, pending } = useStudentData('student-home', async () => {
	const [loans, reservations, resources, attendance, achievements, shelf] = await Promise.all([
		studentService.loans(),
		studentService.reservations(),
		studentService.resources(),
		studentService.attendance(),
		studentService.achievements(),
		studentService.catalog({ availableOnly: true, perPage: 6 }),
	])

	return {
		loans: loans.loans,
		reservations: reservations.reservations,
		resources: resources.resources,
		visitedDates: attendance.recentDates,
		achievements: achievements.achievements,
		shelf: shelf.data,
	}
})

const returning = ref<LoanRow | null>(null)

interface AttentionItem { key: string; tone: StudentTone; icon: string; title: string; sub: string; to: string; loan?: LoanRow }

const attentionItems = computed<AttentionItem[]>(() => {
	if (!data.value) return []
	const open = data.value.loans.filter((l) => l.status === 'Active')

	const overdue = open.filter((l) => l.daysLeft < 0).map<AttentionItem>((l) => ({
		key: `o${l.loanID}`, tone: 'bad', icon: 'i-lucide-circle-alert', title: l.book.title,
		sub: `${dueLabel(l.daysLeft)} · was due ${formatDate(l.dueDate)}`, to: '/student/books', loan: l,
	}))
	const soon = open.filter((l) => l.daysLeft >= 0 && l.daysLeft <= 3).map<AttentionItem>((l) => ({
		key: `s${l.loanID}`, tone: 'warn', icon: 'i-lucide-clock', title: l.book.title,
		sub: `${dueLabel(l.daysLeft)} · ${formatDate(l.dueDate)}`, to: '/student/books', loan: l,
	}))
	const ready = data.value.reservations.filter((r) => r.status === 'Accepted').map<AttentionItem>((r) => ({
		key: `r${r.reservationID}`, tone: 'good', icon: 'i-lucide-check', title: r.book.title,
		sub: 'Ready for pickup at the desk', to: '/student/books?tab=reservations',
	}))

	return [...overdue, ...soon, ...ready]
})

// The next streak achievement still ahead of you, so the meter has something to fill towards.
const nextStreak = computed(() => {
	const ahead = (data.value?.achievements ?? [])
		.filter((a) => a.criteria?.metric === 'visitStreak' && a.criteria.threshold > streak.value)
		.sort((a, b) => a.criteria!.threshold - b.criteria!.threshold)[0]

	return ahead ? { name: ahead.name, threshold: ahead.criteria!.threshold } : null
})

const week = computed(() => lastSevenDays(data.value?.visitedDates ?? []))

const spaceSummary = computed(() => {
	const free = (data.value?.resources ?? []).filter((r) => r.status === 'Available')
	if (!data.value) return 'Checking availability…'
	if (!data.value.resources.length) return 'No computers or rooms listed yet'

	const byType = new Map<string, number>()
	free.forEach((r) => byType.set(r.resourceType, (byType.get(r.resourceType) ?? 0) + 1))
	return byType.size ? [...byType].map(([type, n]) => `${n} ${type.toLowerCase()}${n === 1 ? '' : 's'}`).join(' · ') + ' free' : 'Nothing free right now'
})

const tiles = computed(() => [
	{ label: 'My ID', icon: 'i-lucide-id-card', to: '/student/id' },
	{ label: 'Wishlist', icon: 'i-lucide-heart', action: () => drawer.open('wishlist'), hint: wishlist.value.length },
	{ label: 'Suggest', icon: 'i-lucide-lightbulb', to: '/student/suggest' },
	{ label: 'Spaces', icon: 'i-lucide-monitor', to: '/student/spaces' },
])
</script>
