<template>
	<!-- The librarian Dashboard's Hall of Fame: every board, full names and ID numbers. Students get the
		 compact strip on Home instead (student/HallOfFameStrip.vue). -->
	<section class="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" :aria-labelledby="headingId">
		<div class="mb-4 flex items-start gap-3">
			<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-highlight-100 text-highlight-700">
				<Icon name="i-tabler-trophy" class="h-5 w-5" />
			</span>
			<div class="min-w-0">
				<h2 :id="headingId" class="font-bold text-crimson">Hall of Fame</h2>
				<p class="mt-0.5 text-[13px] text-stone-500">
					{{ board ? `${board.month}'s standouts.` : 'This month’s standouts.' }}
					Students see these boards on their Home page, with first names only.
				</p>
			</div>
		</div>

		<HallOfFameBoards :board="board" :loading="loading" staff />
	</section>
</template>

<script setup lang="ts">
import type { HallOfFame } from '~/services/studentService'

defineProps<{
	board: HallOfFame | null
	loading: boolean
}>()

const headingId = useId()
</script>
