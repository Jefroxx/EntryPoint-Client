<template>
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
				<div v-if="open" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle" @keydown.esc="handleClose"
					class="relative z-10 flex h-[min(680px,calc(100vh-32px))] w-full max-w-[960px] flex-col overflow-hidden rounded-[22px] bg-white shadow-overlay max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:shadow-none">
					<!-- Header + step bar (same pattern as Add Book) -->
					<div class="flex-shrink-0 border-b border-stone-100 px-6 pb-4 pt-5 max-sm:px-4 max-sm:pt-3 sm:px-7">
						<div class="flex items-start justify-between gap-3 max-sm:items-center">
							<div class="min-w-0 max-sm:flex-1">
								<h2 id="checkoutTitle" class="dashboard-heading text-2xl font-bold text-crimson max-sm:text-xl">{{ receipt ? 'Checked out' : 'Checkout Book' }}</h2>
								<p class="dashboard-heading text-[13.5px] text-crimson">{{ subtitle }}</p>
							</div>
							<ButtonsButton variant="icon" size="md" aria-label="Close" class="shrink-0" @click="handleClose">
								<Icon name="i-tabler-x" class="h-[18px] w-[18px]" />
							</ButtonsButton>
						</div>

						<ol v-if="!receipt" class="mt-4 grid grid-cols-3 gap-2.5" aria-label="Checkout steps">
							<li v-for="s in STEPS" :key="s.n" :aria-current="step === s.n ? 'step' : undefined">
								<button type="button" :disabled="!canOpen(s.n)"
									class="group w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200 disabled:cursor-default"
									@click="goTo(s.n)">
									<span class="block h-1 rounded-full transition-colors duration-300" :class="s.n <= step ? 'bg-accent-500' : 'bg-stone-200'" />
									<span class="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold transition-colors duration-300"
										:class="step === s.n ? 'text-accent-600' : canOpen(s.n) ? 'text-stone-700 group-hover:text-accent-600' : 'text-stone-500'">
										<Icon v-if="s.n < step" name="i-tabler-check" class="h-3.5 w-3.5" />
										<span v-else class="tabular-nums">{{ s.n }}.</span>
										{{ s.label }}
									</span>
								</button>
							</li>
						</ol>
					</div>

					<!-- After checkout: the receipt, ready to print. -->
					<div v-if="receipt" class="min-h-0 flex-1 overflow-y-auto px-6 py-5 max-sm:px-4">
						<div class="mx-auto max-w-[480px]"><LoanReceipt ref="receiptView" :receipt="receipt" /></div>
					</div>

					<div v-else class="min-h-0 flex-1 overflow-y-auto px-6 py-6 max-sm:px-4 sm:px-7">
						<!-- Steps 1 and 2 share one camera on the left (shown, not re-created, so it stays on between them);
							 the right side is the book (step 1) or the book and the student (step 2). -->
						<div v-show="step <= 2 && !showOutput && !showCopyPick" class="grid gap-6 md:grid-cols-2">
							<!-- ===== Left: the camera, so scanning never means leaving this window. On a phone it sits under the input, so the box is the first thing there. ===== -->
							<section aria-label="Camera" class="min-w-0 space-y-4">
								<div v-if="!cameraEnabled" class="grid place-items-center rounded-2xl bg-stone-100 p-6 text-center text-[14px] leading-snug text-stone-600">
									<div class="max-w-[300px]">
										<Icon name="i-tabler-camera" class="mx-auto mb-2 h-8 w-8 text-stone-400" />
										<p class="mb-0.5 text-[15px] font-semibold text-stone-900">The Station's camera is in use</p>
										<p>Type the number, use a USB scanner, or open Checkout from Circulation to scan with the camera.</p>
									</div>
								</div>

								<div v-else v-show="!phoneOpen">
									<div class="relative aspect-video overflow-hidden rounded-2xl bg-stone-900 text-white">
										<video ref="video" muted playsinline autoplay class="absolute inset-0 h-full w-full object-cover" />

										<template v-if="camState === 'live'">
											<div class="pointer-events-none absolute rounded-[10px] shadow-[0_0_0_9999px_rgba(12,10,9,.45)]" :style="frameStyle">
												<i v-for="corner in CORNERS" :key="corner" class="absolute h-6 w-6 border-[3px] transition-colors duration-150"
													:class="[corner, flash ? 'border-emerald-300' : 'border-white/90']" />
											</div>
											<p class="pointer-events-none absolute inset-x-0 bottom-3 px-3 text-center text-[13.5px] text-white/90">
												{{ flash ? 'Got it' : step === 1 ? "Hold the book's barcode inside the box" : "Hold the student's ID inside the box" }}
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

								<!-- An alternative to the webcam: the librarian's phone reads the barcodes. -->
								<LibrarianPhoneScanner v-model:open="phoneOpen" :active="open && step <= 2" @code="onCameraCode" />

							</section>

							<!-- ===== Right, step 1: the book. Found by the camera, a scanner, or typed by hand. ===== -->
							<section v-show="step === 1" aria-label="Book information" class="min-w-0 space-y-4 max-md:order-first">
								<!-- Three ways to find the book, one at a time. -->
								<LibrarianSegmentedTabs v-model="findMode" wrap :tabs="FIND_TABS" />

								<div class="md:min-h-[176px]">
									<form v-show="findMode === 'scan'" autocomplete="off" @submit.prevent="handleTyped">
										<label for="checkout-scan" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Book barcode or accession number<FieldRequired /></label>
										<div class="flex gap-2">
											<div class="relative min-w-0 flex-1">
												<Icon name="i-tabler-barcode" class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
												<input id="checkout-scan" ref="scanInput" v-model="scanCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"
													placeholder="Scan it, or type it and press Enter" :disabled="scanning" aria-label="Book barcode"
													class="font-data h-11 w-full rounded-[10px] border bg-white pl-10 pr-3 text-[14px] text-stone-900 outline-none placeholder:font-sans focus:border-accent-500 focus:ring-2 focus:ring-accent-200 disabled:opacity-70"
													:class="errors.scan ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="errors.scan = ''">
											</div>
											<ButtonsButton type="submit" variant="ghost" :disabled="scanning || !scanCode.trim()">
												<Icon v-if="scanning" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
												Find
											</ButtonsButton>
										</div>
										<p v-if="errors.scan" class="mt-1 text-[12.5px] text-red-500">{{ errors.scan }}</p>
										<p v-else class="mt-1 text-[12.5px] text-stone-500">A USB scanner types into this box by itself. The accession number is printed on the book.</p>
									</form>

									<div v-show="findMode === 'title'" class="space-y-3">
										<div>
											<label for="checkout-book" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Search by title</label>
											<LibrarianSearchSelect v-model="pickedBook" input-id="checkout-book" placeholder="Search by title"
												:fetcher="searchBooks" :get-label="bookLabel" :get-sublabel="bookSublabel" />
										</div>
										<p class="text-[12.5px] text-stone-500">No barcode to read? Find the book by its title. You pick the copy in your hand on the next screen.</p>
									</div>

									<form v-show="findMode === 'pickup'" autocomplete="off" @submit.prevent="handlePickupCode">
										<label for="checkout-pickup" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Reservation pickup code</label>
										<div class="flex gap-2">
											<input id="checkout-pickup" v-model="pickupCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"
												placeholder="Scan the student's slip, or type R-000123" :disabled="lookingUp"
												class="font-data h-11 min-w-0 flex-1 rounded-[10px] border bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 disabled:opacity-70"
												:class="errors.pickup ? 'border-red-400' : 'border-stone-200'" @input="errors.pickup = ''">
											<ButtonsButton type="submit" variant="ghost" :disabled="lookingUp || !pickupCode.trim()">Fill in</ButtonsButton>
										</div>
										<p v-if="errors.pickup" class="mt-1 text-[12.5px] text-red-500">{{ errors.pickup }}</p>
										<p v-else class="mt-1 text-[12.5px] text-stone-500">A student collecting a reserved book can hand over the pickup slip. It fills in the book and the student.</p>
									</form>
								</div>
							</section>

							<!-- ===== Right, step 2: the book being lent, and who the student is. ===== -->
							<section v-if="step === 2" aria-label="Find the student" class="min-w-0 space-y-4 max-md:order-first">
								<div v-if="scanned" class="flex items-center gap-3 rounded-xl bg-stone-50 px-4 py-3">
									<div class="h-14 w-10 shrink-0 overflow-hidden rounded bg-stone-200">
										<img v-if="scanned.book.coverImageURL && !coverFailed" :src="scanned.book.coverImageURL" alt="" class="h-full w-full object-cover" @error="coverFailed = true">
										<div v-else class="dashboard-heading flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-500 to-accent-700 text-[13px] font-extrabold text-white">{{ initialsOf(scanned.book.title) }}</div>
									</div>
									<div class="min-w-0">
										<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Lending</p>
										<p class="truncate text-[15px] font-semibold leading-snug text-stone-900">{{ scanned.book.title }}</p>
										<p class="font-data text-[12.5px] text-stone-600">Accession no. {{ scanned.accessionNumber }}</p>
									</div>
								</div>
									<form autocomplete="off" @submit.prevent="handleStudentScan">
										<label for="checkout-student-scan" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Student ID</label>
										<div class="flex gap-2">
											<div class="relative min-w-0 flex-1">
												<Icon name="i-tabler-id" class="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
												<input id="checkout-student-scan" ref="studentScanInput" v-model="studentCode" type="text" autocomplete="off" spellcheck="false"
													placeholder="Scan the ID, or type the student number" :disabled="findingStudent" aria-label="Student ID"
													class="font-data h-11 w-full rounded-[10px] border bg-white pl-10 pr-3 text-[14px] text-stone-900 outline-none placeholder:font-sans focus:border-accent-500 focus:ring-2 focus:ring-accent-200 disabled:opacity-70"
													:class="errors.studentScan ? 'border-red-400 bg-red-50' : 'border-stone-200'" @input="errors.studentScan = ''">
											</div>
											<ButtonsButton type="submit" variant="ghost" :disabled="findingStudent || !studentCode.trim()">
												<Icon v-if="findingStudent" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
												Find
											</ButtonsButton>
										</div>
										<p v-if="errors.studentScan" class="mt-1 text-[12.5px] text-red-500">{{ errors.studentScan }}</p>
									</form>

									<div>
										<label for="checkout-student" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Or search by name<FieldRequired /></label>
										<LibrarianSearchSelect v-model="student" input-id="checkout-student" placeholder="Search name or student ID"
											:fetcher="searchStudents" :get-label="studentLabel" :get-sublabel="studentSublabel" :invalid="!!errors.student" />
										<p v-if="errors.student" class="mt-1 text-[12.5px] text-red-500">{{ errors.student }}</p>
									</div>
							</section>
						</div>

						<!-- ===== Title search: the book is chosen, now which copy of it is being lent. ===== -->
						<div v-if="step === 1 && showCopyPick && pickedBook" class="mx-auto max-w-[760px]">
							<div class="flex items-center gap-4 rounded-2xl bg-stone-50 p-4">
								<div class="h-[90px] w-[60px] shrink-0 overflow-hidden rounded-lg bg-stone-200 shadow-sm">
									<img v-if="pickedBook.coverImageURL && !pickedCoverFailed" :src="pickedBook.coverImageURL" alt="" class="h-full w-full object-cover" @error="pickedCoverFailed = true">
									<div v-else class="dashboard-heading flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-500 to-accent-700 text-[18px] font-extrabold text-white">{{ initialsOf(pickedBook.title) }}</div>
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Book chosen</p>
									<p class="dashboard-heading text-[19px] font-extrabold leading-tight text-stone-900">{{ pickedBook.title }}</p>
									<p class="text-[13.5px] text-stone-600">{{ pickedBook.authors.map((x) => x.name).join(', ') || 'Unknown author' }}</p>
								</div>
								<ButtonsButton variant="ghost" class="shrink-0" @click="clearScan">Search a different title</ButtonsButton>
							</div>

							<h3 class="mt-5 text-[15px] font-bold text-stone-900">Which copy are you lending?</h3>
							<p class="text-[13px] text-stone-500">Pick the copy in your hand. Its accession number is printed on the book.</p>

							<div v-if="shelfCopies.length" class="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
								<button v-for="copy in shelfCopies" :key="copy.copyID" type="button" :disabled="scanning"
									class="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left transition-colors hover:border-accent-500 hover:bg-accent-50 disabled:opacity-60"
									@click="chooseCopy(copy.accessionNumber)">
									<span>
										<span class="block text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">Accession no.</span>
										<span class="font-data text-[18px] font-bold text-stone-900">{{ copy.accessionNumber }}</span>
									</span>
									<span class="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[12px] font-semibold text-emerald-700">On the shelf</span>
								</button>
							</div>
							<p v-else class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-600">No copies of this book are on the shelf right now.</p>
							<p v-if="otherCopyCount" class="mt-3 text-[12.5px] text-stone-500">{{ otherCopyCount }} other {{ otherCopyCount === 1 ? 'copy is' : 'copies are' }} not on the shelf (on loan, damaged, or lost).</p>
							<p v-if="errors.scan" class="mt-2 text-[12.5px] text-red-500">{{ errors.scan }}</p>
						</div>

						<!-- ===== Output: what was found, on its own, once the input is done. ===== -->
						<div v-if="step <= 2 && showOutput" class="mx-auto max-w-[860px]">
							<!-- Step 1: the book -->
							<div v-if="step === 1 && scanned" class="rounded-2xl border p-5 sm:p-6" :class="blockedReason ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50/60'">
								<div class="flex gap-5 max-sm:flex-col">
									<div class="h-[240px] w-[160px] shrink-0 overflow-hidden rounded-xl bg-stone-200 shadow-card max-sm:mx-auto">
										<img v-if="scanned.book.coverImageURL && !coverFailed" :src="scanned.book.coverImageURL" :alt="`Cover of ${scanned.book.title}`" class="h-full w-full object-cover" @error="coverFailed = true">
										<div v-else class="dashboard-heading flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-500 to-accent-700 text-[40px] font-extrabold text-white">{{ initialsOf(scanned.book.title) }}</div>
									</div>
									<div class="min-w-0 flex-1">
										<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Book found</p>
										<p class="dashboard-heading text-[24px] font-extrabold leading-tight text-stone-900">{{ scanned.book.title }}</p>
										<p class="text-[14.5px] text-stone-600">{{ scanned.book.authors.join(', ') || 'Unknown author' }}</p>
										<dl class="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-[13px]">
											<div><dt class="font-semibold uppercase tracking-wide text-stone-500">Accession no.</dt><dd class="font-data text-[14.5px] text-stone-900">{{ scanned.accessionNumber }}</dd></div>
											<div><dt class="font-semibold uppercase tracking-wide text-stone-500">Call number</dt><dd class="font-data text-[14.5px] text-stone-900">{{ scanned.book.callNumber || '—' }}</dd></div>
											<div><dt class="font-semibold uppercase tracking-wide text-stone-500">Collection</dt><dd class="text-[14.5px] text-stone-900">{{ (scanned.book.areaOfLibrary && LIBRARY_AREAS[scanned.book.areaOfLibrary]) || '—' }}</dd></div>
											<div><dt class="font-semibold uppercase tracking-wide text-stone-500">Shelf</dt><dd class="font-data text-[14.5px] text-stone-900">{{ scanned.book.shelfLocation || '—' }}</dd></div>
											<div><dt class="font-semibold uppercase tracking-wide text-stone-500">ISBN</dt><dd class="font-data text-[14.5px] text-stone-900">{{ scanned.book.isbn || '—' }}</dd></div>
											<div><dt class="font-semibold uppercase tracking-wide text-stone-500">Published</dt><dd class="text-[14.5px] text-stone-900">{{ [scanned.book.publisher, scanned.book.publicationYear].filter(Boolean).join(', ') || '—' }}</dd></div>
										</dl>
									</div>
								</div>
								<p v-if="blockedReason" class="mt-4 flex items-start gap-2 text-[14px] font-medium text-red-700">
									<Icon name="i-tabler-alert-circle" class="mt-0.5 h-4 w-4 shrink-0" />{{ blockedReason }}
								</p>
								<p v-else class="mt-4 flex items-start gap-2 text-[14px] font-medium text-emerald-800">
									<Icon name="i-tabler-circle-check" class="mt-0.5 h-4 w-4 shrink-0" />Ready to lend<template v-if="scanned.dueDate">. Would be due {{ formatDate(scanned.dueDate) }}</template>
								</p>
								<div class="mt-4 border-t border-black/5 pt-4">
									<ButtonsButton variant="ghost" @click="clearScan">Find a different book</ButtonsButton>
								</div>
							</div>

							<!-- Step 2: the student, with the book being lent beside them -->
							<div v-if="step === 2 && student" class="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
								<div v-if="scanned" class="rounded-2xl bg-stone-50 p-5">
									<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Lending</p>
									<div class="mt-3 h-[150px] w-[100px] overflow-hidden rounded-lg bg-stone-200 shadow-sm">
										<img v-if="scanned.book.coverImageURL && !coverFailed" :src="scanned.book.coverImageURL" alt="" class="h-full w-full object-cover" @error="coverFailed = true">
										<div v-else class="dashboard-heading flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-500 to-accent-700 text-[26px] font-extrabold text-white">{{ initialsOf(scanned.book.title) }}</div>
									</div>
									<p class="mt-3 text-[16px] font-bold leading-snug text-stone-900">{{ scanned.book.title }}</p>
									<p class="text-[13px] text-stone-500">{{ scanned.book.authors.join(', ') || 'Unknown author' }}</p>
									<p class="font-data mt-1 text-[12.5px] text-stone-600">Accession no. {{ scanned.accessionNumber }}</p>
								</div>
								<div>
									<div class="rounded-2xl border border-stone-200 p-5">
									<div class="flex items-center gap-4">
										<span class="dashboard-heading flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[24px] font-extrabold text-white">{{ initialsOf(studentLabel(student)) }}</span>
										<div class="min-w-0">
											<p class="dashboard-heading text-[22px] font-extrabold leading-tight text-stone-900">{{ studentLabel(student) }}</p>
											<p class="font-data text-[13.5px] text-stone-500">{{ student.memberIDNumber }}</p>
										</div>
									</div>
									<dl class="mt-4 divide-y divide-stone-100 text-[14px]">
										<div class="flex justify-between gap-4 py-2"><dt class="text-stone-500">{{ isStaffMember ? 'Department' : 'Program' }}</dt><dd class="text-right font-semibold text-stone-900">{{ isStaffMember ? (student.department ?? '—') : (student.academicProgram ?? '—') }}</dd></div>
										<div v-if="isStaffMember" class="flex justify-between gap-4 py-2"><dt class="text-stone-500">Member type</dt><dd class="text-right font-semibold capitalize text-stone-900">{{ student.memberType }}</dd></div>
										<div class="flex justify-between gap-4 py-2"><dt class="text-stone-500">Email</dt><dd class="min-w-0 truncate text-right text-stone-900">{{ student.user?.email ?? '—' }}</dd></div>
										<div v-if="student.user?.phoneNumber" class="flex justify-between gap-4 py-2"><dt class="text-stone-500">Phone</dt><dd class="text-right text-stone-900">{{ student.user.phoneNumber }}</dd></div>
										<div class="flex justify-between gap-4 py-2"><dt class="text-stone-500">Account</dt><dd class="text-right font-semibold capitalize text-emerald-700">{{ student.registrationStatus }}</dd></div>
									</dl>
								</div>
									<ButtonsButton variant="ghost" class="mt-3" @click="clearStudent">Choose a different student</ButtonsButton>
								</div>
							</div>
						</div>

						<!-- ================= Step 3: confirm ================= -->
						<div v-if="step === 3 && scanned && student" class="mx-auto max-w-[620px] space-y-4">
							<div class="grid gap-3 sm:grid-cols-2">
								<div class="rounded-xl bg-stone-50 px-4 py-3">
									<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Book</p>
									<p class="text-[15px] font-semibold leading-snug text-stone-900">{{ scanned.book.title }}</p>
									<p class="truncate text-[13px] text-stone-500">{{ scanned.book.authors.join(', ') || 'Unknown author' }}</p>
									<p class="font-data mt-0.5 text-[12.5px] text-stone-600">Accession no. {{ scanned.accessionNumber }}</p>
								</div>
								<div class="rounded-xl bg-stone-50 px-4 py-3">
									<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Borrower</p>
									<p class="text-[15px] font-semibold leading-snug text-stone-900">{{ studentLabel(student) }}</p>
									<p class="truncate text-[13px] text-stone-500">{{ studentSublabel(student) }}</p>
								</div>
							</div>
							<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
								<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Checkout date</dt><dd class="font-semibold text-stone-900">{{ formatDate(today) }}</dd></div>
								<div class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Due back</dt><dd class="font-semibold text-stone-900">{{ scanned.dueDate ? formatDate(scanned.dueDate) : '—' }}</dd></div>
								<div v-if="fulfilsReservation" class="flex justify-between gap-4 px-4 py-2.5"><dt class="text-stone-500">Reservation</dt><dd class="font-semibold text-emerald-700">{{ reservation?.pickupCode }} will be marked collected</dd></div>
							</dl>
							<p class="text-[13px] text-stone-500">A receipt is shown after checkout, ready to print for the student.</p>
						</div>
					</div>

					<!-- Footer -->
					<div v-if="receipt" class="flex flex-shrink-0 justify-end gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:[&>*]:flex-1 sm:px-7">
						<ButtonsButton variant="ghost" @click="emit('close')">Done</ButtonsButton>
						<ButtonsButton variant="primary" @click="receiptView?.print()">
							<Icon name="i-tabler-printer" class="h-4 w-4" />Print receipt
						</ButtonsButton>
					</div>

					<div v-else class="flex flex-shrink-0 items-center justify-between gap-2 border-t border-stone-100 px-6 py-4 max-sm:px-4 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
						<span class="text-[12.5px] tabular-nums text-stone-500 max-sm:hidden">Step {{ step }} of {{ STEPS.length }}</span>
						<div class="flex gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
							<ButtonsButton v-if="step === 1" variant="ghost" @click="handleClose">Cancel</ButtonsButton>
							<ButtonsButton v-else variant="ghost" :disabled="submitting" @click="goTo(step - 1)">
								<Icon name="i-tabler-arrow-left" class="h-4 w-4" />Back
							</ButtonsButton>

							<ButtonsButton v-if="step < STEPS.length" variant="primary" :disabled="!canOpen(step + 1)" @click="next">
								{{ step === 2 ? 'Review' : 'Continue' }}<Icon name="i-tabler-arrow-right" class="h-4 w-4" />
							</ButtonsButton>
							<ButtonsButton v-else variant="primary" :disabled="submitting" @click="handleSubmit">
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
import { librarianService, type StudentRecord, type ScannedCopy, type CatalogBook } from '~/services/librarianService'
import { circulationService, type LoanReceipt as LoanReceiptData } from '~/services/circulationService'
import type { ScanRegion } from '~/composables/useCameraScanner'
import { useAlert } from '~/api/alert/useAlert'

const props = withDefaults(defineProps<{
	open: boolean
	/** A pickup code the scanner already read: looked up as soon as the window opens. */
	initialCode?: string
	/** With a code that is found, check the book out straight away (the slip was scanned, so there is nothing left to fill in). */
	autoCheckout?: boolean
	/** False where a camera is already running on the page (the Station), so two never fight over the webcam. */
	camera?: boolean
}>(), {
	// Vue turns a boolean prop that was not passed into false, so "on" has to be the stated default.
	camera: true,
})
const cameraEnabled = computed(() => props.camera)

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'created'): void
}>()

const alert = useAlert()

const STEPS = [
	{ n: 1, label: 'Book' },
	{ n: 2, label: 'Student' },
	{ n: 3, label: 'Confirm' },
] as const
const step = ref(1)

const student = ref<StudentRecord | null>(null)
const isStaffMember = computed(() => !!student.value?.memberType && student.value.memberType !== 'student')
// The copy being lent: found by the camera, a scanner, a typed number, or a reservation slip.
const scanned = ref<ScannedCopy | null>(null)
const scanCode = ref('')
const scanning = ref(false)
const scanInput = ref<HTMLInputElement | null>(null)
const studentCode = ref('')
const findingStudent = ref(false)
const studentScanInput = ref<HTMLInputElement | null>(null)
const submitting = ref(false)
const errors = reactive({ student: '', scan: '', studentScan: '', pickup: '' })
const today = new Date().toISOString()

// Finding the book by its title, for when there is no barcode to read.
// Which way of finding the book is showing.
const FIND_TABS = [
	{ label: 'Scan or type', short: 'Scan', value: 'scan' },
	{ label: 'Search by title', short: 'Title', value: 'title' },
	{ label: 'Pickup code', short: 'Pickup', value: 'pickup' },
]
const findMode = ref<'scan' | 'title' | 'pickup'>('scan')
// A cover link that doesn't load falls back to the initials tile.
const coverFailed = ref(false)
watch(() => scanned.value?.copyID, () => { coverFailed.value = false })
watch(findMode, (mode) => focusSoon(() => document.getElementById(mode === 'scan' ? 'checkout-scan' : mode === 'title' ? 'checkout-book' : 'checkout-pickup')))
const pickedBook = ref<CatalogBook | null>(null)
const pickedCopyAccession = ref<number | null>(null)
const shelfCopies = computed(() => (pickedBook.value?.copies ?? []).filter((c) => c.status === 'available'))
const otherCopyCount = computed(() => (pickedBook.value?.copies ?? []).filter((c) => c.status !== 'available' && c.status !== 'retired').length)
// A title was chosen but no copy yet: the copy list is the next screen.
const showCopyPick = computed(() => step.value === 1 && !scanned.value && !!pickedBook.value)
const pickedCoverFailed = ref(false)
watch(pickedBook, () => { pickedCoverFailed.value = false })
const chooseCopy = (accession: number) => lookupBook(String(accession))

// A pickup slip scanned (or typed) at the desk: fills in the book and student, and the checkout then fulfils that reservation.
const pickupCode = ref('')
const lookingUp = ref(false)
const reservation = ref<{ reservationID: number; studentID: number; bookID: number; pickupCode: string } | null>(null)
const fulfilsReservation = computed(() => !!reservation.value && reservation.value.studentID === student.value?.studentID && reservation.value.bookID === scanned.value?.book.bookID)
// Why this copy can't go out, or null. A copy only held for an accepted reservation can go to that reservation:
// the slip (or the Pickup code) loaded it, and the checkout then fulfils it (the server allows exactly that).
const blockedReason = computed(() => {
	const copy = scanned.value
	if (!copy?.lendable) return null
	if (copy.heldForReservation && reservation.value?.bookID === copy.book.bookID) return null
	return copy.lendable
})

// Set once the checkout goes through; the window then shows the receipt instead of the steps.
const receipt = ref<LoanReceiptData | null>(null)
const receiptView = ref<{ print: () => void } | null>(null)

const subtitle = computed(() => {
	if (receipt.value) return 'Print the receipt for the student to keep.'
	return ['Scan the book, or type its number.', "Scan the student's ID, or search for them.", 'Check the details, then confirm.'][step.value - 1]
})

/* ---------- steps ---------- */
// A step opens once the ones before it are done.
// Input and output are separate: a step shows what was found once it has been found, and the input again when changing it.
const showOutput = computed(() => (step.value === 1 && !!scanned.value) || (step.value === 2 && !!student.value) || showCopyPick.value)

function clearStudent() {
	student.value = null
	studentCode.value = ''
	reservation.value = null
	focusSoon(() => studentScanInput.value)
}

const bookReady = computed(() => !!scanned.value && !blockedReason.value)
const canOpen = (n: number) => n === 1 || (n === 2 && bookReady.value) || (n === 3 && bookReady.value && !!student.value)

function goTo(target: number) {
	if (target === step.value || !canOpen(target)) return
	step.value = target
}

function next() {
	if (step.value === 2 && !student.value) errors.student = 'Choose a student.'
	goTo(step.value + 1)
}

// The camera is only needed while there is something to scan: it rests while the result is showing.
watch(showOutput, (showing) => {
	if (step.value > 2) return
	if (showing) { stop(); desk.end() } else void startCamera()
})

// The camera is on for the book and the student (steps 1 and 2) and off for the confirmation.
watch(step, (now) => {
	if (now <= 2) void startCamera()
	else { stop(); desk.end() }
	if (now === 1) focusSoon(() => scanInput.value)
	if (now === 2) focusSoon(() => studentScanInput.value)
})

function focusSoon(el: () => HTMLElement | null) {
	nextTick(() => setTimeout(() => el()?.focus(), 80))
}

/* ---------- camera ---------- */
// Wide and short like a barcode. The decoder reads only inside this box, so what is drawn is what is read.
const REGION: ScanRegion = { left: 0.14, top: 0.32, width: 0.72, height: 0.36 }
const frameStyle = { left: `${REGION.left * 100}%`, top: `${REGION.top * 100}%`, width: `${REGION.width * 100}%`, height: `${REGION.height * 100}%` }
const CORNERS = ['left-0 top-0 border-b-0 border-r-0 rounded-tl-[10px]', 'right-0 top-0 border-b-0 border-l-0 rounded-tr-[10px]', 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[10px]', 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-[10px]']

const { video, state: camState, torchAvailable, torchOn, start, stop, toggleTorch } = useCameraScanner(onCameraCode, () => REGION)
// While this camera is reading, the Station tab (attendance) leaves its own reads alone.
const desk = useCheckoutDeskAnnouncer()

// The librarian's phone is the camera instead of the webcam: the webcam is switched off while that is so, and back on after.
const phoneOpen = ref(false)
watch(phoneOpen, (isOpen) => {
	if (isOpen) { stop(); desk.end() }
	else void startCamera()
})

const flash = ref(false)
let paused = false

// A read flashes the frame and pauses for a moment, so one barcode held up is never looked up twice.
// What it means depends on the step: a book on step 1, a student's ID on step 2.
function onCameraCode(value: string) {
	if (paused || step.value > 2 || showOutput.value) return
	paused = true
	flash.value = true
	if (step.value === 1) void lookupBook(value)
	else void findStudent(value)
	setTimeout(() => { flash.value = false; paused = false }, 1600)
}

async function startCamera() {
	await nextTick()
	if (cameraEnabled.value && props.open && step.value <= 2 && !phoneOpen.value && !showOutput.value) {
		desk.begin()
		await start()
	}
}

const camMessage = computed(() => {
	if (camState.value === 'blocked') return { title: 'Camera is blocked', text: "Allow camera access in your browser's site settings. You can still type the number." }
	if (camState.value === 'nocamera') return { title: 'No camera found', text: 'Plug in a webcam, or type the number instead.' }
	if (camState.value === 'unsupported') {
		return import.meta.client && !window.isSecureContext
			? { title: 'The camera needs a secure connection', text: 'Open this site over https (or on localhost). Browsers block the camera on plain http.' }
			: { title: "This browser can't read barcodes", text: 'Try Chrome or Edge, or type the number.' }
	}
	return { title: 'Camera is off', text: 'Turn it on to scan by holding a barcode up.' }
})

const camStatus = computed(() => {
	if (scanning.value || findingStudent.value) return { label: 'Looking it up…', class: 'text-amber-700', dot: 'bg-amber-600' }
	if (camState.value === 'live') return { label: 'Camera live', class: 'text-emerald-700', dot: 'bg-emerald-600' }
	if (camState.value === 'starting') return { label: 'Starting camera…', class: 'text-amber-700', dot: 'bg-amber-600' }
	return camState.value === 'idle' ? { label: 'Camera off', class: 'text-stone-500', dot: 'bg-stone-400' } : { label: 'Camera unavailable', class: 'text-red-600', dot: 'bg-red-500' }
})

/* ---------- opening and closing ---------- */
watch(() => props.open, (isOpen) => {
	if (!isOpen) { stop(); desk.end(); return }

	receipt.value = null
	step.value = 1
	student.value = null
	scanned.value = null
	scanCode.value = ''
	studentCode.value = ''
	pickedBook.value = null
	pickedCopyAccession.value = null
	pickupCode.value = ''
	findMode.value = props.initialCode ? 'pickup' : 'scan'
	reservation.value = null
	errors.student = ''
	errors.scan = ''
	errors.studentScan = ''
	errors.pickup = ''

	if (props.initialCode) {
		pickupCode.value = props.initialCode
		void handlePickupCode().then(() => {
			if (!reservation.value || !student.value || !scanned.value || blockedReason.value) return
			// The slip was scanned and the details are filled in. Only the desk's own scan checks out straight away;
			// otherwise the librarian steps through it, so nothing jumps ahead while they are looking.
			if (props.autoCheckout) { step.value = 3; void handleSubmit() }
		})
	} else {
		void startCamera()
		focusSoon(() => scanInput.value)
	}
})

onBeforeUnmount(() => stop())

/* ---------- finding the book ---------- */
async function lookupBook(raw: string) {
	const code = raw.replace(/[\r\n\t]/g, '').trim()
	if (!code || scanning.value) return

	scanning.value = true
	errors.scan = ''
	try {
		const { copy } = await librarianService.lookupCopy(code)
		// A different book than the loaded reservation's: that reservation is no longer what is being collected.
		if (reservation.value && reservation.value.bookID !== copy.book.bookID) reservation.value = null
		scanned.value = copy
		scanCode.value = ''
	} catch (error: any) {
		errors.scan = error?.data?.errors?.code?.[0] ?? error?.data?.message ?? 'Could not look up that barcode.'
		scanCode.value = ''
		focusSoon(() => scanInput.value)
	} finally {
		scanning.value = false
	}
}

const handleTyped = () => lookupBook(scanCode.value)

function clearScan() {
	scanned.value = null
	student.value = null
	reservation.value = null
	pickedBook.value = null
	pickedCopyAccession.value = null
	focusSoon(() => scanInput.value)
}

async function searchBooks(query: string) {
	const result = await librarianService.fetchBooks({ search: query || undefined, perPage: 6 })
	return result.data
}
const bookLabel = (b: CatalogBook) => b.title
const bookSublabel = (b: CatalogBook) => {
	const available = Math.max(0, b.copies.filter((c) => c.status === 'available').length - (b.heldCopies ?? 0))
	return `${b.authors.map((a) => a.name).join(', ') || 'Unknown author'} · ${available} available`
}

// Choosing a book by title picks its first shelf copy; the copy list lets the librarian pick another.
/* ---------- finding the student ---------- */
async function searchStudents(query: string) {
	const result = await librarianService.fetchStudents({ search: query || undefined, status: 'approved', perPage: 6 })
	return result.data
}

const studentLabel = (s: StudentRecord) => (s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown student')
const studentSublabel = (s: StudentRecord) => `${s.memberIDNumber} · ${s.academicProgram ?? s.department ?? '—'}`
const initialsOf = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

watch(student, (chosen) => {
	errors.student = ''
	// A loaded reservation belongs to its student: choosing someone else lets go of it.
	if (reservation.value && reservation.value.studentID !== chosen?.studentID) reservation.value = null
})

// The ID card's barcode (or the typed student number) finds the one approved student it belongs to.
const handleStudentScan = () => findStudent(studentCode.value)

async function findStudent(raw: string) {
	const code = raw.replace(/[\r\n\t]/g, '').trim()
	if (!code || findingStudent.value) return

	findingStudent.value = true
	errors.studentScan = ''
	try {
		const result = await librarianService.fetchStudents({ search: code, status: 'approved', perPage: 5 })
		const exact = result.data.find((s) => s.memberIDNumber.toLowerCase() === code.toLowerCase())
		const found = exact ?? (result.data.length === 1 ? result.data[0] : undefined)
		if (found) {
			student.value = found
		} else {
			errors.studentScan = result.data.length > 1 ? 'More than one student matches. Search by name below.' : 'No approved student has that ID.'
			focusSoon(() => studentScanInput.value)
		}
		studentCode.value = ''
	} catch (error: any) {
		errors.studentScan = error?.data?.message ?? 'Could not look that student up.'
	} finally {
		findingStudent.value = false
	}
}

/* ---------- a reservation slip ---------- */
async function handlePickupCode() {
	const code = pickupCode.value.trim()
	if (!code) return

	lookingUp.value = true
	errors.pickup = ''
	try {
		const { reservation: found } = await circulationService.lookupReservation(code)

		const studentNumber = found.student?.memberIDNumber
		const [students, books] = await Promise.all([
			librarianService.fetchStudents({ search: studentNumber, status: 'approved', perPage: 10 }),
			librarianService.fetchBooks({ search: found.book?.title, perPage: 20 }),
		])
		const matchedStudent = students.data.find((s) => s.studentID === found.studentID)
		const matchedBook = books.data.find((b) => b.bookID === found.bookID)
		if (!matchedStudent || !matchedBook) {
			errors.pickup = "Found the reservation, but couldn't load the student or book. Scan the book and choose the student instead."
			return
		}

		// Keep a copy the librarian already scanned if it is of the reserved book; otherwise take the first one on the shelf.
		if (scanned.value?.book.bookID !== matchedBook.bookID || scanned.value.lendable) {
			const shelfCopy = matchedBook.copies.find((c) => c.status === 'available')
			if (!shelfCopy) {
				errors.pickup = 'No copy of the reserved book is on the shelf right now.'
				return
			}
			const { copy } = await librarianService.lookupCopy(String(shelfCopy.accessionNumber))
			scanned.value = copy
		}

		student.value = matchedStudent
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

/* ---------- checking out ---------- */
function handleClose() {
	if (submitting.value) return
	emit('close')
}

async function handleSubmit() {
	if (!scanned.value || !student.value) return
	if (blockedReason.value) {
		step.value = 1
		errors.scan = blockedReason.value
		return
	}

	submitting.value = true
	try {
		// Only fulfil the reservation if the choice still matches it. (When it doesn't, the server still links
		// the student's own accepted reservation for this title.)
		const response = await circulationService.checkoutBook({
			studentID: student.value.studentID,
			copyID: scanned.value.copyID,
			...(fulfilsReservation.value ? { reservationID: reservation.value!.reservationID } : {}),
		})
		alert.success('Book checked out', `"${scanned.value.book.title}" was lent to ${studentLabel(student.value)}.`)
		emit('created')
		receipt.value = response.receipt
		stop()
		desk.end()
	} catch (error: any) {
		const serverErrors = error?.data?.errors
		const detail = serverErrors?.copyID?.[0] ?? serverErrors?.studentID?.[0] ?? error?.data?.message
		alert.error('Could not check out', detail || 'Please try again.')
	} finally {
		submitting.value = false
	}
}
</script>
