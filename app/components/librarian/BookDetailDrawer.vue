<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-[60] bg-stone-900/35 backdrop-blur-[2px] transition-opacity duration-200"
			:class="open ? 'opacity-100' : 'pointer-events-none opacity-0'" @click="emit('close')" />

		<aside role="dialog" aria-modal="true" aria-labelledby="bookDetailTitle" :aria-hidden="!open" @keydown.esc="emit('close')"
			class="fixed right-0 top-0 z-[61] flex h-full w-full max-w-[440px] flex-col bg-white shadow-overlay transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]"
			:class="open ? 'translate-x-0' : 'translate-x-full'">
			<div class="flex items-center justify-between border-b border-stone-100 px-5 py-4">
				<h3 id="bookDetailTitle" class="text-[17px] font-bold text-accent-700">Book details</h3>
				<ButtonsButton variant="icon" aria-label="Close" @click="emit('close')">
					<Icon name="i-tabler-x" class="h-[18px] w-[18px]" />
				</ButtonsButton>
			</div>

			<div v-if="loading && !book" class="flex-1 space-y-3 px-5 py-5" aria-busy="true">
				<div class="h-[120px] w-[84px] animate-pulse rounded-md bg-stone-200/70" />
				<div class="h-5 w-3/4 animate-pulse rounded bg-stone-200/70" />
				<div class="h-4 w-1/2 animate-pulse rounded bg-stone-200/70" />
			</div>

			<div v-else-if="error" class="flex-1 px-5 py-10 text-center">
				<p class="text-[15px] font-semibold text-stone-800">Couldn't load this book</p>
				<p class="mt-1 text-[13.5px] text-stone-500">{{ error }}</p>
			</div>

			<div v-else-if="book" class="flex-1 overflow-y-auto px-5 py-5">
				<div class="flex gap-4">
					<div class="h-[120px] w-[84px] shrink-0 overflow-hidden rounded-md bg-gradient-to-br from-accent-100 to-stone-200 shadow-sm">
						<img v-if="book.coverImageURL" :src="book.coverImageURL" alt="" class="h-full w-full object-cover" />
					</div>
					<div class="min-w-0">
						<p class="text-[17px] font-bold leading-snug text-stone-900">{{ book.title }}</p>
						<p class="mt-1 text-[13.5px] text-stone-500">
							<template v-for="(a, i) in book.authors" :key="a.authorID">{{ i ? ', ' : '' }}{{ a.name }}<span
									v-if="a.role && a.role !== 'Author'" class="text-stone-400"> ({{ a.role.toLowerCase() }})</span></template>
							<template v-if="!book.authors.length">No author recorded</template>
						</p>
						<span v-if="book.subject"
							class="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12.5px] font-semibold text-stone-700"
							:style="{ backgroundColor: `${subjectSwatch(book.subject.name)}1f` }">
							<span class="h-2 w-2 shrink-0 rounded-[3px]" :style="{ backgroundColor: subjectSwatch(book.subject.name) }" />
							{{ book.subject.name }}
						</span>
					</div>
				</div>

				<!-- The shelf at a glance: what's in, what's out, and how often it goes out. -->
				<div class="mt-5 grid grid-cols-3 divide-x divide-stone-100 rounded-2xl border border-stone-200 py-3 text-center">
					<div>
						<p class="text-[20px] font-bold tabular-nums" :class="onShelf ? 'text-stone-900' : 'text-red-500'">{{ onShelf }}<span
								class="text-[14px] font-medium text-stone-400"> / {{ book.copies.length }}</span></p>
						<p class="text-[12px] text-stone-500">On the shelf</p>
					</div>
					<div>
						<p class="text-[20px] font-bold tabular-nums text-stone-900">{{ book.loans.active }}</p>
						<p class="text-[12px] text-stone-500">Borrowed now</p>
					</div>
					<div>
						<p class="text-[20px] font-bold tabular-nums text-stone-900">{{ book.loans.total }}</p>
						<p class="text-[12px] text-stone-500">Times borrowed</p>
					</div>
				</div>

				<dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-3.5">
					<div v-for="field in fields" :key="field.label" :class="field.wide ? 'col-span-2' : ''">
						<dt class="mb-0.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">{{ field.label }}</dt>
						<dd class="text-[14.5px] font-medium text-stone-800" :class="field.mono ? 'font-data text-[13.5px]' : ''">{{ field.value }}</dd>
					</div>
				</dl>

				<h4 class="mb-2 mt-6 text-[12px] font-bold uppercase tracking-wide text-stone-400">
					Copies <span class="font-medium normal-case tracking-normal text-stone-400">({{ book.copies.length }})</span>
				</h4>
				<ul v-if="book.copies.length" class="overflow-hidden rounded-2xl border border-stone-200">
					<li v-for="copy in book.copies" :key="copy.copyID"
						class="flex items-center justify-between gap-3 border-b border-stone-100 px-3.5 py-2.5 last:border-0">
						<div class="min-w-0">
							<p class="font-data text-[13.5px] font-medium text-stone-800">{{ copy.accessionNumber }}</p>
							<p class="font-data truncate text-[12px] text-stone-400">{{ copy.barcodeValue }}</p>
						</div>
						<LibrarianStatusPill :label="COPY_STATUS[copy.status]?.label ?? copy.status" :tone="COPY_STATUS[copy.status]?.tone ?? 'neutral'" />
					</li>
				</ul>
				<p v-else class="rounded-2xl border border-dashed border-stone-200 px-4 py-5 text-center text-[13.5px] text-stone-500">
					No copies. Edit the book to add some.
				</p>
			</div>

			<div v-if="book" class="flex gap-2.5 border-t border-stone-100 px-5 py-4">
				<ButtonsButton variant="danger" class="flex-1" @click="emit('remove', book)">
					<Icon name="i-tabler-trash" class="h-4 w-4" />Remove
				</ButtonsButton>
				<ButtonsButton variant="primary" class="flex-1" @click="emit('edit', book)">
					<Icon name="i-tabler-pencil" class="h-4 w-4" />Edit book
				</ButtonsButton>
			</div>
		</aside>
	</Teleport>
</template>

<script setup lang="ts">
import type { BookDetail } from '~/services/librarianService'

const props = defineProps<{
	open: boolean
	book: BookDetail | null
	loading?: boolean
	error?: string
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'edit' | 'remove', book: BookDetail): void
}>()

const COPY_STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
	available: { label: 'On shelf', tone: 'success' },
	borrowed: { label: 'Borrowed', tone: 'warning' },
	lost: { label: 'Lost', tone: 'danger' },
	damaged: { label: 'Damaged', tone: 'danger' },
}

const AREAS: Record<string, string> = {
	circulation: 'Circulation', reserved: 'Reserved', filipiniana: 'Filipiniana', fiction: 'Fiction',
	thesis: 'Thesis', journal: 'Journal', dissertation: 'Dissertation',
}

const onShelf = computed(() => props.book?.copies.filter((c) => c.status === 'available').length ?? 0)

/** The core catalog fields always show; the optional ones only when they've been filled in. */
const fields = computed(() => {
	const b = props.book
	if (!b) return []

	const peso = (value: string | number) => `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`
	const rows: { label: string; value: string | number; mono?: boolean; wide?: boolean; optional?: boolean }[] = [
		{ label: 'Call number', value: b.callNumber || '—', mono: true },
		{ label: 'ISBN', value: b.isbn || '—', mono: true },
		{ label: 'Library area', value: b.areasOfLibrary ? AREAS[b.areasOfLibrary] ?? b.areasOfLibrary : '—' },
		{ label: 'Shelf location', value: b.shelfLocation || '—' },
		{ label: 'Published', value: b.publicationYear ?? '—' },
		{ label: 'Publisher', value: b.publisher ?? '', optional: true },
		{ label: 'Edition', value: b.edition ?? '', optional: true },
		{ label: 'Volume', value: b.volume ?? '', optional: true },
		{ label: 'Pages', value: b.pages ?? '', optional: true },
		{ label: 'Copy number', value: b.copyNumber ?? '', optional: true, mono: true },
		{ label: 'Source of fund', value: b.sourceOfFund ?? '', optional: true },
		{ label: 'Cost', value: b.cost !== null && b.cost !== '' ? peso(b.cost) : '', optional: true },
		{ label: 'Remarks', value: b.remarks ?? '', optional: true, wide: true },
	]

	return rows.filter((row) => !row.optional || row.value !== '')
})
</script>
