<template>
	<AppTeleport>
		<Transition enter-active-class="transition-opacity duration-[280ms] ease-out" enter-from-class="opacity-0"
			leave-active-class="transition-opacity duration-200 ease-out" leave-to-class="opacity-0">
			<div v-if="open" class="fixed inset-0 z-[110] bg-stone-900/40" aria-hidden="true" @click="emit('close')" />
		</Transition>

		<!-- A centred dialog on every screen size. -->
		<div class="pointer-events-none fixed inset-0 z-[120] flex items-center justify-center p-4">
			<Transition enter-active-class="transition-[transform,translate,scale,opacity] duration-[240ms] ease-out"
				enter-from-class="scale-[.96] opacity-0"
				leave-active-class="transition-[transform,translate,scale,opacity] duration-150 ease-out"
				leave-to-class="scale-[.96] opacity-0">
				<div v-if="open" role="dialog" aria-modal="true" :aria-label="title"
					class="student-app pointer-events-auto w-full max-w-[400px] overflow-y-auto overscroll-contain rounded-3xl bg-white p-5 shadow-[0_18px_44px_-18px_rgba(40,25,8,.45)] md:p-6"
					style="max-height: 88dvh">
					<h3 class="dashboard-heading mb-1.5 text-[20px] font-extrabold text-crimson">{{ title }}</h3>
					<div class="text-[14px] leading-relaxed text-stone-600">
						<slot />
					</div>
					<div v-if="$slots.actions" class="mt-5 grid gap-2">
						<slot name="actions" />
					</div>
				</div>
			</Transition>
		</div>
	</AppTeleport>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ (e: 'close'): void }>()


function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>
