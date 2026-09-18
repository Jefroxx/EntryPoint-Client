<template>
	<div class="flex items-center gap-3">
		<LibrarianStudentAvatar :name="name" />
		<div class="min-w-0">
			<p class="truncate text-[13.5px] font-semibold text-stone-900">{{ name }}</p>
			<p v-if="sub" class="font-data truncate text-[11px] text-stone-400">{{ sub }}</p>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{
	name: string
	sub?: string
}>()
</script>
