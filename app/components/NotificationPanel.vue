<template>
	<!-- What the bell opens, the same for students and staff: the newest notifications in the same rows as the
		 Notifications page, "Mark all as read", and a link to the page. Each bell keeps its own button and placement. -->
	<div>
		<div class="flex items-center justify-between border-b border-stone-100 px-4 py-3">
			<p class="text-[15px] font-bold text-stone-900">Notifications</p>
			<button type="button" :disabled="unreadCount === 0"
				class="text-[13px] font-semibold text-accent-500 hover:underline disabled:cursor-not-allowed disabled:opacity-40 disabled:no-underline"
				@click="readAll">
				Mark all as read
			</button>
		</div>

		<div class="max-h-[440px] overflow-y-auto overscroll-contain [scrollbar-color:var(--color-stone-300)_transparent] [scrollbar-width:thin]">
			<NotificationItem v-for="item in recent" :key="item.notificationID" :item="item" :side="side" compact @open="open" />
			<div v-if="!recent.length" class="px-4 py-10 text-center">
				<Icon name="i-tabler-bell" class="mx-auto h-6 w-6 text-stone-300" />
				<p class="mt-2 text-[14px] text-stone-500">{{ loaded ? 'No notifications yet.' : 'Loading notifications…' }}</p>
			</div>
		</div>

		<NuxtLink :to="side === 'student' ? '/student/notifications' : '/librarian/notifications'"
			class="block border-t border-stone-100 px-4 py-2.5 text-center text-[13.5px] font-semibold text-accent-500 transition-colors hover:bg-stone-50"
			@click="emit('close')">
			View all notifications
		</NuxtLink>
	</div>
</template>

<script setup lang="ts">
import type { NotificationRecord } from '~/services/notificationService'
import { useAlert } from '~/api/alert/useAlert'
import { notificationLook } from '~/utils/notificationLook'

const props = defineProps<{ side: 'student' | 'staff' }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const alert = useAlert()
// Shared with the Notifications page, so reading one here updates it there too.
const { items, loaded, unreadCount, markRead, markAllRead } = useNotifications()
const recent = computed(() => items.value.slice(0, 8))

// Opening one marks it read and goes where it leads, as on the page.
async function open(item: NotificationRecord) {
	emit('close')
	markRead(item).catch(() => alert.error('Could not mark it as read'))
	const to = notificationLook(item, props.side).to
	if (to) await navigateTo(to)
}

async function readAll() {
	try {
		await markAllRead()
	} catch (error) {
		alert.error('Could not mark them as read', apiErrorMessage(error))
	}
}
</script>
