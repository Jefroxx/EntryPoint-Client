<template>
	<span
		class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[13px] font-semibold text-amber-900 ring-1 ring-amber-200">
		{{ initials }}
	</span>
</template>

<script setup lang="ts">
const props = defineProps<{
	name: string
}>()

const initials = computed(() => {
	const parts = props.name.trim().split(/\s+/).filter(Boolean)
	if (parts.length === 0) return '?'
	const first = parts[0]!.charAt(0)
	const last = parts.length > 1 ? parts[parts.length - 1]!.charAt(0) : ''
	return (first + last).toUpperCase()
})
</script>
