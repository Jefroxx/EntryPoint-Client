<template>
	<LibrarianModalShell :open="open" size="lg" title="Scan to check out" subtitle="Scan the student's reservation pickup slip." @close="emit('close')">
		<div v-if="reservation" class="space-y-4">
			<!-- Whose reservation this is, so a scan can be checked against it by eye as well. -->
			<section class="rounded-xl border border-stone-200 bg-stone-50 p-4">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="text-[15.5px] font-bold leading-snug text-stone-900">{{ reservation.book?.title ?? 'Removed book' }}</p>
						<p class="text-[14px] text-stone-600">
							for <b class="text-stone-800">{{ personName(reservation.student?.user) }}</b>
							<span class="font-data text-[13px]"> · {{ reservation.student?.studentIDNumber }}</span>
						</p>
					</div>
					<span class="font-data shrink-0 rounded-lg bg-white px-2.5 py-1 text-[13px] font-semibold text-stone-700 ring-1 ring-stone-200">{{ reservation.pickupCode }}</span>
				</div>
			</section>

			<!-- Waiting for a scan -->
			<div class="relative overflow-hidden rounded-2xl bg-stone-900 text-white" style="aspect-ratio: 16 / 7">
				<video ref="video" muted playsinline autoplay class="absolute inset-0 h-full w-full object-cover" />

				<template v-if="camState === 'live'">
					<div class="pointer-events-none absolute rounded-[10px] shadow-[0_0_0_9999px_rgba(12,10,9,.45)]" :style="frameStyle">
						<i v-for="corner in CORNERS" :key="corner" class="absolute h-6 w-6 border-[3px] transition-colors duration-150"
							:class="[corner, outcome === 'matched' ? 'border-emerald-300' : outcome === 'wrong' ? 'border-red-400' : 'border-white/90']" />
						<div v-if="outcome === 'waiting'" class="scan-line absolute inset-x-2 h-0.5 bg-gradient-to-r from-transparent via-red-400 to-transparent" />
					</div>
				</template>

				<div v-else class="absolute inset-0 grid place-items-center bg-stone-900/80 p-4 text-center text-[14px] leading-snug">
					<div v-if="camState === 'starting'" class="flex items-center gap-2.5 text-white/85">
						<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Starting the camera…
					</div>
					<div v-else class="max-w-[360px]">
						<Icon name="i-tabler-camera-off" class="mx-auto mb-1.5 h-7 w-7 opacity-80" />
						<p class="mb-0.5 text-[15px] font-semibold">{{ camMessage.title }}</p>
						<p class="mb-2.5 text-white/70">{{ camMessage.text }}</p>
						<ButtonsButton v-if="camState !== 'unsupported'" size="sm" class="!bg-white !text-stone-900" @click="start">Try the camera again</ButtonsButton>
					</div>
				</div>
			</div>

			<!-- What the scanner heard -->
			<div role="status" aria-live="polite" class="flex items-center gap-2.5 rounded-xl px-4 py-3 text-[14.5px] font-medium" :class="OUTCOME[outcome].box">
				<span v-if="outcome === 'waiting'" class="relative flex h-2.5 w-2.5 shrink-0">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-60" />
					<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-600" />
				</span>
				<Icon v-else :name="OUTCOME[outcome].icon" class="h-4 w-4 shrink-0" aria-hidden="true" />
				<span class="min-w-0">{{ message }}</span>
			</div>

			<!-- A hardware scanner types the code and presses Enter, so this box is focused and waiting too.
				 It is also how a code is typed when the slip's barcode won't read. -->
			<form autocomplete="off" class="flex gap-2" @submit.prevent="check(code)">
				<div class="relative min-w-0 flex-1">
					<Icon name="i-tabler-keyboard" class="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-stone-400" />
					<input ref="codeInput" v-model="code" type="text" inputmode="text" enterkeyhint="go" autocomplete="off" autocapitalize="characters" spellcheck="false"
						placeholder="Scanner ready: scan the slip, or type its code" aria-label="Pickup slip code" :disabled="matched"
						class="font-data h-11 w-full rounded-xl border border-stone-200 bg-stone-50 pl-11 pr-3 text-[14px] text-stone-900 outline-none transition-[border-color,box-shadow,background-color] duration-150 placeholder:font-sans placeholder:text-stone-400 focus:border-accent-500 focus:bg-white focus:ring-2 focus:ring-accent-200 disabled:opacity-70">
				</div>
				<ButtonsButton type="submit" variant="ghost" :disabled="matched || !code.trim()">Check</ButtonsButton>
			</form>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="matched" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="ghost" :disabled="matched" @click="emit('manual')">
				<Icon name="i-tabler-hand-click" class="h-3.5 w-3.5" />Check out manually instead
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { ReservationRecord } from '~/services/circulationService'
import type { ScanRegion } from '~/composables/useCameraScanner'

const props = defineProps<{
	open: boolean
	reservation: ReservationRecord | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	/** The right slip was scanned: carry on and check the book out. */
	(e: 'matched', pickupCode: string): void
	/** The librarian chose the form instead of scanning. */
	(e: 'manual'): void
}>()

type Outcome = 'waiting' | 'matched' | 'wrong'

const OUTCOME: Record<Outcome, { box: string; icon: string }> = {
	waiting: { box: 'bg-amber-50 text-amber-900', icon: '' },
	matched: { box: 'bg-emerald-50 text-emerald-900', icon: 'i-tabler-circle-check' },
	wrong: { box: 'bg-red-50 text-red-700', icon: 'i-tabler-circle-x' },
}

const CORNERS = ['left-0 top-0 border-b-0 border-r-0 rounded-tl-[10px]', 'right-0 top-0 border-b-0 border-l-0 rounded-tr-[10px]', 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[10px]', 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-[10px]']

const code = ref('')
const outcome = ref<Outcome>('waiting')
const message = ref('Waiting for the scan…')
const matched = ref(false)
const codeInput = ref<HTMLInputElement | null>(null)

// A slip is a short barcode, so the target is wide and short, as in the scan station.
const REGION: ScanRegion = { left: 0.2, top: 0.3, width: 0.6, height: 0.4 }
const frameStyle = { left: `${REGION.left * 100}%`, top: `${REGION.top * 100}%`, width: `${REGION.width * 100}%`, height: `${REGION.height * 100}%` }

const { video, state: camState, start, stop } = useCameraScanner(onCameraCode, () => REGION)

const camMessage = computed(() => {
	if (camState.value === 'blocked') return { title: 'Camera is blocked', text: 'Allow camera access in the browser, or use a handheld scanner or type the code below.' }
	if (camState.value === 'nocamera') return { title: 'No camera found', text: 'Use a handheld scanner (the box below is waiting for it), or type the code.' }
	if (camState.value === 'unsupported') {
		return import.meta.client && !window.isSecureContext
			? { title: 'The camera needs a secure connection', text: 'Open this site over https (or on localhost). A handheld scanner still works.' }
			: { title: "This browser can't read barcodes", text: 'Use a handheld scanner or type the code below.' }
	}
	return { title: 'Camera is off', text: 'Use a handheld scanner, or turn the camera on.' }
})

/** "r-12", " R-000012 " and a scanner's trailing Enter all mean the same slip. */
function normalise(raw: string): string {
	return raw.replace(/[\r\n\t]/g, '').trim().toUpperCase()
}

function sameSlip(a: string, b: string): boolean {
	const num = (s: string) => /^R-0*(\d{1,9})$/.exec(s)?.[1]
	return !!num(a) && num(a) === num(b)
}

const noBreak = (code: string) => code.replace(/-/g, "‑")

let pausedUntil = 0

function check(raw: string) {
	const value = normalise(raw)
	if (!value || matched.value || !props.reservation) return
	// The same code twice in a moment is one slip held up for a beat too long.
	if (Date.now() < pausedUntil) return

	const expected = props.reservation.pickupCode ?? ''
	if (sameSlip(value, expected)) {
		matched.value = true
		outcome.value = 'matched'
		message.value = 'Slip matched. Checking the book out…'
		code.value = ''
		emit('matched', expected)
		return
	}

	pausedUntil = Date.now() + 1500
	outcome.value = 'wrong'
	message.value = /^R-\d{1,9}$/.test(value)
		// (non-breaking hyphens, so a code never splits across two lines)
		? `That slip is for a different reservation (${noBreak(value)}). This one is ${noBreak(expected)}.`
		: "That isn't a reservation pickup slip. Scan the slip the student brought, or check out manually."
	code.value = ''
	void nextTick(() => codeInput.value?.focus())
}

function onCameraCode(value: string) {
	check(value)
}

// Opening the window starts the camera and puts the cursor in the box a handheld scanner types into.
watch(() => props.open, async (isOpen) => {
	if (!isOpen) {
		stop()
		return
	}
	code.value = ''
	outcome.value = 'waiting'
	message.value = 'Waiting for the scan…'
	matched.value = false
	pausedUntil = 0
	await nextTick()
	codeInput.value?.focus()
	void start()
}, { immediate: true })

onBeforeUnmount(() => stop())
</script>

<style scoped>
.scan-line {
	animation: scanSweep 2s ease-in-out infinite alternate;
}

@keyframes scanSweep {
	from { top: 8%; }
	to { top: calc(92% - 2px); }
}

@media (prefers-reduced-motion: reduce) {
	.scan-line {
		animation: none;
		top: 50%;
	}
}
</style>
