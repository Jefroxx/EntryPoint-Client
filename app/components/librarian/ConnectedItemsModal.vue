<template>
	<LibrarianModalShell :open="open" size="xl" :title="title" :subtitle="subtitle" @close="emit('close')">
		<!-- Opened by Delete on a card that still has things connected to it: the reason comes first, the list is the proof. -->
		<div v-if="blocked" role="alert" class="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-amber-900">
			<Icon name="i-tabler-alert-triangle" class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
			<p class="text-[14px] leading-snug">{{ blocked }}</p>
		</div>

		<!-- The search stays in place while the list under it loads or changes page. -->
		<div v-if="total > 0 || search" class="mb-3 flex h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 focus-within:ring-2 focus-within:ring-accent-200">
			<Icon name="i-tabler-search" class="h-[15px] w-[15px] text-stone-400" />
			<input :value="search" type="text" :placeholder="searchPlaceholder" aria-label="Search this list"
				class="w-full border-none bg-transparent text-[15px] text-stone-800 outline-none placeholder:text-stone-400"
				@input="emit('search', ($event.target as HTMLInputElement).value)" />
		</div>

		<div v-if="loading && !items.length" class="grid gap-2 md:grid-cols-2" aria-hidden="true">
			<div v-for="n in 8" :key="n" class="h-[68px] animate-pulse rounded-xl bg-stone-100" />
		</div>
		<p v-else-if="failed" class="rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-600">
			Couldn't load the list. <button type="button" class="font-semibold underline underline-offset-2" @click="emit('retry')">Try again</button>
		</p>
		<p v-else-if="!items.length" class="rounded-xl border border-dashed border-stone-200 px-4 py-10 text-center text-[14px] text-stone-500">
			{{ search ? `Nothing matches “${search}”.` : emptyText }}
		</p>

		<ul v-else class="grid gap-2 transition-opacity duration-150 md:grid-cols-2" :class="loading ? 'opacity-60' : ''">
			<li v-for="item in items" :key="item.id" class="flex items-center gap-3 rounded-xl border border-stone-200 bg-white p-2.5">
				<!-- A copy shows its accession number; a book shows an icon. -->
				<span v-if="item.badge" class="font-data flex h-12 min-w-12 shrink-0 items-center justify-center rounded-lg bg-accent-50 px-2 text-[14px] font-bold text-accent-700" :title="`Accession no. ${item.badge}`">{{ item.badge }}</span>
				<span v-else class="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600"><Icon name="i-tabler-book-2" class="h-5 w-5" /></span>

				<div class="min-w-0 flex-1">
					<p class="break-words text-[14.5px] font-semibold leading-snug text-stone-900">{{ item.title }}</p>
					<p class="break-words text-[13px] text-stone-600">{{ item.detail }}</p>
					<p v-if="item.meta" class="font-data break-words text-[12.5px] text-stone-500">{{ item.meta }}</p>
				</div>
			</li>
		</ul>

		<template #footer>
			<!-- Pages of 12, like the rest of the Library page; the pager sits in the footer so it never scrolls away. -->
			<LibrarianPagination v-if="lastPage > 1" class="mr-auto" :shown="items.length" :total="total" :noun="noun" :page="page" :last-page="lastPage"
				:floating="false" @change="emit('page', $event)" />
			<ButtonsButton variant="ghost" @click="emit('close')">Close</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { ConnectedItem } from '~/services/areaService'

defineProps<{
	open: boolean
	title: string
	subtitle?: string
	items: ConnectedItem[]
	total: number
	page: number
	lastPage: number
	/** What the rows are, for the pager ("books", "copies"). */
	noun: string
	search: string
	loading?: boolean
	failed?: boolean
	emptyText: string
	searchPlaceholder?: string
	/** Set when this window is the answer to Delete: why it can't go. */
	blocked?: string | null
}>()

const emit = defineEmits<{ (e: 'close'): void; (e: 'retry'): void; (e: 'page', page: number): void; (e: 'search', term: string): void }>()
</script>
