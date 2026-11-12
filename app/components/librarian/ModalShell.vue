<template>
	<AppTeleport>
		<div class="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" :class="open ? '' : 'pointer-events-none'">
			<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
				enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150 ease-out"
				leave-from-class="opacity-100" leave-to-class="opacity-0">
				<div v-if="open" class="absolute inset-0 bg-[#1c1712]/40" @click="requestClose" />
			</Transition>

			<Transition enter-active-class="transition-[transform,translate,scale,opacity] duration-[260ms] ease-out max-sm:duration-[420ms] max-sm:ease-[cubic-bezier(.4,0,.2,1)]"
				enter-from-class="scale-95 translate-y-2 opacity-0 max-sm:translate-x-full max-sm:translate-y-0 max-sm:scale-100 max-sm:opacity-100 max-sm:motion-reduce:translate-x-0 max-sm:motion-reduce:opacity-0" enter-to-class="scale-100 translate-y-0 opacity-100"
				leave-active-class="transition-[transform,translate,scale,opacity] duration-150 ease-out max-sm:duration-[320ms] max-sm:ease-[cubic-bezier(.4,0,.2,1)]"
				leave-from-class="scale-100 translate-y-0 opacity-100" leave-to-class="scale-95 translate-y-1 opacity-0 max-sm:translate-x-full max-sm:translate-y-0 max-sm:scale-100 max-sm:opacity-100 max-sm:motion-reduce:translate-x-0 max-sm:motion-reduce:opacity-0">
				<div v-if="open" role="dialog" aria-modal="true" :aria-labelledby="titleId"
					class="relative z-10 flex w-full flex-col rounded-[22px] bg-white shadow-overlay max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:shadow-none"
						:class="widthClass">
					<div class="flex flex-shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-6 py-5 max-sm:items-center max-sm:px-4 max-sm:py-3">
							<div class="min-w-0 max-sm:flex-1">
								<h2 :id="titleId" class="dashboard-heading text-2xl font-bold text-crimson max-sm:text-xl">{{ discarding ? 'Discard Changes?' : title }}</h2>
							<p v-if="subtitle && !discarding" class="dashboard-heading text-[13.5px] text-crimson">{{ subtitle }}</p>
						</div>
						<ButtonsButton variant="icon" size="md" aria-label="Close" class="shrink-0" @click="requestClose">
							<Icon name="i-tabler-x" class="h-[18px] w-[18px]" />
						</ButtonsButton>
					</div>

					<div class="flex-1 overflow-y-auto px-6 py-5 max-sm:px-4">
						<!-- Hidden, not removed, while "Discard Changes?" shows: what was typed must still be there if they keep editing. -->
						<div v-show="!discarding" class="contents"><slot /></div>

						<div v-if="discarding" class="flex items-start gap-3">
							<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
								<Icon name="i-tabler-alert-triangle" class="h-5 w-5" />
							</span>
							<p class="pt-1 text-[15px] leading-relaxed text-stone-600">{{ discardText }}</p>
						</div>
					</div>

					<div v-if="$slots.footer" v-show="!discarding" class="flex flex-shrink-0 justify-end gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1">
						<slot name="footer" />
					</div>

					<div v-if="discarding" class="flex flex-shrink-0 justify-end gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1">
						<ButtonsButton ref="keepButton" variant="ghost" @click="keepEditing">Keep Editing</ButtonsButton>
						<ButtonsButton variant="danger" @click="discard">Yes, Discard</ButtonsButton>
					</div>
				</div>
			</Transition>
		</div>
	</AppTeleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	open: boolean
	title: string
	subtitle?: string
	size?: 'sm' | 'md' | 'lg' | 'xl'
	busy?: boolean
	/**
	 * The window holds typing that would be lost (see useUnsavedChanges). Closing it (the X, a click outside, Escape, or
	 * a Cancel button that calls requestClose) then shows "Discard Changes?" inside this same window, as a second step,
	 * and only closes once they say yes.
	 */
	dirty?: boolean
	/** What the "Discard Changes?" step says. */
	discardText?: string
}>(), {
	size: 'md',
	busy: false,
	dirty: false,
	discardText: "What you've entered here won't be saved.",
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

// "Discard Changes?" is a second step inside this window (never another pop-up on top of it).
const discarding = ref(false)
const keepButton = ref<{ $el?: HTMLElement } | null>(null)

// A window that closes, or opens again, starts clean.
watch(() => props.open, () => { discarding.value = false })

/**
 * Every way out goes through here (the X, a click outside, Escape, and a form's own Cancel button, which calls this
 * through the template ref). With typing that would be lost it asks first; with the question already showing, it
 * answers "keep editing", so a second click on the X can't throw the data away by accident.
 */
function requestClose() {
	if (props.busy) return
	if (discarding.value) {
		keepEditing()
		return
	}
	if (props.dirty) {
		discarding.value = true
		// Keyboard users land on the safe choice.
		void nextTick(() => keepButton.value?.$el?.focus?.())
		return
	}
	emit('close')
}

function keepEditing() {
	discarding.value = false
}

function discard() {
	discarding.value = false
	emit('close')
}

defineExpose({ requestClose })

function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape' && props.open) requestClose()
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>
