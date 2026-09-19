<template>
	<div ref="root" class="relative">
		<button type="button" aria-label="Notifications" :aria-expanded="open" aria-haspopup="dialog"
			class="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-stone-500 transition-[transform,background-color,color] duration-150 ease-out hover:bg-stone-100 hover:text-stone-900 active:scale-90"
			@click="open = !open">
			<Icon name="i-lucide-bell" class="h-[18px] w-[18px]" />
			<span v-if="unreadCount"
				class="absolute -right-0.5 top-0 box-content flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-[3px] text-[10px] font-bold leading-none text-white">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
		</button>

		<!-- Scales out from the bell (its top-right corner), not from the middle of the panel. -->
		<Transition enter-active-class="transition-[transform,opacity] duration-[160ms] ease-out" enter-from-class="scale-[.96] opacity-0"
			leave-active-class="transition-[transform,opacity] duration-[120ms] ease-out" leave-to-class="scale-[.96] opacity-0">
			<div v-if="open" role="dialog" aria-label="Notifications"
				class="absolute right-0 top-[calc(100%+10px)] z-50 w-[380px] origin-top-right overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_44px_-18px_rgba(40,25,8,.45)]">
				<div class="flex items-center justify-between border-b border-stone-100 px-4 py-3">
					<b class="text-[15px] text-stone-900">Notifications</b>
					<button v-if="unreadCount" type="button" class="text-[13px] font-medium text-accent-500 hover:underline" @click="readAll">Mark all read</button>
				</div>
				<div class="max-h-[480px] overflow-y-auto overscroll-contain">
					<StudentNotificationList :items="items" :grouped="false" @chosen="open = false" />
				</div>
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
import { useAlert } from '~/api/alert/useAlert'

const { items, unreadCount, markAllRead } = useNotifications()
const alert = useAlert()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

async function readAll() {
	try {
		await markAllRead()
	} catch {
		alert.error('Could not mark them as read')
	}
}

function onPointerDown(event: PointerEvent) {
	if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') open.value = false
}

onMounted(() => {
	document.addEventListener('pointerdown', onPointerDown)
	window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', onPointerDown)
	window.removeEventListener('keydown', onKeydown)
})

// Navigating anywhere closes it.
const route = useRoute()
watch(() => route.fullPath, () => { open.value = false })
</script>
