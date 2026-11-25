<template>
	<div class="flex items-center gap-3">
		<!-- The real cover when the book has one; otherwise the same coloured title cover the reservations use. -->
		<StudentCover :book="book ?? { title }" :width="34" />
		<div class="min-w-0">
			<p class="truncate text-[15px] font-medium text-stone-800">{{ title }}</p>
			<p v-if="sub" class="font-data truncate text-[12px] text-stone-500">{{ sub }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	title: string
	sub?: string | number
	book?: { title: string; coverImageURL?: string | null; subject?: { name: string } | null } | null
}>()
</script>
