<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-[100] flex items-center justify-center p-6" :class="open ? '' : 'pointer-events-none'">
			<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
				enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150 ease-out"
				leave-from-class="opacity-100" leave-to-class="opacity-0">
				<div v-if="open" class="absolute inset-0 bg-[#1c1712]/35 backdrop-blur-[3px]" @click="requestClose" />
			</Transition>

			<Transition enter-active-class="transition-[transform,opacity] duration-[260ms] ease-out"
				enter-from-class="scale-95 translate-y-2 opacity-0" enter-to-class="scale-100 translate-y-0 opacity-100"
				leave-active-class="transition-[transform,opacity] duration-150 ease-out"
				leave-from-class="scale-100 translate-y-0 opacity-100" leave-to-class="scale-95 translate-y-1 opacity-0">
				<div v-if="open" role="dialog" aria-modal="true" :aria-labelledby="titleId"
					class="relative z-10 flex max-h-[min(680px,calc(100vh-48px))] w-full flex-col rounded-[22px] bg-white shadow-overlay"
					:class="widthClass">
					<div class="flex flex-shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-6 py-5">
						<div>
							<h2 :id="titleId" class="dashboard-heading text-2xl font-bold text-amber-900">{{ title }}</h2>
							<p v-if="subtitle" class="dashboard-heading text-[13.5px] text-amber-900">{{ subtitle }}</p>
						</div>
						<ButtonsButton variant="icon" size="md" aria-label="Close" @click="requestClose">
							<Icon name="i-tabler-x" class="h-4 w-4" />
						</ButtonsButton>
					</div>

					<div class="flex-1 overflow-y-auto px-6 py-5">
						<slot />
					</div>

					<div v-if="$slots.footer" class="flex flex-shrink-0 justify-end gap-2 border-t border-stone-100 px-6 py-4">
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
	size?: 'sm' | 'md' | 'lg'
	busy?: boolean
}>(), {
	size: 'md',
	busy: false,
})

const emit = defineEmits<{ (e: 'close'): void }>()

const titleId = useId()

const widthClass = computed(() => ({
	sm: 'max-w-[400px]',
	md: 'max-w-[480px]',
	lg: 'max-w-[560px]',
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
