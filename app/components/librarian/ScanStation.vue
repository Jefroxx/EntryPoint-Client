<template>
	<div :class="kiosk ? 'fixed inset-0 z-[90] overflow-auto bg-amber-50 p-4 md:p-8' : ''">
		<div class="grid gap-4" :class="kiosk ? 'mx-auto max-w-[900px]' : 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start'">
			<section class="rounded-2xl border border-stone-200 bg-white p-4 md:p-[18px]" aria-label="Scan station">
				<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
					<p class="text-[12px] font-semibold uppercase tracking-[.08em] text-stone-400">Scan station</p>
					<div class="flex items-center gap-1.5">
						<span class="mr-1 inline-flex items-center gap-1.5 text-[13px] font-medium" :class="status.class">
							<i class="h-2 w-2 rounded-full" :class="status.dot" />{{ status.label }}
						</span>
						<button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 active:scale-90"
							:aria-label="sound ? 'Turn sound off' : 'Turn sound on'" :aria-pressed="sound" @click="sound = !sound">
							<Icon :name="sound ? 'i-tabler-volume' : 'i-tabler-volume-off'" class="h-4 w-4" />
						</button>
						<button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 active:scale-90"
							:aria-label="kiosk ? 'Exit full screen' : 'Full screen'" @click="toggleKiosk">
							<Icon :name="kiosk ? 'i-tabler-minimize' : 'i-tabler-maximize'" class="h-4 w-4" />
						</button>
					</div>
				</div>

				<LibrarianSegmentedTabs v-model="mode" class="mb-3.5 !flex" :tabs="MODES" />

				<!-- Webcam / phone camera -->
				<div v-if="mode !== 'hardware'" class="mb-3.5 flex gap-3.5">
					<div v-if="mode === 'phone'" class="hidden w-[190px] shrink-0 rounded-2xl bg-stone-100 p-3.5 text-center text-[13px] leading-snug text-stone-500 sm:block">
						<Icon name="i-tabler-device-mobile" class="mx-auto mb-2 h-8 w-8 text-stone-400" />
						<b class="mb-0.5 block text-[13.5px] text-stone-900">Use your phone</b>
						Open this page on your phone and sign in. The back camera opens by itself.
						<ButtonsButton variant="ghost" size="sm" class="mt-3 w-full" @click="copyLink">
							<Icon name="i-tabler-copy" class="h-3.5 w-3.5" />{{ copied ? 'Copied' : 'Copy link' }}
						</ButtonsButton>
					</div>

					<div class="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-stone-900 text-white"
						:class="mode === 'phone' ? 'mx-auto aspect-[3/4] max-w-[280px]' : 'aspect-video'">
						<video ref="video" muted playsinline autoplay class="absolute inset-0 h-full w-full object-cover" :class="facing === 'user' ? '-scale-x-100' : ''" />

						<template v-if="camState === 'live'">
							<div class="pointer-events-none absolute inset-x-[12%] inset-y-[26%]" :class="mode === 'phone' ? '!inset-x-[9%] !inset-y-[34%]' : ''">
								<i v-for="corner in CORNERS" :key="corner" class="absolute h-6 w-6 border-[3px] transition-colors duration-150"
									:class="[corner, flash ? 'border-emerald-300' : 'border-white/90']" />
							</div>
							<div v-if="!flash" class="scan-line pointer-events-none absolute inset-x-[12%] top-[26%] h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent"
								:class="mode === 'phone' ? '!inset-x-[9%] !top-[34%]' : ''" />
							<p class="pointer-events-none absolute inset-x-0 bottom-3 text-center text-[13px] text-white/85">{{ flash ? 'Got it' : 'Hold the barcode inside the frame' }}</p>
							<div class="pointer-events-none absolute inset-0 bg-emerald-300 transition-opacity duration-300" :class="flash ? 'opacity-40' : 'opacity-0'" />

							<div class="absolute right-2.5 top-2.5 flex gap-1.5">
								<button v-if="torchAvailable" type="button" aria-label="Torch" :aria-pressed="torchOn"
									class="flex h-8 w-8 items-center justify-center rounded-full transition-[transform,background-color] duration-150 ease-out active:scale-90"
									:class="torchOn ? 'bg-amber-300 text-stone-900' : 'bg-black/45 text-white'" @click="toggleTorch">
									<Icon name="i-tabler-bolt" class="h-4 w-4" />
								</button>
								<button v-if="mode === 'phone'" type="button" aria-label="Flip camera"
									class="flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white transition-transform duration-150 ease-out active:scale-90" @click="flip">
									<Icon name="i-tabler-refresh" class="h-4 w-4" />
								</button>
							</div>
						</template>

						<div v-else class="absolute inset-0 grid place-items-center bg-stone-900/80 p-4 text-center text-[14px] leading-snug">
							<div v-if="camState === 'starting'" class="flex items-center gap-2.5 text-white/85">
								<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Starting the camera…
							</div>
							<div v-else class="max-w-[300px]">
								<Icon name="i-tabler-camera-off" class="mx-auto mb-2 h-8 w-8 opacity-80" />
								<p class="mb-0.5 text-[15.5px] font-semibold">{{ camMessage.title }}</p>
								<p class="mb-3 text-white/70">{{ camMessage.text }}</p>
								<div class="flex flex-wrap justify-center gap-2">
									<ButtonsButton v-if="camState !== 'unsupported'" class="!bg-white !text-stone-900" @click="start">{{ camState === 'idle' ? 'Turn on camera' : 'Try again' }}</ButtonsButton>
									<ButtonsButton variant="ghost" class="!border-white/40 !bg-transparent !text-white" @click="mode = 'hardware'">Use the scanner</ButtonsButton>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Scanner input (also the typed fallback in every mode) -->
				<form autocomplete="off" @submit.prevent="scan(code)">
					<div class="relative">
						<Icon name="i-tabler-barcode" class="pointer-events-none absolute left-4 top-1/2 h-[22px] w-[22px] -translate-y-1/2 text-stone-400" />
						<input ref="input" v-model="code" type="text" inputmode="text" enterkeyhint="done" autocomplete="off" autocapitalize="off" spellcheck="false"
							placeholder="Scan an ID, or type a student number" aria-label="Scan an ID or type a student number" :disabled="busy"
							class="w-full rounded-2xl border-2 border-stone-200 bg-stone-50 pl-[52px] pr-4 font-medium tracking-wide text-stone-900 outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:font-normal placeholder:tracking-normal placeholder:text-stone-400 focus:border-accent-500 focus:bg-white focus:ring-4 focus:ring-accent-100 disabled:opacity-70"
							:class="mode === 'hardware' ? 'h-[60px] text-[18px]' : 'h-12 text-[16px]'" @blur="onBlur" @focus="lost = false">
					</div>
				</form>
				<button v-if="lost && mode === 'hardware'" type="button" class="mt-2.5 w-full rounded-[10px] bg-amber-50 px-3 py-2 text-left text-[13.5px] text-amber-700" @click="refocus">
					The scanner isn't listening. Click here (or just scan) to start again.
				</button>

				<!-- Result -->
				<div class="relative mt-3.5 grid place-items-center overflow-hidden rounded-[20px] border p-5 text-center"
					:class="[result ? TONES[result.tone].box : 'border-dashed border-stone-200 bg-stone-50', kiosk ? 'min-h-[min(50dvh,480px)]' : 'min-h-[170px]']" aria-live="polite">
					<div v-if="!result" class="text-stone-400">
						<Icon :name="mode === 'hardware' ? 'i-tabler-barcode' : 'i-tabler-camera'" class="mx-auto mb-2 h-10 w-10" />
						<p class="text-[16px] font-semibold text-stone-600">Ready to scan</p>
						<p class="text-[14px]">{{ mode === 'hardware' ? 'Hold the ID under the scanner.' : 'Hold the ID up to the camera.' }}</p>
					</div>

					<div v-else :key="result.key" class="st-swap w-full">
						<div v-if="result.name" class="flex items-center justify-center gap-3.5">
							<span class="dashboard-heading flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 font-extrabold text-white"
								:class="kiosk ? 'h-20 w-20 text-[30px]' : 'h-14 w-14 text-[20px]'">{{ initialsOf(result.name) }}</span>
							<div class="min-w-0 text-left">
								<p class="dashboard-heading font-extrabold leading-tight text-stone-900" :class="kiosk ? 'text-[40px]' : 'text-[24px]'">{{ result.name }}</p>
								<p class="mt-0.5 text-stone-500" :class="kiosk ? 'text-[17px]' : 'text-[14px]'">{{ result.program }} <span v-if="result.program && result.sid">·</span> <span class="font-data">{{ result.sid }}</span></p>
							</div>
						</div>

						<span class="mt-3.5 inline-flex items-center gap-2 rounded-full font-bold" :class="[TONES[result.tone].pill, kiosk ? 'h-14 px-6 text-[22px]' : 'h-[38px] px-4 text-[15px]']">
							<Icon :name="result.icon" class="h-[18px] w-[18px]" />{{ result.verdict }}<span v-if="result.time" class="ml-1.5 font-semibold opacity-95">{{ result.time }}</span>
						</span>

						<p v-if="result.message" class="mx-auto mt-2.5 max-w-[34ch] font-semibold leading-snug text-stone-900" :class="kiosk ? 'text-[26px]' : 'text-[17px]'">{{ result.message }}</p>
						<div v-if="result.notes.length" class="mt-2.5 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[14px] text-stone-600">
							<span v-for="note in result.notes" :key="note.text" class="inline-flex items-center gap-1.5"><Icon :name="note.icon" class="h-4 w-4" />{{ note.text }}</span>
						</div>
					</div>

					<i v-if="result" :key="`bar-${result.key}`" class="scan-clear absolute bottom-0 left-0 block h-1 w-full origin-left opacity-40" :class="TONES[result.tone].bar" />
				</div>

				<p v-if="!kiosk" class="mx-0.5 mt-2.5 text-[13.5px] leading-relaxed text-stone-400">{{ hint }}</p>
			</section>

			<!-- Recent scans -->
			<section v-if="!kiosk" class="overflow-hidden rounded-2xl border border-stone-200 bg-white" aria-label="Recent scans">
				<p class="px-4 pb-1 pt-4 text-[12px] font-semibold uppercase tracking-[.08em] text-stone-400">Recent scans</p>
				<p v-if="!feed.length" class="px-4 pb-5 pt-2 text-center text-[14px] text-stone-400">Nothing scanned yet this session.</p>
				<TransitionGroup v-else tag="div" class="pb-1.5" enter-active-class="transition-[transform,opacity] duration-[250ms] ease-out" enter-from-class="-translate-y-2 opacity-0"
					move-class="transition-transform duration-200 ease-out">
					<div v-for="item in feed" :key="item.key" class="flex items-center gap-3 border-b border-stone-100 px-4 py-2.5 last:border-0">
						<span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]" :class="TONES[item.tone].dot"><Icon :name="item.icon" class="h-4 w-4" /></span>
						<div class="min-w-0 flex-1">
							<p class="truncate text-[15px] font-semibold text-stone-900">{{ item.title }}<span class="ml-1.5 text-[11.5px] font-medium text-stone-400">via {{ VIA[item.via] }}</span></p>
							<p class="truncate text-[13px] text-stone-400">{{ item.sub }}</p>
						</div>
						<span class="shrink-0 text-[13px] text-stone-400">{{ item.at }}</span>
					</div>
				</TransitionGroup>
			</section>
		</div>
	</div>
</template>

<script setup lang="ts">
import { librarianService, type AttendanceScanResult } from '~/services/librarianService'

const emit = defineEmits<{ (e: 'scanned'): void }>()

type Mode = 'hardware' | 'webcam' | 'phone'
type Tone = 'in' | 'out' | 'err' | 'warn'

const MODES = [
	{ label: 'Scanner', value: 'hardware' },
	{ label: 'Webcam', value: 'webcam' },
	{ label: 'Phone camera', value: 'phone' },
]
const VIA: Record<Mode, string> = { hardware: 'scanner', webcam: 'webcam', phone: 'phone' }
const CORNERS = ['left-0 top-0 border-b-0 border-r-0 rounded-tl-[10px]', 'right-0 top-0 border-b-0 border-l-0 rounded-tr-[10px]', 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[10px]', 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-[10px]']

const TONES: Record<Tone, { box: string; pill: string; bar: string; dot: string }> = {
	in: { box: 'border-emerald-200 bg-emerald-50', pill: 'bg-emerald-600 text-white', bar: 'bg-emerald-600', dot: 'bg-emerald-50 text-emerald-700' },
	out: { box: 'border-accent-200 bg-accent-100', pill: 'bg-accent-500 text-white', bar: 'bg-accent-500', dot: 'bg-accent-100 text-accent-600' },
	err: { box: 'border-red-200 bg-red-50', pill: 'bg-red-600 text-white', bar: 'bg-red-600', dot: 'bg-red-50 text-red-600' },
	warn: { box: 'border-amber-200 bg-amber-50', pill: 'bg-amber-600 text-white', bar: 'bg-amber-600', dot: 'bg-amber-50 text-amber-700' },
}

interface ResultView { key: number; tone: Tone; icon: string; verdict: string; time?: string; name?: string; program?: string | null; sid?: string; message?: string; notes: { icon: string; text: string }[] }
interface FeedItem { key: number; tone: Tone; icon: string; title: string; sub: string; at: string; via: Mode }

const mode = ref<Mode>('hardware')
const sound = ref(true)
const kiosk = ref(false)
const code = ref('')
const busy = ref(false)
const lost = ref(false)
const copied = ref(false)
const flash = ref(false)
const result = ref<ResultView | null>(null)
const feed = ref<FeedItem[]>([])
const input = ref<HTMLInputElement | null>(null)

let seq = 0
let lastRaw = ''
let lastRawAt = 0
let clearTimer: ReturnType<typeof setTimeout> | undefined
const paused = ref(false)

/* ---------- camera ---------- */
const { video, state: camState, facing, torchAvailable, torchOn, start, stop, flip, toggleTorch } = useCameraScanner(onCameraCode)

// A read flashes the frame and pauses for a moment, so one ID held up is never counted twice.
function onCameraCode(value: string) {
	if (paused.value) return
	paused.value = true
	flash.value = true
	void scan(value, mode.value)
	setTimeout(() => { flash.value = false; paused.value = false }, 1600)
}

const camMessage = computed(() => {
	if (camState.value === 'blocked') return { title: 'Camera is blocked', text: "Allow camera access in your browser's site settings, or use another scanner. You can always type the student number below." }
	if (camState.value === 'nocamera') return { title: 'No camera found', text: 'Plug in a webcam, or use the scanner or the phone camera instead.' }
	if (camState.value === 'unsupported') {
		return import.meta.client && !window.isSecureContext
			? { title: 'The camera needs a secure connection', text: 'Open this site over https (or on localhost). Browsers block the camera on plain http.' }
			: { title: "This browser can't read barcodes", text: 'Try Chrome or Edge, or use the scanner.' }
	}
	return { title: 'Camera is off', text: mode.value === 'phone' ? 'Turn it on to scan IDs with this phone.' : 'Turn on the webcam to scan IDs by holding them up.' }
})

const status = computed(() => {
	if (busy.value) return { label: 'Checking…', class: 'text-amber-700', dot: 'bg-amber-600' }
	if (mode.value === 'hardware') return lost.value ? { label: 'Not listening', class: 'text-red-600', dot: 'bg-red-500' } : { label: 'Scanner ready', class: 'text-emerald-700', dot: 'bg-emerald-600' }
	if (camState.value === 'live') return { label: paused.value ? 'Paused' : 'Camera live', class: 'text-emerald-700', dot: 'bg-emerald-600' }
	if (camState.value === 'starting') return { label: 'Starting camera…', class: 'text-amber-700', dot: 'bg-amber-600' }
	return camState.value === 'idle' ? { label: 'Camera off', class: 'text-stone-400', dot: 'bg-stone-400' } : { label: 'Camera unavailable', class: 'text-red-600', dot: 'bg-red-500' }
})

const hint = computed(() => mode.value === 'hardware'
	? 'Hardware scanners type the code and press Enter, so nothing needs clicking. The field refocuses after every scan, and any key you type re-captures it.'
	: mode.value === 'webcam'
		? 'Hold the barcode about 15–25 cm from the webcam. It reads on its own and pauses for a moment after each scan, so one ID is never counted twice.'
		: 'On a phone the camera fills the screen, the phone vibrates on a good read, and the screen stays awake. The torch helps in dim rooms.')

/* ---------- scanning ---------- */
const clock = (d = new Date()) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

async function scan(raw: string, via: Mode = mode.value) {
	const value = raw.replace(/[\r\n\t]/g, '').trim()
	if (!value || busy.value) return

	// Scanners often read a code twice in a row: the second read is ignored.
	if (value === lastRaw && Date.now() - lastRawAt < 3000) {
		code.value = ''
		return
	}
	lastRaw = value
	lastRawAt = Date.now()
	busy.value = true

	try {
		const res = await librarianService.scanAttendance(value)
		show(fromSuccess(res), res, via)
		emit('scanned')
	} catch (error: any) {
		const reachable = !!error?.response
		const message = reachable
			? (apiFieldErrors(error).barcodeValue || apiErrorMessage(error, 'Could not scan that.'))
			: "Can't reach the server. Check the connection and try again."
		const tone: Tone = /just scanned/i.test(message) ? 'warn' : 'err'
		show({ key: ++seq, tone, icon: tone === 'warn' ? 'i-tabler-clock' : 'i-tabler-circle-x', verdict: tone === 'warn' ? 'Too soon' : 'Not checked in', message, notes: [] }, null, via)
	} finally {
		busy.value = false
		code.value = ''
		await nextTick()
		refocus()
	}
}

function fromSuccess(res: AttendanceScanResult): ResultView {
	const checkIn = res.action === 'check_in'
	const notes: ResultView['notes'] = []

	if (!checkIn && res.durationMinutes != null) notes.push({ icon: 'i-tabler-clock', text: `Stayed ${formatMinutes(res.durationMinutes)}` })
	if (checkIn && res.student.visitStreak > 1) notes.push({ icon: 'i-tabler-flame', text: `${res.student.visitStreak}-day streak` })
	for (const closed of res.autoClosed) notes.push({ icon: 'i-tabler-alert-circle', text: `Yesterday's visit was closed at ${formatTime(closed.exitTime)}` })

	return {
		key: ++seq, tone: checkIn ? 'in' : 'out', icon: checkIn ? 'i-tabler-login' : 'i-tabler-logout', verdict: checkIn ? 'Checked in' : 'Checked out',
		time: formatTime(checkIn ? res.log.entryTime : (res.log.exitTime ?? res.log.entryTime)),
		name: res.student.name, program: res.student.program, sid: res.student.studentIDNumber, notes,
	}
}

const formatMinutes = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`)

function show(view: ResultView, res: AttendanceScanResult | null, via: Mode) {
	result.value = view
	clearTimeout(clearTimer)
	clearTimer = setTimeout(() => { result.value = null }, 4000)

	feed.value = [{
		key: view.key, tone: view.tone, icon: view.tone === 'in' ? 'i-tabler-login' : view.tone === 'out' ? 'i-tabler-logout' : view.tone === 'warn' ? 'i-tabler-clock' : 'i-tabler-circle-x',
		title: view.name ?? 'Unknown scan',
		sub: res ? (res.action === 'check_in' ? 'Checked in' : `Checked out · ${formatMinutes(res.durationMinutes ?? 0)}`) : (view.message ?? ''),
		at: clock(), via,
	}, ...feed.value].slice(0, 6)

	feedback(view.tone)
}

/* ---------- sound + vibration ---------- */
let audio: AudioContext | null = null

function tone(freq: number, at: number, length: number, type: OscillatorType = 'sine') {
	try {
		audio ??= new AudioContext()
		const t = audio.currentTime + at
		const osc = audio.createOscillator()
		const gain = audio.createGain()
		osc.type = type
		osc.frequency.value = freq
		gain.gain.setValueAtTime(0.0001, t)
		gain.gain.exponentialRampToValueAtTime(0.16, t + 0.012)
		gain.gain.exponentialRampToValueAtTime(0.0001, t + length)
		osc.connect(gain)
		gain.connect(audio.destination)
		osc.start(t)
		osc.stop(t + length + 0.02)
	} catch {
		// No audio available: the visual result is enough.
	}
}

function feedback(tone_: Tone) {
	if (sound.value) {
		if (tone_ === 'in') { tone(660, 0, 0.09); tone(880, 0.1, 0.12) }
		else if (tone_ === 'out') { tone(880, 0, 0.09); tone(660, 0.1, 0.12) }
		else if (tone_ === 'warn') tone(440, 0, 0.14, 'triangle')
		else tone(196, 0, 0.2, 'square')
	}
	if (mode.value !== 'hardware' && 'vibrate' in navigator) navigator.vibrate(tone_ === 'in' || tone_ === 'out' ? 60 : [40, 60, 40])
}

/* ---------- focus + keyboard (hardware scanner) ---------- */
function refocus() {
	if (mode.value !== 'hardware' || !input.value || input.value.disabled) return
	input.value.focus({ preventScroll: true })
}

function onBlur() {
	setTimeout(() => { lost.value = mode.value === 'hardware' && document.activeElement !== input.value && !busy.value }, 200)
}

// Anything typed while focus is elsewhere goes to the scanner (unless you're typing in another field).
function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape' && kiosk.value) return void toggleKiosk()
	if (mode.value !== 'hardware' || event.metaKey || event.ctrlKey || event.altKey || event.key.length !== 1) return
	if ((event.target as HTMLElement | null)?.closest('input, textarea, select, [contenteditable]')) return
	refocus()
}

function toggleKiosk() {
	kiosk.value = !kiosk.value
	document.documentElement.style.overflow = kiosk.value ? 'hidden' : ''
	void nextTick(refocus)
}

async function copyLink() {
	try {
		await navigator.clipboard.writeText(location.href)
		copied.value = true
		setTimeout(() => { copied.value = false }, 1800)
	} catch {
		// Clipboard blocked: the address bar still has the link.
	}
}

/* ---------- mode + lifecycle ---------- */
const STORAGE_KEY = 'librarian-scan-mode'

watch(mode, (next) => {
	try { localStorage.setItem(STORAGE_KEY, next) } catch { /* private window */ }
	lost.value = false
	if (next === 'hardware') {
		stop()
		void nextTick(refocus)
	} else {
		void nextTick(start)
	}
})

onMounted(() => {
	window.addEventListener('keydown', onKeydown)

	// A station left on the webcam or phone comes back the way it was.
	try {
		const saved = localStorage.getItem(STORAGE_KEY)
		if (saved === 'webcam' || saved === 'phone') mode.value = saved
	} catch { /* private window */ }

	refocus()
})

onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown)
	clearTimeout(clearTimer)
	document.documentElement.style.overflow = ''
})
</script>

<style scoped>
.scan-line {
	animation: scanSweep 2.2s ease-in-out infinite alternate;
}

@keyframes scanSweep {
	from {
		transform: translateY(0);
	}

	to {
		transform: translateY(78px);
	}
}

.scan-clear {
	animation: scanClear 4s linear forwards;
}

@keyframes scanClear {
	to {
		transform: scaleX(0);
	}
}

@media (prefers-reduced-motion: reduce) {
	.scan-line {
		animation: none;
	}

	.scan-clear {
		animation-duration: .01s;
	}
}
</style>
