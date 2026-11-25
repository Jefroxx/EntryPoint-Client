<template>
	<div>
		<LibrarianSegmentedTabs v-model="view" wrap class="mb-5" :tabs="[
			{ label: 'Areas of the Library', short: 'Areas', value: 'areas' },
			{ label: 'Sources of Funds', short: 'Funds', value: 'funds' },
		]" />

		<!-- ============ Areas of the library ============ -->
		<template v-if="view === 'areas'">
			<div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
				<LibrarianSearchInput id="area-search" v-model="search" class="!min-w-[210px] !max-w-[560px] !basis-[480px]" placeholder="Search areas" />
				<div class="flex-1"></div>
				<ButtonsButton variant="primary" class="toolbar-full" @click="openArea(null)">
					<Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Area
				</ButtonsButton>
			</div>

			<p v-if="areasError" role="alert" class="rounded-2xl border border-red-100 bg-red-50 p-4 text-[15px] text-red-600">Couldn't load the areas. <button type="button" class="font-semibold underline underline-offset-2" @click="refetchAreas()">Try again</button></p>
			<LibrarianCardSkeleton v-else-if="areasPending && !areas.length" />
			<p v-else-if="!shownAreas.length" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">No areas match your search.</p>
			<ul v-else class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
				<li v-for="a in shownAreas" :key="a.uuid"
					class="relative rounded-2xl border border-stone-200 bg-white p-4 transition-shadow duration-150 hover:shadow-card">
					<button type="button" class="card-cover" :aria-label="`Show the books in ${a.name}`" @click="showConnected('area', a)" />
					<div class="card-body ">
						<div class="flex items-start gap-3">
							<span class="font-data flex h-11 min-w-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-accent-50 px-2 text-[13.5px] font-bold text-accent-700">{{ a.acronym }}</span>
							<div class="min-w-0 flex-1">
								<p class="break-words text-[16px] font-bold leading-snug text-stone-900">{{ a.name }}</p>
								<p class="mt-0.5 text-[13.5px] text-stone-500">{{ a.books_count }} {{ a.books_count === 1 ? 'book' : 'books' }}</p>
							</div>
						</div>
						<dl class="mt-3 grid grid-cols-2 gap-3 border-t border-stone-100 pt-3 text-[13.5px]">
							<div>
								<dt class="text-[11.5px] font-bold uppercase tracking-wide text-stone-500">Lending</dt>
								<dd class="mt-0.5 font-semibold" :class="a.loanable ? 'text-stone-800' : 'text-stone-500'">{{ a.loanable ? 'Can be borrowed' : 'Library use only' }}</dd>
							</div>
							<div>
								<dt class="text-[11.5px] font-bold uppercase tracking-wide text-stone-500">Lending period</dt>
								<dd class="mt-0.5 font-semibold text-stone-800">{{ a.loanable ? lendingText(a) : '—' }}</dd>
							</div>
						</dl>
						<div class="card-action mt-3 flex items-center justify-end gap-1.5">
							<ButtonsButton variant="danger" size="sm" @click="askDeleteArea(a)">Delete</ButtonsButton>
							<ButtonsButton variant="ghost" size="sm" @click="openArea(a)">Edit</ButtonsButton>
						</div>
					</div>
				</li>
			</ul>
			<p class="mt-3 text-[13.5px] text-stone-500">Showing {{ shownAreas.length }} of {{ areas.length }} areas</p>
		</template>

		<!-- ============ Sources of funds ============ -->
		<template v-else>
			<div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
				<LibrarianSearchInput id="fund-search" v-model="search" class="!min-w-[210px] !max-w-[560px] !basis-[480px]" placeholder="Search sources of funds" />
				<div class="flex-1"></div>
				<ButtonsButton variant="primary" class="toolbar-full" @click="openFund(null)">
					<Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Source of Fund
				</ButtonsButton>
			</div>

			<p v-if="fundsError" role="alert" class="rounded-2xl border border-red-100 bg-red-50 p-4 text-[15px] text-red-600">Couldn't load the sources of funds. <button type="button" class="font-semibold underline underline-offset-2" @click="refetchFunds()">Try again</button></p>
			<LibrarianCardSkeleton v-else-if="fundsPending && !funds.length" />
			<p v-else-if="!shownFunds.length" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">No sources of funds match your search.</p>
			<ul v-else class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
				<li v-for="f in shownFunds" :key="f.uuid"
					class="relative rounded-2xl border border-stone-200 bg-white p-4 transition-shadow duration-150 hover:shadow-card">
					<button type="button" class="card-cover" :aria-label="`Show the copies from ${f.name}`" @click="showConnected('fund', f)" />
					<div class="card-body ">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<p class="break-words text-[16px] font-bold leading-snug text-stone-900">{{ f.name }}</p>
								<p class="mt-0.5 text-[13.5px] text-stone-500">{{ f.copies_count }} {{ f.copies_count === 1 ? 'copy' : 'copies' }}</p>
							</div>
							<span v-if="f.locked" class="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11.5px] font-semibold text-stone-600"
								title="Copies from this source cost nothing, so it stays as it is.">
								<Icon name="i-tabler-lock" class="h-3 w-3" />Fixed
							</span>
						</div>
						<div class="card-action mt-3 flex items-center justify-end gap-1.5 border-t border-stone-100 pt-3">
							<ButtonsButton variant="danger" size="sm" @click="askDeleteFund(f)">Delete</ButtonsButton>
							<ButtonsButton variant="ghost" size="sm" @click="openFund(f)">Edit</ButtonsButton>
						</div>
					</div>
				</li>
			</ul>
			<p class="mt-3 text-[13.5px] text-stone-500">Showing {{ shownFunds.length }} of {{ funds.length }} sources of funds. Anything else can still be typed in the Source of fund box.</p>
		</template>

		<!-- A pressed card (what is connected to it), or Delete on a card that still has something connected (the same list, with the reason). -->
		<LibrarianConnectedItemsModal :open="!!connected" :title="connectedTitle" :subtitle="connectedSubtitle" :items="connectedItems" :total="connectedTotal"
			:page="connectedPage" :last-page="connectedLastPage" :noun="connected?.kind === 'area' ? 'books' : 'copies'" :search="connectedSearch"
			:loading="connectedLoading" :failed="connectedFailed" :empty-text="connected?.kind === 'area' ? 'No books are shelved in this area yet.' : 'No copies came from this source yet.'"
			:search-placeholder="connected?.kind === 'area' ? 'Search these books' : 'Search these copies'" :blocked="connectedBlocked" @close="connected = null" @retry="loadConnected"
			@page="goConnectedPage" @search="onConnectedSearch" />

		<LibrarianAreaFormModal :open="isAreaOpen" :area="editingArea" :busy="busy" @close="isAreaOpen = false" @submit="saveArea" />
		<LibrarianFundSourceFormModal :open="isFundOpen" :source="editingFund" :busy="busy" @close="isFundOpen = false" @submit="saveFund" />

		<LibrarianConfirmModal :open="isDeleteAreaOpen" title="Delete Area?"
			:message="`“${deletingArea?.name ?? 'This area'}” will be removed, along with its acronym and lending rule. No books are shelved in it.`"
			confirm-label="Delete" :loading="busy" @close="isDeleteAreaOpen = false" @confirm="removeArea" />
		<LibrarianConfirmModal :open="isDeleteFundOpen" title="Delete Source of Fund?"
			:message="`“${deletingFund?.name ?? 'This source'}” will be taken off the list. Copies already saved with it keep their record.`"
			confirm-label="Delete" :loading="busy" @close="isDeleteFundOpen = false" @confirm="removeFund" />
	</div>
</template>

<script setup lang="ts">
import { areaService, lendingText, type AreaPayload, type AreaRecord, type ConnectedItem, type FundSourceRecord } from '~/services/areaService'

const { perform } = useAction()

// Which of the two lists is showing; changing it (or leaving the tab) clears the search, so nothing stays typed behind it.
const view = ref<'areas' | 'funds'>('areas')
const search = ref('')
watch(view, () => { search.value = '' })

// The same lists feed the Add Book area box and the Source of fund box, so those are refreshed after every change.
const { refresh: refreshAreaNames } = useLibraryAreas()
const { refresh: refreshFundNames } = useFundSources()

const { data: areaData, pending: areasPending, error: areasError, execute: refetchAreas } =
	useLiveAsyncData('library-areas-list', () => areaService.fetchAreas(), { lazy: true })
const { data: fundData, pending: fundsPending, error: fundsError, execute: refetchFunds } =
	useLiveAsyncData('library-funds-list', () => areaService.fetchFundSources(), { lazy: true })

const areas = computed(() => areaData.value?.areas ?? [])
const funds = computed(() => fundData.value?.sources ?? [])

const shownAreas = computed(() => {
	const term = search.value.trim().toLowerCase()
	return areas.value.filter((a) => !term || a.name.toLowerCase().includes(term) || a.acronym.toLowerCase().includes(term))
})
const shownFunds = computed(() => {
	const term = search.value.trim().toLowerCase()
	return funds.value.filter((f) => !term || f.name.toLowerCase().includes(term))
})

const busy = ref(false)
const afterAreaChange = [refetchAreas, refreshAreaNames]
const afterFundChange = [refetchFunds, refreshFundNames]

/* ---- what is connected to a card ---- */
type Connected = { kind: 'area'; record: AreaRecord } | { kind: 'fund'; record: FundSourceRecord }
const connected = ref<Connected | null>(null)
const connectedBlocked = ref<string | null>(null)
const connectedItems = ref<ConnectedItem[]>([])
const connectedTotal = ref(0)
const connectedPage = ref(1)
const connectedLastPage = ref(1)
const connectedSearch = ref('')
const connectedLoading = ref(false)
const connectedFailed = ref(false)
// Each load gets a number, so a slow answer for a card that was closed (or another one pressed) is dropped.
let connectedRun = 0

const connectedTitle = computed(() => connected.value?.record.name ?? '')
const connectedSubtitle = computed(() => {
	const c = connected.value
	if (!c) return ''
	if (c.kind === 'area') return `${c.record.books_count} ${c.record.books_count === 1 ? 'book is' : 'books are'} shelved in this area.`
	return `${c.record.copies_count} ${c.record.copies_count === 1 ? 'copy' : 'copies'} came from this source.`
})

async function loadConnected() {
	const c = connected.value
	if (!c) return
	const mine = ++connectedRun
	connectedLoading.value = true
	connectedFailed.value = false
	try {
		const query = { page: connectedPage.value, search: connectedSearch.value.trim() || undefined }
		const result = c.kind === 'area' ? await areaService.fetchAreaBooks(c.record.uuid, query) : await areaService.fetchFundCopies(c.record.uuid, query)
		if (mine !== connectedRun) return
		connectedItems.value = result.items
		connectedTotal.value = result.total
		connectedLastPage.value = result.last_page
	} catch {
		if (mine === connectedRun) connectedFailed.value = true
	} finally {
		if (mine === connectedRun) connectedLoading.value = false
	}
}

function showConnected(kind: 'area' | 'fund', record: AreaRecord | FundSourceRecord, blocked: string | null = null) {
	connected.value = { kind, record } as Connected
	connectedBlocked.value = blocked
	connectedItems.value = []
	connectedTotal.value = 0
	connectedPage.value = 1
	connectedLastPage.value = 1
	connectedSearch.value = ''
	void loadConnected()
}
watch(connected, (c) => { if (!c) connectedRun++ })

function goConnectedPage(next: number) {
	if (next < 1 || next > connectedLastPage.value) return
	connectedPage.value = next
	void loadConnected()
}

// Typing in the window's search starts again from page 1 once typing pauses.
let connectedSearchTimer: ReturnType<typeof setTimeout>
function onConnectedSearch(term: string) {
	connectedSearch.value = term
	clearTimeout(connectedSearchTimer)
	connectedSearchTimer = setTimeout(() => { connectedPage.value = 1; void loadConnected() }, 300)
}

/* ---- areas ---- */
const isAreaOpen = ref(false)
const editingArea = ref<AreaRecord | null>(null)
function openArea(area: AreaRecord | null) { editingArea.value = area; isAreaOpen.value = true }

async function saveArea(payload: AreaPayload) {
	busy.value = true
	const target = editingArea.value
	const ok = await perform(
		() => target ? areaService.updateArea(target.uuid, payload) : areaService.createArea(payload),
		target ? 'Area updated' : 'Area added', 'Could not save the area', afterAreaChange)
	busy.value = false
	if (ok) isAreaOpen.value = false
}

const deletingArea = ref<AreaRecord | null>(null)
const isDeleteAreaOpen = ref(false)
function askDeleteArea(area: AreaRecord) {
	// The areas Settings and new books lean on can be renamed and re-timed, never deleted.
	if (area.locked) {
		return showConnected('area', area, `“${area.name}” is one of the areas the system relies on (loan periods, fines and new books), so it can't be deleted. You can rename it or change how it is lent out.`)
	}
	// Books shelved here: show them, with why it can't be deleted, instead of the usual "are you sure".
	if (area.books_count > 0) {
		return showConnected('area', area, `${area.books_count} ${area.books_count === 1 ? 'book is' : 'books are'} connected to “${area.name}”, so it can't be deleted. Move them to another area first (Edit Book), then delete it.`)
	}
	deletingArea.value = area
	isDeleteAreaOpen.value = true
}

async function removeArea() {
	const target = deletingArea.value
	if (!target) return
	busy.value = true
	const ok = await perform(() => areaService.deleteArea(target.uuid), 'Area deleted', 'Could not delete the area', afterAreaChange)
	busy.value = false
	if (ok) isDeleteAreaOpen.value = false
}

/* ---- sources of funds ---- */
const isFundOpen = ref(false)
const editingFund = ref<FundSourceRecord | null>(null)
function openFund(source: FundSourceRecord | null) { editingFund.value = source; isFundOpen.value = true }

async function saveFund(payload: { name: string }) {
	busy.value = true
	const target = editingFund.value
	const ok = await perform(
		() => target ? areaService.updateFundSource(target.uuid, payload) : areaService.createFundSource(payload),
		target ? 'Source of fund updated' : 'Source of fund added', 'Could not save the source of fund', afterFundChange)
	busy.value = false
	if (ok) isFundOpen.value = false
}

const deletingFund = ref<FundSourceRecord | null>(null)
const isDeleteFundOpen = ref(false)
function askDeleteFund(source: FundSourceRecord) {
	if (source.locked) {
		return showConnected('fund', source, '“Donated” can\'t be deleted: copies from it cost nothing, so the system relies on it.')
	}
	if (source.copies_count > 0) {
		return showConnected('fund', source, `${source.copies_count} ${source.copies_count === 1 ? 'copy is' : 'copies are'} connected to “${source.name}”, so it can't be deleted. Change their source of fund first (Edit Copy), then delete it.`)
	}
	deletingFund.value = source
	isDeleteFundOpen.value = true
}

async function removeFund() {
	const target = deletingFund.value
	if (!target) return
	busy.value = true
	const ok = await perform(() => areaService.deleteFundSource(target.uuid), 'Source of fund deleted', 'Could not delete the source of fund', afterFundChange)
	busy.value = false
	if (ok) isDeleteFundOpen.value = false
}
</script>
