<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
			:class="open ? '' : 'pointer-events-none'">
			<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
				enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150 ease-out"
				leave-from-class="opacity-100" leave-to-class="opacity-0">
				<div v-if="open" class="absolute inset-0 bg-[#1c1712]/35 backdrop-blur-[3px]" @click="handleClose" />
			</Transition>

			<Transition enter-active-class="transition-[transform,opacity] duration-[260ms] ease-out"
				enter-from-class="scale-95 translate-y-2 opacity-0" enter-to-class="scale-100 translate-y-0 opacity-100"
				leave-active-class="transition-[transform,opacity] duration-150 ease-out"
				leave-from-class="scale-100 translate-y-0 opacity-100"
				leave-to-class="scale-95 translate-y-1 opacity-0">
				<form v-if="open" role="dialog" aria-modal="true" aria-labelledby="addBookTitle" novalidate
					@keydown.esc="handleClose" @submit.prevent="step < lastStep ? next() : handleSubmit()"
					class="relative z-10 flex max-h-[min(780px,calc(100vh-32px))] w-full max-w-[940px] flex-col overflow-hidden rounded-[22px] bg-white shadow-overlay">
					<!-- Header + step bar (same pattern as student registration) -->
					<div class="flex-shrink-0 border-b border-stone-100 px-6 pb-4 pt-5 sm:px-7">
						<div class="flex items-start justify-between gap-3">
							<div>
								<h2 id="addBookTitle" class="dashboard-heading text-2xl font-bold text-amber-900">
									{{ isEdit ? 'Edit Book' : 'Add New Book' }}</h2>
								<p class="dashboard-heading text-[13.5px] text-amber-900">
									{{ isEdit ? 'Jump to any section, change what you need, then save.' : 'Catalog a new title and its physical copies.' }}</p>
							</div>
							<ButtonsButton variant="icon" size="md" aria-label="Close" @click="handleClose">
								<Icon name="i-tabler-x" class="h-4 w-4" />
							</ButtonsButton>
						</div>

						<ol class="mt-4 grid grid-cols-3 gap-2.5" aria-label="Book form sections">
							<li v-for="s in stepList" :key="s.n" :aria-current="step === s.n ? 'step' : undefined">
								<button type="button" :disabled="!canOpen(s.n)"
									class="group w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 disabled:cursor-default"
									@click="goTo(s.n)">
									<span class="block h-1 rounded-full transition-colors duration-300"
										:class="s.n <= step ? 'bg-accent-500' : 'bg-stone-200'" />
									<span class="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-300"
										:class="step === s.n ? 'text-accent-600' : canOpen(s.n) ? 'text-stone-700 group-hover:text-accent-600' : 'text-stone-400'">
										<Icon v-if="stepHasError(s.n)" name="i-tabler-alert-circle" class="h-3.5 w-3.5 text-red-500" />
										<Icon v-else-if="s.n < step" name="i-tabler-check" class="h-3.5 w-3.5" />
										<span v-else class="tabular-nums">{{ s.n }}.</span>
										{{ s.label }}
										<span v-if="s.optional" class="hidden font-normal text-stone-400 sm:inline">(optional)</span>
									</span>
								</button>
							</li>
						</ol>
					</div>

					<div class="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
						<!-- Cover: always visible, whichever step is open -->
						<aside
							class="flex flex-shrink-0 gap-4 border-b border-stone-100 bg-stone-50/70 px-6 py-5 md:w-[272px] md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:px-6">
							<button type="button" aria-label="Set cover image"
								class="group relative aspect-[2/3] w-[112px] shrink-0 overflow-hidden rounded-[14px] transition-transform duration-150 ease-out active:scale-[0.98] md:w-full"
								:class="hasCover ? 'bg-stone-200 shadow-[0_10px_24px_-12px_rgba(28,23,18,.45)]' : 'border-2 border-dashed border-accent-200 bg-accent-50 hover:border-accent-400 hover:bg-accent-100/60'"
								@click="focusCoverInput">
								<img v-if="hasCover" :src="form.coverImageURL.trim()" alt="Cover preview"
									class="h-full w-full object-cover" @error="coverLoadFailed = true" />
								<span v-else class="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
									<span
										class="flex h-11 w-11 items-center justify-center rounded-full bg-white text-accent-500 shadow-sm transition-transform duration-200 ease-out group-hover:scale-105 md:h-14 md:w-14">
										<Icon name="i-tabler-photo-plus" class="h-5 w-5 md:h-6 md:w-6" />
									</span>
									<span class="text-[13px] font-bold text-accent-600 md:text-[15px]">Add a cover</span>
									<span class="hidden text-[12px] leading-snug text-stone-500 md:block">
										Students see it in the catalog. Books with a cover are easier to spot.</span>
								</span>
								<span v-if="hasCover"
									class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 pb-2.5 pt-8 text-left text-[12px] font-semibold text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
									Change image link
								</span>
							</button>

							<div class="min-w-0 flex-1">
								<label for="bookCover" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
									Cover image link <span class="font-normal text-stone-400">(optional)</span>
								</label>
								<input id="bookCover" ref="coverInputRef" v-model="form.coverImageURL" type="url"
									placeholder="https://…" :class="[inputClass, coverError ? 'border-red-400 bg-red-50' : 'border-stone-200']"
									class="!text-[13.5px]" @input="coverLoadFailed = false" />
								<p v-if="coverError" class="mt-1.5 text-[12px] leading-snug text-red-500">{{ coverError }}</p>
								<p v-else class="mt-1.5 text-[12px] leading-snug text-stone-500">
									Find the book's cover online, right-click the image and choose
									<span class="font-semibold text-stone-700">Copy image address</span>, then paste it here.
								</p>
								<button v-if="form.coverImageURL" type="button"
									class="mt-2 inline-flex items-center gap-1 text-[12.5px] font-semibold text-stone-500 transition-colors hover:text-red-600"
									@click="clearCover">
									<Icon name="i-tabler-trash" class="h-3.5 w-3.5" />Remove cover
								</button>
							</div>
						</aside>

						<!-- Steps -->
						<div class="min-w-0 flex-1 px-6 py-6 md:overflow-y-auto sm:px-7">
							<Transition mode="out-in" enter-active-class="transition duration-300 ease-out"
								:enter-from-class="direction > 0 ? 'translate-x-3 opacity-0' : '-translate-x-3 opacity-0'"
								leave-active-class="transition duration-150 ease-out" leave-to-class="opacity-0"
								@after-enter="focusStep">
								<div v-if="step === 1" key="details" class="space-y-4">
									<div>
										<label for="bookTitle"
											class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Title</label>
										<input id="bookTitle" v-model="form.title" type="text"
											placeholder="e.g. The Origin of Species"
											:class="[inputClass, errors.title ? 'border-red-400 bg-red-50' : 'border-stone-200']"
											@input="errors.title = ''" />
										<p v-if="errors.title" class="mt-1 text-[12.5px] text-red-500">{{ errors.title }}</p>
									</div>

									<div>
										<label class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Author(s)</label>
										<div v-for="(author, index) in authors" :key="author.key"
											class="mb-2 flex items-center gap-2">
											<input v-model="author.name" type="text" placeholder="Author name"
												:aria-label="`Author ${index + 1} name`"
												:class="[inputClass, errors.authors && index === 0 ? 'border-red-400 bg-red-50' : 'border-stone-200']"
												class="flex-1" @input="errors.authors = ''" />
											<select v-model="author.role" :aria-label="`Author ${index + 1} role`"
												class="h-11 w-[132px] flex-shrink-0 rounded-[10px] border border-stone-200 bg-white px-2 text-[14px] text-stone-700 outline-none focus:border-accent-500">
												<option value="Author">Author</option>
												<option value="Editor">Editor</option>
												<option value="Translator">Translator</option>
												<option value="Illustrator">Illustrator</option>
											</select>
											<ButtonsButton variant="icon" size="sm" aria-label="Remove author"
												:disabled="authors.length === 1" @click="removeAuthor(index)">
												<Icon name="i-tabler-trash" class="h-3.5 w-3.5" />
											</ButtonsButton>
										</div>
										<p v-if="errors.authors" class="mb-1.5 text-[12.5px] text-red-500">{{ errors.authors }}</p>
										<button type="button"
											class="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-accent-500 transition-opacity hover:opacity-70"
											@click="addAuthor">
											<Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add author
										</button>
									</div>

									<div class="grid gap-3 sm:grid-cols-2">
										<div>
											<label for="bookIsbn" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
												ISBN <span class="font-normal text-stone-400">(optional)</span>
											</label>
											<input id="bookIsbn" v-model="form.isbn" type="text" placeholder="978-0-000-00000-0"
												:class="[inputClass, 'border-stone-200']" class="font-data !text-[13.5px]" />
										</div>
										<div>
											<label for="bookYear" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
												Publication year <span class="font-normal text-stone-400">(optional)</span>
											</label>
											<input id="bookYear" v-model="form.publicationYear" type="number" placeholder="2024"
												:class="[inputClass, 'border-stone-200']" />
										</div>
									</div>
								</div>

								<div v-else-if="step === 2" key="shelving" class="space-y-6">
									<fieldset>
										<legend class="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Classification</legend>
										<div class="grid gap-3 sm:grid-cols-2">
											<div>
												<label for="bookCategory" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
													Category / genre</label>
												<input id="bookCategory" v-model="form.subjectName" type="text"
													list="category-options" placeholder="e.g. Science"
													:class="[inputClass, errors.subjectName ? 'border-red-400 bg-red-50' : 'border-stone-200']"
													@input="errors.subjectName = ''" />
												<datalist id="category-options">
													<option v-for="c in categories" :key="c" :value="c" />
												</datalist>
												<p v-if="errors.subjectName" class="mt-1 text-[12.5px] text-red-500">{{ errors.subjectName }}</p>
											</div>
											<div>
												<label for="bookCall" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
													Call number <span class="font-normal text-stone-400">(optional)</span>
												</label>
												<input id="bookCall" v-model="form.callNumber" type="text"
													:placeholder="isEdit ? 'Leave blank to keep the current one' : 'Auto-generated if left blank'"
													:class="[inputClass, 'border-stone-200']" class="font-data !text-[13.5px]" />
											</div>
										</div>
									</fieldset>

									<fieldset>
										<legend class="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Location</legend>
										<div class="grid gap-3 sm:grid-cols-2">
											<div>
												<label for="bookArea" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
													Library area</label>
												<select id="bookArea" v-model="form.areasOfLibrary" :class="[inputClass, 'border-stone-200']">
													<option value="circulation">Circulation</option>
													<option value="reserved">Reserved</option>
													<option value="filipiniana">Filipiniana</option>
													<option value="fiction">Fiction</option>
													<option value="thesis">Thesis</option>
													<option value="journal">Journal</option>
													<option value="dissertation">Dissertation</option>
												</select>
											</div>
											<div>
												<label for="bookShelf" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
													Shelf location <span class="font-normal text-stone-400">(optional)</span>
												</label>
												<input id="bookShelf" v-model="form.shelfLocation" type="text"
													placeholder="e.g. 2nd Floor, Aisle 4" :class="[inputClass, 'border-stone-200']" />
											</div>
										</div>
									</fieldset>

									<fieldset>
										<legend class="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-stone-400">Copies</legend>
										<div class="flex flex-wrap items-center gap-3">
											<div class="flex w-fit overflow-hidden rounded-[10px] border border-stone-200">
												<button type="button" aria-label="Decrease quantity" :disabled="quantity <= minQuantity"
													class="flex h-11 w-10 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:scale-90 disabled:opacity-40"
													@click="quantity = Math.max(minQuantity, quantity - 1)">–</button>
												<span
													class="flex h-11 w-12 items-center justify-center border-x border-stone-200 text-[15px] font-bold tabular-nums text-stone-900">{{
														quantity }}</span>
												<button type="button" aria-label="Increase quantity"
													class="flex h-11 w-10 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:scale-90"
													@click="quantity = Math.min(100, quantity + 1)">+</button>
											</div>
											<span class="text-[13px] text-stone-500">{{ quantity === 1 ? 'copy' : 'copies' }} on the shelf</span>
										</div>
										<!-- Lowering it retires copies that are on the shelf; borrowed ones can't be retired. -->
										<p v-if="isEdit && quantity < originalQuantity" class="mt-2 text-[12.5px] leading-snug text-amber-700">
											{{ originalQuantity - quantity }} {{ originalQuantity - quantity === 1 ? 'copy' : 'copies' }} on the shelf will be retired.
										</p>
									</fieldset>
								</div>

								<div v-else key="more" class="space-y-4">
									<p class="text-[13px] leading-relaxed text-stone-500">
										Publication and acquisition records. Skip anything you don't have.</p>
									<div class="grid gap-3 sm:grid-cols-2">
										<div>
											<label for="bookPublisher" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Publisher</label>
											<input id="bookPublisher" v-model="form.publisher" type="text" placeholder="e.g. McGraw-Hill"
												:class="[inputClass, 'border-stone-200']" />
										</div>
										<div>
											<label for="bookEdition" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Edition</label>
											<input id="bookEdition" v-model="form.edition" type="text" placeholder="e.g. 7th ed."
												:class="[inputClass, 'border-stone-200']" />
										</div>
										<div>
											<label for="bookVolume" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Volume</label>
											<input id="bookVolume" v-model="form.volume" type="text" placeholder="e.g. Vol. 2"
												:class="[inputClass, 'border-stone-200']" />
										</div>
										<div>
											<label for="bookPages" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Pages</label>
											<input id="bookPages" v-model="form.pages" type="number" min="1" placeholder="e.g. 320"
												:class="[inputClass, 'border-stone-200']" />
										</div>
										<div>
											<label for="bookFund" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Source of fund</label>
											<input id="bookFund" v-model="form.sourceOfFund" type="text" placeholder="e.g. Library budget"
												:class="[inputClass, 'border-stone-200']" />
										</div>
										<div>
											<label for="bookCost" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Cost</label>
											<input id="bookCost" v-model="form.cost" type="number" min="0" step="0.01" placeholder="0.00"
												:class="[inputClass, 'border-stone-200']" class="font-data !text-[13.5px]" />
										</div>
										<div>
											<label for="bookCopyNumber" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Copy number</label>
											<input id="bookCopyNumber" v-model="form.copyNumber" type="text" placeholder="e.g. c.1"
												:class="[inputClass, 'border-stone-200']" class="font-data !text-[13.5px]" />
										</div>
									</div>
									<div>
										<label for="bookRemarks" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Remarks</label>
										<textarea id="bookRemarks" v-model="form.remarks" rows="3"
											placeholder="e.g. Donated copy, minor cover wear"
											class="w-full resize-y rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-[14px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
									</div>
								</div>
							</Transition>
						</div>
					</div>

					<div class="flex flex-shrink-0 items-center justify-between gap-2 border-t border-stone-100 px-6 py-4 sm:px-7">
						<span class="text-[12.5px] tabular-nums text-stone-400">Step {{ step }} of {{ lastStep }}</span>
						<div class="flex gap-2">
							<ButtonsButton v-if="step > 1" variant="ghost" :disabled="submitting" @click="goTo(step - 1)">
								<Icon name="i-tabler-arrow-left" class="h-4 w-4" />Back
							</ButtonsButton>
							<ButtonsButton v-else variant="ghost" @click="handleClose">Cancel</ButtonsButton>

							<!-- Editing can save from any step; adding walks through to the end. -->
							<ButtonsButton v-if="isEdit && step < lastStep" variant="ghost" :disabled="submitting" @click="handleSubmit">
								Save Changes
							</ButtonsButton>
							<ButtonsButton v-if="step < lastStep" type="submit" variant="primary">
								Continue<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
							</ButtonsButton>
							<ButtonsButton v-else type="submit" variant="primary" :disabled="submitting">
								<Icon v-if="submitting" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
								{{ isEdit ? (submitting ? 'Saving…' : 'Save Changes') : (submitting ? 'Adding…' : 'Add Book') }}
							</ButtonsButton>
						</div>
					</div>
				</form>
			</Transition>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { librarianService, type BookDetail, type LibraryArea, type NewBookPayload } from '~/services/librarianService'
import { useAlert } from '~/api/alert/useAlert'

const alert = useAlert()

const props = defineProps<{
	open: boolean
	categories?: string[]
	/** Set to edit this book instead of adding a new one. */
	book?: BookDetail | null
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'created'): void
	(e: 'updated'): void
}>()

const isEdit = computed(() => !!props.book)
// Editing can take a book down to 0 copies (all retired); a new book needs at least one.
const minQuantity = computed(() => (isEdit.value ? 0 : 1))
const originalQuantity = computed(() => props.book?.copies.length ?? 0)

const inputClass =
	'h-11 w-full rounded-[10px] border bg-white px-3 text-[15px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200'

const coverInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
	title: '',
	isbn: '',
	publicationYear: '' as string | number,
	subjectName: '',
	callNumber: '',
	areasOfLibrary: 'circulation' as LibraryArea,
	shelfLocation: '',
	coverImageURL: '',
	publisher: '',
	edition: '',
	volume: '',
	pages: '' as string | number,
	sourceOfFund: '',
	cost: '' as string | number,
	copyNumber: '',
	remarks: '',
})

/* Steps, as on the registration page: short sections instead of one long scroll. */
const stepList = [
	{ n: 1, label: 'Book details', optional: false, firstField: 'bookTitle' },
	{ n: 2, label: 'Shelving & copies', optional: false, firstField: 'bookCategory' },
	{ n: 3, label: 'More details', optional: true, firstField: 'bookPublisher' },
] as const
const lastStep = stepList.length
const step = ref(1)
const direction = ref(1)
// Adding: a step opens once the ones before it pass. Editing: every step is already filled, so any can open.
const furthestStep = ref(1)
const canOpen = (n: number) => isEdit.value || n <= furthestStep.value

function goTo(target: number) {
	if (target === step.value || !canOpen(target)) return
	direction.value = target > step.value ? 1 : -1
	step.value = target
}

function focusStep() {
	const id = stepList[step.value - 1]?.firstField
	if (id) document.getElementById(id)?.focus()
}

let authorKeySeq = 0
function blankAuthor() {
	return { key: ++authorKeySeq, name: '', role: 'Author' }
}

const authors = ref([blankAuthor()])
const quantity = ref(1)
const submitting = ref(false)
const coverLoadFailed = ref(false)
const errors = reactive<{ title: string; authors: string; subjectName: string }>({
	title: '',
	authors: '',
	subjectName: '',
})

const categories = computed(() => props.categories ?? [])

const coverUrlIsWellFormed = computed(() => {
	const value = form.coverImageURL.trim()
	if (!value) return false
	try {
		return ['http:', 'https:'].includes(new URL(value).protocol)
	} catch {
		return false
	}
})
const hasCover = computed(() => coverUrlIsWellFormed.value && !coverLoadFailed.value)
const coverError = computed(() => {
	if (!form.coverImageURL.trim()) return ''
	if (!coverUrlIsWellFormed.value) return 'That isn\'t a web link. It should start with https://'
	if (coverLoadFailed.value) return 'No image loaded from that link. Make sure it points to the image itself, not the page it\'s on.'
	return ''
})

function focusCoverInput() {
	coverInputRef.value?.focus()
	coverInputRef.value?.select()
}

function clearCover() {
	form.coverImageURL = ''
	coverLoadFailed.value = false
	coverInputRef.value?.focus()
}

function addAuthor() {
	authors.value.push(blankAuthor())
}

function removeAuthor(index: number) {
	if (authors.value.length > 1) authors.value.splice(index, 1)
}

function resetForm() {
	form.title = ''
	form.isbn = ''
	form.publicationYear = ''
	form.subjectName = ''
	form.callNumber = ''
	form.areasOfLibrary = 'circulation'
	form.shelfLocation = ''
	form.coverImageURL = ''
	form.publisher = ''
	form.edition = ''
	form.volume = ''
	form.pages = ''
	form.sourceOfFund = ''
	form.cost = ''
	form.copyNumber = ''
	form.remarks = ''
	authors.value = [blankAuthor()]
	quantity.value = 1
	coverLoadFailed.value = false
	step.value = 1
	direction.value = 1
	furthestStep.value = 1
	errors.title = ''
	errors.authors = ''
	errors.subjectName = ''
}

function fillFromBook(book: BookDetail) {
	form.title = book.title
	form.isbn = book.isbn ?? ''
	form.publicationYear = book.publicationYear ?? ''
	form.subjectName = book.subject?.name ?? ''
	form.callNumber = book.callNumber ?? ''
	form.areasOfLibrary = book.areasOfLibrary ?? 'circulation'
	form.shelfLocation = book.shelfLocation ?? ''
	form.coverImageURL = book.coverImageURL ?? ''
	form.publisher = book.publisher ?? ''
	form.edition = book.edition ?? ''
	form.volume = book.volume ?? ''
	form.pages = book.pages ?? ''
	form.sourceOfFund = book.sourceOfFund ?? ''
	form.cost = book.cost ?? ''
	form.copyNumber = book.copyNumber ?? ''
	form.remarks = book.remarks ?? ''
	authors.value = book.authors.length
		? book.authors.map((a) => ({ key: ++authorKeySeq, name: a.name, role: a.role || 'Author' }))
		: [blankAuthor()]
	quantity.value = book.copies.length
}

watch(() => props.open, (isOpen) => {
	if (isOpen) {
		resetForm()
		if (props.book) fillFromBook(props.book)
		nextTick(focusStep)
	}
})

function handleClose() {
	if (submitting.value) return
	emit('close')
}

/** Checks one step's required fields and shows their messages. Step 3 is all optional. */
function checkStep(n: number): boolean {
	if (n === 1) {
		errors.title = form.title.trim() ? '' : 'Title is required.'
		errors.authors = authors.value.some((a) => a.name.trim()) ? '' : 'At least one author is required.'
		return !errors.title && !errors.authors
	}
	if (n === 2) {
		errors.subjectName = form.subjectName.trim() ? '' : 'Category is required.'
		return !errors.subjectName
	}
	return true
}

function stepHasError(n: number) {
	if (n === 1) return !!(errors.title || errors.authors)
	if (n === 2) return !!errors.subjectName
	return false
}

function next() {
	if (!checkStep(step.value)) {
		focusStep()
		return
	}
	furthestStep.value = Math.max(furthestStep.value, step.value + 1)
	goTo(step.value + 1)
}

async function handleSubmit() {
	// Check every step, and send the librarian to the first one with a problem.
	const invalidStep = stepList.map((s) => s.n).find((n) => !checkStep(n))
	if (invalidStep) {
		if (invalidStep === step.value) focusStep()
		else goTo(invalidStep)
		return
	}

	submitting.value = true

	const payload: NewBookPayload = {
		title: form.title.trim(),
		authors: authors.value
			.filter((a) => a.name.trim())
			.map((a) => ({ name: a.name.trim(), role: a.role })),
		subjectName: form.subjectName.trim(),
		isbn: form.isbn.trim() || null,
		publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
		callNumber: form.callNumber.trim() || null,
		areasOfLibrary: form.areasOfLibrary,
		shelfLocation: form.shelfLocation.trim() || null,
		coverImageURL: form.coverImageURL.trim() || null,
		quantity: quantity.value,
		publisher: form.publisher.trim() || null,
		edition: form.edition.trim() || null,
		volume: form.volume.trim() || null,
		pages: form.pages ? Number(form.pages) : null,
		sourceOfFund: form.sourceOfFund.trim() || null,
		cost: form.cost !== '' ? Number(form.cost) : null,
		copyNumber: form.copyNumber.trim() || null,
		remarks: form.remarks.trim() || null,
	}

	const failTitle = isEdit.value ? 'Could not save changes' : 'Could not add book'

	try {
		if (props.book) {
			// A blank call number means "keep the one it has"; the server won't take an empty one.
			const { callNumber, ...changes } = payload
			await librarianService.updateBook(props.book.bookID, callNumber ? payload : changes)
			alert.success('Book updated', `Changes to "${payload.title}" are saved.`)
			emit('updated')
		} else {
			await librarianService.createBook(payload)
			alert.success('Book added', `"${payload.title}" is now in the catalog.`)
			emit('created')
		}
		emit('close')
	} catch (error: any) {
		const serverErrors = error?.data?.errors
		if (serverErrors) {
			errors.title = serverErrors.title?.[0] ?? ''
			errors.subjectName = serverErrors.subjectName?.[0] ?? ''
			if (errors.title) goTo(1)
			else if (errors.subjectName) goTo(2)
			// e.g. "Cannot reduce to 0: only 1 copies are currently available to retire"
			const fieldError = serverErrors.quantity?.[0] ?? serverErrors.coverImageURL?.[0]
			alert.error(failTitle, fieldError || error?.data?.message || 'Please check the highlighted fields.')
		} else {
			alert.error(failTitle, error?.data?.message || 'Please try again.')
		}
	} finally {
		submitting.value = false
	}
}
</script>
