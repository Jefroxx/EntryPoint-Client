<template>
	<LibrarianModalShell :open="open" size="sm" title="Facility label"
		subtitle="Print this and stick it on the computer or room. Scanning it starts or ends a session." @close="emit('close')">
		<!-- Shown as a preview, plus a copy teleported to <body> that printOnly() sends to the printer on its own. -->
		<div v-if="resource" class="rounded-2xl bg-stone-100 p-3">
			<LibrarianFacilityLabelBody :resource="resource" />
		</div>

		<Teleport to="body">
			<div v-if="resource" ref="printCopy" class="print-only" aria-hidden="true">
				<LibrarianFacilityLabelBody :resource="resource" />
			</div>
		</Teleport>

		<template #footer>
			<ButtonsButton variant="ghost" @click="emit('close')">Close</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="!resource" @click="printOnly(printCopy)">
				<Icon name="i-tabler-printer" class="h-4 w-4" />Print label
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { ResourceRecord } from '~/services/resourceService'

defineProps<{
	open: boolean
	resource: ResourceRecord | null
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const printCopy = ref<HTMLElement | null>(null)
</script>
