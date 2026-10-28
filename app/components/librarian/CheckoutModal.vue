<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6" :class="open ? '' : 'pointer-events-none'">
			<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
				enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150 ease-out"
				leave-from-class="opacity-100" leave-to-class="opacity-0">
				<div v-if="open" class="absolute inset-0 bg-[#1c1712]/40" @click="handleClose" />
			</Transition>

			<Transition enter-active-class="transition-[transform,opacity] duration-[260ms] ease-out"
				enter-from-class="scale-95 translate-y-2 opacity-0 max-sm:translate-x-10 max-sm:translate-y-0 max-sm:scale-100" enter-to-class="scale-100 translate-y-0 opacity-100"
				leave-active-class="transition-[transform,opacity] duration-150 ease-out"
				leave-from-class="scale-100 translate-y-0 opacity-100" leave-to-class="scale-95 translate-y-1 opacity-0 max-sm:translate-x-6 max-sm:translate-y-0 max-sm:scale-100">
				<div v-if="open" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle" @keydown.esc="handleClose"
					class="relative z-10 flex max-h-[calc(100vh-48px)] w-full max-w-[480px] flex-col rounded-[22px] bg-white shadow-overlay max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:shadow-none">
					<div class="flex items-start justify-between gap-3 border-b border-stone-100 px-6 py-5 max-sm:items-center max-sm:px-3 max-sm:py-3">
						<ButtonsButton variant="icon" size="md" aria-label="Back" class="-ml-1 shrink-0 sm:hidden" @click="handleClose">
								<Icon name="i-tabler-arrow-left" class="h-[18px] w-[18px]" />
							</ButtonsButton>
						<div class="min-w-0 max-sm:flex-1">
							<h2 id="checkoutTitle" class="dashboard-heading text-2xl font-bold text-crimson">{{ receipt ? 'Checked out' : 'Checkout Book' }}</h2>
							<p class="dashboard-heading text-[13.5px] text-crimson">
								{{ receipt ? 'Print the receipt for the student to keep.' : 'Lend an available copy to an approved student.' }}
							</p>
						</div>
						<ButtonsButton variant="icon" size="md" aria-label="Close" class="max-sm:hidden" @click="handleClose">
							<Icon name="i-tabler-x" class="h-4 w-4" />
						</ButtonsButton>
					</div>

					<!-- After checkout: the receipt, ready to print. -->
					<div v-if="receipt" class="overflow-y-auto px-6 py-5 max-sm:flex-1 max-sm:px-4">
						<LoanReceipt ref="receiptView" :receipt="receipt" />
					</div>

					<div v-else class="space-y-4 px-6 py-5 max-sm:flex-1 max-sm:overflow-y-auto max-sm:px-4">
						<form autocomplete="off" @submit.prevent="handlePickupCode">
							<label for="checkout-pickup" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Reservation pickup code <span class="font-normal text-stone-500">(optional)</span></label>
							<div class="flex gap-2">
								<input id="checkout-pickup" v-model="pickupCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"
									placeholder="Scan the student's slip, or type R-000123" :disabled="lookingUp"
									class="font-data h-11 min-w-0 flex-1 rounded-[10px] border bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 disabled:opacity-70"
									:class="errors.pickup ? 'border-red-400' : 'border-stone-200'" @input="errors.pickup = ''">
								<ButtonsButton type="submit" variant="ghost" :disabled="lookingUp || !pickupCode.trim()">Fill in</ButtonsButton>
							</div>
							<p v-if="errors.pickup" class="mt-1 text-[12.5px] text-red-500">{{ errors.pickup }}</p>
							<p v-else-if="reservation" class="mt-1 text-[12.5px] text-emerald-600">Reservation {{ reservation.pickupCode }} loaded. Check the details, then check out.</p>
						</form>

						<div>
							<label for="checkout-student" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Student<FieldRequired /></label>
							<LibrarianSearchSelect v-model="student" input-id="checkout-student" placeholder="Search name or student ID"
								:fetcher="searchStudents" :get-label="studentLabel" :get-sublabel="studentSublabel"
								:invalid="!!errors.student" />
							<p v-if="errors.student" class="mt-1 text-[12.5px] text-red-500">{{ errors.student }}</p>
						</div>

						<!-- The student has several reservations ready: pick the one being collected. -->
						<fieldset v-if="studentReservations.length > 1 && !reservation" class="rounded-[14px] border border-dashed border-amber-400 bg-amber-50/60 p-3">
							<legend class="px-1.5 text-[13.5px] font-semibold text-stone-800">Reserved for pickup ({{ studentReservations.length }})</legend>
							<label v-for="r in studentReservations" :key="r.reservationID" :for="`checkout-res-${r.reservationID}`"
								class="mb-2 flex cursor-pointer items-center gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2.5 last:mb-0 hover:bg-stone-50">
								<input :id="`checkout-res-${r.reservationID}`" type="radio" name="checkout-reservation" class="accent-accent-500" @change="pickReservation(r)">
								<span class="min-w-0 flex-1">
									<span class="block text-[14px] font-semibold text-stone-900">{{ r.book?.title }}</span>
									<span class="font-data block text-[12.5px] text-stone-500">{{ r.pickupCode }}</span>
								</span>
							</label>
							<p class="mt-2 text-[12.5px] text-stone-600">Pick one to fill in the book and copy, or search for a different book below.</p>
						</fieldset>

						<div>
							<label for="checkout-book" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Book<FieldRequired /></label>
							<LibrarianSearchSelect v-model="book" input-id="checkout-book" placeholder="Search by title"
								:fetcher="searchBooks" :get-label="bookLabel" :get-sublabel="bookSublabel"
								:invalid="!!errors.book" />
							<p v-if="errors.book" class="mt-1 text-[12.5px] text-red-500">{{ errors.book }}</p>
						</div>

						<div v-if="book">
							<label for="checkout-copy" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Copy<FieldRequired /></label>
							<select v-if="availableCopies.length" id="checkout-copy" v-model="copyID"
								class="font-data h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200">
								<option v-for="copy in availableCopies" :key="copy.copyID" :value="copy.copyID">{{ copy.accessionNumber }}</option>
							</select>
							<p v-else class="rounded-lg bg-red-50 px-3 py-2 text-[13.5px] text-red-600">
								No copies of this book are available right now.
							</p>
						</div>
					</div>

					<div v-if="receipt" class="flex justify-end gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1">
						<ButtonsButton variant="ghost" @click="emit('close')">Done</ButtonsButton>
						<ButtonsButton variant="primary" @click="receiptView?.print()">
							<Icon name="i-tabler-printer" class="h-4 w-4" />Print receipt
						</ButtonsButton>
					</div>

					<div v-else class="flex justify-end gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1">
						<ButtonsButton variant="ghost" @click="handleClose">Cancel</ButtonsButton>
						<ButtonsButton variant="primary" :disabled="submitting" @click="handleSubmit">
							<Icon v-if="submitting" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
							{{ submitting ? 'Checking out…' : 'Checkout' }}
						</ButtonsButton>
					</div>
				</div>
			</Transition>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { librarianService, type StudentRecord, type CatalogBook } from '~/services/librarianService'
import { circulationService, type LoanReceipt as LoanReceiptData, type ReservationRecord } from '~/services/circulationService'
import { useAlert } from '~/api/alert/useAlert'

const props = defineProps<{
	open: boolean
	/** A pickup code the scanner already read: looked up as soon as the window opens. */
	initialCode?: string
	/** With a code that is found, check the book out straight away (the slip was scanned, so there is nothing left to fill in). */
	autoCheckout?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'created'): void
}>()

const alert = useAlert()

const student = ref<StudentRecord | null>(null)
const book = ref<CatalogBook | null>(null)
const copyID = ref<number | null>(null)
const submitting = ref(false)
const errors = reactive({ student: '', book: '', pickup: '' })
// A pickup slip scanned (or typed) at the desk: fills the form, and the checkout then fulfils that reservation.
const pickupCode = ref('')
const lookingUp = ref(false)
const reservation = ref<{ reservationID: number; studentID: number; bookID: number; pickupCode: string } | null>(null)
// The accepted reservations of the chosen student: one is loaded by itself, several are offered to pick from.
const studentReservations = ref<ReservationRecord[]>([])
// Set once the checkout goes through; the window then shows the receipt instead of the form.
const receipt = ref<LoanReceiptData | null>(null)
const receiptView = ref<{ print: () => void } | null>(null)

const availableCopies = computed(() => (book.value?.copies ?? []).filter((c) => c.status === 'available'))

watch(book, () => {
	copyID.value = availableCopies.value[0]?.copyID ?? null
	errors.book = ''
})
watch(student, (chosen) => {
	errors.student = ''
	studentReservations.value = []
	// A loaded reservation belongs to its student: choosing someone else lets go of it.
	if (reservation.value && reservation.value.studentID !== chosen?.studentID) reservation.value = null
	if (chosen && !reservation.value) void loadStudentReservations(chosen)
})

// Checking out by hand: once the student is chosen, their accepted reservation fills in by itself, as if its slip had been scanned.
async function loadStudentReservations(chosen: StudentRecord) {
	try {
		const { reservations } = await circulationService.fetchReservations('Accepted')
		if (student.value?.studentID !== chosen.studentID || reservation.value) return // the form moved on meanwhile
		const ready = reservations.filter((r) => r.student?.studentID === chosen.studentID && r.book)
		if (ready.length === 1) await pickReservation(ready[0]!)
		else studentReservations.value = ready
	} catch {
		// Looking for a reservation is a convenience; the form still works without it.
	}
}

async function pickReservation(r: ReservationRecord) {
	if (!r.pickupCode) return
	pickupCode.value = r.pickupCode
	await handlePickupCode()
}

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	receipt.value = null
	student.value = null
	book.value = null
	copyID.value = null
	pickupCode.value = ''
	reservation.value = null
	studentReservations.value = []
	errors.student = ''
	errors.book = ''
	errors.pickup = ''

	if (props.initialCode) {
		pickupCode.value = props.initialCode
		void handlePickupCode().then(async () => {
			if (!props.autoCheckout || !reservation.value || !student.value || !book.value) return
			await nextTick() // the book's watcher picks the copy to lend
			if (props.open && copyID.value) void handleSubmit()
		})
	}
})

async function handlePickupCode() {
	const code = pickupCode.value.trim()
	if (!code) return

	lookingUp.value = true
	errors.pickup = ''
	try {
		const { reservation: found } = await circulationService.lookupReservation(code)

		const studentNumber = found.student?.studentIDNumber
		const [students, books] = await Promise.all([
			librarianService.fetchStudents({ search: studentNumber, status: 'approved', perPage: 10 }),
			librarianService.fetchBooks({ search: found.book?.title, perPage: 20 }),
		])
		const matchedStudent = students.data.find((s) => s.studentID === found.studentID)
		const matchedBook = books.data.find((b) => b.bookID === found.bookID)
		if (!matchedStudent || !matchedBook) {
			errors.pickup = "Found the reservation, but couldn't load the student or book. Choose them below."
			return
		}

		student.value = matchedStudent
		book.value = matchedBook
		reservation.value = { reservationID: found.reservationID, studentID: found.studentID, bookID: found.bookID, pickupCode: found.pickupCode ?? code }
		// The code stays in the box, so the librarian can see which reservation was loaded.
		pickupCode.value = found.pickupCode ?? code
	} catch (error: any) {
		reservation.value = null
		errors.pickup = error?.data?.errors?.code?.[0] ?? error?.data?.message ?? 'Could not look up that code.'
	} finally {
		lookingUp.value = false
	}
}

async function searchStudents(query: string) {
	const result = await librarianService.fetchStudents({ search: query || undefined, status: 'approved', perPage: 6 })
	return result.data
}

async function searchBooks(query: string) {
	const result = await librarianService.fetchBooks({ search: query || undefined, perPage: 6 })
	return result.data
}

const studentLabel = (s: StudentRecord) => (s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown student')
const studentSublabel = (s: StudentRecord) => `${s.studentIDNumber} · ${s.academicProgram ?? '—'}`
const bookLabel = (b: CatalogBook) => b.title
const bookSublabel = (b: CatalogBook) => {
	const available = Math.max(0, b.copies.filter((c) => c.status === 'available').length - (b.heldCopies ?? 0))
	return `${b.authors.map((a) => a.name).join(', ') || 'Unknown author'} · ${available} available`
}

function handleClose() {
	if (submitting.value) return
	emit('close')
}

async function handleSubmit() {
	errors.student = student.value ? '' : 'Choose a student.'
	errors.book = book.value ? '' : 'Choose a book.'
	if (!student.value || !book.value) return
	if (!copyID.value) {
		errors.book = 'No available copy to check out.'
		return
	}

	submitting.value = true
	try {
		// Only fulfil the reservation if the form still matches it (the librarian may have changed the student or book).
		const fulfils = reservation.value
			&& reservation.value.studentID === student.value.studentID
			&& reservation.value.bookID === book.value.bookID
		const response = await circulationService.checkoutBook({
			studentID: student.value.studentID,
			copyID: copyID.value,
			...(fulfils ? { reservationID: reservation.value!.reservationID } : {}),
		})
		alert.success('Book checked out', `"${book.value.title}" was lent to ${studentLabel(student.value)}.`)
		emit('created')
		receipt.value = response.receipt
	} catch (error: any) {
		const serverErrors = error?.data?.errors
		const detail = serverErrors?.copyID?.[0] ?? serverErrors?.studentID?.[0] ?? error?.data?.message
		alert.error('Could not check out', detail || 'Please try again.')
	} finally {
		submitting.value = false
	}
}
</script>
