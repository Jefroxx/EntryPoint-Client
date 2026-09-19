<template>
	<div>
		<StudentEmptyState v-if="!items.length" icon="i-lucide-bell" title="No notifications yet"
			text="Reservation updates, due dates and rewards will show up here." />

		<template v-else>
			<section v-for="group in groups" :key="group.label" class="last:mb-0">
				<h3 v-if="grouped" class="mb-2 mt-5 px-1 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400 first:mt-0">{{ group.label }}</h3>
				<div class="overflow-hidden" :class="grouped ? 'rounded-2xl border border-stone-200 bg-white' : ''">
					<button v-for="item in group.items" :key="item.notificationID" type="button"
						class="flex w-full items-start gap-3 border-b border-stone-100 px-4 py-3.5 text-left transition-colors duration-150 last:border-0 hover:bg-stone-50 active:bg-stone-100"
						@click="choose(item)">
						<span class="mt-px flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]"
							:class="TONE_SOFT[studentNotificationMeta(item.type).tone]">
							<Icon :name="studentNotificationMeta(item.type).icon" class="h-[17px] w-[17px]" />
						</span>
						<span class="min-w-0 flex-1">
							<span class="block text-[13.5px] leading-snug text-stone-900" :class="item.isRead ? 'font-normal text-stone-600' : 'font-medium'">{{ item.message }}</span>
							<span class="mt-0.5 block text-[12px] text-stone-400">{{ timeAgo(item.sentAt) }}</span>
						</span>
						<span class="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500 transition-[opacity,transform] duration-200 ease-out"
							:class="item.isRead ? 'scale-[.4] opacity-0' : ''" />
					</button>
				</div>
			</section>
		</template>
	</div>
</template>

<script setup lang="ts">
import type { NotificationRecord } from '~/services/notificationService'
import { TONE_SOFT, studentNotificationMeta } from '~/utils/studentNotifications'
import { useAlert } from '~/api/alert/useAlert'

const props = withDefaults(defineProps<{ items: NotificationRecord[]; grouped?: boolean }>(), { grouped: true })
const emit = defineEmits<{ (e: 'chosen'): void }>()

const alert = useAlert()
const { markRead } = useNotifications()

// "Today" vs "Earlier" (when not grouped everything sits in one list).
const groups = computed(() => {
	if (!props.grouped) return [{ label: '', items: props.items }]

	const today = props.items.filter((n) => isSameDay(new Date(n.sentAt), new Date()))
	const earlier = props.items.filter((n) => !today.includes(n))
	return [
		{ label: 'Today', items: today },
		{ label: 'Earlier', items: earlier },
	].filter((group) => group.items.length)
})

async function choose(item: NotificationRecord) {
	try {
		await markRead(item)
	} catch {
		alert.error('Could not mark it as read')
	}

	emit('chosen')
	const to = studentNotificationMeta(item.type).to
	if (to) await navigateTo(to)
}
</script>
