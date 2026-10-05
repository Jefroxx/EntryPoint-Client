<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-[60] bg-stone-900/35 backdrop-blur-[2px] transition-opacity duration-200"
			:class="open ? 'opacity-100' : 'pointer-events-none opacity-0'" @click="emit('close')" />

		<aside class="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[400px] flex-col bg-white shadow-overlay transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]"
			:class="open ? 'translate-x-0' : 'translate-x-full'" role="dialog" :aria-label="heading" :aria-hidden="!open">
			<div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
				<h3 class="text-[17px] font-bold text-accent-700">{{ heading }}</h3>
				<ButtonsButton variant="icon" aria-label="Close" @click="emit('close')">
					<Icon name="i-tabler-x" class="h-[18px] w-[18px]" />
				</ButtonsButton>
			</div>

			<div class="flex-1 overflow-y-auto px-5 py-5">
				<p class="text-[16px] font-bold text-stone-900">{{ title }}</p>
				<p v-if="subtitle" class="text-[13.5px] text-stone-500">{{ subtitle }}</p>
				<div v-if="status" class="mt-2.5">
					<LibrarianStatusPill :label="status.label" :tone="status.tone" />
				</div>

				<dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
					<div v-for="field in fields" :key="field.label" :class="field.wide ? 'col-span-2' : ''">
						<dt class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">{{ field.label }}</dt>
						<dd class="break-words text-[14.5px] font-medium text-stone-800" :class="field.mono ? 'font-data text-[13.5px]' : ''">
							{{ field.value === null || field.value === undefined || field.value === '' ? '—' : field.value }}
						</dd>
					</div>
				</dl>
			</div>

			<div v-if="$slots.footer" class="flex gap-2.5 border-t border-stone-100 px-5 py-4">
				<slot name="footer" />
			</div>
		</aside>
	</Teleport>
</template>

<script setup lang="ts">
/**
 * One drawer for "click a table row to see everything about it". The table builds the field list
 * from its own record; anything that doesn't fit a table column belongs here.
 */
export interface RecordField {
	label: string
	value: string | number | null | undefined
	/** Spans both columns (long text, emails, titles). */
	wide?: boolean
	/** IDs, codes and dates in the data font. */
	mono?: boolean
}

const props = withDefaults(defineProps<{
	open: boolean
	/** What this is, e.g. "Loan details". */
	heading: string
	title: string
	subtitle?: string
	status?: { label: string; tone: 'info' | 'warning' | 'danger' | 'neutral' | 'success' }
	fields: RecordField[]
}>(), { subtitle: undefined, status: undefined })

const emit = defineEmits<{ (e: 'close'): void }>()

function handleKeydown(e: KeyboardEvent) {
	if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>
