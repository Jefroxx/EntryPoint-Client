<template>
	<!-- The Notifications page, the same for every account: students (Me → Notifications) and staff (the bell →
		 Notifications). What differs is only which notices they get and where each one leads (utils/notifications.ts
		 for staff, utils/studentNotifications.ts for students). One component so the two pages never drift apart. -->
	<div class="mx-auto max-w-[860px]">
		<div class="mb-5">
			<h1 class="dashboard-heading text-3xl font-bold text-crimson">Notifications</h1>
			<p class="dashboard-heading mt-1 text-crimson">
				{{ !loaded ? 'Loading…' : unreadCount ? `${unreadCount} unread` : items.length ? "You're all caught up." : 'Nothing yet.' }}
			</p>
		</div>

		<div class="phone-toolbar mb-4 flex flex-wrap items-center gap-2">
			<LibrarianSegmentedTabs v-model="filter" :tabs="[
				{ label: 'All', value: 'all' },
				{ label: 'Unread', value: 'unread', badge: unreadCount || undefined },
			]" />
			<!-- Look through them by date: pick a day, or step back and forward. -->
			<LibrarianDayPicker v-model="day" :max="todayYmd" empty-value="" reset-label="All dates" />
			<div class="flex-1" />
			<ButtonsButton variant="ghost" class="toolbar-full" :disabled="unreadCount === 0" @click="readAll">
				<Icon name="i-tabler-checks" class="h-3.5 w-3.5" />Mark all as read
			</ButtonsButton>
		</div>

		<div class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white">
			<div v-if="!loaded && !items.length" class="divide-y divide-stone-100" aria-busy="true">
				<div v-for="n in 5" :key="n" class="flex items-center gap-3.5 px-5 py-4">
					<div class="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-stone-200/70" />
					<div class="flex-1 space-y-2">
						<div class="h-3 w-3/4 animate-pulse rounded bg-stone-200/70" />
						<div class="h-2.5 w-20 animate-pulse rounded bg-stone-200/60" />
					</div>
				</div>
			</div>

			<template v-else>
				<template v-for="group in groups" :key="group.label">
					<p class="border-b border-stone-100 bg-stone-50 px-5 py-2.5 text-[11.5px] font-bold uppercase tracking-wider text-stone-500">
						{{ group.label }}
					</p>
					<!-- The whole row opens it (and marks it read); the button says where it goes. Same row as the bell list. -->
					<NotificationItem v-for="item in group.items" :key="item.notificationID" :item="item" :side="side" @open="open" />
				</template>

				<div v-if="!groups.length" class="px-5 py-12 text-center">
					<Icon name="i-tabler-bell" class="mx-auto h-7 w-7 text-stone-300" />
					<p class="mt-2 text-[15px] font-semibold text-stone-700">{{ emptyTitle }}</p>
					<p class="mt-1 text-[13.5px] text-stone-500">{{ emptyText }}</p>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { NotificationRecord } from '~/services/notificationService'
import { useAlert } from '~/api/alert/useAlert'
import { notificationLook } from '~/utils/notificationLook'

const props = defineProps<{ side: 'student' | 'staff' }>()

const alert = useAlert()
// Shared with the header bell, so marking read here updates its badge too.
const { items, loaded, unreadCount, refresh, markRead, markAllRead } = useNotifications()
onMounted(() => { void refresh() })


/* ---- what is shown ---- */
const filter = ref('all')
// Opening one marks it read; in the Unread view it stays put until the view changes instead of vanishing under the
// finger, so Unread shows what was unread when it was chosen.
const unreadIds = ref<Set<number>>(new Set())
watch(filter, (value) => {
	if (value === 'unread') unreadIds.value = new Set(items.value.filter((n) => !n.isRead).map((n) => n.notificationID))
}, { immediate: true })

// One day (Y-m-d); empty shows every date. Local dates, so an evening notification lands on the right day.
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const todayYmd = ymd(new Date())
const day = ref('')

const visible = computed(() => items.value.filter((n) =>
	(filter.value === 'all' || unreadIds.value.has(n.notificationID)) && (!day.value || ymd(new Date(n.sentAt)) === day.value)))

const groups = computed(() => {
	// A chosen day is one group, headed with that date.
	if (day.value) {
		const [y, m, d] = day.value.split('-').map(Number)
		return visible.value.length ? [{ label: formatLongDate(new Date(y!, m! - 1, d!)), items: visible.value }] : []
	}
	const now = new Date()
	return [
		{ label: 'Today', items: visible.value.filter((n) => isSameDay(new Date(n.sentAt), now)) },
		{ label: 'Earlier', items: visible.value.filter((n) => !isSameDay(new Date(n.sentAt), now)) },
	].filter((group) => group.items.length > 0)
})

const emptyTitle = computed(() => (day.value ? 'Nothing on this day' : filter.value === 'unread' ? 'Nothing unread' : 'No notifications yet'))
const emptyText = computed(() => {
	if (day.value) return 'Pick another day, or choose All dates.'
	if (filter.value === 'unread') return 'You have read everything. Switch to All to see older notifications.'
	return props.side === 'student'
		? 'Reservation updates, due dates and rewards will show up here.'
		: 'New registrations, requests and returns will show up here.'
})

/* ---- actions ---- */
async function open(item: NotificationRecord) {
	try {
		await markRead(item)
	} catch (error) {
		alert.error('Could not mark it as read', apiErrorMessage(error))
	}
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
