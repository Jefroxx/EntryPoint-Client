<template>
	<div>
		<div class="mt-3 flex items-center justify-between text-[13.5px] text-stone-400">
			<span>Showing {{ shown }} of {{ total }} {{ noun }}</span>
			<span>Page {{ page }} of {{ lastPage }}</span>
		</div>

		<div v-if="lastPage > 1" class="mt-3 flex items-center justify-center gap-2">
			<ButtonsButton variant="ghost" size="sm" :disabled="page <= 1" @click="emit('change', page - 1)">
				<Icon name="i-tabler-chevron-left" class="h-3.5 w-3.5" />Previous
			</ButtonsButton>
			<ButtonsButton variant="ghost" size="sm" :disabled="page >= lastPage" @click="emit('change', page + 1)">
				Next<Icon name="i-tabler-chevron-right" class="h-3.5 w-3.5" />
			</ButtonsButton>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	shown: number
	total: number
	noun: string
	page: number
	lastPage: number
}>()

const emit = defineEmits<{ (e: 'change', page: number): void }>()
</script>
