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
					class="relative z-10 flex w-full max-w-[480px] flex-col rounded-[22px] bg-white shadow-2xl">
					<div class="flex items-start justify-between gap-3 border-b border-stone-100 px-6 py-5">
						<div>
							<h2 id="checkoutTitle" class="dashboard-heading text-2xl font-bold text-amber-900">Checkout Book</h2>
							<p class="dashboard-heading text-[12.5px] text-amber-900">Lend an available copy to an approved student.</p>
						</div>
						<ButtonsButton variant="icon" size="md" aria-label="Close" @click="handleClose">
							<Icon name="i-lucide-x" class="h-4 w-4" />
						</ButtonsButton>
					</div>

					<div class="space-y-4 px-6 py-5">
						<div>
							<label for="checkout-student" class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">Student</label>
							<LibrarianSearchSelect v-model="student" input-id="checkout-student" placeholder="Search name or student ID"
								:fetcher="searchStudents" :get-label="studentLabel" :get-sublabel="studentSublabel"
								:invalid="!!errors.student" />
							<p v-if="errors.student" class="mt-1 text-[11.5px] text-red-500">{{ errors.student }}</p>
						</div>

						<div>
							<label for="checkout-book" class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">Book</label>
							<LibrarianSearchSelect v-model="book" input-id="checkout-book" placeholder="Search by title"
								:fetcher="searchBooks" :get-label="bookLabel" :get-sublabel="bookSublabel"
								:invalid="!!errors.book" />
							<p v-if="errors.book" class="mt-1 text-[11.5px] text-red-500">{{ errors.book }}</p>
						</div>

						<div v-if="book">
							<label for="checkout-copy" class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">Copy</label>
							<select v-if="availableCopies.length" id="checkout-copy" v-model="copyID"
								class="font-data h-10 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[12.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200">
								<option v-for="copy in availableCopies" :key="copy.copyID" :value="copy.copyID">{{ copy.accessionNumber }}</option>
							</select>
							<p v-else class="rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-600">
								No copies of this book are available right now.
							</p>
						</div>
					</div>

					<div class="flex justify-end gap-2 border-t border-stone-100 px-6 py-4">
						<ButtonsButton variant="ghost" @click="handleClose">Cancel</ButtonsButton>
						<ButtonsButton variant="primary" :disabled="submitting" @click="handleSubmit">
							<Icon v-if="submitting" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
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
import { circulationService } from '~/services/circulationService'
import { useAlert } from '~/api/alert/useAlert'

const props = defineProps<{ open: boolean }>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'created'): void
}>()

const alert = useAlert()

const student = ref<StudentRecord | null>(null)
const book = ref<CatalogBook | null>(null)
const copyID = ref<number | null>(null)
const submitting = ref(false)
const errors = reactive({ student: '', book: '' })

const availableCopies = computed(() => (book.value?.copies ?? []).filter((c) => c.status === 'available'))

watch(book, () => {
	copyID.value = availableCopies.value[0]?.copyID ?? null
	errors.book = ''
})
watch(student, () => { errors.student = '' })

watch(() => props.open, (isOpen) => {
	if (!isOpen) return
	student.value = null
	book.value = null
	copyID.value = null
	errors.student = ''
	errors.book = ''
})

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
	const available = b.copies.filter((c) => c.status === 'available').length
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
		await circulationService.checkoutBook({ studentID: student.value.studentID, copyID: copyID.value })
		alert.success('Book checked out', `"${book.value.title}" was lent to ${studentLabel(student.value)}.`)
		emit('created')
		emit('close')
	} catch (error: any) {
		const serverErrors = error?.data?.errors
		const detail = serverErrors?.copyID?.[0] ?? serverErrors?.studentID?.[0] ?? error?.data?.message
		alert.error('Could not check out', detail || 'Please try again.')
	} finally {
		submitting.value = false
	}
}
</script>
