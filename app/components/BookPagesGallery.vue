<template>
	<!-- "Look inside": photos of a book's table of contents, appendix, bibliography, index and "about the author",
		 by section. A thumbnail opens the full page; the viewer steps through every photo, section to section.
		 Used in the librarian's book details, the student's book drawer, and (dark) the book panel on student Home. -->
	<section v-if="pages.length" :aria-labelledby="headingId">
		<div class="mb-2.5 flex items-baseline justify-between gap-3">
			<h4 :id="headingId" class="text-[11px] font-semibold uppercase tracking-[.08em]" :class="dark ? 'text-accent-100/75' : 'text-stone-400'">Look inside</h4>
			<span class="text-[12px] tabular-nums" :class="dark ? 'text-accent-100/60' : 'text-stone-400'">{{ pages.length }} page{{ pages.length === 1 ? '' : 's' }}</span>
		</div>

		<div class="no-scrollbar -mx-1 mb-2.5 flex gap-1.5 overflow-x-auto px-1" role="tablist" aria-label="Sections">
			<button v-for="s in sections" :key="s.key" type="button" role="tab" :aria-selected="active === s.key"
				class="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[12.5px] font-semibold transition-colors duration-150"
				:class="active === s.key
					? dark ? 'bg-white text-accent-800' : 'bg-accent-500 text-white'
					: dark ? 'bg-white/10 text-accent-100 hover:bg-white/20' : 'bg-accent-50 text-accent-700 hover:bg-accent-100'"
				@click="active = s.key">
				<Icon :name="s.icon" class="h-3.5 w-3.5" />{{ s.label }}<span class="tabular-nums opacity-75">{{ s.count }}</span>
			</button>
		</div>

		<ul class="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
			<li v-for="page in activePages" :key="page.pageID" class="shrink-0">
				<button type="button" class="group block overflow-hidden rounded-lg border transition-[transform,border-color] duration-150 active:scale-95"
					:class="dark ? 'border-white/15 bg-white/5 hover:border-white/40' : 'border-stone-200 bg-stone-100 hover:border-accent-300'"
					:aria-label="`${labelOf(page.section)}, page ${page.position}. Open`" @click="openAt(page)">
					<img :src="page.url" alt="" loading="lazy" class="h-[112px] w-[84px] object-cover transition-transform duration-300 group-hover:scale-105" />
				</button>
			</li>
		</ul>

		<!-- The viewer -->
		<Teleport to="body">
			<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
				leave-active-class="transition-opacity duration-150 ease-out" leave-to-class="opacity-0">
				<div v-if="current" ref="viewer" role="dialog" aria-modal="true" :aria-label="`${labelOf(current.section)}, page photo`" tabindex="-1"
					class="fixed inset-0 z-[300] flex flex-col bg-stone-950/95 text-white outline-none" @keydown="onKey">
					<div class="flex items-center justify-between gap-3 px-4 pb-2 pt-[calc(0.75rem+env(safe-area-inset-top,0px))]">
						<div class="min-w-0">
							<p class="truncate text-[15px] font-semibold">{{ labelOf(current.section) }}</p>
							<p class="text-[12.5px] tabular-nums text-white/60">{{ index + 1 }} of {{ pages.length }}</p>
						</div>
						<div class="flex items-center gap-1.5">
							<a :href="current.url" target="_blank" rel="noopener" aria-label="Open the full-size photo"
								class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20">
								<Icon name="i-tabler-external-link" class="h-[18px] w-[18px]" />
							</a>
							<button type="button" aria-label="Close" class="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20" @click="close">
								<Icon name="i-tabler-x" class="h-5 w-5" />
							</button>
						</div>
					</div>

					<div class="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]" @click.self="close">
						<img :key="current.pageID" :src="current.url" :alt="`${labelOf(current.section)}, page ${current.position}`"
							class="max-h-full max-w-full select-none rounded-md object-contain shadow-2xl" />

						<button v-if="index > 0" type="button" aria-label="Previous page"
							class="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
							@click="step(-1)">
							<Icon name="i-tabler-chevron-left" class="h-6 w-6" />
						</button>
						<button v-if="index < pages.length - 1" type="button" aria-label="Next page"
							class="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
							@click="step(1)">
							<Icon name="i-tabler-chevron-right" class="h-6 w-6" />
						</button>
					</div>
				</div>
			</Transition>
		</Teleport>
	</section>
</template>

<script setup lang="ts">
import { BOOK_PAGE_SECTIONS, type BookPagePhoto, type BookPageSection } from '~/utils/bookPages'

const props = defineProps<{
	pages: BookPagePhoto[]
	/** On a dark surface (the maroon book panel on student Home). */
	dark?: boolean
}>()

const headingId = useId()

const sections = computed(() => BOOK_PAGE_SECTIONS
	.map((s) => ({ ...s, count: props.pages.filter((p) => p.section === s.key).length }))
	.filter((s) => s.count > 0))

const active = ref<BookPageSection | null>(null)
watch(sections, (list) => {
	if (!list.some((s) => s.key === active.value)) active.value = list[0]?.key ?? null
}, { immediate: true })

const activePages = computed(() => props.pages.filter((p) => p.section === active.value))
const labelOf = (key: BookPageSection) => BOOK_PAGE_SECTIONS.find((s) => s.key === key)?.label ?? key

/* ---- viewer ---- */
const index = ref(-1)
const current = computed(() => props.pages[index.value] ?? null)
const viewer = ref<HTMLElement | null>(null)

function openAt(page: BookPagePhoto) {
	index.value = props.pages.findIndex((p) => p.pageID === page.pageID)
}

function close() {
	index.value = -1
}

// Steps through every photo; crossing into another section moves the tabs along with it.
function step(delta: number) {
	const next = index.value + delta
	if (next < 0 || next >= props.pages.length) return
	index.value = next
	active.value = props.pages[next]!.section
}

function onKey(event: KeyboardEvent) {
	if (event.key === 'Escape') close()
	else if (event.key === 'ArrowLeft') step(-1)
	else if (event.key === 'ArrowRight') step(1)
}

watch(current, async (page, before) => {
	if (!import.meta.client) return
	document.documentElement.style.overflow = page ? 'hidden' : ''
	if (page && !before) {
		await nextTick()
		viewer.value?.focus({ preventScroll: true })
	}
})

onBeforeUnmount(() => {
	if (index.value >= 0) document.documentElement.style.overflow = ''
})
</script>
