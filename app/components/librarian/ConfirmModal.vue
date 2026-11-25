<template>
	<LibrarianModalShell :open="open" :title="title" size="sm" :busy="loading" @close="emit('close')">
		<p class="text-[15px] leading-relaxed text-stone-600">{{ message }}</p>
		<slot />

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="loading" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton :variant="danger ? 'danger' : 'primary'" :disabled="loading || confirmDisabled" @click="emit('confirm')">
				<Icon v-if="loading" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ confirmLabel }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	open: boolean
	title: string
	message: string
	confirmLabel?: string
	danger?: boolean
	loading?: boolean
	/** Keeps the confirm button off until whatever the pop-up asks for (a reason, say) is filled in. */
	confirmDisabled?: boolean
}>(), {
	confirmLabel: 'Confirm',
	danger: true,
	loading: false,
	confirmDisabled: false,
})

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'confirm'): void
}>()
</script>
