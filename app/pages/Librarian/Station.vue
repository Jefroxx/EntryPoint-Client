<template>
	<div class="min-h-dvh bg-parchment">
		<header class="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
			<div class="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 md:px-6">
				<div class="flex items-center gap-3">
					<img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-7 w-auto" />
					<span class="h-6 w-px bg-stone-200" />
					<div>
						<p class="dashboard-heading text-[17px] font-bold leading-tight text-crimson">Scan station</p>
						<p class="text-[12.5px] text-stone-500">{{ today }}</p>
					</div>
				</div>

				<div class="flex flex-1 flex-wrap items-center justify-end gap-2">
					<span class="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-[13.5px] text-emerald-800">
						<Icon name="i-tabler-circle-check" class="h-4 w-4" />
						<b class="tabular-nums">{{ stats?.currentlyInLibrary ?? '—' }}</b> in the library
					</span>
					<span class="hidden h-9 items-center gap-2 rounded-xl bg-accent-50 px-3 text-[13.5px] text-accent-600 lg:inline-flex">
						<Icon name="i-tabler-user-check" class="h-4 w-4" />
						<b class="tabular-nums">{{ stats?.totalVisitsToday ?? '—' }}</b> visits today
					</span>
					<span class="font-data hidden px-1 text-[15px] font-semibold tabular-nums text-stone-700 lg:inline">{{ time }}</span>

					<button v-if="canFullscreen" type="button"
						class="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 active:scale-[0.96]"
						:aria-label="isFullscreen ? 'Exit full screen' : 'Full screen'" @click="toggleFullscreen">
						<Icon :name="isFullscreen ? 'i-tabler-minimize' : 'i-tabler-maximize'" class="h-4 w-4" />
					</button>
					<ButtonsButton variant="ghost" size="sm" @click="askEndSession">
						<Icon name="i-tabler-player-stop" class="h-3.5 w-3.5" />End session
					</ButtonsButton>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-[1280px] p-4 md:p-6">
			<!-- Returns and reservation slips open their window in the librarian's main tab (see ScanStation), not here. -->
			<LibrarianScanStation @scanned="onScanned" />
		</main>

		<!-- Ending the station logs everyone still inside out, so it asks first (with the numbers). -->
		<LibrarianConfirmModal :open="isEndOpen" title="End the Session?" :message="endMessage" confirm-label="Yes, log everyone out"
			:loading="endBusy" @close="isEndOpen = false" @confirm="confirmEndSession" />

		<AlertToast />
	</div>
</template>

<script setup lang="ts">
import { librarianService } from '~/services/librarianService'
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
	middleware: 'librarian',
	layout: false,
})

useHead({ title: 'Scan station' })

const { data: stats, execute: refetchStats } = useLiveAsyncData('station-stats', () => librarianService.fetchAttendanceStats(), { lazy: true })

// Answer the Attendance tab when it asks whether a station is running.
const { post } = useStationChannel((message) => {
	if (message.type === 'ping') post({ type: 'open' })
})

function onScanned() {
	void refetchStats()
	post({ type: 'scanned' })
}

const { perform } = useAction()

/* ---------- clock ---------- */
// Empty until the page is in the browser: the server's time would never match the browser's, and Vue would warn.
const now = ref<Date | null>(null)
const time = computed(() => (now.value ? formatTime(now.value) : ''))
const today = computed(() => now.value?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) ?? '')
let tick: ReturnType<typeof setInterval> | undefined

/* ---------- full screen (for a dedicated front-desk screen) ---------- */
const canFullscreen = ref(false)
const isFullscreen = ref(false)
const syncFullscreen = () => { isFullscreen.value = !!document.fullscreenElement }

async function toggleFullscreen() {
	try {
		if (document.fullscreenElement) await document.exitFullscreen()
		else await document.documentElement.requestFullscreen()
	} catch {
		// Refused (e.g. iPhone Safari): the page still works as a normal tab.
	}
}

/* ---------- ending ---------- */
function announceClosed() {
	post({ type: 'closed' })
}

// "End session" asks first: it logs out everyone still in the library. The count is read fresh when it opens.
const isEndOpen = ref(false)
const endBusy = ref(false)

const endMessage = computed(() => {
    const inside = stats.value?.inside
    const earlier = inside?.earlier ?? { students: 0, visitors: 0 }
    // Who is in now, apart from visits left open from an earlier day (those are closed too, and said separately).
    const students = (inside?.students ?? 0) - earlier.students
    const visitors = (inside?.visitors ?? 0) - earlier.visitors
    const old = earlier.students + earlier.visitors
    const who = [
        students ? `${students} ${students === 1 ? 'student' : 'students'}` : '',
        visitors ? `${visitors} ${visitors === 1 ? 'visitor' : 'visitors'}` : '',
    ].filter(Boolean).join(' and ')
    const oldNote = old ? `${old} ${old === 1 ? 'visit' : 'visits'} left open from an earlier day ${old === 1 ? 'is' : 'are'} closed too.` : ''

    if (!who) {
        return old
            ? `Nobody is in the library right now, but ${old} ${old === 1 ? 'visit is' : 'visits are'} still open from an earlier day. Ending the session closes ${old === 1 ? 'it' : 'them'}.`
            : 'Nobody is in the library right now. End the scan station?'
    }
    const count = students + visitors
    return `${who} ${count === 1 ? 'is' : 'are'} still in the library. Ending the session logs ${count === 1 ? 'them' : 'all of them'} out and ends any computer or room session they have running.${oldNote ? ' ' + oldNote : ''}`
})

async function askEndSession() {
	await refetchStats()
	isEndOpen.value = true
}

async function confirmEndSession() {
	endBusy.value = true
	const ok = await perform(() => librarianService.closeAllVisits(), 'Everyone is logged out', 'Could not log everyone out', [refetchStats])
	endBusy.value = false
	if (!ok) return
	isEndOpen.value = false
	post({ type: 'scanned' })   // the Attendance tab refreshes its log and numbers
	endSession()
}

function endSession() {
	// The next session starts with an empty list of recent scans.
	try { sessionStorage.removeItem('station-feed') } catch { /* private window */ }
	announceClosed()
	// A tab opened from the Attendance page may close itself; one opened by hand (a phone) can't.
	window.close()
	setTimeout(() => navigateTo('/librarian/attendance'), 150)
}

onMounted(() => {
	now.value = new Date()
	post({ type: 'open' })
	tick = setInterval(() => { now.value = new Date() }, 15_000)
	canFullscreen.value = !!document.documentElement.requestFullscreen
	document.addEventListener('fullscreenchange', syncFullscreen)
	window.addEventListener('pagehide', announceClosed)
})

onBeforeUnmount(() => {
	announceClosed()
	clearInterval(tick)
	document.removeEventListener('fullscreenchange', syncFullscreen)
	window.removeEventListener('pagehide', announceClosed)
})
</script>
