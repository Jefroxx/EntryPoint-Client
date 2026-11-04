<template>
	<!-- One slim line under a list inside a pop-up: "1–7 of 31", with arrows. Hidden when everything fits on one page. -->
	<div v-if="total > pageSize" class="flex items-center justify-between pt-1 text-[13px] text-stone-500">
		<span>{{ from }}–{{ to }} of {{ total }}</span>
		<div class="flex items-center gap-1">
			<ButtonsButton variant="icon" size="sm" aria-label="Previous page" :disabled="page <= 1" @click="emit('update:page', page - 1)">
				<Icon name="i-tabler-chevron-left" class="h-4 w-4" />
			</ButtonsButton>
			<span class="tabular-nums">{{ page }} / {{ lastPage }}</span>
			<ButtonsButton variant="icon" size="sm" aria-label="Next page" :disabled="page >= lastPage" @click="emit('update:page', page + 1)">
				<Icon name="i-tabler-chevron-right" class="h-4 w-4" />
			</ButtonsButton>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{
	page: number
	total: number
	pageSize: number
}>()

const emit = defineEmits<{ (e: 'update:page', page: number): void }>()

const lastPage = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const from = computed(() => (props.page - 1) * props.pageSize + 1)
const to = computed(() => Math.min(props.total, props.page * props.pageSize))
</script>
