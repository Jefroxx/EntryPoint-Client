<template>
	<Teleport to="body">
		<div class="fixed inset-0 z-index:100; flex items-center justify-center p-6"
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
				<div v-if="open" role="dialog" aria-modal="true" aria-labelledby="addBookTitle"
					@keydown.esc="handleClose"
					class="relative z-10 flex max-h-[min(680px,calc(100vh-48px))] w-full max-w-[560px] flex-col rounded-[22px] bg-white shadow-2xl">
					<div
						class="flex flex-shrink:0 items-start justify-between gap-3 border-b border-stone-100 px-6 py-5">
						<div>
							<h2 id="addBookTitle" class="dashboard-heading text-2xl font-bold text-amber-900">Add New
								Book</h2>
							<p class="dashboard-heading text-[12.5px] text-amber-900">Catalog a new title and its
								physical copies.</p>
						</div>
						<ButtonsButton variant="icon" size="md" aria-label="Close" @click="handleClose">
							<Icon name="i-lucide-x" class="h-4 w-4" />
						</ButtonsButton>
					</div>

					<div class="flex-1 overflow-y-auto px-6 py-5">
						<div class="mb-6">
							<p class="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">Book details
							</p>

							<div class="mb-3.5">
								<label for="bookTitle"
									class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">Title</label>
								<input id="bookTitle" ref="titleInputRef" v-model="form.title" type="text"
									placeholder="e.g. The Origin of Species"
									class="h-10 w-full rounded-[10px] border bg-white px-3 text-[13.5px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
									:class="errors.title ? 'border-red-400 bg-red-50' : 'border-stone-200'"
									@input="errors.title = ''" />
								<p v-if="errors.title" class="mt-1 text-[11.5px] text-red-500">{{ errors.title }}</p>
							</div>

							<div class="mb-3.5">
								<label class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">Author(s)</label>
								<div v-for="(author, index) in authors" :key="author.key"
									class="mb-2 flex items-center gap-2">
									<input v-model="author.name" type="text" placeholder="Author name"
										class="h-9 flex-1 rounded-[10px] border border-stone-200 bg-white px-3 text-[13px] text-stone-900 outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
									<select v-model="author.role"
										class="h-9 w-[120px] flex-shrink-0 rounded-[10px] border border-stone-200 bg-white px-2 text-[13px] text-stone-700 outline-none focus:border-accent-500">
										<option value="Author">Author</option>
										<option value="Editor">Editor</option>
										<option value="Translator">Translator</option>
										<option value="Illustrator">Illustrator</option>
									</select>
									<ButtonsButton variant="icon" size="sm" aria-label="Remove author"
										:disabled="authors.length === 1" @click="removeAuthor(index)">
										<Icon name="i-lucide-trash-2" class="h-3.5 w-3.5" />
									</ButtonsButton>
								</div>
								<p v-if="errors.authors" class="mb-1.5 text-[11.5px] text-red-500">{{ errors.authors }}
								</p>
								<button type="button"
									class="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-accent-500 transition-opacity hover:opacity-70"
									@click="addAuthor">
									<Icon name="i-lucide-plus" class="h-3.5 w-3.5" />Add author
								</button>
							</div>

							<div class="grid grid-cols-2 gap-3">
								<div>
									<label for="bookIsbn"
										class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">
										ISBN <span class="font-normal text-stone-400">(optional)</span>
									</label>
									<input id="bookIsbn" v-model="form.isbn" type="text" placeholder="978-0-000-00000-0"
										class="font-data h-10 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[12.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
								</div>
								<div>
									<label for="bookYear"
										class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">Publication
										year</label>
									<input id="bookYear" v-model="form.publicationYear" type="number" placeholder="2024"
										class="h-10 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
								</div>
							</div>
						</div>

						<div class="mb-6">
							<p class="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">
								Classification</p>

							<div class="mb-3.5 grid grid-cols-2 gap-3">
								<div>
									<label for="bookCategory"
										class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">
										Category / genre</label>
									<input id="bookCategory" v-model="form.subjectName" type="text"
										list="category-options" placeholder="e.g. Science"
										class="h-10 w-full rounded-[10px] border bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
										:class="errors.subjectName ? 'border-red-400 bg-red-50' : 'border-stone-200'"
										@input="errors.subjectName = ''" />
									<datalist id="category-options">
										<option v-for="c in categories" :key="c" :value="c" />
									</datalist>
									<p v-if="errors.subjectName" class="mt-1 text-[11.5px] text-red-500">{{
										errors.subjectName }}</p>
								</div>
								<div>
									<label for="bookCall"
										class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">
										Call number <span class="font-normal text-stone-400">(optional)</span>
									</label>
									<input id="bookCall" v-model="form.callNumber" type="text"
										placeholder="Auto-generated if left blank"
										class="font-data h-10 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[12.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
								</div>
							</div>

							<div>
								<label for="bookShelf" class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">
									Shelf location <span class="font-normal text-stone-400">(optional)</span>
								</label>
								<input id="bookShelf" v-model="form.shelfLocation" type="text"
									placeholder="e.g. 2nd Floor, Aisle 4"
									class="h-10 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
							</div>
						</div>

						<div>
							<p class="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-stone-400">Copies</p>

							<div class="grid grid-cols-2 gap-3">
								<div>
									<label
										class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">Quantity</label>
									<div class="flex w-fit overflow-hidden rounded-[10px] border border-stone-200">
										<button type="button" aria-label="Decrease quantity"
											class="flex h-10 w-9 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:scale-90"
											@click="quantity = Math.max(1, quantity - 1)">–</button>
										<span
											class="flex h-10 w-11 items-center justify-center border-x border-stone-200 text-[14px] font-bold tabular-nums text-stone-900">{{
												quantity }}</span>
										<button type="button" aria-label="Increase quantity"
											class="flex h-10 w-9 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:scale-90"
											@click="quantity = Math.min(100, quantity + 1)">+</button>
									</div>
								</div>
								<div>
									<label for="bookCover"
										class="mb-1.5 block text-[12.5px] font-semibold text-stone-800">
										Cover image URL <span class="font-normal text-stone-400">(optional)</span>
									</label>
									<div class="flex items-start gap-2.5">
										<div
											class="flex h-[52px] w-[38px] flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-accent-100 to-stone-200 text-stone-400">
											<img v-if="isValidCoverUrl" :src="form.coverImageURL!" alt=""
												class="h-full w-full object-cover" @error="coverLoadFailed = true" />
											<Icon v-else name="i-lucide-book" class="h-4 w-4" />
										</div>
										<input id="bookCover" v-model="form.coverImageURL" type="text"
											placeholder="https://…"
											class="h-10 flex-1 rounded-[10px] border border-stone-200 bg-white px-3 text-[13px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200"
											@input="coverLoadFailed = false" />
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="flex flex-shrink-0 justify-end gap-2 border-t border-stone-100 px-6 py-4">
						<ButtonsButton variant="ghost" @click="handleClose">Cancel</ButtonsButton>
						<ButtonsButton variant="primary" :disabled="submitting" @click="handleSubmit">
							<Icon v-if="submitting" name="i-lucide-loader-2" class="h-3.5 w-3.5 animate-spin" />
							{{ submitting ? 'Adding…' : 'Add Book' }}
						</ButtonsButton>
					</div>
				</div>
			</Transition>
		</div>
	</Teleport>
</template>

<script setup lang="ts">
import { librarianService, type NewBookPayload } from '~/services/librarianService'
import { useAlert } from '~/api/alert/useAlert'

const alert = useAlert()

const props = defineProps<{
	open: boolean
	categories?: string[]
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'created'): void
}>()

const titleInputRef = ref<HTMLInputElement | null>(null)

const form = reactive({
	title: '',
	isbn: '',
	publicationYear: '' as string | number,
	subjectName: '',
	callNumber: '',
	shelfLocation: '',
	coverImageURL: '',
})

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

const isValidCoverUrl = computed(() => {
	if (!form.coverImageURL || coverLoadFailed.value) return false
	try {
		new URL(form.coverImageURL)
		return true
	} catch {
		return false
	}
})

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
	form.shelfLocation = ''
	form.coverImageURL = ''
	authors.value = [blankAuthor()]
	quantity.value = 1
	coverLoadFailed.value = false
	errors.title = ''
	errors.authors = ''
	errors.subjectName = ''
}

watch(() => props.open, (isOpen) => {
	if (isOpen) {
		resetForm()
		nextTick(() => titleInputRef.value?.focus())
	}
})

function handleClose() {
	if (submitting.value) return
	emit('close')
}

function validate(): boolean {
	errors.title = form.title.trim() ? '' : 'Title is required.'
	errors.subjectName = form.subjectName.trim() ? '' : 'Category is required.'
	errors.authors = authors.value.some((a) => a.name.trim()) ? '' : 'At least one author is required.'
	return !errors.title && !errors.subjectName && !errors.authors
}

async function handleSubmit() {
	if (!validate()) return

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
		shelfLocation: form.shelfLocation.trim() || null,
		coverImageURL: form.coverImageURL.trim() || null,
		quantity: quantity.value,
	}

	try {
		await librarianService.createBook(payload)
		alert.success('Book added', `"${payload.title}" is now in the catalog.`)
		emit('created')
		emit('close')
	} catch (error: any) {
		const serverErrors = error?.data?.errors
		if (serverErrors) {
			errors.title = serverErrors.title?.[0] ?? ''
			errors.subjectName = serverErrors.subjectName?.[0] ?? ''
			alert.error('Could not add book', error?.data?.message || 'Please check the fields above.')
		} else {
			alert.error('Could not add book', error?.data?.message || 'Please try again.')
		}
	} finally {
		submitting.value = false
	}
}
</script>
