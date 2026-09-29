<template>
	<!-- The Hall of Fame boards: one card per category with its top three. Shared by the librarian Dashboard
		 section (HallOfFame.vue) and the student "See all" drawer (student/HallOfFameStrip.vue). -->
	<div v-if="loading && !board" class="grid gap-3" :class="gridClass" aria-busy="true">
		<div v-for="n in 6" :key="n" class="h-[196px] animate-pulse rounded-2xl bg-stone-100" />
	</div>

	<p v-else-if="!board" class="rounded-2xl bg-stone-50 px-4 py-8 text-center text-[13.5px] text-stone-500">
		The Hall of Fame couldn't load. It'll try again in a moment.
	</p>

	<ul v-else class="grid gap-3" :class="gridClass">
		<li v-for="category in board.categories" :key="category.key"
			class="flex flex-col rounded-2xl border border-stone-200 bg-parchment/60 p-4">
			<div class="flex items-start gap-2.5">
				<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
					<Icon :name="category.icon" class="h-[17px] w-[17px]" />
				</span>
				<div class="min-w-0 flex-1">
					<div class="flex items-center justify-between gap-2">
						<h3 class="truncate text-[14.5px] font-bold text-stone-900">{{ category.title }}</h3>
						<span class="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-stone-400">{{ HALL_OF_FAME_PERIOD[category.period] }}</span>
					</div>
					<p class="truncate text-[12.5px] text-stone-500">{{ category.blurb }}</p>
				</div>
			</div>

			<p v-if="!category.leaders.length" class="mt-3 flex-1 rounded-xl bg-white px-3 py-5 text-center text-[13px] text-stone-500">
				{{ staff ? 'No one has placed yet.' : 'No one yet. The first to get here takes the top spot.' }}
			</p>

			<ol v-else class="mt-3 flex-1 space-y-1.5">
				<li v-for="leader in category.leaders" :key="`${category.key}-${leader.rank}-${leader.name}`"
					class="flex items-center gap-2.5 rounded-xl px-2 py-1.5"
					:class="leader.isYou ? 'bg-accent-50 ring-1 ring-accent-200' : leader.rank === 1 ? 'bg-white' : ''">
					<!-- Place medal: gold (oak) for first, silver for second, bronze (leather) for third. -->
					<span class="font-data flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold"
						:class="HALL_OF_FAME_MEDAL[leader.rank] ?? HALL_OF_FAME_MEDAL[3]" :aria-label="`${ordinal(leader.rank)} place`">{{ leader.rank }}</span>
					<span class="flex shrink-0 items-center justify-center rounded-full bg-accent-500 font-bold text-white"
						:class="leader.rank === 1 ? 'h-9 w-9 text-[13px]' : 'h-7 w-7 text-[11px]'" aria-hidden="true">{{ leader.initials }}</span>
					<span class="min-w-0 flex-1">
						<span class="flex items-center gap-1.5">
							<span class="truncate font-semibold text-stone-900" :class="leader.rank === 1 ? 'text-[14.5px]' : 'text-[13.5px]'">{{ leader.name }}</span>
							<span v-if="leader.isYou" class="shrink-0 rounded-full bg-accent-500 px-1.5 py-px text-[10.5px] font-bold uppercase tracking-wide text-white">You</span>
						</span>
						<span v-if="leader.program || leader.studentIDNumber" class="block truncate text-[12px] text-stone-500">
							{{ leader.program }}<template v-if="leader.studentIDNumber"><template v-if="leader.program"> · </template><span class="font-data">{{ leader.studentIDNumber }}</span></template>
						</span>
					</span>
					<span class="shrink-0 text-right text-[12.5px] font-semibold tabular-nums text-stone-700">{{ hallOfFameAmount(leader.value, category.unit) }}</span>
				</li>
			</ol>

			<!-- Where the viewing student stands when they aren't on the board: a nudge, not a ranking. -->
			<p v-if="category.yourValue !== undefined && !category.leaders.some((l) => l.isYou)"
				class="mt-3 border-t border-stone-200/80 pt-2.5 text-[12.5px] text-stone-500">
				<span class="font-semibold text-stone-700">You:</span> {{ hallOfFameAmount(category.yourValue, category.unit) }}
				<template v-if="category.leaders.length && category.yourValue > 0"> · {{ gapToBoard(category) }}</template>
			</p>
		</li>
	</ul>
</template>

<script setup lang="ts">
import type { HallOfFame, HallOfFameCategory } from '~/services/studentService'

withDefaults(defineProps<{
	board: HallOfFame | null
	loading: boolean
	/** Librarian wording for empty boards. */
	staff?: boolean
	gridClass?: string
}>(), { staff: false, gridClass: 'sm:grid-cols-2 xl:grid-cols-3' })

function ordinal(n: number): string {
	return n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : `${n}th`
}

/** How far the viewing student is from the last spot on the board. */
function gapToBoard(category: HallOfFameCategory): string {
	const last = category.leaders[category.leaders.length - 1]!
	const gap = last.value - (category.yourValue ?? 0)
	if (gap <= 0) return 'tied with the board'
	return `${hallOfFameAmount(Math.round(gap * 10) / 10, category.unit)} to make the board`
}
</script>
