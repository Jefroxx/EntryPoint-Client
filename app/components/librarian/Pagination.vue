<template>
	<div>
		<div class="mt-3 flex items-center justify-between text-[13.5px] text-stone-500">
			<span>Showing {{ shown }} of {{ total }} {{ noun }}</span>
			<span>Page {{ page }} of {{ lastPage }}</span>
		</div>

		<!-- The regular pager, under the list. On phones it is what you reach once you scroll to the end. -->
		<div v-if="lastPage > 1" ref="inlineEl" class="mt-3 flex items-center justify-center gap-2">
			<ButtonsButton variant="ghost" size="sm" :disabled="page <= 1" @click="emit('change', page - 1)">
				<Icon name="i-tabler-chevron-left" class="h-3.5 w-3.5" />Previous
			</ButtonsButton>
			<LibrarianPageJump :page="page" :last-page="lastPage" @change="emit('change', $event)" />
			<ButtonsButton variant="ghost" size="sm" :disabled="page >= lastPage" @click="emit('change', page + 1)">
				Next<Icon name="i-tabler-chevron-right" class="h-3.5 w-3.5" />
			</ButtonsButton>
		</div>

		<!-- Phones: a long list of cards would otherwise bury the pager at the very bottom, so a pill floats over the
			 screen until the regular pager scrolls into view, then steps aside for it. It is drawn into <body> because
			 a page transition's transform would make `fixed` relative to the page instead of the screen. -->
		<AppTeleport v-if="floating && lastPage > 1">
			<Transition enter-active-class="transition duration-200 ease-out" enter-from-class="translate-y-3 opacity-0"
				leave-active-class="transition duration-150 ease-out" leave-to-class="translate-y-3 opacity-0">
				<nav v-show="!inlineVisible" aria-label="Pages"
					class="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] left-1/2 z-40 -ml-[6.5rem] flex w-52 items-center justify-between gap-1 rounded-full border border-stone-200 bg-white/95 p-1 shadow-overlay backdrop-blur md:hidden">
					<ButtonsButton variant="icon" size="sm" aria-label="Previous page" :disabled="page <= 1" @click="emit('change', page - 1)">
						<Icon name="i-tabler-chevron-left" class="h-4 w-4" />
					</ButtonsButton>
					<LibrarianPageJump :page="page" :last-page="lastPage" @change="emit('change', $event)" />
					<ButtonsButton variant="icon" size="sm" aria-label="Next page" :disabled="page >= lastPage" @click="emit('change', page + 1)">
						<Icon name="i-tabler-chevron-right" class="h-4 w-4" />
					</ButtonsButton>
				</nav>
			</Transition>
		</AppTeleport>
	</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	shown: number
	total: number
	noun: string
	page: number
	lastPage: number
	// Float over the screen on phones. Turn off where the list scrolls inside its own panel (a drawer).
	floating?: boolean
}>(), { floating: true })

const emit = defineEmits<{ (e: 'change', page: number): void }>()

// The floating pill hides while the regular pager is on screen. Starts "visible" so the pill never flashes in
// before the observer has reported. The bottom margin counts the pill's own strip as off-screen, so the two
// are never shown over each other.
const inlineEl = ref<HTMLElement | null>(null)
const inlineVisible = ref(true)
let observer: IntersectionObserver | null = null

onMounted(() => {
	observer = new IntersectionObserver(([entry]) => { inlineVisible.value = !!entry?.isIntersecting }, { rootMargin: '0px 0px -56px 0px' })
	watch(inlineEl, (el, previous) => {
		if (previous) observer?.unobserve(previous)
		if (el) observer?.observe(el)
		else inlineVisible.value = true
	}, { immediate: true, flush: 'post' })
})

onBeforeUnmount(() => observer?.disconnect())
</script>
