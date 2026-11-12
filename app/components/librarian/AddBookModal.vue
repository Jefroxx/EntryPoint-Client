<template>
	<AppTeleport>
		<div class="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6"
			:class="open ? '' : 'pointer-events-none'">
			<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
				enter-to-class="opacity-100" leave-active-class="transition-opacity duration-150 ease-out"
				leave-from-class="opacity-100" leave-to-class="opacity-0">
				<div v-if="open" class="absolute inset-0 bg-[#1c1712]/40" @click="handleClose" />
			</Transition>

			<Transition enter-active-class="transition-[transform,translate,scale,opacity] duration-[260ms] ease-out max-sm:duration-[420ms] max-sm:ease-[cubic-bezier(.4,0,.2,1)]"
				enter-from-class="scale-95 translate-y-2 opacity-0 max-sm:translate-x-full max-sm:translate-y-0 max-sm:scale-100 max-sm:opacity-100 max-sm:motion-reduce:translate-x-0 max-sm:motion-reduce:opacity-0" enter-to-class="scale-100 translate-y-0 opacity-100"
				leave-active-class="transition-[transform,translate,scale,opacity] duration-150 ease-out max-sm:duration-[320ms] max-sm:ease-[cubic-bezier(.4,0,.2,1)]"
				leave-from-class="scale-100 translate-y-0 opacity-100"
				leave-to-class="scale-95 translate-y-1 opacity-0 max-sm:translate-x-full max-sm:translate-y-0 max-sm:scale-100 max-sm:opacity-100 max-sm:motion-reduce:translate-x-0 max-sm:motion-reduce:opacity-0">
				<form v-if="open" role="dialog" aria-modal="true" aria-labelledby="addBookTitle" novalidate
					@submit.prevent="entry !== 'form' ? undefined : confirming ? doSave() : step < lastStep ? next() : handleSubmit()"
					class="relative z-10 flex max-h-[min(780px,calc(100vh-32px))] w-full max-w-[940px] flex-col overflow-hidden rounded-[22px] bg-white shadow-overlay max-sm:h-dvh max-sm:max-h-none max-sm:rounded-none max-sm:shadow-none">
					<!-- Header + step bar (same pattern as student registration) -->
					<div class="flex-shrink-0 border-b border-stone-100 px-6 pb-4 pt-5 sm:px-7">
						<div class="flex items-start justify-between gap-3 max-sm:items-center">
							<div class="min-w-0 max-sm:flex-1">
								<h2 id="addBookTitle" class="dashboard-heading text-2xl font-bold text-crimson">
									{{ discarding ? 'Discard Changes?' : createdBook ? 'Book Added' : confirming ? (isEdit ? 'Confirm Changes' : 'Confirm New Book') : isEdit ? 'Edit Book' : 'Add New Book' }}</h2>
								<p v-if="!discarding" class="dashboard-heading text-[13.5px] text-crimson">
									{{ createdBook ? createdBook.title : confirming ? 'Check the details before they are saved.' : isEdit ? 'Jump to any section, change what you need, then save.' : entry === 'choose' ? 'How would you like to start?' : entry === 'scan' ? 'Scan the barcode on the back cover, or type the ISBN.' : 'Catalog a new title and its physical copies.' }}</p>
							</div>
							<ButtonsButton variant="icon" size="md" aria-label="Close" class="shrink-0" @click="handleClose">
								<Icon name="i-tabler-x" class="h-[18px] w-[18px]" />
							</ButtonsButton>
						</div>

						<ol v-show="!confirming && !createdBook && !discarding && entry === 'form'" class="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4" aria-label="Book form sections">
							<li v-for="s in stepList" :key="s.n" :aria-current="step === s.n ? 'step' : undefined">
								<button type="button" :disabled="!canOpen(s.n)"
									class="group w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 disabled:cursor-default"
									@click="goTo(s.n)">
									<span class="block h-1 rounded-full transition-colors duration-300"
										:class="s.n <= step ? 'bg-accent-500' : 'bg-stone-200'" />
									<span class="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-300"
										:class="step === s.n ? 'text-accent-600' : canOpen(s.n) ? 'text-stone-700 group-hover:text-accent-600' : 'text-stone-500'">
										<Icon v-if="stepHasError(s.n)" name="i-tabler-alert-circle" class="h-3.5 w-3.5 text-red-500" />
										<Icon v-else-if="s.n < step" name="i-tabler-check" class="h-3.5 w-3.5" />
										<span v-else class="tabular-nums">{{ s.n }}.</span>
										{{ s.label }}
										<span v-if="s.optional" class="font-normal text-stone-500">(optional)</span>
									</span>
								</button>
							</li>
						</ol>
					</div>

					<!-- Last step: a summary of what will be saved. It replaces the form in this same window (no second pop-up).
						 The form below is only hidden, not removed, so the page photos picked in step 4 are kept when going Back. -->
					<!-- Done: the book and its copies are in the catalog, and their barcode labels are one tap away. -->
				<!-- "Discard Changes?": closing with something typed or scanned asks first, inside this same window (never a second
						 pop-up). The form is only hidden meanwhile, so everything typed is still there if they keep editing. -->
				<div v-if="discarding" class="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">
					<div class="mx-auto flex max-w-[620px] items-start gap-3">
						<span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
							<Icon name="i-tabler-alert-triangle" class="h-5 w-5" />
						</span>
						<p class="pt-1 text-[15px] leading-relaxed text-stone-600">
							{{ isEdit ? "The changes you made to this book won't be saved." : "What you've entered for this book won't be saved, and nothing will be added to the catalog." }}
						</p>
					</div>
				</div>

				<div v-else-if="createdBook" class="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">
					<div class="mx-auto max-w-[620px] space-y-4">
						<div class="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3">
							<Icon name="i-tabler-circle-check" class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
							<div class="min-w-0">
								<p class="text-[15px] font-semibold text-stone-900">"{{ createdBook.title }}" is in the catalog</p>
								<p class="text-[13px] text-stone-600">{{ createdBook.copies }} {{ createdBook.copies === 1 ? 'copy' : 'copies' }}, each with its own accession number and barcode.</p>
							</div>
						</div>
						<p class="text-[14px] leading-snug text-stone-600">Each copy needs a barcode label stuck on it before it can be scanned at checkout. Print them now, or later from the Book Catalog.</p>
					</div>
				</div>

				<div v-else-if="confirming" class="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">
						<div class="mx-auto max-w-[860px] space-y-4">
							<!-- A new book: who it is, at a glance (the cover as it will look, the title and authors). -->
							<div v-if="!isEdit" class="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-4">
								<img v-if="hasCover" :src="form.coverImageURL" alt="" class="h-24 w-16 shrink-0 rounded-lg object-cover shadow-sm ring-1 ring-stone-200" />
								<div v-else class="flex h-24 w-16 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-400 ring-1 ring-stone-200">
									<Icon name="i-tabler-book-2" class="h-6 w-6" aria-hidden="true" />
								</div>
								<div class="min-w-0">
									<p class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">New book</p>
									<p class="text-[19px] font-bold leading-snug text-crimson">{{ form.title.trim() }}</p>
									<p class="mt-0.5 text-[14px] text-stone-600">{{ headerAuthors }}</p>
									<span v-if="form.subjectName.trim()" class="mt-2 inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-[12.5px] font-semibold text-stone-700">{{ form.subjectName.trim() }}</span>
								</div>
							</div>

							<p v-if="isEdit && summaryRows.length === 0" class="rounded-xl bg-stone-50 px-4 py-3 text-[14px] text-stone-600">
								None of the book's details changed.
							</p>
							<p v-else-if="isEdit" class="text-[13.5px] text-stone-600">
								{{ summaryRows.length }} {{ summaryRows.length === 1 ? 'thing is' : 'things are' }} changing. Only what changed is shown.
							</p>

							<!-- Grouped into small cards, two columns wide, so it reads at a glance instead of one long list. -->
							<section v-for="group in summaryGroups" :key="group.key" class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
								<h3 class="flex items-center gap-2 border-b border-stone-100 bg-stone-50 px-4 py-2.5 text-[12.5px] font-bold uppercase tracking-wide text-stone-600">
									<Icon :name="group.icon" class="h-4 w-4 text-accent-600" aria-hidden="true" />{{ group.title }}
								</h3>
								<dl class="grid gap-x-6 gap-y-1 p-3 sm:grid-cols-2">
									<div v-for="row in group.rows" :key="row.label" class="min-w-0 rounded-lg px-2 py-2"
										:class="[row.wide ? 'sm:col-span-2' : '', isEdit ? 'bg-amber-50/70' : '']">
										<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ row.label }}</dt>
										<dd class="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 break-words text-[15px] text-stone-900">
											<template v-if="isEdit && !row.plain">
												<span class="text-[13.5px] text-stone-500 line-through decoration-stone-300">{{ row.before || '—' }}</span>
												<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden="true" />
											</template>
											<span class="font-semibold">{{ row.now || '—' }}</span>
										</dd>
									</div>
								</dl>
							</section>
							<!-- The call number (Dewey Decimal): from the ISBN lookup or typed on the shelving step. It can still be changed here, and is saved when Yes is pressed. -->
							<div class="rounded-xl border border-stone-200 p-4">
								<label for="bookDewey" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
									Call number (Dewey Decimal)<FieldRequired v-if="deweyRequired" /><span v-else class="font-normal text-stone-500"> (optional)</span>
								</label>
								<div class="flex gap-2">
									<input id="bookDewey" v-model="form.deweyNumber" type="text" inputmode="decimal" maxlength="14" placeholder="e.g. 005.1" autocomplete="off"
										:disabled="lookingUp" :class="[inputClass, errors.deweyNumber ? 'border-red-400 bg-red-50' : 'border-stone-200']" class="font-data !text-[13.5px]"
										@input="onDeweyInput" @blur="checkDeweyField" />
									<ButtonsButton variant="ghost" class="shrink-0" :disabled="lookingUp || !form.isbn.trim()"
										:title="form.isbn.trim() ? 'Search the library catalogues for this book by its ISBN and fill in the call number' : 'No ISBN to look up'" @click="lookUpDewey">
										<Icon :name="lookingUp ? 'i-tabler-loader-2' : 'i-tabler-search'" class="h-4 w-4" :class="{ 'animate-spin': lookingUp }" />Find from ISBN
									</ButtonsButton>
								</div>
								<p v-if="errors.deweyNumber" class="mt-1.5 text-[12.5px] leading-snug text-red-500">{{ errors.deweyNumber }}</p>
								<p v-else-if="lookingUp || deweyHint" class="mt-1.5 text-[12.5px] leading-snug" :class="deweyIsError ? 'text-red-500' : 'text-stone-500'">
									{{ lookingUp ? 'Looking the ISBN up in the library catalogues…' : deweyHint }}
								</p>
								<p class="mt-2 text-[12.5px] leading-snug text-stone-500">
									{{ deweyRequired ? 'This is saved with the book when you press the button below.' : 'Left blank, the book is saved without a confirmed number (students see "Pending"); add it later by editing the book.' }}
								</p>
							</div>

						<p v-if="!isEdit" class="text-[13px] text-stone-500">
								Each copy gets its own accession number and barcode, and is recorded in the stock log. Any page photos you picked are saved with the book.
							</p>
						</div>
					</div>

					<!-- Adding a book starts here: scan the back cover, or type everything by hand. Both end up in the same form. -->
					<div v-if="entry !== 'form' && !confirming && !createdBook && !discarding" class="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-7">
						<div v-if="entry === 'choose'" class="mx-auto grid max-w-[640px] gap-3 sm:grid-cols-2">
							<button type="button"
								class="group flex flex-col items-start gap-3 rounded-2xl border border-stone-200 bg-white p-5 text-left transition-[transform,border-color,background-color] duration-150 ease-out hover:border-accent-300 hover:bg-accent-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 active:scale-[0.98]"
								@click="entry = 'scan'">
								<span class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600 transition-colors group-hover:bg-white">
									<Icon name="i-tabler-barcode" class="h-6 w-6" />
								</span>
								<span>
									<span class="flex items-center gap-2 text-[17px] font-bold text-crimson">Scan the back of the book
										<span class="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">Fastest</span>
									</span>
									<span class="mt-1 block text-[13.5px] leading-snug text-stone-600">Point the camera at the barcode on the back cover. The title, author, cover and more fill in for you.</span>
								</span>
							</button>
							<button type="button"
								class="group flex flex-col items-start gap-3 rounded-2xl border border-stone-200 bg-white p-5 text-left transition-[transform,border-color,background-color] duration-150 ease-out hover:border-accent-300 hover:bg-accent-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 active:scale-[0.98]"
								@click="startManual">
								<span class="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600 transition-colors group-hover:bg-white">
									<Icon name="i-tabler-pencil" class="h-6 w-6" />
								</span>
								<span>
									<span class="block text-[17px] font-bold text-crimson">Type it in myself</span>
									<span class="mt-1 block text-[13.5px] leading-snug text-stone-600">Enter every detail by hand. Best for older books and anything without a barcode.</span>
								</span>
							</button>
						</div>

						<div v-else class="mx-auto max-w-[560px] space-y-4">
							<!-- First, so it is in view without scrolling while the camera and the typed box stay below it. -->
							<LibrarianIsbnLookupProgress v-if="lookupSteps.length" :title="lookupTitle" :steps="lookupSteps" />
							<div v-show="!phoneOpen">
								<LibrarianCameraScanPanel :active="open && entry === 'scan' && !phoneOpen" format="isbn"
									hint="Hold the barcode inside the box, about 10–15 cm from the camera" @code="onIsbnScanned" />
							</div>
							<LibrarianPhoneScanner v-model:open="phoneOpen" :active="open && entry === 'scan'" @code="onIsbnScanned" />

							<div>
								<label for="startIsbn" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
									No barcode, or it won't scan? Type the ISBN</label>
								<div class="flex gap-2">
									<input id="startIsbn" v-model="form.isbn" type="text" inputmode="numeric" placeholder="978-0-000-00000-0" maxlength="20" autocomplete="off"
										:class="[inputClass, 'border-stone-200']" class="font-data !text-[13.5px]" @input="form.isbn = sanitizeIsbnInput(form.isbn)" @keydown.enter.prevent="findDetails" />
									<ButtonsButton variant="ghost" class="shrink-0" :disabled="findingDetails || !form.isbn.trim()" @click="findDetails">
										<Icon :name="findingDetails ? 'i-tabler-loader-2' : 'i-tabler-search'" class="h-4 w-4" :class="{ 'animate-spin': findingDetails }" />Find
									</ButtonsButton>
								</div>
							</div>

							<p v-if="!(lookupSteps.length && isbnStatus.kind === 'searching')" class="flex items-start gap-2 text-[13px] leading-snug" aria-live="polite"
								:class="isbnStatus.kind === 'error' ? 'text-red-500' : 'text-stone-500'">
								<span v-if="isbnStatus.kind === 'searching'" class="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-accent-500" />
								<span>{{ isbnStatus.kind === 'idle' ? 'The details are looked up as soon as the barcode is read.' : isbnStatusText }}</span>
							</p>
						</div>
					</div>

					<div v-show="!confirming && !createdBook && !discarding && entry === 'form'" class="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
						<!-- Cover: always visible, whichever step is open -->
						<aside
							class="flex flex-shrink-0 gap-4 border-b border-stone-100 bg-stone-50/70 px-6 py-5 md:w-[272px] md:flex-col md:overflow-y-auto md:border-b-0 md:border-r md:px-6">
							<button type="button" aria-label="Set cover image"
								class="group relative aspect-[2/3] w-[112px] shrink-0 overflow-hidden rounded-[14px] transition-transform duration-150 ease-out active:scale-[0.96] md:w-full"
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
									Cover image link <span class="font-normal text-stone-500">(optional)</span>
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
									<!-- What the last scan or ISBN lookup did (a new book only): which catalogues answered and what was filled in, or
										 that nothing was found. The scan itself is the "Scan the book" button next to Continue. -->
									<p v-if="!isEdit && (isbnStatus.kind === 'found' || isbnStatus.kind === 'none')"
										class="flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-[13px] leading-snug" aria-live="polite"
										:class="isbnStatus.kind === 'found' ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'">
										<Icon :name="isbnStatus.kind === 'found' ? 'i-tabler-circle-check' : 'i-tabler-info-circle'" class="mt-px h-4 w-4 shrink-0" />
										<span>{{ isbnStatusText }}<template v-if="isbnStatus.kind === 'found'"><span v-for="hint in isbnHints" :key="hint" class="mt-1.5 block font-medium text-amber-800">{{ hint }}</span></template></span>
									</p>

									<div>
										<label for="bookTitle"
											class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Title<FieldRequired /></label>
										<input id="bookTitle" v-model="form.title" type="text"
											placeholder="e.g. The Origin of Species"
											:class="[inputClass, errors.title ? 'border-red-400 bg-red-50' : 'border-stone-200']"
											@input="errors.title = ''" />
										<p v-if="errors.title" class="mt-1 text-[12.5px] text-red-500">{{ errors.title }}</p>
									</div>

									<div>
										<label class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Author(s)<FieldRequired /></label>
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
											<label for="bookIsbn" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">ISBN<FieldRequired /></label>
											<input id="bookIsbn" v-model="form.isbn" type="text" inputmode="text" autocomplete="off" placeholder="978-0-000-00000-0" maxlength="20"
												:class="[inputClass, errors.isbn ? 'border-red-400 bg-red-50' : 'border-stone-200']" class="font-data !text-[13.5px]"
												@input="onIsbnInput" @blur="checkIsbnField" />
											<p v-if="errors.isbn" class="mt-1 text-[12.5px] text-red-500">{{ errors.isbn }}</p>
											<p v-else class="mt-1 text-[12.5px] text-stone-500">10 or 13 digits. Hyphens are fine, and an X only at the end of an ISBN-10.</p>
										</div>
										<div>
											<label for="bookYear" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Publication year<FieldRequired /></label>
											<input id="bookYear" v-model="form.publicationYear" type="text" inputmode="numeric" autocomplete="off" maxlength="4" placeholder="2024"
												:class="[inputClass, errors.publicationYear ? 'border-red-400 bg-red-50' : 'border-stone-200']"
												@input="onYearInput" @blur="checkYearField" />
											<p v-if="errors.publicationYear" class="mt-1 text-[12.5px] text-red-500">{{ errors.publicationYear }}</p>
											<p v-else class="mt-1 text-[12.5px] text-stone-500">The four-digit year, no later than {{ CURRENT_YEAR }}.</p>
										</div>
									</div>
									<!-- For books that just arrived (the library also catalogues old books). Editing can mark an existing book, or take the mark off. -->
									<label class="flex cursor-pointer items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-3">
										<input v-model="form.isNewArrival" type="checkbox" class="mt-0.5 h-4 w-4 shrink-0 accent-accent-500" />
										<span class="min-w-0">
											<span class="block text-[14px] font-semibold text-stone-900">This is a new arrival</span>
											<span class="block text-[12.5px] leading-snug text-stone-500">{{ isEdit ? 'Shows the book in New arrivals on the students\' Home. Students are not notified again.' : 'Marks the book as new and notifies everyone. Leave it unticked for older books you are only now cataloguing.' }}</span>
										</span>
									</label>
								</div>

								<div v-else-if="step === 2" key="shelving" class="space-y-6">
									<fieldset>
										<legend class="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-stone-500">Classification</legend>
										<div class="grid gap-4">
											<div>
												<label for="bookCategory" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
													Category / genre<FieldRequired /></label>
												<input id="bookCategory" v-model="form.subjectName" type="text"
													list="category-options" placeholder="e.g. Science"
													:class="[inputClass, errors.subjectName ? 'border-red-400 bg-red-50' : 'border-stone-200']"
													@input="errors.subjectName = ''" />
												<datalist id="category-options">
													<option v-for="c in categories" :key="c" :value="c" />
												</datalist>
												<p v-if="errors.subjectName" class="mt-1 text-[12.5px] text-red-500">{{ errors.subjectName }}</p>
											</div>
											<!-- The call number IS the Dewey Decimal number (the author's Cutter is added on the shelf label). It is looked up from the ISBN
												when this step opens; if no catalogue has the book it is typed in. Required for a new book. -->
											<div>
												<label for="bookDeweyStep" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
													Call number (Dewey Decimal)<FieldRequired v-if="deweyRequired" /><span v-else class="font-normal text-stone-500"> (optional)</span>
												</label>
												<div class="flex gap-2">
													<input id="bookDeweyStep" v-model="form.deweyNumber" type="text" inputmode="decimal" maxlength="14" placeholder="e.g. 005.1" autocomplete="off"
														:disabled="lookingUp" :class="[inputClass, errors.deweyNumber ? 'border-red-400 bg-red-50' : 'border-stone-200']" class="font-data !text-[13.5px]"
														@input="onDeweyInput" @blur="checkDeweyField" />
													<ButtonsButton variant="ghost" class="shrink-0" :disabled="lookingUp || !form.isbn.trim()"
														:title="form.isbn.trim() ? 'Search the library catalogues for this book by its ISBN and fill in the call number' : 'Add the ISBN in step 1 to look it up'" @click="lookUpDewey">
														<Icon :name="lookingUp ? 'i-tabler-loader-2' : 'i-tabler-search'" class="h-4 w-4" :class="{ 'animate-spin': lookingUp }" />Find from ISBN
													</ButtonsButton>
												</div>
												<p v-if="errors.deweyNumber" class="mt-1.5 text-[12.5px] leading-snug text-red-500">{{ errors.deweyNumber }}</p>
												<p v-else class="mt-1.5 text-[12.5px] leading-snug" :class="deweyIsError ? 'text-red-500' : 'text-stone-500'">
													{{ lookingUp ? 'Looking the ISBN up in the library catalogues…' : deweyHint || deweyHelp }}
												</p>
											</div>
										</div>
									</fieldset>

									<fieldset>
										<legend class="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-stone-500">Location</legend>
										<div class="grid gap-3 sm:grid-cols-2">
											<div>
												<label for="bookArea" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
													Area of the library<FieldRequired /></label>
												<select id="bookArea" v-model="form.areaOfLibrary" :class="[inputClass, 'border-stone-200']">
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
													Shelf location <span class="font-normal text-stone-500">(optional)</span>
												</label>
												<input id="bookShelf" v-model="form.shelfLocation" type="text"
													placeholder="e.g. 2nd Floor, Aisle 4" :class="[inputClass, 'border-stone-200']" />
											</div>
										</div>
									</fieldset>

									<fieldset v-if="isEdit">
										<legend class="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-stone-500">Copies</legend>
										<!-- Copies are added and removed from the Book Catalog so every change lands in the stock log. -->
										<p class="text-[14px] text-stone-700"><b class="tabular-nums text-stone-900">{{ originalQuantity }}</b> {{ originalQuantity === 1 ? 'copy' : 'copies' }} in the catalog.</p>
										<p class="mt-1 text-[12.5px] leading-snug text-stone-500">
											To add or remove copies, use <b>Add copy</b> and <b>Remove copy</b> in the Book Catalog, so the change is recorded in the stock log.
										</p>
									</fieldset>
									<fieldset v-else>
										<legend class="mb-2.5 text-[12px] font-bold uppercase tracking-wide text-stone-500">Copies<FieldRequired /></legend>
										<div class="flex flex-wrap items-center gap-3">
											<div class="flex w-fit overflow-hidden rounded-[10px] border border-stone-200">
												<button type="button" aria-label="Decrease quantity" :disabled="quantity <= minQuantity"
													class="flex h-11 w-10 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:scale-[0.96] disabled:opacity-40"
													@click="quantity = Math.max(minQuantity, quantity - 1)">–</button>
												<span
													class="flex h-11 w-12 items-center justify-center border-x border-stone-200 text-[15px] font-bold tabular-nums text-stone-900">{{
														quantity }}</span>
												<button type="button" aria-label="Increase quantity"
													class="flex h-11 w-10 items-center justify-center text-stone-500 transition-colors hover:bg-stone-50 active:scale-[0.96]"
													@click="quantity = Math.min(100, quantity + 1)">+</button>
											</div>
											<span class="text-[13px] text-stone-500">{{ quantity === 1 ? 'copy' : 'copies' }} on the shelf</span>
										</div>
									</fieldset>
								</div>

								<div v-else-if="step === 3" key="more" class="space-y-4">
									<p class="text-[13px] leading-relaxed text-stone-500">
										Publication and acquisition records. Everything here is required except the remarks.
										If a book has no edition or volume, enter <b class="text-stone-700">N/A</b>; if it was donated, the cost is <b class="text-stone-700">0</b>.</p>
									<div class="grid gap-3 sm:grid-cols-2">
										<div>
											<label for="bookPublisher" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Publisher<FieldRequired /></label>
											<input id="bookPublisher" v-model="form.publisher" type="text" placeholder="e.g. McGraw-Hill" maxlength="255"
											:class="[inputClass, errors.publisher ? 'border-red-400 bg-red-50' : 'border-stone-200']" @input="errors.publisher = ''" />
											<p v-if="errors.publisher" class="mt-1 text-[12.5px] text-red-500">{{ errors.publisher }}</p>
										</div>
										<div>
											<label for="bookEdition" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Edition<FieldRequired /></label>
											<input id="bookEdition" v-model="form.edition" type="text" placeholder="e.g. 7th ed., or N/A" maxlength="50"
											:class="[inputClass, errors.edition ? 'border-red-400 bg-red-50' : 'border-stone-200']" @input="errors.edition = ''" />
											<p v-if="errors.edition" class="mt-1 text-[12.5px] text-red-500">{{ errors.edition }}</p>
										</div>
										<div>
											<label for="bookVolume" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Volume<FieldRequired /></label>
											<input id="bookVolume" v-model="form.volume" type="text" placeholder="e.g. Vol. 2, or N/A" maxlength="50"
											:class="[inputClass, errors.volume ? 'border-red-400 bg-red-50' : 'border-stone-200']" @input="errors.volume = ''" />
											<p v-if="errors.volume" class="mt-1 text-[12.5px] text-red-500">{{ errors.volume }}</p>
										</div>
										<div>
											<label for="bookPages" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Pages<FieldRequired /></label>
											<input id="bookPages" v-model="form.pageCount" type="text" inputmode="numeric" autocomplete="off" placeholder="e.g. 320"
											:class="[inputClass, errors.pageCount ? 'border-red-400 bg-red-50' : 'border-stone-200']" @input="onPagesInput" @blur="checkPagesField" />
											<p v-if="errors.pageCount" class="mt-1 text-[12.5px] text-red-500">{{ errors.pageCount }}</p>
										</div>
										<div>
											<label for="bookFund" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Source of fund<FieldRequired /></label>
											<input id="bookFund" v-model="form.sourceOfFund" type="text" placeholder="e.g. Library budget, Donation" maxlength="255"
											:class="[inputClass, errors.sourceOfFund ? 'border-red-400 bg-red-50' : 'border-stone-200']" @input="errors.sourceOfFund = ''" />
											<p v-if="errors.sourceOfFund" class="mt-1 text-[12.5px] text-red-500">{{ errors.sourceOfFund }}</p>
										</div>
										<div>
											<label for="bookCost" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Cost (₱)<FieldRequired /></label>
											<input id="bookCost" v-model="form.cost" type="text" inputmode="decimal" autocomplete="off" placeholder="0.00"
											:class="[inputClass, errors.cost ? 'border-red-400 bg-red-50' : 'border-stone-200']" class="font-data !text-[13.5px]" @input="onCostInput" @blur="checkCostField" />
											<p v-if="errors.cost" class="mt-1 text-[12.5px] text-red-500">{{ errors.cost }}</p>
											<p v-else class="mt-1 text-[12.5px] text-stone-500">Enter 0 for a donated book.</p>
										</div>
									</div>
									<div>
										<label for="bookRemarks" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">
											Remarks <span class="font-normal text-stone-500">(optional)</span>
										</label>
										<textarea id="bookRemarks" v-model="form.remarks" rows="3" maxlength="1000"
											placeholder="e.g. Donated copy, minor cover wear"
											class="w-full resize-y rounded-[10px] border border-stone-200 bg-white px-3 py-2 text-[14px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
									</div>
								</div>
							</Transition>

							<!-- Step 4 stays mounted while the window is open (shown, not re-created), so photos picked
								 there survive going back to another step. Re-created per open via editorKey. -->
							<LibrarianBookPagesEditor v-if="open" v-show="step === 4" :key="editorKey" ref="pagesEditor"
								:pages="book?.pages ?? []" />
						</div>
					</div>

					<div class="flex flex-shrink-0 items-center justify-between gap-2 border-t border-stone-100 px-6 py-4 sm:px-7">
						<span class="text-[12.5px] tabular-nums text-stone-500">{{ createdBook ? 'Done' : confirming ? 'Review' : entry !== 'form' ? 'Start' : `Step ${step} of ${lastStep}` }}</span>
						<div v-if="discarding" class="flex gap-2">
							<ButtonsButton ref="keepEditingButton" variant="ghost" @click="keepEditing">Keep Editing</ButtonsButton>
							<ButtonsButton variant="danger" @click="discardAndClose">Yes, Discard</ButtonsButton>
						</div>
						<div v-else-if="createdBook" class="flex gap-2">
							<ButtonsButton variant="ghost" @click="emit('close')">Done</ButtonsButton>
							<ButtonsButton variant="primary" @click="emit('print-labels', createdBook.uuid)">
								<Icon name="i-tabler-printer" class="h-3.5 w-3.5" />Print {{ createdBook.copies === 1 ? 'label' : `${createdBook.copies} labels` }}
							</ButtonsButton>
						</div>
						<div v-else-if="confirming" class="flex gap-2">
							<ButtonsButton variant="ghost" :disabled="submitting" @click="backToForm">
								<Icon name="i-tabler-arrow-left" class="h-4 w-4" />Back
							</ButtonsButton>
							<ButtonsButton type="submit" variant="primary" :disabled="submitting || lookingUp">
								<Icon v-if="submitting" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
								<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
								{{ isEdit ? (submitting ? 'Saving…' : 'Yes, save changes') : (submitting ? 'Adding…' : 'Yes, add book') }}
							</ButtonsButton>
						</div>
						<!-- Before the form: choosing how to start, or scanning. -->
						<div v-else-if="entry === 'choose'" class="flex gap-2">
							<ButtonsButton variant="ghost" @click="handleClose">Cancel</ButtonsButton>
						</div>
						<div v-else-if="entry === 'scan'" class="flex gap-2">
							<ButtonsButton variant="ghost" @click="entry = formStarted ? 'form' : 'choose'">
								<Icon name="i-tabler-arrow-left" class="h-4 w-4" />Back
							</ButtonsButton>
							<ButtonsButton variant="primary" @click="startManual">
								Type the details instead<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
							</ButtonsButton>
						</div>
						<div v-else class="flex gap-2">
							<ButtonsButton v-if="step > 1" variant="ghost" :disabled="submitting" @click="goTo(step - 1)">
								<Icon name="i-tabler-arrow-left" class="h-4 w-4" />Back
							</ButtonsButton>
							<ButtonsButton v-else variant="ghost" @click="handleClose">Cancel</ButtonsButton>
							<!-- A new book: scan the back cover from the first page too (it fills only what is still empty). -->
							<ButtonsButton v-if="!isEdit && step === 1" variant="ghost" @click="entry = 'scan'">
								<Icon name="i-tabler-barcode" class="h-4 w-4" />Scan the book
							</ButtonsButton>

							<!-- Editing can save from any step; adding walks through to the end. -->
							<ButtonsButton v-if="isEdit && step < lastStep" variant="ghost" :disabled="submitting" @click="handleSubmit">
								Review Changes
							</ButtonsButton>
							<ButtonsButton v-if="step < lastStep" type="submit" variant="primary">
								Continue<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
							</ButtonsButton>
							<ButtonsButton v-else type="submit" variant="primary" :disabled="submitting">
								{{ isEdit ? 'Review Changes' : 'Review' }}<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
							</ButtonsButton>
						</div>
					</div>
				</form>
			</Transition>
		</div>
	</AppTeleport>
</template>

<script setup lang="ts">
import { DEWEY_SOURCE_LABEL, LIBRARY_AREAS, librarianService, type BookDetail, type IsbnDetailsLookup, type IsbnSourceCheck, type IsbnSourceName, type LibraryArea, type NewBookPayload } from '~/services/librarianService'
import type { ProgressStep } from '~/components/librarian/IsbnLookupProgress.vue'
import { isbnFromBarcode, normalizeIsbn, sanitizeIsbnInput } from '~/utils/isbn'
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
	/** The scanned or typed ISBN is already a book in the catalog: the window closes and the caller offers to add a copy of it. */
	(e: 'exists', book: { bookUuid: string; title: string; authors: string[]; coverImageURL: string | null; callNumber: string | null; copies: number }): void
	/** Print the barcode labels of the book just added (all its copies). */
	(e: 'print-labels', bookUuid: string): void
}>()

const isEdit = computed(() => !!props.book)
// A new book needs at least one copy. (Editing doesn't change the count: copies are added and removed from the Book Catalog.)
const minQuantity = computed(() => 1)
const originalQuantity = computed(() => props.book?.copies.length ?? 0)

const inputClass =
	'h-11 w-full rounded-[10px] border bg-white px-3 text-[15px] text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-accent-500 focus:ring-2 focus:ring-accent-200'

const coverInputRef = ref<HTMLInputElement | null>(null)

/* ---------- Dewey number: found from the ISBN (Library of Congress, then Open Library) and accepted on the last page ---------- */
const deweyHint = ref('')
const deweyIsError = ref(false)
const lookingUp = ref(false)
// What the book already has, so saving an edit only sends the number when it was changed (and so counts as "typed in").
let originalDewey = ''
// The number an unchecked book has now: only a guess from its category, so it is shown for the librarian to accept or correct.
const guessedDewey = ref('')
// The ISBN the catalogues were last asked about, and the number they gave back. The lookup runs by itself on reaching the
// shelving step, but never twice for the same ISBN, and never over a number typed by hand or one the book already has.
let lookedUpIsbn = ''
let lookedUpNumber = ''

/** Reaching the shelving step with an ISBN entered: look the Dewey number up without a button press. */
async function autoLookUpDewey() {
	const isbn = form.isbn.trim()
	if (!isbn || lookingUp.value || isbn === lookedUpIsbn) return
	const typed = form.deweyNumber.trim()
	// An empty box, or the number an earlier lookup (for another ISBN) put there, may be replaced; nothing else.
	if (typed && typed !== lookedUpNumber) return
	await lookUpDewey()
}

/**
 * Entering the last page: when no number is typed, the ISBN is looked up so the librarian can accept it right there.
 * An unchecked book with no match falls back to its guess, which is shown to be checked or corrected.
 */
async function prepareDewey() {
	deweyIsError.value = false
	if (form.deweyNumber.trim()) {
		if (!deweyHint.value) deweyHint.value = props.book ? 'The number the book has now. Change it, or leave it as it is.' : ''
		return
	}
	// Already asked about this ISBN on the shelving step (and found nothing): don't ask the catalogues again.
	if (form.isbn.trim() && form.isbn.trim() !== lookedUpIsbn) await lookUpDewey()
	if (!form.deweyNumber.trim() && guessedDewey.value) {
		form.deweyNumber = guessedDewey.value
		deweyHint.value = `No catalogue has this book, so ${guessedDewey.value} is only a guess from the category. Check it, or type the right number.`
	}
}

function backToForm() {
	// The number stays: if the ISBN is changed on the way back, the shelving step looks the new one up (see autoLookUpDewey).
	confirming.value = false
}

async function lookUpDewey() {
	const isbn = form.isbn.trim()
	if (!isbn) return
	lookingUp.value = true
	deweyIsError.value = false
	lookedUpIsbn = isbn
	try {
		const result = await librarianService.lookupIsbnDewey(isbn)
		// The ISBN was changed while the catalogues were answering: that answer is for a book that is no longer in the form.
		if (form.isbn.trim() !== isbn) return
		if (result.found && result.deweyNumber) {
			form.deweyNumber = result.deweyNumber
			errors.deweyNumber = ''
			lookedUpNumber = result.deweyNumber
			deweyHint.value = `Found ${result.deweyNumber} in ${result.source ? DEWEY_SOURCE_LABEL[result.source] : 'a library catalogue'}. Check it, then confirm.`
		} else {
			// A number from an earlier lookup belonged to the previous ISBN, so it doesn't stay for this one.
			if (lookedUpNumber && form.deweyNumber === lookedUpNumber) form.deweyNumber = ''
			lookedUpNumber = ''
			// "Nobody has a number" and "the catalogue didn't answer" call for different next steps, so they read differently.
			deweyHint.value = result.unreachable
				? "The Library of Congress didn't answer, so a number may exist that couldn't be checked. Press Find from ISBN to try again, or type it in."
				: deweyRequired.value
				? 'No catalogue has a Dewey number for this ISBN. Type it in; it is often printed on the copyright page as "DDC".'
				: 'No catalogue has a Dewey number for this ISBN. Type one if you know it (often printed on the copyright page as "DDC"), or leave it blank.'
		}
	} catch {
		deweyIsError.value = true
		deweyHint.value = "Couldn't reach the catalogues. Try again, or type the number."
	} finally {
		lookingUp.value = false
	}
}

/* ---------- Fill the form from the ISBN: scan the back of the book, or type it and press Find ---------- */
const SOURCE_LABEL: Record<string, string> = { library_of_congress: 'the Library of Congress', open_library: 'Open Library', google_books: 'Google Books' }

// Adding a book opens on a choice: scan the back cover, or type everything. Editing goes straight to the form.
const entry = ref<'choose' | 'scan' | 'form'>('form')
const phoneOpen = ref(false)
// Once the form has been shown, Back from the scan screen returns to it (with what was typed) and not to the first choice.
const formStarted = ref(entry.value === 'form')
watch(entry, (now) => {
	if (now === 'form') formStarted.value = true
	// Back on the scan screen for another book: the last lookup's progress list and note no longer apply.
	if (now === 'scan' && !findingDetails.value) {
		lookupSteps.value = []
		isbnHints.value = []
		isbnStatus.value = { kind: 'idle' }
	}
})

function startManual() {
	entry.value = 'form'
	void nextTick(focusStep)
}
type IsbnStatus =
	| { kind: 'idle' }
	| { kind: 'searching' }
	| { kind: 'found'; filled: string[]; sources: string[] }
	| { kind: 'none'; text: string }
	| { kind: 'error'; text: string }
const isbnStatus = ref<IsbnStatus>({ kind: 'idle' })
const findingDetails = computed(() => isbnStatus.value.kind === 'searching')
// Each lookup gets a number, so an answer that arrives after a newer scan (or after the window was reset) is dropped.
let detailsRun = 0

/* ---------- The progress list: what the lookup is doing, step by step, so the screen is never a silent wait ---------- */
const PROGRESS_SOURCES: { name: IsbnSourceName; label: string }[] = [
	{ name: 'library_of_congress', label: 'Library of Congress' },
	{ name: 'open_library', label: 'Open Library' },
	{ name: 'google_books', label: 'Google Books' },
]
const lookupSteps = ref<ProgressStep[]>([])
const lookupTitle = ref('')
// Things to check by eye after a lookup (e.g. "this ISBN is a set of 7 volumes, so enter which volume").
const isbnHints = ref<string[]>([])

function patchStep(key: string, patch: Partial<ProgressStep>) {
	const step = lookupSteps.value.find((s) => s.key === key)
	if (step) Object.assign(step, patch)
}

function beginProgress(isbn: string) {
	const now = Date.now()
	lookupTitle.value = `Looking up ${isbn}`
	lookupSteps.value = [
		{ key: 'isbn', label: 'ISBN checked', state: 'done', detail: isbn },
		...PROGRESS_SOURCES.map(({ name, label }): ProgressStep => ({ key: name, label, state: 'running', running: 'Waiting for an answer…', startedAt: now })),
		{ key: 'merge', label: 'Putting the details together', state: 'waiting' },
		{ key: 'dewey', label: 'Call number (Dewey)', state: 'waiting' },
	]
}

function took(ms: number) {
	return ms >= 1000 ? ` · ${(ms / 1000).toFixed(1)}s` : ''
}

/** One catalogue is back: say what it said (found, no record, or no answer), from what the server really reported. */
function finishSource(check: IsbnSourceCheck) {
	const time = check.cached ? '' : took(check.ms)
	const detail = check.status === 'found' ? `Has this book${check.title ? `: ${check.title}` : ''}${time}`
		: check.status === 'none' ? `No record of this ISBN${time}`
			: check.status === 'unreachable' ? "Didn't answer in time. It may be down; the others carry on without it."
				: 'Switched off'
	patchStep(check.source, { state: check.status, detail })
}

/** The details are put together: close the last two rows from the server's answer. */
function finishProgress(result: IsbnDetailsLookup) {
	if (!result.found) {
		patchStep('merge', { state: 'none', detail: 'No catalogue had the book, so there was nothing to fill in.' })
		patchStep('dewey', { state: 'none', detail: 'Not looked up.' })
		return
	}
	const from = result.sources.map((s) => SOURCE_LABEL[s] ?? s).join(' and ')
	patchStep('merge', { state: 'done', detail: from ? `Filled in from ${from}.` : 'Done.' })
	if (result.deweyStatus === 'found' && result.deweyNumber) {
		const where = result.deweySource ? DEWEY_SOURCE_LABEL[result.deweySource] : 'a library catalogue'
		patchStep('dewey', { state: 'found', detail: `${result.deweyNumber}, from ${where}` })
	} else if (result.deweyStatus === 'unreachable') {
		patchStep('dewey', { state: 'unreachable', detail: "The Library of Congress didn't answer, so this couldn't be checked. You can retry on the next step, or type it." })
	} else {
		patchStep('dewey', { state: 'none', detail: 'No catalogue has a number for this book. Type it in; it is often printed on the copyright page as "DDC".' })
	}
}

const isbnStatusText = computed(() => {
	const status = isbnStatus.value
	if (status.kind === 'searching') return 'Looking the book up in the library catalogues…'
	if (status.kind === 'none' || status.kind === 'error') return status.text
	if (status.kind === 'found') {
		const from = status.sources.map((s) => SOURCE_LABEL[s] ?? s).join(' and ')
		return status.filled.length
			? `Found it in ${from}. Filled in: ${status.filled.join(', ')}. Check them below, then continue.`
			: `Found it in ${from}, but every field already has something typed in, so nothing was changed.`
	}
	return 'Scan the barcode on the back cover and the details fill in, or type the ISBN below and press Find. You can also skip this and type everything yourself.'
})

/** A barcode came off the camera (or the phone). Only a real book ISBN is used; anything else is explained, not guessed at. */
function onIsbnScanned(code: string) {
	const isbn = isbnFromBarcode(code) ?? normalizeIsbn(code)
	if (!isbn) {
		isbnStatus.value = { kind: 'none', text: "That barcode isn't a book's ISBN. Scan the one on the back cover (its number starts with 978 or 979)." }
		return
	}
	form.isbn = isbn
	errors.isbn = ''
	void findDetails()
}

async function findDetails() {
	const typed = form.isbn.trim()
	if (!typed || findingDetails.value) return

	const isbn = normalizeIsbn(typed)
	if (!isbn) {
		errors.isbn = "That isn't a valid ISBN. Check the digits."
		isbnStatus.value = { kind: 'none', text: "That isn't a valid ISBN, so there is nothing to look up. Check the digits (an ISBN has 10 or 13)." }
		return
	}

	const run = ++detailsRun
	isbnStatus.value = { kind: 'searching' }
	isbnHints.value = []
	// A book the library already has is a new copy of it, not a new book: settled before the catalogues are asked anything.
	if (!isEdit.value) {
		try {
			const { exists, book } = await librarianService.findBookByIsbn(isbn)
			if (run !== detailsRun) return
			if (exists && book) {
				isbnStatus.value = { kind: 'idle' }
				emit('exists', book)
				return
			}
		} catch {
			// The check itself failed: carry on; the server still refuses a duplicate when the book is saved.
			if (run !== detailsRun) return
		}
	}
	beginProgress(isbn)
	try {
		// Each catalogue is asked on its own, all at once, so each row can say how ITS ask went the moment it is back.
		// (The server remembers what they answered, so the lookup after this does not ask them again.)
		await Promise.all(PROGRESS_SOURCES.map(async ({ name }) => {
			try {
				const check = await librarianService.lookupIsbnSource(isbn, name, true)
				if (run === detailsRun) finishSource(check)
			} catch {
				if (run === detailsRun) patchStep(name, { state: 'unreachable', detail: "Couldn't ask. Check the connection." })
			}
		}))
		if (run !== detailsRun) return

		patchStep('merge', { state: 'running', running: 'Comparing what they said…', startedAt: Date.now() })
		patchStep('dewey', { state: 'running', running: 'Looking for the call number…', startedAt: Date.now() })
		const result = await librarianService.lookupIsbnDetails(isbn)
		if (run !== detailsRun) return
		finishProgress(result)
		// Let the finished list be seen for a moment before the window moves on to the form it has just filled.
		if (entry.value !== 'form' && (result.found || result.reason === 'not_found')) {
			await new Promise((resolve) => setTimeout(resolve, result.found ? 1100 : 600))
			if (run !== detailsRun) return
		}
		if (!result.found) {
			isbnStatus.value = { kind: 'none', text: result.message }
			// Valid ISBN, but no catalogue has the book (common for local and older titles): carry on into the form with
			// the ISBN kept, so the librarian types the rest. A mistyped ISBN or a dropped connection stays put to retry.
			if (entry.value !== 'form' && result.reason === 'not_found') {
				form.isbn = isbn
				errors.isbn = ''
				entry.value = 'form'
				void nextTick(focusStep)
			}
			return
		}
		isbnStatus.value = { kind: 'found', filled: applyIsbnDetails(result), sources: result.sources }
		isbnHints.value = result.hints ?? []
		// The Dewey catalogue stayed silent: the shelving step must say so, not "no catalogue has a number".
		if (result.deweyStatus === 'unreachable' && !result.deweyNumber) {
			deweyHint.value = "The Library of Congress didn't answer, so a call number may exist that couldn't be checked. Press Find from ISBN to try again, or type it."
			lookedUpIsbn = result.isbn
		}
		// Found from the start screen: carry on into the form, now filled in. (A miss stays put so it can be retried.)
		if (entry.value !== 'form') {
			entry.value = 'form'
			void nextTick(focusStep)
		}
	} catch {
		if (run !== detailsRun) return
		for (const step of lookupSteps.value) {
			if (step.state === 'running' || step.state === 'waiting') { step.state = 'unreachable'; step.detail = "Didn't finish." }
		}
		isbnStatus.value = { kind: 'error', text: "Couldn't reach the catalogues. Check the connection and try again, or type the details yourself." }
	}
}

/** Puts what was found into the fields that are still empty (never over what the librarian typed). Returns what it filled. */
function applyIsbnDetails(found: Extract<IsbnDetailsLookup, { found: true }>): string[] {
	const filled: string[] = []

	form.isbn = found.isbn
	errors.isbn = ''

	if (found.title && !form.title.trim()) {
		form.title = found.title
		errors.title = ''
		filled.push('title')
	}
	if (found.authors.length && authors.value.every((a) => !a.name.trim())) {
		authors.value = found.authors.map((name) => ({ key: ++authorKeySeq, name, role: 'Author' }))
		errors.authors = ''
		filled.push(found.authors.length === 1 ? 'author' : 'authors')
	}
	if (found.publisher && !form.publisher.trim()) {
		form.publisher = found.publisher
		errors.publisher = ''
		filled.push('publisher')
	}
	// (A catalogue can list a forthcoming book under next year; the form doesn't take a year in the future.)
	if (found.publishYear && found.publishYear <= new Date().getFullYear() && !String(form.publicationYear).trim()) {
		form.publicationYear = found.publishYear
		errors.publicationYear = ''
		filled.push('year')
	}
	if (found.pageCount && !String(form.pageCount).trim()) {
		form.pageCount = found.pageCount
		errors.pageCount = ''
		filled.push('page count')
	}
	if (found.coverUrl && !form.coverImageURL.trim()) {
		form.coverImageURL = found.coverUrl
		coverLoadFailed.value = false
		filled.push('cover')
	}
	// Only when a catalogue actually states them. Otherwise they stay empty for the librarian (a guess would read as fact).
	if (found.edition && !form.edition.trim()) {
		form.edition = found.edition
		errors.edition = ''
		filled.push('edition')
	}
	if (found.volume && !form.volume.trim()) {
		form.volume = found.volume
		errors.volume = ''
		filled.push('volume')
	}
	// The Dewey number comes in the same answer, so the shelving step doesn't have to ask the catalogues again.
	if (found.deweyNumber && !form.deweyNumber.trim()) {
		form.deweyNumber = found.deweyNumber
		errors.deweyNumber = ''
		lookedUpIsbn = found.isbn
		lookedUpNumber = found.deweyNumber
		deweyHint.value = `Found ${found.deweyNumber} in ${found.deweySource ? DEWEY_SOURCE_LABEL[found.deweySource] : 'a library catalogue'}. Check it, then confirm.`
		filled.push('Dewey number')
	}

	return filled
}

const form = reactive({
	title: '',
	isbn: '',
	publicationYear: '' as string | number,
	subjectName: '',
	deweyNumber: '',
	areaOfLibrary: 'circulation' as LibraryArea,
	shelfLocation: '',
	coverImageURL: '',
	publisher: '',
	edition: '',
	volume: '',
	pageCount: '' as string | number,
	sourceOfFund: '',
	cost: '' as string | number,
	remarks: '',
	isNewArrival: false,
})

/* Steps, as on the registration page: short sections instead of one long scroll. */
const stepList = [
	{ n: 1, label: 'Book details', optional: false, firstField: 'bookTitle' },
	{ n: 2, label: 'Shelving & copies', optional: false, firstField: 'bookCategory' },
	{ n: 3, label: 'More details', optional: false, firstField: 'bookPublisher' },
	{ n: 4, label: 'Page photos', optional: true, firstField: null },
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
	// The shelving step is where the Dewey number lives: look it up from the ISBN as soon as it opens.
	if (target === 2) void autoLookUpDewey()
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
const pagesEditor = ref<{
	apply: (bookUuid: string) => Promise<{ failed: number }>
	/** Photos added and removed, and whether any section was reordered (for the confirmation). */
	summary: { added: number; removed: number; reordered: boolean }
} | null>(null)
const editorKey = ref(0)
const quantity = ref(1)
const submitting = ref(false)
// The last step: a summary of what will be saved, shown in place of the form.
const confirming = ref(false)
// Set once a new book is in: the window then shows "Book Added" with a button to print its copies' labels.
const createdBook = ref<{ uuid: string; title: string; copies: number } | null>(null)
const coverLoadFailed = ref(false)
// The fields every book must have, whether it is being added or edited (see StoreBookRequest and UpdateBookRequest).
const REQUIRED_KEYS = ['isbn', 'publicationYear', 'publisher', 'edition', 'volume', 'pageCount', 'sourceOfFund', 'cost'] as const
type RequiredKey = (typeof REQUIRED_KEYS)[number]
const errors = reactive<{ title: string; authors: string; subjectName: string; deweyNumber: string } & Record<RequiredKey, string>>({
	title: '',
	authors: '',
	subjectName: '',
	deweyNumber: '',
	isbn: '',
	publicationYear: '',
	publisher: '',
	edition: '',
	volume: '',
	pageCount: '',
	sourceOfFund: '',
	cost: '',
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
	detailsRun++
	isbnStatus.value = { kind: 'idle' }
	lookupSteps.value = []
	isbnHints.value = []
	phoneOpen.value = false
	formStarted.value = false
	form.title = ''
	form.isbn = ''
	form.publicationYear = ''
	form.subjectName = ''
	form.deweyNumber = ''
	deweyHint.value = ''
	deweyIsError.value = false
	lookedUpIsbn = ''
	lookedUpNumber = ''
	createdBook.value = null
	originalDewey = ''
	guessedDewey.value = ''
	form.areaOfLibrary = 'circulation'
	form.shelfLocation = ''
	form.coverImageURL = ''
	form.publisher = ''
	form.edition = ''
	form.volume = ''
	form.pageCount = ''
	form.sourceOfFund = ''
	form.cost = ''
	form.remarks = ''
	form.isNewArrival = false
	authors.value = [blankAuthor()]
	quantity.value = 1
	coverLoadFailed.value = false
	step.value = 1
	direction.value = 1
	furthestStep.value = 1
	confirming.value = false
	errors.title = ''
	errors.authors = ''
	errors.subjectName = ''
	errors.deweyNumber = ''
	hadCheckedDewey.value = false
	for (const key of REQUIRED_KEYS) errors[key] = ''
}

function fillFromBook(book: BookDetail) {
	form.title = book.title
	form.isbn = book.isbn ?? ''
	form.publicationYear = book.publicationYear ?? ''
	form.subjectName = book.subject?.name ?? ''
	// A checked number is shown as it is; a guessed one is left blank so it can't be saved by accident as "typed in".
	originalDewey = book.deweyStatus === 'ok' ? (book.deweyNumber ?? '') : ''
	hadCheckedDewey.value = originalDewey !== ''
	guessedDewey.value = book.deweyStatus === 'ok' ? '' : (book.deweyNumber ?? '')
	form.deweyNumber = originalDewey
	deweyHint.value = ''
	deweyIsError.value = false
	form.areaOfLibrary = book.areaOfLibrary ?? 'circulation'
	form.shelfLocation = book.shelfLocation ?? ''
	form.coverImageURL = book.coverImageURL ?? ''
	form.isNewArrival = !!book.isNewArrival
	form.publisher = book.publisher ?? ''
	form.edition = book.edition ?? ''
	form.volume = book.volume ?? ''
	form.pageCount = book.pageCount ?? ''
	form.sourceOfFund = book.sourceOfFund ?? ''
	form.cost = book.cost ?? ''
	form.remarks = book.remarks ?? ''
	authors.value = book.authors.length
		? book.authors.map((a) => ({ key: ++authorKeySeq, name: a.name, role: a.role || 'Author' }))
		: [blankAuthor()]
	quantity.value = book.copies.length
}

watch(() => props.open, (isOpen) => {
	if (isOpen) {
		editorKey.value++
		discarding.value = false
		resetForm()
		if (props.book) fillFromBook(props.book)
		entry.value = props.book ? 'form' : 'choose'
		if (entry.value === 'form') nextTick(focusStep)
	}
})

// What is typed or scanned in this window. Closing with changes asks "Discard Changes?" first, as a step in this same
// window; once the book is saved there is nothing to lose (see useUnsavedChanges).
const { dirty } = useUnsavedChanges(() => [form, authors.value, quantity.value], () => props.open)
const discarding = ref(false)
const keepEditingButton = ref<{ $el?: HTMLElement } | null>(null)

function handleClose() {
	if (submitting.value) return
	// With the question already showing, the X, a click outside and Escape all mean "keep editing", so a second tap
	// can't throw the data away by accident.
	if (discarding.value) {
		keepEditing()
		return
	}
	if (dirty.value && !createdBook.value) {
		discarding.value = true
		void nextTick(() => keepEditingButton.value?.$el?.focus?.())
		return
	}
	emit('close')
}

function keepEditing() {
	discarding.value = false
}

// Escape is heard on the whole page, not only inside the form: after "Keep Editing" the button that had focus is gone,
// and Escape would otherwise do nothing until something in the form was clicked.
function onEscape(event: KeyboardEvent) {
	if (event.key === 'Escape' && props.open) handleClose()
}
onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape))

function discardAndClose() {
	discarding.value = false
	emit('close')
}

/* ---------- Checks on the ISBN and the publication year ---------- */
const CURRENT_YEAR = new Date().getFullYear()

/** Why the ISBN can't be saved, or '' when it can. An old book's unchanged ISBN is left alone (see UpdateBookRequest). */
function isbnProblem(): string {
	const value = form.isbn.trim()
	if (!value) return 'ISBN is required.'
	if (isEdit.value && value === (props.book?.isbn ?? '')) return ''
	return normalizeIsbn(value) ? '' : "That isn't a valid ISBN. It has 10 or 13 digits (an ISBN-10 may end in X), and its last digit is a check digit, so a typo is usually caught."
}

/** Why the year can't be saved, or '' when it can: four digits, and not in the future. */
function yearProblem(): string {
	const value = String(form.publicationYear).trim()
	if (!/^\d{4}$/.test(value)) return 'Enter the four-digit year, like 2024.'
	const year = Number(value)
	if (year > CURRENT_YEAR) return `The publication year can't be in the future. ${CURRENT_YEAR} is the latest.`
	if (year < 1000) return 'Enter the four-digit year, like 2024.'
	return ''
}

/** Only digits, hyphens, spaces and a final X can be typed (or pasted) into the ISBN box. */
function onIsbnInput() {
	form.isbn = sanitizeIsbnInput(form.isbn)
	errors.isbn = ''
}

/** Leaving the ISBN box with something in it says right away if it isn't a real ISBN (an empty box waits for Continue). */
function checkIsbnField() {
	if (form.isbn.trim()) errors.isbn = isbnProblem()
}

/** Only digits, and at most four of them. */
function onYearInput() {
	form.publicationYear = String(form.publicationYear).replace(/\D/g, '').slice(0, 4)
	errors.publicationYear = ''
}

/** Only digits can be typed into the page count. */
function onPagesInput() {
	form.pageCount = digitsOnly(String(form.pageCount), 5)
	errors.pageCount = ''
}

function checkPagesField() {
	const value = String(form.pageCount).trim()
	if (value && !(Number.isInteger(Number(value)) && Number(value) >= 1)) errors.pageCount = 'Enter the number of pages.'
}

/** Digits and one decimal point, with two places at most. */
function onCostInput() {
	form.cost = decimalOnly(String(form.cost), 2)
	errors.cost = ''
}

function checkCostField() {
	const value = String(form.cost).trim()
	if (value && !(Number.isFinite(Number(value)) && Number(value) >= 0)) errors.cost = 'Enter the cost (0 if it was donated).'
}

function checkYearField() {
	if (String(form.publicationYear).trim()) errors.publicationYear = yearProblem()
}

/* ---------- Call number (Dewey Decimal): required for a new book ---------- */
const DEWEY_FORMAT = /^\d{3}(\.\d{1,10})?$/
// Editing: a book whose number was only a guess may stay without one (it is on the "check Dewey numbers" list), but a book
// that already has a checked number can't have it blanked out.
const hadCheckedDewey = ref(false)
const deweyRequired = computed(() => !isEdit.value || hadCheckedDewey.value)

const deweyHelp = computed(() => form.isbn.trim()
	? 'Looked up from the ISBN when this step opens. If no catalogue has the book, type the number (often printed on the copyright page as "DDC").'
	: 'Type the Dewey number (often printed on the copyright page as "DDC"), or add the ISBN in step 1 to look it up.')

/** Why the call number can't be saved, or '' when it can. */
function deweyProblem(): string {
	const value = form.deweyNumber.trim()
	if (!value) return deweyRequired.value ? 'The call number is required. It is the Dewey number, like 005.1, often printed on the copyright page as "DDC".' : ''
	return DEWEY_FORMAT.test(value) ? '' : 'Write it as three digits, then an optional decimal part, like 005 or 005.13.'
}

/** Only digits and one decimal point can be typed (or pasted) into the call number box. */
function onDeweyInput() {
	const [whole = '', ...rest] = form.deweyNumber.replace(/[^0-9.]/g, '').split('.')
	form.deweyNumber = rest.length ? `${whole}.${rest.join('')}` : whole
	deweyHint.value = ''
	errors.deweyNumber = ''
}

function checkDeweyField() {
	if (form.deweyNumber.trim()) errors.deweyNumber = deweyProblem()
}

/** Checks one step's required fields and shows their messages. Step 4 (page photos) is optional. */
function checkStep(n: number): boolean {
	if (n === 1) {
		errors.title = form.title.trim() ? '' : 'Title is required.'
		errors.authors = authors.value.some((a) => a.name.trim()) ? '' : 'At least one author is required.'
		// A book's record is complete, new or edited.
		errors.isbn = isbnProblem()
		errors.publicationYear = yearProblem()
		return !errors.title && !errors.authors && !errors.isbn && !errors.publicationYear
	}
	if (n === 2) {
		errors.subjectName = form.subjectName.trim() ? '' : 'Category is required.'
		errors.deweyNumber = deweyProblem()
		return !errors.subjectName && !errors.deweyNumber
	}
	if (n === 3) {
		errors.publisher = form.publisher.trim() ? '' : 'Publisher is required.'
		errors.edition = form.edition.trim() ? '' : 'Edition is required. Enter N/A if there isn\'t one.'
		errors.volume = form.volume.trim() ? '' : 'Volume is required. Enter N/A if there isn\'t one.'
		const pages = Number(form.pageCount)
		errors.pageCount = form.pageCount !== '' && Number.isInteger(pages) && pages >= 1 ? '' : 'Enter the number of pages.'
		errors.sourceOfFund = form.sourceOfFund.trim() ? '' : 'Source of fund is required.'
		const price = form.cost === '' ? NaN : Number(form.cost)
		errors.cost = Number.isFinite(price) && price >= 0 ? '' : 'Enter the cost (0 if it was donated).'
		return !errors.publisher && !errors.edition && !errors.volume && !errors.pageCount && !errors.sourceOfFund && !errors.cost
	}
	return true
}

function stepHasError(n: number) {
	if (n === 1) return !!(errors.title || errors.authors || errors.isbn || errors.publicationYear)
	if (n === 2) return !!(errors.subjectName || errors.deweyNumber)
	if (n === 3) return !!(errors.publisher || errors.edition || errors.volume || errors.pageCount || errors.sourceOfFund || errors.cost)
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

type SummaryRow = {
	label: string
	now: string
	before: string
	group: 'book' | 'shelving' | 'details' | 'extras'
	/** A long value (the title, authors, remarks, a link): takes the whole width of its card. */
	wide?: boolean
	/** No "before" to show (page photo changes are described, not compared). */
	plain?: boolean
}

/** What the confirmation shows: every field when adding; only the fields that changed (old → new) when editing. */
const summaryRows = computed<SummaryRow[]>(() => {
	if (!confirming.value) return []
	const book = props.book
	const money = (v: string | number | null | undefined) => (v === '' || v == null ? '' : formatPeso(Number(v)))
	// "Name" for an ordinary author, "Name (Editor)" for any other role, so a changed role counts as a change too.
	const withRole = (name: string, role: string | null | undefined) => (role && role !== 'Author' ? `${name} (${role})` : name)
	const authorNames = authors.value.filter((a) => a.name.trim()).map((a) => withRole(a.name.trim(), a.role)).join(', ')

	// The page photos live in their own editor: added, removed or re-ordered photos are summed up here.
	const photos = pagesEditor.value?.summary
	const photoParts = photos ? [
		photos.added ? `${photos.added} added` : '',
		photos.removed ? `${photos.removed} removed` : '',
		photos.reordered ? 'order changed' : '',
	].filter(Boolean) : []
	const photoNow = photoParts.length ? (book ? photoParts.join(', ') : `${photos?.added ?? 0} ${photos?.added === 1 ? 'photo' : 'photos'}`) : ''

	const rows: SummaryRow[] = [
		{ group: 'book', wide: true, label: 'Title', now: form.title.trim(), before: book?.title ?? '' },
		{ group: 'book', wide: true, label: 'Authors', now: authorNames, before: book?.authors.map((a) => withRole(a.name, a.role)).join(', ') ?? '' },
		{ group: 'book', label: 'Category', now: form.subjectName.trim(), before: book?.subject?.name ?? '' },
		{ group: 'book', label: 'ISBN', now: form.isbn.trim(), before: book?.isbn ?? '' },
		{ group: 'book', label: 'Publication year', now: String(form.publicationYear).trim(), before: String(book?.publicationYear ?? '') },
		{ group: 'shelving', label: 'Area of library', now: LIBRARY_AREAS[form.areaOfLibrary], before: book?.areaOfLibrary ? LIBRARY_AREAS[book.areaOfLibrary] : LIBRARY_AREAS.circulation },
		{ group: 'shelving', label: 'Shelf location', now: form.shelfLocation.trim(), before: book?.shelfLocation ?? '' },
		{ group: 'details', label: 'Publisher', now: form.publisher.trim(), before: book?.publisher ?? '' },
		{ group: 'details', label: 'Edition', now: form.edition.trim(), before: book?.edition ?? '' },
		{ group: 'details', label: 'Volume', now: form.volume.trim(), before: book?.volume ?? '' },
		{ group: 'details', label: 'Pages', now: String(form.pageCount).trim(), before: String(book?.pageCount ?? '') },
		{ group: 'details', label: 'Source of fund', now: form.sourceOfFund.trim(), before: book?.sourceOfFund ?? '' },
		{ group: 'details', label: 'Cost', now: money(form.cost), before: money(book?.cost) },
		{ group: 'extras', wide: true, label: 'Cover image link', now: form.coverImageURL.trim(), before: book?.coverImageURL ?? '' },
		{ group: 'extras', wide: true, label: 'Remarks', now: form.remarks.trim(), before: book?.remarks ?? '' },
		{ group: 'extras', plain: true, label: 'Page photos', now: photoNow, before: '' },
	]
	if (book) rows.push({ group: 'extras', label: 'New arrival', now: form.isNewArrival ? 'Yes' : 'No', before: book.isNewArrival ? 'Yes' : 'No' })
	if (!book) {
		rows.splice(7, 0, { group: 'shelving', label: 'Copies', now: String(quantity.value), before: '' })
		rows.push({ group: 'extras', label: 'New arrival', now: form.isNewArrival ? 'Yes, everyone is notified' : 'No', before: '' })
		return rows.filter((r) => r.now !== '' || r.label === 'Copies')
	}
	return rows.filter((r) => r.now !== r.before)
})

const GROUPS = [
	{ key: 'book', title: 'The book', icon: 'i-tabler-book-2' },
	{ key: 'shelving', title: 'Shelving', icon: 'i-tabler-map-pin' },
	{ key: 'details', title: 'Details', icon: 'i-tabler-list-details' },
	{ key: 'extras', title: 'Extras', icon: 'i-tabler-photo' },
] as const

/**
 * The rows, sorted into their cards. A new book's title, authors and category are in the header card above,
 * so they are left out here; an edit lists only the rows that changed, so a card with none doesn't appear.
 */
const summaryGroups = computed(() => {
	const inHeader = new Set(['Title', 'Authors', 'Category'])
	return GROUPS
		.map((g) => ({ ...g, rows: summaryRows.value.filter((r) => r.group === g.key && (props.book || !inHeader.has(r.label))) }))
		.filter((g) => g.rows.length > 0)
})

const headerAuthors = computed(() => authors.value.filter((a) => a.name.trim()).map((a) => a.name.trim()).join(', '))

/** Validates every step, then shows the confirmation. Nothing is saved until "Yes" is pressed there. */
function handleSubmit() {
	// Check every step, and send the librarian to the first one with a problem.
	const invalidStep = stepList.map((s) => s.n).find((n) => !checkStep(n))
	if (invalidStep) {
		if (invalidStep === step.value) focusStep()
		else goTo(invalidStep)
		return
	}
	confirming.value = true
	void prepareDewey()
}

async function doSave() {
	const deweyError = deweyProblem()
	if (deweyError) {
		errors.deweyNumber = deweyError
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
		// New book: whatever was typed or looked up. Edit: only when it changed from what the book had.
		deweyNumber: form.deweyNumber.trim() && form.deweyNumber.trim() !== originalDewey ? form.deweyNumber.trim() : undefined,
		areaOfLibrary: form.areaOfLibrary,
		shelfLocation: form.shelfLocation.trim() || null,
		coverImageURL: form.coverImageURL.trim() || null,
		quantity: quantity.value,
		publisher: form.publisher.trim() || null,
		edition: form.edition.trim() || null,
		volume: form.volume.trim() || null,
		pageCount: form.pageCount ? Number(form.pageCount) : null,
		sourceOfFund: form.sourceOfFund.trim() || null,
		cost: form.cost !== '' ? Number(form.cost) : null,
		remarks: form.remarks.trim() || null,
		isNewArrival: form.isNewArrival,
	}

	const failTitle = isEdit.value ? 'Could not save changes' : 'Could not add book'

	try {
		let bookUuid: string
		let unchecked = false
		if (props.book) {
			// The copy count isn't edited here (copies are added and removed from the Book Catalog), so it isn't sent.
			const { quantity: _copies, ...changes } = payload
			await librarianService.updateBook(props.book.uuid, changes)
			bookUuid = props.book.uuid
		} else {
			const created = await librarianService.createBook(payload)
			bookUuid = created.book.uuid
			// No number typed and none found by ISBN: the book was saved with a guess from its category, which students don't see.
			unchecked = created.book.deweyStatus === 'needs_review'
		}

		// Page photos go once the book exists (a new one only has an ID now).
		const { failed } = (await pagesEditor.value?.apply(bookUuid)) ?? { failed: 0 }

		if (props.book) {
			alert.success('Book updated', `Changes to "${payload.title}" are saved.`)
			emit('updated')
		} else {
			alert.success(
				unchecked ? 'Book added, Dewey number unverified' : 'Book added',
				unchecked
					? `"${payload.title}" is in the catalog without a confirmed Dewey number. Add it later by editing the book.`
					: `"${payload.title}" is now in the catalog.`,
			)
			emit('created')
		}
		if (failed) alert.error('Some page photos didn\'t save', 'Open the book again to check its photos and add any that are missing.')

		// A new book stays open on a "Book Added" page (with a button to print its labels); an edit just closes.
		if (props.book) emit('close')
		else createdBook.value = { uuid: bookUuid, title: payload.title, copies: payload.quantity }
	} catch (error: any) {
		const serverErrors = error?.data?.errors
		// Back to the form: the highlighted fields are there.
		confirming.value = false
		if (serverErrors) {
			errors.title = serverErrors.title?.[0] ?? ''
			errors.subjectName = serverErrors.subjectName?.[0] ?? ''
			for (const key of REQUIRED_KEYS) errors[key] = serverErrors[key]?.[0] ?? ''
			if (errors.title || errors.isbn || errors.publicationYear) goTo(1)
			else if (errors.subjectName) goTo(2)
			else if (REQUIRED_KEYS.some((key) => errors[key])) goTo(3)
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
