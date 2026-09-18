<template>
	<div class="row-fade-in flex cursor-pointer items-center gap-3.5 border-b border-stone-100 px-5 py-3.5 transition-colors duration-150 last:border-0 hover:bg-stone-50"
		:style="{ animationDelay: `${index * 35}ms` }" @click="emit('open', notification)">
		<div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" :class="tones[meta.tone]">
			<Icon :name="meta.icon" class="h-4 w-4" />
		</div>

		<div class="min-w-0 flex-1">
			<p class="text-[13.5px] leading-snug" :class="notification.isRead ? 'text-stone-500' : 'font-medium text-stone-900'">
				{{ notification.message }}
			</p>
			<p class="mt-0.5 text-[11.5px] text-stone-400">{{ timeAgo(notification.sentAt) }}</p>
		</div>

		<ButtonsButton v-if="meta.to" variant="ghost" size="sm" @click.stop="emit('go', notification)">
			{{ meta.action }}
		</ButtonsButton>
		<span class="h-2 w-2 shrink-0 rounded-full bg-accent-500 transition-opacity duration-200"
			:class="notification.isRead ? 'opacity-0' : 'opacity-100'" />
	</div>
</template>

<script setup lang="ts">
import type { NotificationRecord } from '~/services/notificationService'

const props = defineProps<{
	notification: NotificationRecord
	index: number
}>()

const emit = defineEmits<{
	(e: 'open', notification: NotificationRecord): void
	(e: 'go', notification: NotificationRecord): void
}>()

const tones = {
	accent: 'bg-accent-100 text-accent-600',
	success: 'bg-emerald-100 text-emerald-600',
	warning: 'bg-amber-100 text-amber-600',
	info: 'bg-sky-100 text-sky-600',
	neutral: 'bg-stone-100 text-stone-500',
}

const meta = computed(() => notificationMeta(props.notification.type))
</script>
