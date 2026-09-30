<template>
	<!-- Home's Hall of Fame: one small tile per category with just its #1, in a single row (it scrolls
		 sideways on phones). "See all" opens every board, the top three and where you stand, in a drawer. -->
	<section class="rounded-[22px] border border-stone-200 bg-white p-4 md:px-5" aria-labelledby="hall-of-fame-title">
		<div class="mb-3 flex items-center justify-between gap-3">
			<div class="flex min-w-0 items-center gap-2.5">
				<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-highlight-100 text-highlight-700">
					<Icon name="i-tabler-trophy" class="h-[17px] w-[17px]" />
				</span>
				<h2 id="hall-of-fame-title" class="truncate text-[16px] font-bold text-stone-900">
					Hall of Fame<span v-if="board" class="font-medium text-stone-500"> · {{ board.month }}</span>
				</h2>
			</div>
			<button type="button" :disabled="!board"
				class="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg bg-accent-50 px-3 text-[13px] font-semibold text-accent-600 transition-colors duration-150 hover:bg-accent-100 disabled:opacity-50"
				@click="open = true">
				See all<Icon name="i-tabler-chevron-right" class="h-4 w-4" />
			</button>
		</div>

		<div v-if="loading && !board" class="no-scrollbar -mx-4 flex gap-2.5 overflow-hidden px-4 md:mx-0 md:grid md:grid-cols-3 md:px-0 lg:grid-cols-6 xl:grid-cols-3 2xl:grid-cols-6" aria-busy="true">
			<div v-for="n in 6" :key="n" class="h-[92px] w-[152px] shrink-0 animate-pulse rounded-xl bg-stone-100 md:w-auto" />
		</div>

		<p v-else-if="!board" class="rounded-xl bg-stone-50 px-4 py-4 text-center text-[13px] text-stone-500">
			The Hall of Fame couldn't load. It'll try again in a moment.
		</p>

		<ul v-else class="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-0.5 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 lg:grid-cols-6 xl:grid-cols-3 2xl:grid-cols-6">
			<li v-for="category in board.categories" :key="category.key" class="w-[152px] shrink-0 snap-start md:w-auto">
				<button type="button" class="flex h-full w-full flex-col rounded-xl border px-3 py-2.5 text-left transition-colors duration-150"
					:class="winnerIsYou(category) ? 'border-accent-200 bg-accent-50 hover:bg-accent-100' : 'border-stone-200 bg-parchment/60 hover:bg-parchment'"
					:aria-label="tileLabel(category)" @click="open = true">
					<span class="flex items-center gap-1.5 text-[11.5px] font-semibold text-stone-500">
						<Icon :name="category.icon" class="h-3.5 w-3.5 shrink-0 text-accent-500" />
						<span class="truncate">{{ category.title }}</span>
					</span>

					<template v-if="winner(category)">
						<span class="mt-2 flex min-w-0 items-center gap-1.5">
							<span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-highlight-500 text-[10px] font-bold text-white" aria-hidden="true">
								{{ winner(category)!.initials }}
							</span>
							<span class="truncate text-[13.5px] font-semibold text-stone-900">{{ winnerIsYou(category) ? 'You' : winner(category)!.name }}</span>
						</span>
						<span class="mt-1 truncate text-[12px] tabular-nums text-stone-500">
							{{ hallOfFameAmount(winner(category)!.value, category.unit) }}<template v-if="tiedCount(category)"> · +{{ tiedCount(category) }} tied</template>
						</span>
					</template>
					<span v-else class="mt-2 text-[12.5px] text-stone-500">Open spot. Be the first.</span>
				</button>
			</li>
		</ul>

		<StudentDrawer :open="open" title="Hall of Fame" @close="open = false">
			<div class="p-4 md:p-5">
				<p v-if="board" class="mb-3 text-[13px] text-stone-500">{{ board.month }}'s standouts. Monthly boards start over on the 1st.</p>
				<HallOfFameBoards :board="board" :loading="loading" grid-class="grid-cols-1" />
			</div>
		</StudentDrawer>
	</section>
</template>

<script setup lang="ts">
import type { HallOfFame, HallOfFameCategory } from '~/services/studentService'

defineProps<{
	board: HallOfFame | null
	loading: boolean
}>()

const open = ref(false)

/** The tile shows one #1; when several share first place, you first, then the listing order. */
function winner(category: HallOfFameCategory) {
	const first = category.leaders.filter((l) => l.rank === 1)
	return first.find((l) => l.isYou) ?? first[0] ?? null
}

function winnerIsYou(category: HallOfFameCategory): boolean {
	return !!winner(category)?.isYou
}

function tiedCount(category: HallOfFameCategory): number {
	return Math.max(0, category.leaders.filter((l) => l.rank === 1).length - 1)
}

function tileLabel(category: HallOfFameCategory): string {
	const top = winner(category)
	if (!top) return `${category.title}: no one yet. Open the Hall of Fame`
	return `${category.title}: ${top.isYou ? 'you' : top.name}, ${hallOfFameAmount(top.value, category.unit)}. Open the Hall of Fame`
}
</script>
