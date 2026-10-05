<template>
	<div class="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start">
		<!-- Camera -->
		<section class="rounded-2xl border border-stone-200 bg-white p-4 md:p-5" aria-label="Camera">
			<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
				<LibrarianSegmentedTabs v-model="mode" :tabs="MODES" />
				<div class="flex items-center gap-1.5">
					<span class="mr-1 inline-flex items-center gap-1.5 text-[13px] font-medium" :class="status.class">
						<i class="h-2 w-2 rounded-full" :class="status.dot" />{{ status.label }}
					</span>
					<button type="button" class="flex h-8 w-8 items-center justify-center rounded-lg text-stone-500 transition-[transform,background-color] duration-150 ease-out hover:bg-stone-100 active:scale-90"
						:aria-label="sound ? 'Turn sound off' : 'Turn sound on'" :aria-pressed="sound" @click="sound = !sound">
						<Icon :name="sound ? 'i-tabler-volume' : 'i-tabler-volume-off'" class="h-4 w-4" />
					</button>
				</div>
			</div>

			<div class="flex gap-3.5">
				<div v-if="mode === 'phone'" class="hidden w-[200px] shrink-0 rounded-2xl bg-stone-100 p-4 text-center text-[13px] leading-snug text-stone-500 sm:block">
					<Icon name="i-tabler-device-mobile" class="mx-auto mb-2 h-8 w-8 text-stone-400" />
					<b class="mb-0.5 block text-[13.5px] text-stone-900">Scanning with a phone?</b>
					Open this station link on the phone and sign in as a librarian. The back camera opens by itself.
					<ButtonsButton variant="ghost" size="sm" class="mt-3 w-full" @click="copyLink">
						<Icon name="i-tabler-copy" class="h-3.5 w-3.5" />{{ copied ? 'Copied' : 'Copy link' }}
					</ButtonsButton>
				</div>

				<div class="relative min-w-0 flex-1 overflow-hidden rounded-2xl bg-stone-900 text-white"
					:class="mode === 'phone' ? 'mx-auto aspect-[3/4] max-w-[340px]' : 'aspect-video'">
					<video ref="video" muted playsinline autoplay class="absolute inset-0 h-full w-full object-cover" :class="facing === 'user' ? '-scale-x-100' : ''" />

					<template v-if="camState === 'live'">
						<!-- The target: barcode-shaped, and the only part of the picture the decoder reads (plus a small
							 margin). Everything outside it is dimmed, so it's obvious where the ID goes. -->
						<div class="pointer-events-none absolute rounded-[10px] shadow-[0_0_0_9999px_rgba(12,10,9,.45)]" :style="frameStyle">
							<i v-for="corner in CORNERS" :key="corner" class="absolute h-6 w-6 border-[3px] transition-colors duration-150"
								:class="[corner, flash ? 'border-emerald-300' : 'border-white/90']" />
							<div v-if="!flash" class="scan-line absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
						</div>
						<p class="pointer-events-none absolute inset-x-0 bottom-3 px-3 text-center text-[14px] text-white/90">
							{{ flash ? 'Got it' : 'Bring the barcode close until it fills the box' }}
						</p>
						<div class="pointer-events-none absolute inset-0 bg-emerald-300 transition-opacity duration-300" :class="flash ? 'opacity-40' : 'opacity-0'" />

						<div class="absolute right-2.5 top-2.5 flex gap-1.5">
							<button v-if="torchAvailable" type="button" aria-label="Torch" :aria-pressed="torchOn"
								class="flex h-9 w-9 items-center justify-center rounded-full transition-[transform,background-color] duration-150 ease-out active:scale-90"
								:class="torchOn ? 'bg-amber-300 text-stone-900' : 'bg-black/45 text-white'" @click="toggleTorch">
								<Icon name="i-tabler-bolt" class="h-4 w-4" />
							</button>
							<button v-if="mode === 'phone'" type="button" aria-label="Flip camera"
								class="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white transition-transform duration-150 ease-out active:scale-90" @click="flip">
								<Icon name="i-tabler-refresh" class="h-4 w-4" />
							</button>
						</div>
					</template>

					<div v-else class="absolute inset-0 grid place-items-center bg-stone-900/80 p-4 text-center text-[14px] leading-snug">
						<div v-if="camState === 'starting'" class="flex items-center gap-2.5 text-white/85">
							<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Starting the camera…
						</div>
						<div v-else class="max-w-[320px]">
							<Icon name="i-tabler-camera-off" class="mx-auto mb-2 h-8 w-8 opacity-80" />
							<p class="mb-0.5 text-[15.5px] font-semibold">{{ camMessage.title }}</p>
							<p class="mb-3 text-white/70">{{ camMessage.text }}</p>
							<ButtonsButton v-if="camState !== 'unsupported'" class="!bg-white !text-stone-900" @click="start">
								{{ camState === 'idle' ? 'Turn on camera' : 'Try again' }}
							</ButtonsButton>
						</div>
					</div>
				</div>
			</div>

			<!-- For an ID with a damaged or unreadable barcode -->
			<form autocomplete="off" class="mt-3.5 flex gap-2" @submit.prevent="scan(code, 'typed')">
				<div class="relative min-w-0 flex-1">
					<Icon name="i-tabler-keyboard" class="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" />
					<input v-model="code" type="text" inputmode="text" enterkeyhint="go" autocomplete="off" autocapitalize="off" spellcheck="false"
						placeholder="Barcode won't read? Type the code or student number" aria-label="Type a code" :disabled="busy"
						class="h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-11 pr-3 text-[15px] text-stone-900 outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:text-stone-400 focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-200 disabled:opacity-70">
				</div>
				<ButtonsButton type="submit" variant="ghost" :disabled="busy || !code.trim()">Scan</ButtonsButton>
			</form>

			<p class="mx-0.5 mt-2.5 text-[13px] leading-relaxed text-stone-400">{{ hint }}</p>
		</section>

		<div class="grid gap-4">
			<!-- A facility was scanned: it waits here for the student's ID. -->
			<div v-if="armed" class="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3" role="status">
				<Icon name="i-tabler-device-desktop" class="h-5 w-5 shrink-0 text-amber-700" />
				<p class="min-w-0 flex-1 text-[14.5px] leading-snug text-amber-900">
					<b>{{ armed.name }}</b> is ready. Scan the student's ID to start their session.
				</p>
				<ButtonsButton variant="ghost" size="sm" @click="disarm">Cancel</ButtonsButton>
			</div>

			<!-- Result -->
			<div class="relative grid min-h-[260px] place-items-center overflow-hidden rounded-[20px] border p-6 text-center lg:min-h-[320px]"
				:class="result ? TONES[result.tone].box : 'border-dashed border-stone-300 bg-white'" aria-live="polite">
				<div v-if="!result" class="text-stone-400">
					<Icon name="i-tabler-scan" class="mx-auto mb-2 h-12 w-12" />
					<p class="text-[18px] font-semibold text-stone-600">Ready to scan</p>
					<p class="text-[14.5px]">Student IDs, borrowing receipts, reservation slips and facility labels all scan here.</p>
				</div>

				<div v-else :key="result.key" class="st-swap w-full">
					<div v-if="result.name" class="flex flex-col items-center gap-3">
						<span class="dashboard-heading flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[30px] font-extrabold text-white">
							{{ initialsOf(result.name) }}</span>
						<div class="min-w-0">
							<p class="dashboard-heading text-[30px] font-extrabold leading-tight text-stone-900">{{ result.name }}</p>
							<p class="mt-0.5 text-[15px] text-stone-500">{{ result.program }} <span v-if="result.program && result.sid">·</span> <span class="font-data">{{ result.sid }}</span></p>
						</div>
					</div>

					<span class="mt-4 inline-flex h-12 items-center gap-2 rounded-full px-5 text-[18px] font-bold" :class="TONES[result.tone].pill">
						<Icon :name="result.icon" class="h-5 w-5" />{{ result.verdict }}<span v-if="result.time" class="ml-1.5 font-semibold opacity-95">{{ result.time }}</span>
					</span>

					<p v-if="result.message" class="mx-auto mt-3 max-w-[34ch] text-[19px] font-semibold leading-snug text-stone-900">{{ result.message }}</p>
					<div v-if="result.notes.length" class="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[14.5px] text-stone-600">
						<span v-for="note in result.notes" :key="note.text" class="inline-flex items-center gap-1.5"><Icon :name="note.icon" class="h-4 w-4" />{{ note.text }}</span>
					</div>
					<ButtonsButton v-if="result.action" class="mt-4 !h-11" @click="result.action.run()">
						<Icon :name="result.action.icon" class="h-4 w-4" />{{ result.action.label }}
					</ButtonsButton>
				</div>

				<i v-if="result" :key="`bar-${result.key}`" class="scan-clear absolute bottom-0 left-0 block h-1 w-full origin-left opacity-40" :class="TONES[result.tone].bar" />
			</div>

			<!-- Recent scans -->
			<section class="overflow-hidden rounded-2xl border border-stone-200 bg-white" aria-label="Recent scans">
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
import { librarianService, type AttendanceScanResult, type ScanResult } from '~/services/librarianService'
import type { ScanRegion } from '~/composables/useCameraScanner'

const emit = defineEmits<{
	(e: 'scanned'): void
	/** A borrowing receipt was scanned: the book is in the librarian's hands and needs checking. */
	(e: 'check-loan', loan: { loanUuid: string; bookTitle: string; accessionNumber: number; studentName: string }): void
	/** A reservation slip was scanned: open the checkout for it. */
	(e: 'open-checkout', code: string): void
}>()

type Mode = 'webcam' | 'phone'
type Via = Mode | 'typed'
type Tone = 'in' | 'out' | 'err' | 'warn'

const MODES = [
	{ label: 'Webcam', value: 'webcam' },
	{ label: 'Phone camera', value: 'phone' },
]
const VIA: Record<Via, string> = { webcam: 'webcam', phone: 'phone', typed: 'typed number' }
const CORNERS = ['left-0 top-0 border-b-0 border-r-0 rounded-tl-[10px]', 'right-0 top-0 border-b-0 border-l-0 rounded-tr-[10px]', 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[10px]', 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-[10px]']

const TONES: Record<Tone, { box: string; pill: string; bar: string; dot: string }> = {
	in: { box: 'border-emerald-200 bg-emerald-50', pill: 'bg-emerald-600 text-white', bar: 'bg-emerald-600', dot: 'bg-emerald-50 text-emerald-700' },
	out: { box: 'border-accent-200 bg-accent-100', pill: 'bg-accent-500 text-white', bar: 'bg-accent-500', dot: 'bg-accent-100 text-accent-600' },
	err: { box: 'border-red-200 bg-red-50', pill: 'bg-red-600 text-white', bar: 'bg-red-600', dot: 'bg-red-50 text-red-600' },
	warn: { box: 'border-amber-200 bg-amber-50', pill: 'bg-amber-600 text-white', bar: 'bg-amber-600', dot: 'bg-amber-50 text-amber-700' },
}

interface ResultView { key: number; tone: Tone; icon: string; verdict: string; time?: string; name?: string; program?: string | null; sid?: string; message?: string; notes: { icon: string; text: string }[]; sub?: string; action?: { label: string; icon: string; run: () => void } }
interface FeedItem { key: number; tone: Tone; icon: string; title: string; sub: string; at: string; via: Via }

const mode = ref<Mode>('webcam')
const sound = ref(true)
const code = ref('')
const busy = ref(false)
const copied = ref(false)
const flash = ref(false)
const result = ref<ResultView | null>(null)
const feed = ref<FeedItem[]>([])

let seq = 0
let lastRaw = ''
let lastRawAt = 0
let clearTimer: ReturnType<typeof setTimeout> | undefined
const paused = ref(false)

/* ---------- camera ---------- */
// The target box, as fractions of the camera view. Wide and short like a barcode, and smaller than the
// view, so students bring the ID close enough for the bars to be sharp instead of holding it back to
// fit a big frame. The decoder crops to this same box, so what's drawn is what's read.
const REGIONS: Record<Mode, ScanRegion> = {
	webcam: { left: 0.2, top: 0.34, width: 0.6, height: 0.32 },
	phone: { left: 0.08, top: 0.38, width: 0.84, height: 0.22 },
}
const frameStyle = computed(() => {
	const r = REGIONS[mode.value]
	return { left: `${r.left * 100}%`, top: `${r.top * 100}%`, width: `${r.width * 100}%`, height: `${r.height * 100}%` }
})

const { video, state: camState, facing, torchAvailable, torchOn, start, stop, flip, toggleTorch } =
	useCameraScanner(onCameraCode, () => REGIONS[mode.value])

// A read flashes the frame and pauses for a moment, so one ID held up is never counted twice.
function onCameraCode(value: string) {
	if (paused.value) return
	paused.value = true
	flash.value = true
	void scan(value, mode.value)
	setTimeout(() => { flash.value = false; paused.value = false }, 1600)
}

const camMessage = computed(() => {
	if (camState.value === 'blocked') return { title: 'Camera is blocked', text: "Allow camera access in your browser's site settings. You can still type a student number below." }
	if (camState.value === 'nocamera') return { title: 'No camera found', text: 'Plug in a webcam, or open this station on a phone instead.' }
	if (camState.value === 'unsupported') {
		return import.meta.client && !window.isSecureContext
			? { title: 'The camera needs a secure connection', text: 'Open this site over https (or on localhost). Browsers block the camera on plain http.' }
			: { title: "This browser can't read barcodes", text: 'Try Chrome or Edge.' }
	}
	return { title: 'Camera is off', text: mode.value === 'phone' ? 'Turn it on to scan barcodes with this phone.' : 'Turn on the webcam to scan barcodes by holding them up.' }
})

const status = computed(() => {
	if (busy.value) return { label: 'Checking…', class: 'text-amber-700', dot: 'bg-amber-600' }
	if (camState.value === 'live') return { label: paused.value ? 'Paused' : 'Camera live', class: 'text-emerald-700', dot: 'bg-emerald-600' }
	if (camState.value === 'starting') return { label: 'Starting camera…', class: 'text-amber-700', dot: 'bg-amber-600' }
	return camState.value === 'idle' ? { label: 'Camera off', class: 'text-stone-400', dot: 'bg-stone-400' } : { label: 'Camera unavailable', class: 'text-red-600', dot: 'bg-red-500' }
})

const hint = computed(() => mode.value === 'webcam'
	? 'Hold the barcode about 15–25 cm from the webcam. It reads on its own and pauses for a moment after each scan, so one code is never counted twice.'
	: 'On a phone the camera fills the screen, the phone vibrates on a good read, and the screen stays awake. The torch helps in dim rooms.')

/* ---------- scanning ---------- */
const clock = (d = new Date()) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

async function scan(raw: string, via: Via) {
	const value = raw.replace(/[\r\n\t]/g, '').trim()
	if (!value || busy.value) return

	// The same code twice in quick succession is one ID held up for a moment too long.
	if (value === lastRaw && Date.now() - lastRawAt < 3000) {
		code.value = ''
		return
	}
	lastRaw = value
	lastRawAt = Date.now()
	busy.value = true

	try {
		const res = await librarianService.scan(value, armed.value?.resID)
		show(fromResult(res), via)
		if (res.type === 'attendance' || res.type === 'facility_started' || res.type === 'facility_ended') emit('scanned')
	} catch (error: any) {
		const reachable = !!error?.response
		const message = reachable
			? (apiFieldErrors(error).barcodeValue || apiErrorMessage(error, 'Could not scan that.'))
			: "Can't reach the server. Check the connection and try again."
		const tone: Tone = /just scanned/i.test(message) ? 'warn' : 'err'
		show({ key: ++seq, tone, icon: tone === 'warn' ? 'i-tabler-clock' : 'i-tabler-circle-x', verdict: tone === 'warn' ? 'Too soon' : 'Not done', message, notes: [], sub: message }, via)
	} finally {
		busy.value = false
		code.value = ''
	}
}

/* ---------- a facility waiting for a student ---------- */
// Scanning a computer or study room's label arms it; the next student ID scanned starts their session on it.
const armed = ref<{ resID: number; name: string } | null>(null)
let armedTimer: ReturnType<typeof setTimeout> | undefined
const ARMED_MS = 60_000

function arm(facility: { resID: number; name: string }) {
	armed.value = { resID: facility.resID, name: facility.name }
	clearTimeout(armedTimer)
	armedTimer = setTimeout(() => { armed.value = null }, ARMED_MS)
}

function disarm() {
	armed.value = null
	clearTimeout(armedTimer)
}

/** One result for every kind of scan: what to show, and the next step when there is one. */
function fromResult(res: ScanResult): ResultView {
	const key = ++seq

	switch (res.type) {
		case 'attendance':
			disarm()
			return fromAttendance(res)

		case 'loan_received': {
			const l = res.loan
			const notes: ResultView['notes'] = [{ icon: 'i-tabler-checklist', text: 'Check the book for damage' }]
			if (l.wasLate) notes.push({ icon: 'i-tabler-alert-circle', text: l.fineAmount > 0 ? `Late · fine ${formatPeso(l.fineAmount)}` : 'Returned late' })
			return {
				key, tone: 'warn', icon: 'i-tabler-book-download', verdict: 'Book received', name: l.studentName, sid: l.studentIDNumber,
				message: l.bookTitle, notes, sub: `Received · ${l.bookTitle}`,
				action: { label: 'Check the book now', icon: 'i-tabler-checklist', run: () => emit('check-loan', { loanUuid: l.uuid, bookTitle: l.bookTitle, accessionNumber: l.accessionNumber, studentName: l.studentName }) },
			}
		}

		case 'reservation': {
			const r = res.reservation
			return {
				key, tone: 'in', icon: 'i-tabler-bookmark', verdict: 'Reservation found', name: r.studentName, sid: r.studentIDNumber,
				message: r.bookTitle, notes: [], sub: `Reservation · ${r.bookTitle}`,
				action: { label: 'Open checkout', icon: 'i-tabler-arrow-right', run: () => emit('open-checkout', r.pickupCode) },
			}
		}

		case 'facility':
			arm(res.resource)
			return { key, tone: 'warn', icon: 'i-tabler-device-desktop', verdict: res.resource.name, message: "Scan the student's ID to start their session.", notes: [], sub: `${res.resource.name} ready` }

		case 'facility_started':
			disarm()
			return {
				key, tone: 'in', icon: 'i-tabler-player-play', verdict: `${res.resource.name} started`, name: res.student.name, program: res.student.program,
				sid: res.student.studentIDNumber, notes: [], sub: `Started ${res.resource.name}`,
			}

		case 'facility_ended':
			disarm()
			return {
				key, tone: 'out', icon: 'i-tabler-player-stop', verdict: `${res.resource.name} free again`, name: res.student,
				notes: [{ icon: 'i-tabler-clock', text: `Used for ${formatMinutes(res.minutes)}` }], sub: `Ended ${res.resource.name} · ${formatMinutes(res.minutes)}`,
			}
	}
}

function fromAttendance(res: AttendanceScanResult): ResultView {
	const checkIn = res.action === 'check_in'
	const notes: ResultView['notes'] = []

	if (!checkIn && res.durationMinutes != null) notes.push({ icon: 'i-tabler-clock', text: `Stayed ${formatMinutes(res.durationMinutes)}` })
	if (checkIn && res.student.visitStreak > 1) notes.push({ icon: 'i-tabler-flame', text: `${res.student.visitStreak}-day streak` })
	for (const closed of res.autoClosed) notes.push({ icon: 'i-tabler-alert-circle', text: `Yesterday's visit was closed at ${formatTime(closed.exitTime)}` })

	return {
		key: ++seq, tone: checkIn ? 'in' : 'out', icon: checkIn ? 'i-tabler-login' : 'i-tabler-logout', verdict: checkIn ? 'Checked in' : 'Checked out',
		time: formatTime(checkIn ? res.log.entryTime : (res.log.exitTime ?? res.log.entryTime)),
		name: res.student.name, program: res.student.program, sid: res.student.studentIDNumber, notes,
		sub: checkIn ? 'Checked in' : `Checked out · ${formatMinutes(res.durationMinutes ?? 0)}`,
	}
}

const formatMinutes = (m: number) => (m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`)

function show(view: ResultView, via: Via) {
	result.value = view
	clearTimeout(clearTimer)
	// A result with a next step (check the book, open the checkout) stays up long enough to use it.
	clearTimer = setTimeout(() => { result.value = null }, view.action ? 20_000 : 4000)

	feed.value = [{
		key: view.key, tone: view.tone, icon: view.icon,
		title: view.name ?? view.verdict,
		sub: view.sub ?? view.message ?? '',
		at: clock(), via,
	}, ...feed.value].slice(0, 8)

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
	if ('vibrate' in navigator) navigator.vibrate(tone_ === 'in' || tone_ === 'out' ? 60 : [40, 60, 40])
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
	void start()
})

onMounted(() => {
	// Phones start on the phone layout; a desk keeps whichever mode it used last.
	let saved: string | null = null
	try { saved = localStorage.getItem(STORAGE_KEY) } catch { /* private window */ }
	const initial: Mode = saved === 'webcam' || saved === 'phone'
		? saved
		: window.matchMedia('(pointer: coarse)').matches ? 'phone' : 'webcam'

	// Setting the mode starts the camera through the watcher; if it's unchanged, start it here.
	if (initial !== mode.value) mode.value = initial
	else void start()
})

onBeforeUnmount(() => {
	stop()
	clearTimeout(clearTimer)
	clearTimeout(armedTimer)
})
</script>

<style scoped>
/* Sweeps the height of the frame, whatever size the frame is. */
.scan-line {
	animation: scanSweep 1.8s ease-in-out infinite alternate;
}

@keyframes scanSweep {
	from {
		top: 12%;
	}

	to {
		top: 88%;
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
