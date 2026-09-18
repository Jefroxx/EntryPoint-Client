<template>
	<Teleport to="body">
		<div class="pointer-events-none fixed right-5 top-5 z-[200] flex w-full max-w-[360px] flex-col gap-2">
			<TransitionGroup enter-active-class="transition-[transform,opacity] duration-200 ease-out"
				enter-from-class="translate-x-3 opacity-0" enter-to-class="translate-x-0 opacity-100"
				leave-active-class="transition-[transform,opacity] duration-150 ease-out"
				leave-from-class="translate-x-0 opacity-100" leave-to-class="translate-x-3 opacity-0"
				move-class="transition-transform duration-200 ease-out">
				<div v-for="alert in alerts" :key="alert.id"
					class="pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-3.5 shadow-lg"
					:class="alert.variant === 'success' ? 'border-emerald-100' : 'border-red-100'">
					<div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
						:class="alert.variant === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'">
						<Icon :name="alert.variant === 'success' ? 'i-lucide-check' : 'i-lucide-x'"
							class="h-3.5 w-3.5" />
					</div>
					<div class="min-w-0 flex-1 pt-0.5">
						<p class="text-[13.5px] font-semibold text-stone-900">{{ alert.title }}</p>
						<p v-if="alert.description" class="mt-0.5 text-[12.5px] leading-snug text-stone-500">{{
							alert.description }}</p>
					</div>
					<button type="button" aria-label="Dismiss"
						class="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-stone-100 hover:text-stone-600"
						@click="dismiss(alert.id)">
						<Icon name="i-lucide-x" class="h-3.5 w-3.5" />
					</button>
				</div>
			</TransitionGroup>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { useAlert } from './useAlert'

const { alerts, dismiss } = useAlert()
</script>
