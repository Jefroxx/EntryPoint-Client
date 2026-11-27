<template>
	<!-- One notification row, the same everywhere: the Notifications page and the bell list, for students and staff.
		 The whole row opens it (the parent marks it read and goes where it leads); the pill says where that is. -->
	<button type="button"
		class="flex w-full items-center gap-3.5 border-b border-stone-100 text-left transition-colors duration-150 last:border-0 hover:bg-accent-50 active:bg-accent-100/60"
		:class="[item.isRead ? '' : 'bg-accent-50/60', compact ? 'px-4 py-3' : 'px-5 py-3.5']"
		@click="emit('open', item)">
		<span class="flex shrink-0 items-center justify-center rounded-xl" :class="[NOTIFICATION_TONES[look.tone], compact ? 'h-8 w-8' : 'h-9 w-9']">
			<Icon :name="look.icon" class="h-4 w-4" />
		</span>
		<span class="min-w-0 flex-1">
			<span class="block leading-snug" :class="[item.isRead ? 'text-stone-500' : 'font-medium text-stone-900', compact ? 'text-[13.5px]' : 'text-[14.5px]']">{{ item.message }}</span>
			<span class="mt-0.5 block text-stone-500" :class="compact ? 'text-[12px]' : 'text-[12.5px]'">{{ timeAgo(item.sentAt) }}</span>
		</span>
		<!-- The bell list is narrow, so there only the row itself says it can be opened. -->
		<span v-if="look.to && !compact" class="hidden shrink-0 rounded-[10px] border border-stone-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-stone-700 sm:inline-flex">
			{{ look.action }}
		</span>
		<span class="h-2 w-2 shrink-0 rounded-full bg-accent-500 transition-opacity duration-200"
			:class="item.isRead ? 'opacity-0' : 'opacity-100'" :aria-label="item.isRead ? undefined : 'Unread'" />
	</button>
</template>

<script setup lang="ts">
import type { NotificationRecord } from '~/services/notificationService'
import { NOTIFICATION_TONES, notificationLook } from '~/utils/notificationLook'

const props = defineProps<{ item: NotificationRecord; side: 'student' | 'staff'; compact?: boolean }>()
const emit = defineEmits<{ (e: 'open', item: NotificationRecord): void }>()

const look = computed(() => notificationLook(props.item, props.side))
</script>
