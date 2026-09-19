<template>
	<span class="inline-flex h-[22px] items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-[11.5px] font-semibold"
		:class="TONE_SOFT[tone]">
		<slot />
	</span>
</template>

<script setup lang="ts">
import { TONE_SOFT, type StudentTone } from '~/utils/studentNotifications'

withDefaults(defineProps<{ tone?: StudentTone }>(), { tone: 'neutral' })
</script>
