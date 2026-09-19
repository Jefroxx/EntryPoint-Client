<template>
	<Teleport to="body">
		<!-- Sits above the tab bar on phones; bottom-centre on wide screens. -->
		<div class="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-[200] flex flex-col items-center gap-2 md:bottom-6">
			<TransitionGroup enter-active-class="transition-[transform,opacity] duration-[260ms] ease-out"
				enter-from-class="translate-y-4 scale-[.96] opacity-0" leave-active-class="transition-[transform,opacity] duration-150 ease-out"
				leave-to-class="translate-y-2 opacity-0" move-class="transition-transform duration-200 ease-out">
				<div v-for="alert in alerts" :key="alert.id" role="status"
					class="pointer-events-auto flex w-full max-w-[380px] items-center gap-2.5 rounded-2xl bg-stone-900 px-3.5 py-3 text-[13.5px] font-medium text-stone-50 shadow-[0_12px_30px_-12px_rgba(0,0,0,.5)]"
					@click="dismiss(alert.id)">
					<Icon :name="alert.variant === 'success' ? 'i-lucide-check' : 'i-lucide-circle-alert'" class="h-[18px] w-[18px] shrink-0"
						:class="alert.variant === 'success' ? 'text-emerald-400' : 'text-red-400'" />
					<span class="min-w-0">
						{{ alert.title }}
						<span v-if="alert.description" class="block text-[12.5px] font-normal text-stone-300">{{ alert.description }}</span>
					</span>
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { useAlert } from '~/api/alert/useAlert'

const { alerts, dismiss } = useAlert()
</script>
