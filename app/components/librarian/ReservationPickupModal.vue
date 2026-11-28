<template>
	<!-- A reserved book being collected, start to finish in one window: prove the slip, scan the book in hand, confirm.
		 Every way in lands here (the Reservations tab, the Station's slip scan, the Pickup code in Checkout), so a
		 pickup always runs the same steps. The copy recorded is always the one scanned, never one picked for it.
		 Built on the same frame as Checkout Book (CheckoutModal.vue): same size, step bar, camera on the left with the
		 phone option, the input on the right, the same confirm and receipt, so lending a book looks the same either way. -->
	<AppTeleport>
		<div class="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" :class="open ? '' : 'pointer-events-none'">
			<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
				enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150 ease-out"
				leave-from-class="opacity-100" leave-to-class="opacity-0">
				<div v-if="open" class="absolute inset-0 bg-[#1c1712]/40" @click="handleClose" />
			</Transition>

			<Transition enter-active-class="transition-[transform,translate,scale,opacity] duration-[260ms] ease-out max-sm:duration-[420ms] max-sm:ease-[cubic-bezier(.4,0,.2,1)]"
				enter-from-class="scale-95 translate-y-2 opacity-0 max-sm:translate-x-full max-sm:translate-y-0 max-sm:scale-100 max-sm:opacity-100 max-sm:motion-reduce:translate-x-0 max-sm:motion-reduce:opacity-0" enter-to-class="scale-100 translate-y-0 opacity-100"
				leave-active-class="transition-[transform,translate,scale,opacity] duration-150 ease-out max-sm:duration-[320ms] max-sm:ease-[cubic-bezier(.4,0,.2,1)]"
				leave-from-class="scale-100 translate-y-0 opacity-100" leave-to-class="scale-95 translate-y-1 opacity-0 max-sm:translate-x-full max-sm:translate-y-0 max-sm:scale-100 max-sm:opacity-100 max-sm:motion-reduce:translate-x-0 max-sm:motion-reduce:opacity-0">
				<div v-if="open" role="dialog" aria-modal="true" aria-labelledby="pickupTitle"
					class="relative z-10 flex w-full flex-col overflow-hidden rounded-[22px] bg-white shadow-overlay max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:shadow-none"
					:class="discarding ? 'max-w-[520px]' : 'h-[min(680px,calc(100vh-32px))] max-w-[960px]'">
					<!-- Header + step bar (as in Checkout Book) -->
					<div class="flex-shrink-0 border-b border-stone-100 px-6 pb-4 pt-5 max-sm:px-4 max-sm:pt-3 sm:px-7">
						<div class="flex items-start justify-between gap-3 max-sm:items-center">
							<div class="min-w-0 max-sm:flex-1">
								<h2 id="pickupTitle" class="dashboard-heading text-2xl font-bold text-crimson max-sm:text-xl">{{ discarding ? 'Stop This Pickup?' : receipt ? 'Checked out' : 'Reservation Pickup' }}</h2>
								<p v-if="!discarding" class="dashboard-heading text-[13.5px] text-crimson">{{ subtitle }}</p>
							</div>
							<ButtonsButton variant="icon" size="md" aria-label="Close" class="shrink-0" @click="handleClose">
								<Icon name="i-tabler-x" class="h-[18px] w-[18px]" />
							</ButtonsButton>
						</div>

						<ol v-if="!receipt && !discarding && (stage === 'slip' || stage === 'book' || stage === 'confirm')" class="mt-4 grid grid-cols-3 gap-2.5" aria-label="Pickup steps">
							<li v-for="(label, i) in STEP_LABELS" :key="label" :aria-current="stepIndex === i ? 'step' : undefined">
								<span class="block h-1 rounded-full transition-colors duration-300" :class="i <= stepIndex ? 'bg-accent-500' : 'bg-stone-200'" />
								<span class="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-300"
									:class="stepIndex === i ? 'text-accent-600' : i < stepIndex ? 'text-stone-700' : 'text-stone-500'">
									<Icon v-if="i < stepIndex" name="i-tabler-check" class="h-3.5 w-3.5" />
									<span v-else class="tabular-nums">{{ i + 1 }}.</span>{{ label }}
								</span>
							</li>
						</ol>
					</div>

					<!-- Closing part-way (a slip already checked, a book already scanned) asks first, here in the same window. -->
					<div v-if="discarding" class="px-6 py-6 max-sm:flex-1 max-sm:px-4 sm:px-7">
						<div class="flex items-start gap-3">
							<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
								<Icon name="i-tabler-alert-triangle" class="h-5 w-5" />
							</span>
							<p class="pt-1 text-[15px] leading-relaxed text-stone-600">
								The book hasn't been checked out yet. If you close now, {{ personName(found?.student?.user) }}'s reservation
								stays ready for pickup and you'll start again from the slip next time.
							</p>
						</div>
					</div>

					<!-- After checkout: the receipt, ready to print. -->
					<div v-else-if="receipt" class="min-h-0 flex-1 overflow-y-auto px-6 py-5 max-sm:px-4">
						<div class="mx-auto max-w-[480px]"><LoanReceipt ref="receiptView" :receipt="receipt" /></div>
					</div>

					<div v-else class="min-h-0 flex-1 overflow-y-auto px-6 py-6 max-sm:px-4 sm:px-7">
						<!-- Looking the reservation up -->
						<div v-if="stage === 'loading'" class="flex items-center justify-center gap-2.5 py-24 text-[14.5px] text-stone-500">
							<Icon name="i-tabler-loader-2" class="h-4 w-4 animate-spin" />Loading the reservation…
						</div>

						<!-- The code can't be collected (expired, already collected, unknown) -->
						<div v-else-if="stage === 'error'" class="mx-auto max-w-[620px] rounded-2xl border border-red-200 bg-red-50 p-5 text-[14.5px] text-red-700">
							<p class="flex items-start gap-2 font-semibold"><Icon name="i-tabler-alert-circle" class="mt-0.5 h-4 w-4 shrink-0" />{{ loadError }}</p>
							<p class="mt-1.5 pl-6 text-red-600/90">You can still lend the book with a normal checkout.</p>
						</div>

						<!-- Steps 1 and 2 share one camera on the left (kept, not re-created, so it stays on between them). -->
						<div v-else-if="found && (stage === 'slip' || stage === 'book')" class="grid gap-6 md:grid-cols-2">
							<section aria-label="Camera" class="min-w-0 space-y-4">
								<div v-show="!phoneOpen">
									<div class="relative aspect-video overflow-hidden rounded-2xl bg-stone-900 text-white">
										<video ref="video" muted playsinline autoplay class="absolute inset-0 h-full w-full object-cover" />

										<template v-if="camState === 'live'">
											<div class="pointer-events-none absolute rounded-[10px] shadow-[0_0_0_9999px_rgba(12,10,9,.45)]" :style="frameStyle">
												<i v-for="corner in CORNERS" :key="corner" class="absolute h-6 w-6 border-[3px] transition-colors duration-150"
													:class="[corner, flash ? 'border-emerald-300' : problem ? 'border-red-400' : 'border-white/90']" />
											</div>
											<p class="pointer-events-none absolute inset-x-0 bottom-3 px-3 text-center text-[13.5px] text-white/90">
												{{ flash ? 'Got it' : stage === 'slip' ? "Hold the pickup slip (or the student's ID) inside the box" : "Hold the book's barcode inside the box" }}
											</p>
											<div class="pointer-events-none absolute inset-0 bg-emerald-300 transition-opacity duration-300" :class="flash ? 'opacity-40' : 'opacity-0'" />
											<button v-if="torchAvailable" type="button" aria-label="Torch" :aria-pressed="torchOn"
												class="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]"
												:class="torchOn ? 'bg-amber-300 text-stone-900' : 'bg-black/45 text-white'" @click="toggleTorch">
												<Icon name="i-tabler-bolt" class="h-4 w-4" />
											</button>
										</template>

										<div v-else class="absolute inset-0 grid place-items-center bg-stone-900/80 p-4 text-center text-[14px] leading-snug">
											<div v-if="camState === 'starting'" class="flex items-center gap-2.5 text-white/85">
												<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Starting the camera…
											</div>
											<div v-else class="max-w-[300px]">
												<Icon name="i-tabler-camera-off" class="mx-auto mb-2 h-8 w-8 opacity-80" />
												<p class="mb-0.5 text-[15px] font-semibold">{{ camMessage.title }}</p>
												<p class="mb-3 text-white/70">{{ camMessage.text }}</p>
												<ButtonsButton v-if="camState !== 'unsupported'" class="!bg-white !text-stone-900" @click="startCamera">
													{{ camState === 'idle' ? 'Turn on camera' : 'Try again' }}
												</ButtonsButton>
											</div>
										</div>
									</div>
									<p class="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium" :class="camStatus.class">
										<i class="h-2 w-2 rounded-full" :class="camStatus.dot" />{{ camStatus.label }}
									</p>
								</div>

								<!-- An alternative to the webcam: the librarian's phone reads the barcodes (as in Checkout Book). -->
								<LibrarianPhoneScanner v-model:open="phoneOpen" :active="open && (stage === 'slip' || stage === 'book')" @code="onCameraCode" />
							</section>

							<!-- Right: who is collecting what, and the box a handheld scanner types into. On a phone it comes first. -->
							<section :aria-label="stage === 'slip' ? 'Pickup slip' : 'The book'" class="min-w-0 space-y-4 max-md:order-first">
								<div class="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
									<StudentCover :book="coverBook" :width="40" />
									<div class="min-w-0 flex-1">
										<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Reserved</p>
										<p class="truncate text-[15px] font-semibold leading-snug text-stone-900" :title="found.book?.title">{{ found.book?.title ?? 'Removed book' }}</p>
										<p class="truncate text-[13px] text-stone-600">
											for <b class="text-stone-800">{{ personName(found.student?.user) }}</b>
											<span class="font-data text-[12.5px]"> · {{ found.student?.memberIDNumber }}</span>
										</p>
									</div>
									<span class="font-data shrink-0 self-start rounded-lg bg-white px-2.5 py-1 text-[13px] font-semibold text-stone-700 ring-1 ring-stone-200">{{ found.pickupCode }}</span>
								</div>

								<form autocomplete="off" @submit.prevent="handleTyped">
									<label for="pickup-code" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
										{{ stage === 'slip' ? 'Pickup slip or student ID' : 'Book barcode or accession number' }}<FieldRequired />
									</label>
									<div class="flex gap-2">
										<div class="relative min-w-0 flex-1">
											<Icon :name="stage === 'slip' ? 'i-tabler-ticket' : 'i-tabler-barcode'" class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
											<input id="pickup-code" ref="codeInput" v-model="typed" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"
												:placeholder="stage === 'slip' ? 'Scan it, or type R-000123 or the student number' : 'Scan it, or type it and press Enter'"
												:disabled="checking"
												class="font-data h-11 w-full rounded-[10px] border bg-white pl-10 pr-3 text-[14px] text-stone-900 outline-none placeholder:font-sans focus:border-accent-500 focus:ring-2 focus:ring-accent-200 disabled:opacity-70"
												:class="problem ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="problem = ''">
										</div>
										<ButtonsButton type="submit" variant="ghost" :disabled="checking || !typed.trim()">
											<Icon v-if="checking" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />Find
										</ButtonsButton>
									</div>
									<p v-if="problem" role="alert" class="mt-1 text-[12.5px] text-red-500">{{ problem }}</p>
									<p v-else class="mt-1 text-[12.5px] text-stone-500">
										{{ stage === 'slip'
											? "The slip proves who is collecting. No slip? Their library ID works too. A USB scanner types into this box by itself."
											: 'Scan the copy you are about to hand over, so the record matches the book that leaves. A USB scanner types into this box by itself.' }}
									</p>
								</form>

								<!-- No readable label: the copies on the shelf, to pick the number printed on the one in hand. -->
								<template v-if="stage === 'book'">
									<div v-if="shelfCopies.length">
										<p class="text-[13.5px] font-semibold text-stone-800">Label won't scan?</p>
										<p class="text-[12.5px] text-stone-500">Pick the accession number printed on the copy in your hand.</p>
										<div class="mt-2 flex flex-wrap gap-2">
											<button v-for="c in shelfCopies" :key="c.copyID" type="button" :disabled="checking"
												class="font-data rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-[15px] font-bold text-stone-900 transition-colors hover:border-accent-500 hover:bg-accent-50 disabled:opacity-60"
												@click="checkBook(String(c.accessionNumber))">{{ c.accessionNumber }}</button>
										</div>
									</div>
									<p v-else class="rounded-xl bg-amber-50 px-4 py-3 text-[13.5px] text-amber-800">
										No copy of this book is marked as on the shelf. If you have one in hand, scan it anyway and the system will say what it knows about it.
									</p>
								</template>
							</section>
						</div>

						<!-- ================= Step 3: confirm (as in Checkout Book) ================= -->
						<div v-else-if="stage === 'confirm' && found && copy" class="mx-auto max-w-[620px] space-y-4">
							<div class="grid gap-3 sm:grid-cols-2">
								<div class="rounded-xl bg-stone-50 px-4 py-3">
									<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Book</p>
									<p class="text-[15px] font-semibold leading-snug text-stone-900">{{ copy.book.title }}</p>
									<p class="truncate text-[13px] text-stone-500">{{ copy.book.authors.join(', ') || 'Unknown author' }}</p>
									<p class="font-data mt-0.5 text-[12.5px] text-stone-600">Accession no. {{ copy.accessionNumber }}</p>
								</div>
								<div class="rounded-xl bg-stone-50 px-4 py-3">
									<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Borrower</p>
									<p class="text-[15px] font-semibold leading-snug text-stone-900">{{ personName(found.student?.user) }}</p>
									<p class="truncate text-[13px] text-stone-500">{{ found.student?.memberIDNumber }} · {{ found.student?.academicProgram ?? found.student?.department ?? '—' }}</p>
								</div>
							</div>
							<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
								<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Checkout date</dt><dd class="font-semibold text-stone-900">{{ formatDate(today) }}</dd></div>
								<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Due back</dt><dd class="font-semibold text-stone-900">{{ copy.dueDate ? formatDate(copy.dueDate) : '—' }}</dd></div>
								<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Collected with</dt><dd class="font-semibold text-stone-900">{{ proof === 'id' ? 'Library ID' : 'Pickup slip' }}</dd></div>
								<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Reservation</dt><dd class="font-semibold text-emerald-700">{{ found.pickupCode }} will be marked collected</dd></div>
							</dl>
							<p class="text-[13px] text-stone-500">A receipt is shown after checkout, ready to print for the student.</p>
						</div>
					</div>

					<!-- Footer (as in Checkout Book) -->
					<div v-if="discarding" class="flex flex-shrink-0 justify-end gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1 sm:px-7">
						<ButtonsButton ref="keepButton" variant="ghost" @click="keepGoing">Keep Going</ButtonsButton>
						<ButtonsButton variant="danger" @click="emit('close')">Yes, Stop</ButtonsButton>
					</div>

					<div v-else-if="receipt"class="flex flex-shrink-0 justify-end gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1 sm:px-7">
						<ButtonsButton variant="ghost" @click="emit('close')">Done</ButtonsButton>
						<ButtonsButton variant="primary" @click="receiptView?.print()">
							<Icon name="i-tabler-printer" class="h-4 w-4" />Print receipt
						</ButtonsButton>
					</div>

					<div v-else class="flex flex-shrink-0 items-center justify-between gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
						<span class="text-[12.5px] tabular-nums text-stone-500 max-sm:hidden">
							<template v-if="stage === 'slip' || stage === 'book' || stage === 'confirm'">Step {{ stepIndex + 1 }} of {{ STEP_LABELS.length }}</template>
						</span>
						<div class="flex gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
							<ButtonsButton v-if="(stage === 'book' && !slipDone) || stage === 'confirm'" variant="ghost" :disabled="submitting" @click="back">
								<Icon name="i-tabler-arrow-left" class="h-4 w-4" />Back
							</ButtonsButton>
							<ButtonsButton v-else variant="ghost" @click="handleClose">Cancel</ButtonsButton>
							<ButtonsButton v-if="stage === 'slip' || stage === 'error'" variant="ghost" @click="emit('manual')">
								<Icon name="i-tabler-hand-click" class="h-3.5 w-3.5" />Normal checkout instead
							</ButtonsButton>
							<ButtonsButton v-if="stage === 'confirm'" variant="primary" :disabled="submitting" @click="submit">
								<Icon v-if="submitting" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
								<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
								{{ submitting ? 'Checking out…' : 'Yes, check out' }}
							</ButtonsButton>
						</div>
					</div>
				</div>
			</Transition>
		</div>
	</AppTeleport>
</template>

<script setup lang="ts">
import { circulationService, type ReservationRecord, type LoanReceipt as LoanReceiptData } from '~/services/circulationService'
import { librarianService, type ScannedCopy } from '~/services/librarianService'
import type { ScanRegion } from '~/composables/useCameraScanner'
import { useAlert } from '~/api/alert/useAlert'

const props = defineProps<{
	open: boolean
	/** Picked from the Reservations tab: the slip (or the student's ID) still has to be shown. */
	reservation?: ReservationRecord | null
	/** A slip code already scanned (at the Station, or typed in Checkout): the slip step is done. */
	code?: string | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	/** Checked out: the lists behind can refresh. */
	(e: 'created'): void
	/** No slip or ID to show, or the reservation can't be collected: a normal checkout instead. */
	(e: 'manual'): void
}>()

const alert = useAlert()

type Stage = 'loading' | 'error' | 'slip' | 'book' | 'confirm'
const STEP_LABELS = ['Slip', 'Book', 'Confirm'] as const
const stage = ref<Stage>('loading')
const stepIndex = computed(() => (stage.value === 'slip' ? 0 : stage.value === 'book' ? 1 : 2))

type Found = Awaited<ReturnType<typeof circulationService.lookupReservation>>['reservation']
const found = ref<Found | null>(null)
const shelfCopies = ref<{ copyID: number; accessionNumber: number }[]>([])
const loadError = ref('')
/** The slip was already proven before this window opened, so there is no slip step to go back to. */
const slipDone = ref(false)
const proof = ref<'slip' | 'id'>('slip')
const copy = ref<ScannedCopy | null>(null)
const receipt = ref<LoanReceiptData | null>(null)
const receiptView = ref<{ print: () => void } | null>(null)

const typed = ref('')
const problem = ref('')
const checking = ref(false)
const submitting = ref(false)
const codeInput = ref<HTMLInputElement | null>(null)
const today = new Date().toISOString()

const coverBook = computed(() => ({ title: found.value?.book?.title ?? '?', coverImageURL: found.value?.book?.coverImageURL ?? null, subject: found.value?.book?.subject ?? null }))

const subtitle = computed(() => {
	if (receipt.value) return 'Print the receipt for the student to keep.'
	return {
		loading: 'Finding the reservation.',
		error: "This reservation can't be collected.",
		slip: "Scan the student's pickup slip, or their library ID.",
		book: 'Scan the copy you are handing over.',
		confirm: 'Check the details, then confirm.',
	}[stage.value]
})

// Part-way through (the slip checked here, a book scanned, or a code typed in the box): closing asks first, in this
// same window. Before anything is done, or once the receipt shows, it just closes.
const discarding = ref(false)
const keepButton = ref<{ $el?: HTMLElement } | null>(null)
const inProgress = computed(() => !receipt.value && (
	stage.value === 'confirm'
	|| (stage.value === 'book' && !slipDone.value)
	|| ((stage.value === 'slip' || stage.value === 'book') && typed.value.trim() !== '')
))

function handleClose() {
	if (submitting.value) return
	if (discarding.value) { keepGoing(); return }   // Escape or the X on the question: back to the pickup
	if (inProgress.value) {
		discarding.value = true
		stopCamera()
		nextTick(() => keepButton.value?.$el?.focus())
		return
	}
	emit('close')
}

// Back to where they were; the camera comes back for the slip and book steps.
function keepGoing() {
	discarding.value = false
	if (stage.value === 'slip' || stage.value === 'book') void startCamera()
}

/* ---------- camera (the webcam, or the librarian's phone instead) ---------- */
// Wide and short, like the slip's barcode and a book's label. The decoder reads only inside this box.
const REGION: ScanRegion = { left: 0.14, top: 0.32, width: 0.72, height: 0.36 }
const frameStyle = { left: `${REGION.left * 100}%`, top: `${REGION.top * 100}%`, width: `${REGION.width * 100}%`, height: `${REGION.height * 100}%` }
const CORNERS = ['left-0 top-0 border-b-0 border-r-0 rounded-tl-[10px]', 'right-0 top-0 border-b-0 border-l-0 rounded-tr-[10px]', 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[10px]', 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-[10px]']

const { video, state: camState, torchAvailable, torchOn, start, stop, toggleTorch } = useCameraScanner(onCameraCode, () => REGION)
// The Station tab reads the same webcam: while this window scans, it leaves the reads alone.
const desk = useCheckoutDeskAnnouncer()

// The phone is the camera instead of the webcam: the webcam rests while that is so, and comes back after.
const phoneOpen = ref(false)
watch(phoneOpen, (isOpen) => {
	if (isOpen) stopCamera()
	else void startCamera()
})

const scanning = computed(() => stage.value === 'slip' || stage.value === 'book')

async function startCamera() {
	await nextTick()
	if (!props.open || !scanning.value || phoneOpen.value) return
	desk.begin()
	await start()
}
function stopCamera() {
	stop()
	desk.end()
}
onBeforeUnmount(stopCamera)

// Escape is heard on the whole page, not only inside the window: after a lookup or a click the keyboard focus is often
// outside it, and Escape did nothing. It goes through handleClose, so part-way through it asks first.
function onEscape(e: KeyboardEvent) {
	if (e.key === 'Escape' && props.open && !e.defaultPrevented) handleClose()
}
onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape))

const flash = ref(false)
let paused = false
// A read flashes the frame and pauses for a moment, so one barcode held up is never taken twice.
function onCameraCode(value: string) {
	if (paused || checking.value || !scanning.value) return
	paused = true
	flash.value = true
	if (stage.value === 'slip') checkSlip(value)
	else void checkBook(value)
	setTimeout(() => { flash.value = false; paused = false }, 1500)
}

const camMessage = computed(() => {
	if (camState.value === 'blocked') return { title: 'Camera is blocked', text: "Allow camera access in your browser's site settings. You can still type the code." }
	if (camState.value === 'nocamera') return { title: 'No camera found', text: 'Plug in a webcam, use your phone, or type the code instead.' }
	if (camState.value === 'unsupported') {
		return import.meta.client && !window.isSecureContext
			? { title: 'The camera needs a secure connection', text: 'Open this site over https (or on localhost). Browsers block the camera on plain http.' }
			: { title: "This browser can't read barcodes", text: 'Try Chrome or Edge, or type the code.' }
	}
	return { title: 'Camera is off', text: 'Turn it on to scan by holding a barcode up.' }
})

const camStatus = computed(() => {
	if (checking.value) return { label: 'Looking it up…', class: 'text-amber-700', dot: 'bg-amber-600' }
	if (camState.value === 'live') return { label: 'Camera live', class: 'text-emerald-700', dot: 'bg-emerald-600' }
	if (camState.value === 'starting') return { label: 'Starting camera…', class: 'text-amber-700', dot: 'bg-amber-600' }
	return camState.value === 'idle' ? { label: 'Camera off', class: 'text-stone-500', dot: 'bg-stone-400' } : { label: 'Camera unavailable', class: 'text-red-600', dot: 'bg-red-500' }
})

/* ---------- opening ---------- */
// Not immediate: the page mounts this window closed.
watch(() => props.open, async (isOpen) => {
	discarding.value = false
	if (!isOpen) { stopCamera(); phoneOpen.value = false; return }

	stage.value = 'loading'
	found.value = null
	copy.value = null
	receipt.value = null
	typed.value = ''
	problem.value = ''
	proof.value = 'slip'
	slipDone.value = !!props.code

	const code = props.code ?? props.reservation?.pickupCode
	if (!code) {
		loadError.value = 'This reservation has no pickup code yet. It may not have been accepted.'
		stage.value = 'error'
		return
	}
	try {
		const result = await circulationService.lookupReservation(code)
		found.value = result.reservation
		shelfCopies.value = result.shelfCopies
		goTo(slipDone.value ? 'book' : 'slip')
	} catch (error) {
		loadError.value = apiErrorMessage(error) || 'Could not find that reservation.'
		stage.value = 'error'
	}
})

function goTo(next: Stage) {
	stage.value = next
	typed.value = ''
	problem.value = ''
	if (next === 'slip' || next === 'book') {
		void startCamera()
		nextTick(() => setTimeout(() => codeInput.value?.focus(), 80))
	} else {
		stopCamera()
	}
}

function back() {
	if (stage.value === 'confirm') { copy.value = null; goTo('book') }
	else if (stage.value === 'book' && !slipDone.value) goTo('slip')
}

/* ---------- step 1: the slip, or the student's ID ---------- */
const clean = (raw: string) => raw.replace(/[\r\n\t]/g, '').trim()
const noBreak = (code: string) => code.replace(/-/g, '‑')

// "r-12", "R-000012", and a slip code with a scanner's extra characters around it all mean the same slip (utils/pickupCode).
function checkSlip(raw: string) {
	const value = clean(raw)
	const r = found.value
	if (!value || !r) return
	const read = slipNumber(value)
	if (read && read === slipNumber(r.pickupCode ?? '')) {
		proof.value = 'slip'
		goTo('book')
	} else if (r.student?.memberIDNumber && value.toLowerCase() === r.student.memberIDNumber.toLowerCase()) {
		proof.value = 'id'
		goTo('book')
	} else {
		// Say what was read, so a slip that won't match can be told apart from a different barcode being picked up.
		problem.value = read
			? `That slip is for a different reservation (${noBreak(slipCode(value)!)}). This one is ${noBreak(r.pickupCode ?? '')}.`
			: `Read "${shownRead(value)}", which isn't this reservation's slip or ${personName(r.student?.user)}'s ID. The slip's code looks like ${noBreak(r.pickupCode ?? 'R-000123')}.`
		typed.value = ''
	}
}

/* ---------- step 2: the copy in hand ---------- */
async function checkBook(raw: string) {
	const value = clean(raw)
	const r = found.value
	if (!value || !r || checking.value) return
	checking.value = true
	problem.value = ''
	try {
		const { copy: scanned } = await librarianService.lookupCopy(value)
		if (scanned.book.bookID !== r.bookID) {
			problem.value = `That is a copy of "${scanned.book.title}". This reservation is for "${r.book?.title ?? 'another book'}".`
		} else if (scanned.lendable && !scanned.heldForReservation) {
			// Only held for a reservation is fine: this reservation is the one it is held for. Anything else stops it.
			problem.value = scanned.lendable
		} else {
			copy.value = scanned
			goTo('confirm')
		}
	} catch (error) {
		problem.value = apiErrorMessage(error) || 'Could not look up that barcode.'
	} finally {
		checking.value = false
		typed.value = ''
		if (stage.value === 'book') nextTick(() => codeInput.value?.focus())
	}
}

function handleTyped() {
	if (stage.value === 'slip') checkSlip(typed.value)
	else if (stage.value === 'book') void checkBook(typed.value)
}

/* ---------- step 3: check out ---------- */
async function submit() {
	const r = found.value
	if (!r || !copy.value || submitting.value) return
	submitting.value = true
	try {
		const response = await circulationService.checkoutBook({ studentID: r.studentID, copyID: copy.value.copyID, reservationID: r.reservationID })
		alert.success('Book checked out', `"${copy.value.book.title}" was lent to ${personName(r.student?.user)}.`)
		receipt.value = response.receipt
		emit('created')
	} catch (error: any) {
		const serverErrors = error?.data?.errors
		alert.error('Could not check out', serverErrors?.copyID?.[0] ?? serverErrors?.studentID?.[0] ?? (apiErrorMessage(error) || 'Please try again.'))
	} finally {
		submitting.value = false
	}
}
</script>
