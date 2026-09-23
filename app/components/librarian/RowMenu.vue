<template>
	<div class="relative inline-flex" @click.stop>
		<span ref="anchorRef" class="inline-flex">
			<ButtonsButton variant="icon" size="sm" :aria-label="label" :aria-expanded="open" aria-haspopup="menu"
				@click="toggle">
				<Icon name="i-tabler-dots-vertical" class="h-4 w-4" />
			</ButtonsButton>
		</span>

		<!-- Rendered at the body so a table's `overflow-hidden` can never clip it. -->
		<Teleport to="body">
			<Transition enter-active-class="transition-[transform,opacity] duration-[180ms] ease-out"
				enter-from-class="scale-[.96] opacity-0" enter-to-class="scale-100 opacity-100"
				leave-active-class="transition-[transform,opacity] duration-[130ms] ease-out"
				leave-from-class="scale-100 opacity-100" leave-to-class="scale-[.98] opacity-0">
				<div v-if="open" role="menu" :style="style"
					class="fixed z-[120] min-w-[186px] rounded-[14px] border border-stone-200 bg-white p-1.5 shadow-card"
					:class="flipped ? 'origin-bottom-right' : 'origin-top-right'">
					<template v-for="item in items" :key="item.key">
						<div v-if="item.separator" class="mx-1.5 my-1.5 h-px bg-stone-100" />
						<button type="button" role="menuitem" :disabled="item.disabled"
							class="group flex w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2.5 text-left text-[14px] font-medium transition-[background-color,color,transform] duration-150 ease-out active:scale-[.975] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
							:class="TONES[item.tone ?? 'default']" @click="choose(item)">
							<Icon :name="item.icon" class="h-[15px] w-[15px] shrink-0"
								:class="item.tone && item.tone !== 'default' ? '' : 'text-stone-400 group-hover:text-stone-600'" />
							{{ item.label }}
						</button>
					</template>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
interface RowMenuItem {
	key: string
	label: string
	icon: string
	tone?: 'default' | 'danger' | 'success'
	disabled?: boolean
	/** Draws a hairline above this item, to keep destructive actions apart from the rest. */
	separator?: boolean
}

withDefaults(defineProps<{ items: readonly RowMenuItem[]; label?: string }>(), { label: 'More actions' })

const emit = defineEmits<{ (e: 'select', key: string): void }>()

const TONES = {
	default: 'text-stone-700 hover:bg-stone-100 hover:text-stone-900',
	danger: 'text-red-600 hover:bg-red-50',
	success: 'text-emerald-600 hover:bg-emerald-50',
}

const MENU_WIDTH = 186
const EDGE = 8

const anchorRef = ref<HTMLElement | null>(null)
const open = ref(false)
const flipped = ref(false)
const style = ref<Record<string, string>>({})

function place() {
	const rect = anchorRef.value?.getBoundingClientRect()
	if (!rect) return

	const left = Math.min(Math.max(EDGE, rect.right - MENU_WIDTH), window.innerWidth - MENU_WIDTH - EDGE)
	const spaceBelow = window.innerHeight - rect.bottom
	flipped.value = spaceBelow < 190 && rect.top > spaceBelow

	style.value = flipped.value
		? { left: `${left}px`, bottom: `${window.innerHeight - rect.top + 8}px` }
		: { left: `${left}px`, top: `${rect.bottom + 8}px` }
}

function close() {
	open.value = false
}

function toggle() {
	if (open.value) return close()
	place()
	open.value = true
}

function choose(item: RowMenuItem) {
	close()
	emit('select', item.key)
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') close()
}

onMounted(() => {
	window.addEventListener('click', close)
	window.addEventListener('keydown', onKeydown)
	// Position is measured once on open, so anything that moves the trigger closes the menu.
	window.addEventListener('scroll', close, true)
	window.addEventListener('resize', close)
})

onUnmounted(() => {
	window.removeEventListener('click', close)
	window.removeEventListener('keydown', onKeydown)
	window.removeEventListener('scroll', close, true)
	window.removeEventListener('resize', close)
})
</script>
