<template>
	<!-- Page photos for a book, one row per section. Nothing is sent while the librarian works: photos are
		 compressed and previewed locally, removals and moves are remembered, and `apply(bookID)` (called by
		 the Add/Edit Book window after the book itself saves) makes it so. Cancel therefore really cancels. -->
	<div class="space-y-4">
		<p class="text-[13.5px] leading-relaxed text-stone-500">
			Photos of these pages let students look inside a book before they borrow it. Shoot each page straight on,
			in good light. They're uploaded when you save.
		</p>

		<section v-for="s in BOOK_PAGE_SECTIONS" :key="s.key" class="rounded-2xl border border-stone-200 p-3.5">
			<div class="mb-2.5 flex items-center justify-between gap-3">
				<h4 class="flex items-center gap-2 text-[14px] font-semibold text-stone-800">
					<Icon :name="s.icon" class="h-4 w-4 text-accent-500" />{{ s.label }}
				</h4>
				<span class="text-[12px] tabular-nums text-stone-400">{{ inSection(s.key).length }} / {{ MAX_PAGES_PER_SECTION }}</span>
			</div>

			<ul class="flex flex-wrap gap-2.5">
				<li v-for="(item, i) in inSection(s.key)" :key="item.key" class="w-[76px]">
					<div class="relative h-[100px] overflow-hidden rounded-lg border border-stone-200 bg-stone-100">
						<img :src="item.url" :alt="`${s.label}, photo ${i + 1}`" class="h-full w-full object-cover" />
						<span v-if="item.blob" class="absolute left-1 top-1 rounded bg-accent-500 px-1 text-[10px] font-bold uppercase text-white">New</span>
						<span class="font-data absolute bottom-1 right-1 rounded bg-black/55 px-1 text-[10.5px] font-semibold text-white">{{ i + 1 }}</span>
					</div>
					<div class="mt-1 flex justify-between">
						<button type="button" class="flex h-6 w-6 items-center justify-center rounded text-stone-500 hover:bg-stone-100 disabled:opacity-30"
							:disabled="i === 0" :aria-label="`Move ${s.label} photo ${i + 1} earlier`" @click="move(item, -1)">
							<Icon name="i-tabler-chevron-left" class="h-4 w-4" />
						</button>
						<button type="button" class="flex h-6 w-6 items-center justify-center rounded text-red-500 hover:bg-red-50"
							:aria-label="`Remove ${s.label} photo ${i + 1}`" @click="remove(item)">
							<Icon name="i-tabler-trash" class="h-3.5 w-3.5" />
						</button>
						<button type="button" class="flex h-6 w-6 items-center justify-center rounded text-stone-500 hover:bg-stone-100 disabled:opacity-30"
							:disabled="i === inSection(s.key).length - 1" :aria-label="`Move ${s.label} photo ${i + 1} later`" @click="move(item, 1)">
							<Icon name="i-tabler-chevron-right" class="h-4 w-4" />
						</button>
					</div>
				</li>

				<li v-if="inSection(s.key).length < MAX_PAGES_PER_SECTION" class="w-[76px]">
					<!-- image/* lets a phone offer its camera as well as the gallery. `relative` keeps the sr-only input
						 inside the tile: otherwise it sits at the bottom of the form, and focusing it scrolls the whole window. -->
					<label class="relative flex h-[100px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-stone-300 text-[11.5px] font-semibold text-stone-500 transition-colors hover:border-accent-300 hover:bg-accent-50 hover:text-accent-600"
						:class="preparing === s.key ? 'pointer-events-none opacity-60' : ''">
						<Icon :name="preparing === s.key ? 'i-tabler-loader-2' : 'i-tabler-camera-plus'" class="h-5 w-5" :class="preparing === s.key ? 'animate-spin' : ''" />
						{{ preparing === s.key ? 'Preparing' : 'Add photos' }}
						<input type="file" accept="image/*" multiple class="sr-only" @change="add(s.key, $event)" />
					</label>
				</li>
			</ul>
			<p v-if="notice[s.key]" class="mt-2 text-[12.5px] text-amber-700">{{ notice[s.key] }}</p>
		</section>
	</div>
</template>

<script setup lang="ts">
import { librarianService } from '~/services/librarianService'
import { BOOK_PAGE_SECTIONS, MAX_PAGES_PER_SECTION, compressPagePhoto, type BookPagePhoto, type BookPageSection } from '~/utils/bookPages'

const props = defineProps<{
	/** The book's current photos (empty for a new book). Read once, when the editor is created. */
	pages: BookPagePhoto[]
}>()

interface Item {
	key: number
	section: BookPageSection
	url: string
	/** Set once it exists on the server. */
	pageID?: number
	/** A new photo, compressed and waiting to be uploaded. */
	blob?: Blob
}

let keySeq = 0
const items = ref<Item[]>(props.pages.map((p) => ({ key: ++keySeq, section: p.section, url: p.url, pageID: p.pageID })))
const removed = ref<number[]>([])
const reordered = ref(new Set<BookPageSection>())
const preparing = ref<BookPageSection | null>(null)
const notice = reactive<Partial<Record<BookPageSection, string>>>({})

const inSection = (section: BookPageSection) => items.value.filter((i) => i.section === section)

const hasChanges = computed(() => removed.value.length > 0 || reordered.value.size > 0 || items.value.some((i) => i.blob))

async function add(section: BookPageSection, event: Event) {
	const input = event.target as HTMLInputElement
	const files = [...(input.files ?? [])]
	input.value = '' // so choosing the same photo again still fires
	if (!files.length) return

	const room = MAX_PAGES_PER_SECTION - inSection(section).length
	notice[section] = files.length > room ? `Only ${room} more fit in this section; the rest were left out.` : ''

	preparing.value = section
	let unreadable = 0
	for (const file of files.slice(0, room)) {
		try {
			const blob = await compressPagePhoto(file)
			items.value.push({ key: ++keySeq, section, url: URL.createObjectURL(blob), blob })
		} catch {
			unreadable++
		}
	}
	preparing.value = null
	if (unreadable) notice[section] = `${unreadable} file${unreadable === 1 ? " wasn't a photo this browser can read" : "s weren't photos this browser can read"}.`
}

function move(item: Item, delta: number) {
	const list = inSection(item.section)
	const from = list.indexOf(item)
	const target = list[from + delta]
	if (!target) return
	// Swap the two within the flat list; other sections keep their places.
	const all = items.value
	const a = all.indexOf(item)
	const b = all.indexOf(target)
	;[all[a], all[b]] = [all[b]!, all[a]!]
	reordered.value = new Set(reordered.value).add(item.section)
}

function remove(item: Item) {
	items.value = items.value.filter((i) => i !== item)
	if (item.pageID) removed.value.push(item.pageID)
	if (item.blob) URL.revokeObjectURL(item.url)
}

/**
 * Sends the changes for a book that now exists: removals, then uploads (appended per section, in order),
 * then a reorder wherever the order differs from "existing first, new after". Keeps going past a failure
 * and reports how many steps didn't go through.
 */
async function apply(bookID: number): Promise<{ failed: number }> {
	let failed = 0

	for (const pageID of removed.value) {
		try { await librarianService.deleteBookPage(pageID) } catch { failed++ }
	}

	for (const { key: section } of BOOK_PAGE_SECTIONS) {
		const list = inSection(section)
		const fresh = list.filter((i) => i.blob)

		if (fresh.length) {
			try {
				const { pages } = await librarianService.uploadBookPages(bookID, section, fresh.map((i) => i.blob!))
				fresh.forEach((item, n) => { item.pageID = pages[n]?.pageID })
			} catch {
				failed++
				continue
			}
		}

		// Uploads land at the end, so a section only needs reordering if something was moved,
		// or a new photo sits before an existing one.
		const firstNew = list.findIndex((i) => i.blob)
		const newBeforeOld = firstNew >= 0 && list.slice(firstNew).some((i) => !i.blob)
		if ((reordered.value.has(section) || newBeforeOld) && list.length > 1 && list.every((i) => i.pageID)) {
			try { await librarianService.reorderBookPages(bookID, section, list.map((i) => i.pageID!)) } catch { failed++ }
		}
	}

	return { failed }
}

onBeforeUnmount(() => {
	for (const item of items.value) if (item.blob) URL.revokeObjectURL(item.url)
})

defineExpose({ apply, hasChanges })
</script>
