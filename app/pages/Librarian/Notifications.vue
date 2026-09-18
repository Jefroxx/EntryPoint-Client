<template>
    <div>
        <div class="mb-6">
            <h1 class="dashboard-heading text-3xl font-bold text-amber-900">Notifications</h1>
            <p class="dashboard-heading mt-1 text-amber-900">Stay on top of registrations, requests and returns.</p>
        </div>

        <div class="mb-4 flex flex-wrap items-center gap-2">
            <LibrarianSegmentedTabs v-model="filter" :tabs="[
                { label: 'All', value: 'all' },
                { label: 'Unread', value: 'unread', badge: unreadCount },
            ]" />

            <div class="flex-1"></div>

            <ButtonsButton variant="ghost" :disabled="unreadCount === 0" @click="markAll">
                <Icon name="i-lucide-check-check" class="h-3.5 w-3.5" />Mark all as read
            </ButtonsButton>
        </div>

        <div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <template v-for="group in groups" :key="group.label">
                <p class="border-b border-stone-100 bg-stone-50 px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-wider text-stone-400">
                    {{ group.label }}
                </p>
                <LibrarianNotificationRow v-for="(notification, index) in group.items"
                    :key="notification.notificationID" :notification="notification" :index="index"
                    @open="markRead" @go="go" />
            </template>

            <p v-if="visible.length === 0" class="px-5 py-12 text-center text-sm text-stone-400">
                {{ !loaded ? 'Loading notifications…' : filter === 'unread' ? 'You\'re all caught up.' : 'No notifications yet.' }}
            </p>

            <LibrarianLoadingOverlay :loading="!loaded && items.length === 0" />
        </div>
    

        <AlertToast />
    
    </div>
</template>

<script setup lang="ts">
import type { NotificationRecord } from '~/services/notificationService'
import AlertToast from '~/api/alert/AlertToast.vue'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

const alert = useAlert()

const filter = ref('all')

// Shared with the header bell, so marking read here updates its badge too.
const { items, loaded, unreadCount, refresh, markRead: markNotificationRead, markAllRead } = useNotifications()
onMounted(refresh)

const visible = computed(() => items.value.filter((n) => filter.value === 'all' || !n.isRead))

const groups = computed(() => {
    const today = new Date()
    const todays = visible.value.filter((n) => isSameDay(new Date(n.sentAt), today))
    const earlier = visible.value.filter((n) => !isSameDay(new Date(n.sentAt), today))

    return [
        { label: 'Today', items: todays },
        { label: 'Earlier', items: earlier },
    ].filter((group) => group.items.length > 0)
})

async function markRead(notification: NotificationRecord) {
    try {
        await markNotificationRead(notification)
    } catch (error) {
        alert.error('Could not mark as read', apiErrorMessage(error))
    }
}

async function markAll() {
    try {
        await markAllRead()
    } catch (error) {
        alert.error('Could not mark all as read', apiErrorMessage(error))
    }
}

async function go(notification: NotificationRecord) {
    const target = notificationMeta(notification.type).to
    markRead(notification)
    if (target) await navigateTo(target)
}
</script>
