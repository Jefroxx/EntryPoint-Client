<template>
	<!-- Every error in the app lands here (they all go through useAlert().error), so it is mounted once in app.vue.
		 One error at a time; pressing OK shows the next, if any. -->
	<Teleport to="body">
		<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
			leave-active-class="transition-opacity duration-150 ease-out" leave-to-class="opacity-0">
			<div v-if="current" class="fixed inset-0 z-[300] flex items-center justify-center p-4">
				<div class="absolute inset-0 bg-[#1c1712]/50" @click="close" />
				<div ref="dialog" role="alertdialog" aria-modal="true" :aria-labelledby="`error-title-${current.id}`"
					:aria-describedby="current.description ? `error-text-${current.id}` : undefined" tabindex="-1"
					class="error-pop relative w-full max-w-[380px] rounded-[22px] bg-white p-6 text-center shadow-overlay outline-none"
					@keydown.esc="close">
					<span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
						<!-- Inline on purpose: an icon fetched on demand can fail to load, and this dialog must never show a blank circle. -->
						<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6" aria-hidden="true">
							<circle cx="12" cy="12" r="9" />
							<path d="M12 8v4" />
							<path d="M12 16h.01" />
						</svg>
					</span>
					<h2 :id="`error-title-${current.id}`" class="mt-4 text-[18px] font-bold leading-snug text-stone-900">{{ current.title }}</h2>
					<p v-if="current.description" :id="`error-text-${current.id}`" class="mt-1.5 whitespace-pre-line text-[14px] leading-snug text-stone-500">{{ current.description }}</p>
					<p v-if="waiting > 0" class="mt-2 text-[12.5px] text-stone-400">{{ waiting }} more {{ waiting === 1 ? 'message' : 'messages' }} after this</p>
					<button type="button"
						class="mt-5 h-11 w-full rounded-xl bg-accent-500 text-[15px] font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-accent-600 active:scale-[0.97]"
						@click="close">OK</button>
				</div>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
import { useAlert } from '~/api/alert/useAlert'

const { alerts, dismiss } = useAlert()

const errors = computed(() => alerts.value.filter((a) => a.variant === 'error'))
const current = computed(() => errors.value[0] ?? null)
const waiting = computed(() => Math.max(errors.value.length - 1, 0))
const dialog = ref<HTMLElement | null>(null)

function close() {
	if (current.value) dismiss(current.value.id)
}

// Focus moves into the dialog when an error appears, so Enter or Esc dismisses it and the page behind
// stops reacting to the keyboard.
watch(() => current.value?.id, async (id) => {
	if (id === undefined) return
	await nextTick()
	dialog.value?.focus()
})
</script>

<style scoped>
.error-pop {
	animation: errorPop 240ms cubic-bezier(.22, 1, .36, 1) both;
}

@keyframes errorPop {
	from {
		opacity: 0;
		transform: scale(.95) translateY(8px);
	}
}

@media (prefers-reduced-motion: reduce) {
	.error-pop {
		animation: none;
	}
}
</style>
