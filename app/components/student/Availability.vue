<template>
	<span class="inline-flex items-center gap-[5px] text-[12px] font-medium" :class="available > 0 ? 'text-emerald-700' : 'text-amber-700'">
		<i class="h-[7px] w-[7px] rounded-full" :class="available > 0 ? 'bg-emerald-600' : 'bg-amber-600'" />
		{{ availabilityLabel(available, total, queue) }}
	</span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ available: number; total: number; queue?: number }>(), { queue: 0 })
</script>
