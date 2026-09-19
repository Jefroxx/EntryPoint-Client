<template>
	<div>
		<div class="st-in mb-5 flex items-end justify-between gap-4">
			<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Notifications</h1>
			<ButtonsButton v-if="unreadCount" variant="ghost" size="sm" @click="readAll">Mark all read</ButtonsButton>
		</div>

		<div v-if="!loaded" class="space-y-3" aria-busy="true">
			<div v-for="n in 4" :key="n" class="h-16 animate-pulse rounded-2xl bg-stone-200/70" />
		</div>

		<div v-else class="st-in mx-auto max-w-[680px] md:mx-0" style="animation-delay: 35ms">
			<StudentNotificationList :items="items" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Notifications', nav: 'home', tab: 'me' })
useHead({ title: 'Notifications · EntryPoint' })

const alert = useAlert()
const { items, loaded, unreadCount, markAllRead, refresh } = useNotifications()

onMounted(() => { void refresh() })

async function readAll() {
	try {
		await markAllRead()
	} catch {
		alert.error('Could not mark them as read')
	}
}
</script>
