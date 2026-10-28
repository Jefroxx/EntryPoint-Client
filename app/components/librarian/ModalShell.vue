<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" :class="open ? '' : 'pointer-events-none'">
			<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
				enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150 ease-out"
				leave-from-class="opacity-100" leave-to-class="opacity-0">
				<div v-if="open" class="absolute inset-0 bg-[#1c1712]/40" @click="requestClose" />
			</Transition>

			<Transition enter-active-class="transition-[transform,opacity] duration-[260ms] ease-out"
				enter-from-class="scale-95 translate-y-2 opacity-0 max-sm:translate-x-10 max-sm:translate-y-0 max-sm:scale-100" enter-to-class="scale-100 translate-y-0 opacity-100"
				leave-active-class="transition-[transform,opacity] duration-150 ease-out"
				leave-from-class="scale-100 translate-y-0 opacity-100" leave-to-class="scale-95 translate-y-1 opacity-0 max-sm:translate-x-6 max-sm:translate-y-0 max-sm:scale-100">
				<div v-if="open" role="dialog" aria-modal="true" :aria-labelledby="titleId"
					class="relative z-10 flex w-full flex-col rounded-[22px] bg-white shadow-overlay max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:shadow-none"
						:class="widthClass">
					<div class="flex flex-shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-6 py-5 max-sm:items-center max-sm:px-3 max-sm:py-3">
							<ButtonsButton variant="icon" size="md" aria-label="Back" class="-ml-1 shrink-0 sm:hidden" @click="requestClose">
								<Icon name="i-tabler-arrow-left" class="h-[18px] w-[18px]" />
							</ButtonsButton>
							<div class="min-w-0 max-sm:flex-1">
								<h2 :id="titleId" class="dashboard-heading text-2xl font-bold text-crimson max-sm:text-xl">{{ title }}</h2>
							<p v-if="subtitle" class="dashboard-heading text-[13.5px] text-crimson">{{ subtitle }}</p>
						</div>
						<ButtonsButton variant="icon" size="md" aria-label="Close" class="max-sm:hidden" @click="requestClose">
							<Icon name="i-tabler-x" class="h-4 w-4" />
						</ButtonsButton>
					</div>

					<div class="flex-1 overflow-y-auto px-6 py-5 max-sm:px-4">
						<slot />
					</div>

					<div v-if="$slots.footer" class="flex flex-shrink-0 justify-end gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1">
						<slot name="footer" />
					</div>
				</div>
			</Transition>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	open: boolean
	title: string
	subtitle?: string
	size?: 'sm' | 'md' | 'lg' | 'xl'
	busy?: boolean
}>(), {
	size: 'md',
	busy: false,
})

const emit = defineEmits<{ (e: 'close'): void }>()

const titleId = useId()

const widthClass = computed(() => ({
	sm: 'max-w-[400px] max-h-[min(680px,calc(100vh-48px))]',
	md: 'max-w-[480px] max-h-[min(680px,calc(100vh-48px))]',
	lg: 'max-w-[560px] max-h-[min(680px,calc(100vh-48px))]',
	// A wide, tall window for screens that show a lot at once (the return confirmation): up to the screen's own height.
	xl: 'max-w-[940px] max-h-[calc(100vh-48px)]',
}[props.size]))

function requestClose() {
	if (!props.busy) emit('close')
}

function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape' && props.open) requestClose()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>
