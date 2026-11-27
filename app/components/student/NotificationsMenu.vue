<template>
	<div ref="root" class="relative">
		<!-- Same tile as the points pill and the cart beside it: white, hairline border, 40px. -->
		<button type="button" :aria-label="unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'" :aria-expanded="open" aria-haspopup="dialog"
			class="relative flex h-10 w-10 items-center justify-center rounded-xl border bg-white transition-[transform,border-color,color] duration-150 ease-out active:scale-[0.96]"
			:class="open ? 'border-accent-200 text-accent-600' : 'border-stone-200 text-stone-700 hover:border-accent-200 hover:text-accent-600'"
			@click="open = !open">
			<Icon name="i-tabler-bell" class="h-[22px] w-[22px]" />
			<CountBadge v-if="unreadCount" size="md" ring="parchment" class="absolute -right-1.5 -top-1.5">{{ unreadCount > 9 ? '9+' : unreadCount }}</CountBadge>
		</button>

		<!-- Scales out from the bell (its top-right corner), not from the middle of the panel. The panel itself is the
			 staff bell's too (NotificationPanel), so both sides show the same list. -->
		<Transition enter-active-class="transition-[transform,translate,scale,opacity] duration-[160ms] ease-out" enter-from-class="scale-[.96] opacity-0"
			leave-active-class="transition-[transform,translate,scale,opacity] duration-[120ms] ease-out" leave-to-class="scale-[.96] opacity-0">
			<div v-if="open" role="dialog" aria-label="Notifications"
				class="absolute right-0 top-[calc(100%+10px)] z-50 w-[380px] origin-top-right overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_44px_-18px_rgba(40,25,8,.45)]">
				<NotificationPanel side="student" @close="open = false" />
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
const { unreadCount } = useNotifications()

const open = ref(false)
const root = ref<HTMLElement | null>(null)

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
