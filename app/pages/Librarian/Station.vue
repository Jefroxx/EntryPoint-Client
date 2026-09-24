<template>
	<div class="min-h-dvh bg-amber-50">
		<header class="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
			<div class="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 md:px-6">
				<div class="flex items-center gap-3">
					<img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-7 w-auto" />
					<span class="h-6 w-px bg-stone-200" />
					<div>
						<p class="dashboard-heading text-[17px] font-bold leading-tight text-amber-900">Attendance station</p>
						<p class="text-[12.5px] text-stone-500">{{ today }}</p>
					</div>
				</div>

				<div class="flex flex-1 flex-wrap items-center justify-end gap-2">
					<span class="inline-flex h-9 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-[13.5px] text-emerald-800">
						<Icon name="i-tabler-circle-check" class="h-4 w-4" />
						<b class="tabular-nums">{{ stats?.currentlyInLibrary ?? '—' }}</b> in the library
					</span>
					<span class="hidden h-9 items-center gap-2 rounded-xl bg-accent-50 px-3 text-[13.5px] text-accent-600 sm:inline-flex">
						<Icon name="i-tabler-user-check" class="h-4 w-4" />
						<b class="tabular-nums">{{ stats?.totalVisitsToday ?? '—' }}</b> visits today
					</span>
					<span class="font-data hidden px-1 text-[15px] font-semibold tabular-nums text-stone-700 md:inline">{{ time }}</span>

					<button v-if="canFullscreen" type="button"
						class="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 active:scale-90"
						:aria-label="isFullscreen ? 'Exit full screen' : 'Full screen'" @click="toggleFullscreen">
						<Icon :name="isFullscreen ? 'i-tabler-minimize' : 'i-tabler-maximize'" class="h-4 w-4" />
					</button>
					<ButtonsButton variant="ghost" size="sm" @click="endSession">
						<Icon name="i-tabler-player-stop" class="h-3.5 w-3.5" />End session
					</ButtonsButton>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-[1280px] p-4 md:p-6">
			<LibrarianScanStation @scanned="onScanned" />
		</main>
	</div>
</template>

<script setup lang="ts">
import { librarianService } from '~/services/librarianService'

definePageMeta({
	middleware: 'librarian',
	layout: false,
})

useHead({ title: 'Attendance station' })

const { data: stats, execute: refetchStats } = useLiveAsyncData('station-stats', () => librarianService.fetchAttendanceStats(), { lazy: true })

// Answer the Attendance tab when it asks whether a station is running.
const { post } = useStationChannel((message) => {
	if (message.type === 'ping') post({ type: 'open' })
})

function onScanned() {
	void refetchStats()
	post({ type: 'scanned' })
}

/* ---------- clock ---------- */
const now = ref(new Date())
const time = computed(() => now.value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
const today = computed(() => now.value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
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

function endSession() {
	announceClosed()
	// A tab opened from the Attendance page may close itself; one opened by hand (a phone) can't.
	window.close()
	setTimeout(() => navigateTo('/librarian/attendance'), 150)
}

onMounted(() => {
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
