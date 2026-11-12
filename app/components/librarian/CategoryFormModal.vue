<template>
	<LibrarianModalShell :open="open" :size="subject ? 'xl' : 'md'" :title="subject ? 'Edit Category' : 'Add Category'"
		:subtitle="subject ? 'Rename it or change its Dewey code, and see which books are in it.' : 'Categories group books on the shelf and in the catalog.'"
		:busy="busy" :dirty="dirty" ref="shell" @close="emit('close')">
		<!-- Editing: the inputs on the left and the category's books on the right on a computer; on a phone the books follow the inputs. -->
		<div :class="subject ? 'grid items-start gap-6 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]' : ''">
			<div class="space-y-4">
				<LibrarianTextField id="category-name" v-model="form.name" label="Name" placeholder="e.g. Cooking"
					:error="errors.name" @update:model-value="errors.name = ''" />

				<LibrarianTextField id="category-code" v-model="form.classificationCode" label="Dewey code" optional mono
					placeholder="e.g. 641" hint="Leave blank to assign one automatically from the name." />
			</div>

			<section v-if="subject" aria-labelledby="category-books-title" class="min-w-0 md:border-l md:border-stone-100 md:pl-6">
				<div class="mb-3 flex items-baseline justify-between gap-3">
					<h3 id="category-books-title" class="text-[15px] font-bold text-crimson">Books in this category</h3>
					<span class="font-data text-[13px] text-stone-500">{{ total ?? subject.books_count }}</span>
				</div>

				<div v-if="loading && !books.length" class="space-y-2" aria-hidden="true">
					<div v-for="n in 4" :key="n" class="h-[74px] animate-pulse rounded-2xl bg-stone-100" />
				</div>
				<p v-else-if="failed" class="rounded-xl bg-red-50 px-4 py-3 text-[13.5px] text-red-600">
					Couldn't load the books. <button type="button" class="font-semibold underline underline-offset-2" @click="loadBooks(true)">Try again</button>
				</p>
				<p v-else-if="!books.length" class="rounded-xl border border-dashed border-stone-200 px-4 py-8 text-center text-[14px] text-stone-500">
					No books are in this category yet.
				</p>

				<template v-else>
					<!-- On a computer the list scrolls inside the window; on a phone the whole page scrolls. -->
					<ul class="space-y-2 md:max-h-[46vh] md:overflow-y-auto md:pr-1">
						<li v-for="b in books" :key="b.uuid" class="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-2.5">
							<img v-if="b.coverImageURL && !brokenCovers.has(b.uuid)" :src="b.coverImageURL" alt="" class="h-[58px] w-10 shrink-0 rounded-md object-cover ring-1 ring-stone-200"
								@error="brokenCovers.add(b.uuid)" />
							<span v-else class="flex h-[58px] w-10 shrink-0 items-center justify-center rounded-md bg-stone-100 text-stone-400 ring-1 ring-stone-200"><Icon name="i-tabler-book-2" class="h-4 w-4" /></span>
							<div class="min-w-0 flex-1">
								<p class="line-clamp-2 text-[14px] font-semibold leading-snug text-stone-900">{{ b.title }}</p>
								<p class="truncate text-[12.5px] text-stone-600">{{ b.authors.map((a) => a.name).join(', ') || 'Unknown author' }}</p>
								<p class="mt-0.5 flex items-center gap-2 text-[12px] text-stone-500">
									<span v-if="b.callNumber" class="font-data">{{ b.callNumber }}</span>
									<span>{{ b.copies.length }} {{ b.copies.length === 1 ? 'copy' : 'copies' }}</span>
								</p>
							</div>
						</li>
					</ul>

					<div v-if="books.length < (total ?? 0)" class="mt-3 flex justify-center">
						<ButtonsButton variant="ghost" size="sm" :disabled="loading" @click="loadBooks(false)">
							<Icon v-if="loading" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
							Show more ({{ (total ?? 0) - books.length }} left)
						</ButtonsButton>
					</div>
				</template>
			</section>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" :disabled="busy" @click="shell?.requestClose()">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ subject ? 'Save changes' : 'Add Category' }}
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { SubjectRecord } from '~/services/subjectService'
import { librarianService, type CatalogBook } from '~/services/librarianService'

const props = defineProps<{
	open: boolean
	subject: SubjectRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: { name: string; classificationCode: string | null }): void
}>()

const PAGE = 20

const form = reactive({ name: '', classificationCode: '' })
const errors = reactive({ name: '' })

/* ---------- The books in the category being edited ---------- */
const books = ref<CatalogBook[]>([])
const total = ref<number | null>(null)
const page = ref(0)
const loading = ref(false)
const failed = ref(false)
const brokenCovers = reactive(new Set<string>())
// Each load gets a number, so a slow answer for a category that was closed (or another one opened) is dropped.
let run = 0

/** The first page (or the next one): `fresh` starts over, which is also what "Try again" does. */
async function loadBooks(fresh: boolean) {
	const subject = props.subject
	if (!subject) return

	const mine = ++run
	if (fresh) { books.value = []; total.value = null; page.value = 0 }
	loading.value = true
	failed.value = false

	try {
		const result = await librarianService.fetchBooks({ subjectID: subject.subjectID, page: page.value + 1, perPage: PAGE })
		if (mine !== run) return
		books.value = fresh ? result.data : [...books.value, ...result.data]
		total.value = result.total
		page.value += 1
	} catch {
		if (mine !== run) return
		failed.value = true
	} finally {
		if (mine === run) loading.value = false
	}
}

// What is typed in this window: closing it with changes asks "Discard Changes?" first (see ModalShell, useUnsavedChanges).
const shell = ref<{ requestClose: () => void } | null>(null)
const { dirty } = useUnsavedChanges(() => form, () => props.open)

watch(() => props.open, (isOpen) => {
	if (!isOpen) { run++; return }
	form.name = props.subject?.name ?? ''
	form.classificationCode = props.subject?.classificationCode ?? ''
	errors.name = ''
	books.value = []
	total.value = null
	brokenCovers.clear()
	if (props.subject) void loadBooks(true)
})

function submit() {
	errors.name = form.name.trim() ? '' : 'Name is required.'
	if (errors.name) return

	emit('submit', {
		name: form.name.trim(),
		classificationCode: form.classificationCode.trim() || null,
	})
}
</script>
