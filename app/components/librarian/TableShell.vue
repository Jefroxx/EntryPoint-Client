<template>
	<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
		<div class="max-h-[480px] overflow-auto">
			<table class="w-full border-collapse text-left" :style="{ minWidth }">
				<thead>
					<tr>
						<th v-for="(column, index) in columns" :key="`${index}-${column}`"
							class="sticky top-0 z-10 whitespace-nowrap border-b border-stone-100 bg-stone-50 px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-stone-400">
							{{ column }}
						</th>
					</tr>
				</thead>
				<tbody>
					<slot />
					<tr v-if="empty && !loading">
						<td :colspan="columns.length" class="py-10 text-center text-[15px] text-stone-400">{{ emptyText }}</td>
					</tr>
				</tbody>
			</table>
		</div>

		<LibrarianLoadingOverlay :loading="loading" />
	</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	columns: string[]
	loading: boolean
	empty: boolean
	emptyText: string
	minWidth?: string
}>(), {
	minWidth: '760px',
})
</script>
