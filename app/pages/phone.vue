<template>
	<!-- The page a librarian's phone opens from the desk's QR code: a full-screen camera that sends every barcode it reads
		 to the desk. No sign-in; the QR's one-time code was the proof, and the phone only gets a scan-only token. -->
	<main class="fixed inset-0 flex flex-col bg-stone-950 text-white">
		<header class="flex shrink-0 items-center justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
			<div class="min-w-0">
				<p class="truncate text-[15px] font-semibold">EntryPoint scanner</p>
				<p class="truncate text-[12.5px] text-white/60">{{ session ? `Scanning for ${session.name}'s desk` : 'Not connected' }}</p>
			</div>
			<span v-if="phase === 'ready'" class="flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
				:class="online ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'">
				<i class="h-2 w-2 rounded-full" :class="online ? 'bg-emerald-400' : 'bg-amber-400'" />{{ online ? 'Connected' : 'Reconnecting…' }}
			</span>
		</header>

		<!-- Connecting, or nothing to connect with: say what to do. -->
		<section v-if="phase !== 'ready'" class="grid flex-1 place-items-center px-6 text-center">
			<div class="max-w-[320px]">
				<span v-if="phase === 'starting'" class="mx-auto block h-9 w-9 animate-spin rounded-full border-[3px] border-white/20 border-t-white" />
				<Icon v-else name="i-tabler-device-mobile" class="mx-auto h-10 w-10 text-white/70" />
				<h1 class="mt-4 text-[20px] font-bold leading-snug">{{ headline }}</h1>
				<p v-if="detail" class="mt-2 text-[14.5px] leading-snug text-white/70">{{ detail }}</p>
			</div>
		</section>

		<template v-else>
			<div class="relative min-h-0 flex-1 overflow-hidden bg-black">
				<video ref="video" muted playsinline autoplay class="absolute inset-0 h-full w-full object-cover" />

				<template v-if="camState === 'live'">
					<div class="pointer-events-none absolute rounded-[12px] shadow-[0_0_0_9999px_rgba(0,0,0,.5)]" :style="frameStyle">
						<i v-for="corner in CORNERS" :key="corner" class="absolute h-7 w-7 border-[3px] transition-colors duration-150"
							:class="[corner, flash ? 'border-emerald-300' : 'border-white/90']" />
					</div>
					<p class="pointer-events-none absolute inset-x-0 top-[calc(34%-2.25rem)] px-4 text-center text-[14px] text-white/85">{{ flash ? 'Sent to the desk' : 'Hold a barcode inside the box' }}</p>
					<div class="pointer-events-none absolute inset-0 bg-emerald-300 transition-opacity duration-300" :class="flash ? 'opacity-30' : 'opacity-0'" />

					<div class="absolute right-3 top-3 flex flex-col gap-2.5">
						<button v-if="torchAvailable" type="button" aria-label="Torch" :aria-pressed="torchOn"
							class="flex h-11 w-11 items-center justify-center rounded-full transition-[transform,background-color] duration-150 ease-out active:scale-[0.94]"
							:class="torchOn ? 'bg-amber-300 text-stone-900' : 'bg-black/50 text-white'" @click="toggleTorch">
							<Icon name="i-tabler-bolt" class="h-5 w-5" />
						</button>
						<button type="button" aria-label="Flip camera"
							class="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white transition-transform duration-150 ease-out active:scale-[0.94]" @click="flip">
							<Icon name="i-tabler-refresh" class="h-5 w-5" />
						</button>
					</div>
				</template>

				<div v-else class="absolute inset-0 grid place-items-center bg-stone-950/90 p-6 text-center">
					<div v-if="camState === 'starting'" class="flex items-center gap-2.5 text-white/85">
						<span class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Starting the camera…
					</div>
					<div v-else class="max-w-[300px]">
						<Icon name="i-tabler-camera-off" class="mx-auto mb-3 h-9 w-9 opacity-80" />
						<p class="text-[17px] font-semibold">{{ camMessage.title }}</p>
						<p class="mt-1 text-[14.5px] leading-snug text-white/70">{{ camMessage.text }}</p>
						<button v-if="camState !== 'unsupported'" type="button" class="mt-4 h-12 rounded-xl bg-white px-6 text-[15px] font-semibold text-stone-900 transition-transform active:scale-[0.97]" @click="startCamera">
							{{ camState === 'idle' ? 'Turn on camera' : 'Try again' }}
						</button>
					</div>
				</div>
			</div>

			<footer class="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
				<ul v-if="recent.length" class="mb-3 space-y-1.5" aria-label="Recently scanned">
					<li v-for="item in recent" :key="item.id" class="flex items-center gap-2.5 rounded-xl bg-white/8 px-3 py-2 text-[13.5px]">
						<Icon v-if="item.state === 'sent'" name="i-tabler-check" class="h-4 w-4 shrink-0 text-emerald-300" />
						<Icon v-else-if="item.state === 'failed'" name="i-tabler-alert-triangle" class="h-4 w-4 shrink-0 text-amber-300" />
						<span v-else class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/25 border-t-white" />
						<span class="font-data min-w-0 flex-1 truncate">{{ item.code }}</span>
						<span class="shrink-0 text-[12px]" :class="item.state === 'failed' ? 'text-amber-300' : 'text-white/50'">{{ item.state === 'sent' ? 'Sent' : item.state === 'failed' ? 'Not sent' : 'Sending…' }}</span>
					</li>
				</ul>
				<p v-else class="mb-3 text-center text-[13.5px] text-white/55">Barcodes you scan appear on the desk's screen.</p>
				<button type="button" class="h-12 w-full rounded-xl bg-white/10 text-[15px] font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-white/15 active:scale-[0.98]" @click="disconnect">
					Disconnect this phone
				</button>
			</footer>
		</template>
	</main>
</template>

<script setup lang="ts">
import type { ScanRegion } from '~/composables/useCameraScanner'
import { phoneApi, type PhoneSession } from '~/services/phoneScannerService'

definePageMeta({ layout: false })
useHead({ title: 'Scanner', meta: [{ name: 'robots', content: 'noindex' }, { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' }] })

const STORAGE_KEY = 'entrypoint-phone-session'
const PING_MS = 8000

const api = phoneApi()
const route = useRoute()

type Phase = 'starting' | 'ready' | 'needs-code' | 'ended'
const phase = ref<Phase>('starting')
const session = ref<PhoneSession | null>(null)
const online = ref(true)
const failure = ref('')

/* ---------- connecting ---------- */
function readSaved(): PhoneSession | null {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as PhoneSession | null
		return saved && saved.token && new Date(saved.expiresAt).getTime() > Date.now() ? saved : null
	} catch {
		return null
	}
}

function save(value: PhoneSession | null) {
	try {
		if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
		else localStorage.removeItem(STORAGE_KEY)
	} catch { /* private mode: it just won't survive a reload */ }
}

function messageOf(error: any): string {
	return error?.data?.errors?.code?.[0] ?? error?.data?.message ?? "Couldn't reach the library system. Check the connection and try again."
}

async function connect() {
	const code = typeof route.query.code === 'string' ? route.query.code : ''

	if (code) {
		try {
			session.value = await api.claim(code)
			save(session.value)
		} catch (error) {
			failure.value = messageOf(error)
			session.value = readSaved()
			if (!session.value) { phase.value = 'needs-code'; return }
		}
		// The one-time code is spent: take it out of the address bar so a reload doesn't try it again.
		await navigateTo({ path: route.path }, { replace: true })
	} else {
		session.value = readSaved()
	}

	if (!session.value) { phase.value = 'needs-code'; return }

	try {
		await api.ping(session.value.token)
	} catch (error: any) {
		if (error?.status === 401 || error?.status === 403) return end('This phone was disconnected from the desk.')
		online.value = false // offline right now: the camera can still start, scans wait for the connection
	}

	phase.value = 'ready'
	await nextTick()
	await startCamera()
	pingTimer = setInterval(ping, PING_MS)
}

let pingTimer: ReturnType<typeof setInterval> | undefined

async function ping() {
	if (!session.value) return
	try {
		await api.ping(session.value.token)
		online.value = true
	} catch (error: any) {
		if (error?.status === 401 || error?.status === 403) end('This phone was disconnected from the desk.')
		else online.value = false
	}
}

function end(message: string) {
	clearInterval(pingTimer)
	stop()
	save(null)
	session.value = null
	failure.value = message
	phase.value = 'ended'
}

async function disconnect() {
	const token = session.value?.token
	if (token) { try { await api.leave(token) } catch { /* it is going away either way */ } }
	end('This phone is disconnected.')
}

const headline = computed(() => {
	if (phase.value === 'starting') return 'Connecting to the desk…'
	if (phase.value === 'ended') return failure.value || 'This phone is disconnected.'
	return failure.value || 'Scan the code on the computer'
})
const detail = computed(() => {
	if (phase.value === 'starting') return ''
	if (phase.value === 'ended') return 'To connect it again, scan the QR code shown on the computer.'
	return failure.value
		? 'On the computer, open "Use your phone as the camera" and scan the new code.'
		: 'On the computer, open Checkout or Start Session, choose "Use your phone as the camera", then point this phone\'s camera at the QR code.'
})

/* ---------- scanning ---------- */
// Wide and short like a barcode, in the upper middle where a phone is held naturally.
const REGION: ScanRegion = { left: 0.08, top: 0.34, width: 0.84, height: 0.26 }
const frameStyle = { left: `${REGION.left * 100}%`, top: `${REGION.top * 100}%`, width: `${REGION.width * 100}%`, height: `${REGION.height * 100}%` }
const CORNERS = ['left-0 top-0 border-b-0 border-r-0 rounded-tl-[12px]', 'right-0 top-0 border-b-0 border-l-0 rounded-tr-[12px]', 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[12px]', 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-[12px]']

const { video, state: camState, torchAvailable, torchOn, start, stop, flip, toggleTorch } = useCameraScanner(onCode, () => REGION)

interface Recent { id: number; code: string; state: 'sending' | 'sent' | 'failed' }
const recent = ref<Recent[]>([])
const flash = ref(false)
let seq = 0
let lastCode = ''
let lastAt = 0

async function startCamera() {
	await nextTick()
	await start()
}

async function onCode(value: string) {
	const token = session.value?.token
	if (!token) return

	// The same barcode held in front of the camera is read many times a second; send it once per couple of seconds.
	const now = Date.now()
	if (value === lastCode && now - lastAt < 2500) return
	lastCode = value
	lastAt = now

	flash.value = true
	setTimeout(() => { flash.value = false }, 500)
	if ('vibrate' in navigator) navigator.vibrate(60)

	const item: Recent = reactive({ id: ++seq, code: value, state: 'sending' })
	recent.value = [item, ...recent.value].slice(0, 4)

	try {
		await api.send(token, value)
		item.state = 'sent'
		online.value = true
	} catch (error: any) {
		if (error?.status === 401 || error?.status === 403) return end('This phone was disconnected from the desk.')
		item.state = 'failed'
		online.value = false
	}
}

const camMessage = computed(() => {
	if (camState.value === 'blocked') return { title: 'Camera is blocked', text: "Allow camera access for this site in your browser's settings, then try again." }
	if (camState.value === 'nocamera') return { title: 'No camera found', text: "This phone's camera couldn't be opened." }
	if (camState.value === 'unsupported') {
		return import.meta.client && !window.isSecureContext
			? { title: 'The camera needs a secure connection', text: 'Open this page through the https address shown by the QR code, not an http one.' }
			: { title: "This browser can't read barcodes", text: 'Try Chrome or Safari.' }
	}
	return { title: 'Camera is off', text: 'Turn it on to scan barcodes.' }
})

onMounted(() => { void connect() })
onBeforeUnmount(() => { clearInterval(pingTimer); stop() })
</script>
