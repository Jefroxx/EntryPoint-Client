<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-[100] flex items-center justify-center p-6" :class="open ? '' : 'pointer-events-none'">
			<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
				enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150 ease-out"
				leave-from-class="opacity-100" leave-to-class="opacity-0">
				<div v-if="open" class="absolute inset-0 bg-[#1c1712]/35 backdrop-blur-[3px]" @click="handleClose" />
			</Transition>

			<Transition enter-active-class="transition-[transform,opacity] duration-[260ms] ease-out"
				enter-from-class="scale-95 translate-y-2 opacity-0" enter-to-class="scale-100 translate-y-0 opacity-100"
				leave-active-class="transition-[transform,opacity] duration-150 ease-out"
				leave-from-class="scale-100 translate-y-0 opacity-100" leave-to-class="scale-95 translate-y-1 opacity-0">
				<div v-if="open" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle" @keydown.esc="handleClose"
					class="relative z-10 flex max-h-[calc(100vh-48px)] w-full max-w-[480px] flex-col rounded-[22px] bg-white shadow-overlay">
					<div class="flex items-start justify-between gap-3 border-b border-stone-100 px-6 py-5">
						<div>
							<h2 id="checkoutTitle" class="dashboard-heading text-2xl font-bold text-crimson">{{ receipt ? 'Checked out' : 'Checkout Book' }}</h2>
							<p class="dashboard-heading text-[13.5px] text-crimson">
								{{ receipt ? 'Print the receipt for the student to keep.' : 'Lend an available copy to an approved student.' }}
							</p>
						</div>
						<ButtonsButton variant="icon" size="md" aria-label="Close" @click="handleClose">
							<Icon name="i-tabler-x" class="h-4 w-4" />
						</ButtonsButton>
					</div>

					<!-- After checkout: the receipt, ready to print. -->
					<div v-if="receipt" class="overflow-y-auto px-6 py-5">
						<LoanReceipt ref="receiptView" :receipt="receipt" />
					</div>

					<div v-else class="space-y-4 px-6 py-5">
						<form autocomplete="off" @submit.prevent="handlePickupCode">
							<label for="checkout-pickup" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Reservation pickup code</label>
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
							<label for="checkout-student" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Student</label>
							<LibrarianSearchSelect v-model="student" input-id="checkout-student" placeholder="Search name or student ID"
								:fetcher="searchStudents" :get-label="studentLabel" :get-sublabel="studentSublabel"
								:invalid="!!errors.student" />
							<p v-if="errors.student" class="mt-1 text-[12.5px] text-red-500">{{ errors.student }}</p>
						</div>

						<div>
							<label for="checkout-book" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Book</label>
							<LibrarianSearchSelect v-model="book" input-id="checkout-book" placeholder="Search by title"
								:fetcher="searchBooks" :get-label="bookLabel" :get-sublabel="bookSublabel"
								:invalid="!!errors.book" />
							<p v-if="errors.book" class="mt-1 text-[12.5px] text-red-500">{{ errors.book }}</p>
						</div>

						<div v-if="book">
							<label for="checkout-copy" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Copy</label>
							<select v-if="availableCopies.length" id="checkout-copy" v-model="copyID"
								class="font-data h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200">
								<option v-for="copy in availableCopies" :key="copy.copyID" :value="copy.copyID">{{ copy.accessionNumber }}</option>
							</select>
							<p v-else class="rounded-lg bg-red-50 px-3 py-2 text-[13.5px] text-red-600">
								No copies of this book are available right now.
							</p>
						</div>
					</div>

					<div v-if="receipt" class="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
						<ButtonsButton variant="ghost" @click="emit('close')">Done</ButtonsButton>
						<ButtonsButton variant="primary" @click="receiptView?.print()">
							<Icon name="i-tabler-printer" class="h-4 w-4" />Print receipt
						</ButtonsButton>
					</div>

					<div v-else class="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
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
import { circulationService, type LoanReceipt as LoanReceiptData } from '~/services/circulationService'
import { useAlert } from '~/api/alert/useAlert'

const props = defineProps<{ open: boolean; /** A pickup code the scanner already read: looked up as soon as the window opens. */ initialCode?: string }>()

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
// Set once the checkout goes through; the window then shows the receipt instead of the form.
const receipt = ref<LoanReceiptData | null>(null)
const receiptView = ref<{ print: () => void } | null>(null)

const availableCopies = computed(() => (book.value?.copies ?? []).filter((c) => c.status === 'available'))

watch(book, () => {
	copyID.value = availableCopies.value[0]?.copyID ?? null
	errors.book = ''
})
watch(student, () => { errors.student = '' })

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	receipt.value = null
	student.value = null
	book.value = null
	copyID.value = null
	pickupCode.value = ''
	reservation.value = null
	errors.student = ''
	errors.book = ''
	errors.pickup = ''

	if (props.initialCode) {
		pickupCode.value = props.initialCode
		void handlePickupCode()
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
		pickupCode.value = ''
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
