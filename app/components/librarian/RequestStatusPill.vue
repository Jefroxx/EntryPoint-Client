<template>
	<span class="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-bold" :class="toneClasses">
		<Icon :name="icon" class="h-3 w-3" />
		{{ status }}
	</span>
</template>

<script setup lang="ts">
const props = defineProps<{
	status: 'Pending' | 'Approved' | 'Rejected'
}>()

const toneMap = {
	Pending: { classes: 'border-amber-200 bg-amber-50 text-amber-700', icon: 'i-lucide-clock' },
	Approved: { classes: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: 'i-lucide-check' },
	Rejected: { classes: 'border-red-200 bg-red-50 text-red-700', icon: 'i-lucide-x' },
}

const toneClasses = computed(() => toneMap[props.status].classes)
const icon = computed(() => toneMap[props.status].icon)
</script>
