<template>
	<div class="mx-auto max-w-[720px]">
		<!-- One column for the whole page: the heading, the button and the list share the same width, so "Mark all read"
			 sits right above the list it acts on. (This comment lives inside the root on purpose: a comment beside the
			 root makes the page a fragment, and Nuxt's page transitions need a single root element.) -->
		<div class="st-in mb-4 flex items-end justify-between gap-4">
			<div class="min-w-0">
				<h1 class="dashboard-heading text-3xl font-bold text-crimson">Notifications</h1>
				<p class="mt-1 text-[14px] text-stone-500">
					{{ !loaded ? 'Loading…' : unreadCount ? `${unreadCount} unread` : items.length ? "You're all caught up." : 'Nothing yet.' }}
				</p>
			</div>
			<ButtonsButton v-if="unreadCount" variant="ghost" size="sm" class="shrink-0" @click="readAll">
				<Icon name="i-tabler-checks" class="h-4 w-4" />Mark all read
			</ButtonsButton>
		</div>

		<div v-if="loaded && items.length" class="st-in mb-3" style="animation-delay: 20ms">
			<LibrarianSegmentedTabs v-model="filter" :tabs="[
				{ label: 'All', value: 'all' },
				{ label: 'Unread', value: 'unread', badge: unreadCount || undefined },
			]" />
		</div>

		<div v-if="!loaded" class="space-y-3" aria-busy="true">
			<div v-for="n in 4" :key="n" class="h-16 animate-pulse rounded-2xl bg-stone-200/70" />
		</div>

		<div v-else class="st-in" style="animation-delay: 35ms">
			<StudentNotificationList :items="shown"
				:empty-title="filter === 'unread' ? 'Nothing unread' : undefined"
				:empty-text="filter === 'unread' ? 'You have read everything. Switch to All to see older notifications.' : undefined" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAlert } from '~/api/alert/useAlert'

// `centered`: this page sits in the middle of the screen (the others start at the left edge).
definePageMeta({ layout: 'student', middleware: 'student', title: 'Notifications', nav: 'home', tab: 'me', back: '/student/me', centered: true })
useHead({ title: 'Notifications' })

const alert = useAlert()
const { items, loaded, unreadCount, markAllRead, refresh } = useNotifications()

onMounted(() => { void refresh() })

const filter = ref('all')
// Opening one marks it read; in the Unread view it should stay put until the page is left, not vanish under the finger,
// so the list is only narrowed by what was unread when the view was chosen.
const unreadIds = ref<Set<number>>(new Set())
watch(filter, (value) => {
	if (value === 'unread') unreadIds.value = new Set(items.value.filter((n) => !n.isRead).map((n) => n.notificationID))
}, { immediate: true })
const shown = computed(() => (filter.value === 'unread' ? items.value.filter((n) => unreadIds.value.has(n.notificationID)) : items.value))

async function readAll() {
	try {
		await markAllRead()
	} catch {
		alert.error('Could not mark them as read')
	}
}
</script>
