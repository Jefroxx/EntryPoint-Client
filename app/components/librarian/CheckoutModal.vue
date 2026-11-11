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
					class="relative z-10 flex max-h-[min(780px,calc(100vh-32px))] w-full max-w-[940px] flex-col overflow-hidden rounded-[22px] bg-white shadow-overlay max-sm:h-dvh max-sm:max-h-none max-sm:max-w-none max-sm:rounded-none max-sm:shadow-none">
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
						<div v-show="step <= 2" class="grid gap-6 md:grid-cols-2">
							<!-- ===== Left: the camera, so scanning never means leaving this window ===== -->
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

								<!-- Step 2: ways to find the student under the camera. -->
								<template v-if="step === 2">
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
								</template>
							</section>

							<!-- ===== Right, step 1: the book. Found by the camera, a scanner, or typed by hand. ===== -->
							<section v-show="step === 1" aria-label="Book information" class="min-w-0 space-y-4">
								<form autocomplete="off" @submit.prevent="handleTyped">
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

								<!-- The book that was found. -->
								<div v-if="scanned" class="rounded-xl border px-4 py-3" :class="scanned.lendable ? 'border-red-200 bg-red-50' : 'border-emerald-200 bg-emerald-50/60'">
									<div class="flex items-start gap-3">
										<Icon :name="scanned.lendable ? 'i-tabler-alert-circle' : 'i-tabler-circle-check'" class="mt-0.5 h-5 w-5 shrink-0"
											:class="scanned.lendable ? 'text-red-500' : 'text-emerald-600'" />
										<div class="min-w-0 flex-1">
											<p class="text-[15px] font-semibold leading-snug text-stone-900">{{ scanned.book.title }}</p>
											<p class="truncate text-[13px] text-stone-500">{{ scanned.book.authors.join(', ') || 'Unknown author' }}</p>
											<p class="font-data mt-1 text-[12.5px] text-stone-600">Accession no. {{ scanned.accessionNumber }}<span v-if="scanned.barcodeValue"> · {{ scanned.barcodeValue }}</span></p>
											<p v-if="!scanned.lendable && scanned.dueDate" class="mt-0.5 text-[12.5px] text-stone-600">Would be due {{ formatDate(scanned.dueDate) }}</p>
										</div>
										<ButtonsButton variant="ghost" size="sm" class="shrink-0" @click="clearScan">Clear</ButtonsButton>
									</div>
									<p v-if="scanned.lendable" class="mt-2 text-[13.5px] font-medium text-red-700">{{ scanned.lendable }}</p>
								</div>
								<div v-else class="rounded-xl border border-dashed border-stone-300 px-4 py-6 text-center text-[13.5px] text-stone-500">
									<Icon name="i-tabler-book-2" class="mx-auto mb-1 h-6 w-6 text-stone-400" />
									The book's details appear here once it is scanned.
								</div>

								<!-- No barcode to read: find the book by its title instead. -->
								<div class="border-t border-stone-100 pt-4">
									<button v-if="!showTitleSearch" type="button" class="text-[13px] font-semibold text-accent-600 hover:underline" @click="showTitleSearch = true">
										Can't scan it? Find the book by title
									</button>
									<div v-else class="space-y-3">
										<div>
											<label for="checkout-book" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Search by title</label>
											<LibrarianSearchSelect v-model="pickedBook" input-id="checkout-book" placeholder="Search by title"
												:fetcher="searchBooks" :get-label="bookLabel" :get-sublabel="bookSublabel" />
										</div>
										<div v-if="pickedBook">
											<label for="checkout-copy" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Copy</label>
											<select v-if="shelfCopies.length" id="checkout-copy" v-model="pickedCopyAccession"
												class="font-data h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200">
												<option v-for="copy in shelfCopies" :key="copy.copyID" :value="copy.accessionNumber">Accession no. {{ copy.accessionNumber }}</option>
											</select>
											<p v-else class="rounded-lg bg-red-50 px-3 py-2 text-[13.5px] text-red-600">No copies of this book are on the shelf right now.</p>
										</div>
									</div>
								</div>

								<!-- A student collecting a reserved book can hand over the pickup slip; it fills in the book and the student. -->
								<div class="border-t border-stone-100 pt-4">
									<button v-if="!showPickup" type="button" class="text-[13px] font-semibold text-accent-600 hover:underline" @click="openPickup">
										Collecting a reserved book? Use the pickup code
									</button>
									<form v-else autocomplete="off" @submit.prevent="handlePickupCode">
										<label for="checkout-pickup" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Reservation pickup code <span class="font-normal text-stone-500">(optional)</span></label>
										<div class="flex gap-2">
											<input id="checkout-pickup" v-model="pickupCode" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false"
												placeholder="Scan the student's slip, or type R-000123" :disabled="lookingUp"
												class="font-data h-11 min-w-0 flex-1 rounded-[10px] border bg-white px-3 text-[13.5px] text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200 disabled:opacity-70"
												:class="errors.pickup ? 'border-red-400' : 'border-stone-200'" @input="errors.pickup = ''">
											<ButtonsButton type="submit" variant="ghost" :disabled="lookingUp || !pickupCode.trim()">Fill in</ButtonsButton>
										</div>
										<p v-if="errors.pickup" class="mt-1 text-[12.5px] text-red-500">{{ errors.pickup }}</p>
									</form>
								</div>
							</section>

							<!-- ===== Right, step 2: the book being lent, and who the student is. ===== -->
							<section v-if="step === 2" aria-label="Book and student information" class="min-w-0 space-y-4">
								<div v-if="scanned" class="rounded-xl bg-stone-50 px-4 py-3">
									<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Book</p>
									<p class="text-[15px] font-semibold leading-snug text-stone-900">{{ scanned.book.title }}</p>
									<p class="truncate text-[13px] text-stone-500">{{ scanned.book.authors.join(', ') || 'Unknown author' }}</p>
									<p class="font-data mt-0.5 text-[12.5px] text-stone-600">Accession no. {{ scanned.accessionNumber }}</p>
								</div>

								<div v-if="student" class="rounded-2xl border border-stone-200 p-5">
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
								<div v-else class="grid min-h-[200px] place-items-center rounded-2xl border border-dashed border-stone-300 px-4 text-center text-[13.5px] text-stone-500">
									<div>
										<Icon name="i-tabler-user-search" class="mx-auto mb-1 h-6 w-6 text-stone-400" />
										The student's information appears here once they are scanned or chosen.
									</div>
								</div>
							</section>
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
const showTitleSearch = ref(false)
const pickedBook = ref<CatalogBook | null>(null)
const pickedCopyAccession = ref<number | null>(null)
const shelfCopies = computed(() => (pickedBook.value?.copies ?? []).filter((c) => c.status === 'available'))

// A pickup slip scanned (or typed) at the desk: fills in the book and student, and the checkout then fulfils that reservation.
const pickupCode = ref('')
const showPickup = ref(false)
const lookingUp = ref(false)
const reservation = ref<{ reservationID: number; studentID: number; bookID: number; pickupCode: string } | null>(null)
const fulfilsReservation = computed(() => !!reservation.value && reservation.value.studentID === student.value?.studentID && reservation.value.bookID === scanned.value?.book.bookID)

// Set once the checkout goes through; the window then shows the receipt instead of the steps.
const receipt = ref<LoanReceiptData | null>(null)
const receiptView = ref<{ print: () => void } | null>(null)

const subtitle = computed(() => {
	if (receipt.value) return 'Print the receipt for the student to keep.'
	return ['Scan the book, or type its number.', "Scan the student's ID, or search for them.", 'Check the details, then confirm.'][step.value - 1]
})

/* ---------- steps ---------- */
// A step opens once the ones before it are done.
const bookReady = computed(() => !!scanned.value && !scanned.value.lendable)
const canOpen = (n: number) => n === 1 || (n === 2 && bookReady.value) || (n === 3 && bookReady.value && !!student.value)

function goTo(target: number) {
	if (target === step.value || !canOpen(target)) return
	step.value = target
}

function next() {
	if (step.value === 2 && !student.value) errors.student = 'Choose a student.'
	goTo(step.value + 1)
}

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
	if (paused || step.value > 2) return
	paused = true
	flash.value = true
	if (step.value === 1) void lookupBook(value)
	else void findStudent(value)
	setTimeout(() => { flash.value = false; paused = false }, 1600)
}

async function startCamera() {
	await nextTick()
	if (cameraEnabled.value && props.open && step.value <= 2 && !phoneOpen.value) {
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
	showTitleSearch.value = false
	pickupCode.value = ''
	showPickup.value = !!props.initialCode
	reservation.value = null
	errors.student = ''
	errors.scan = ''
	errors.studentScan = ''
	errors.pickup = ''

	if (props.initialCode) {
		pickupCode.value = props.initialCode
		void handlePickupCode().then(() => {
			if (!reservation.value || !student.value || !scanned.value || scanned.value.lendable) return
			// The slip was scanned: nothing is left to fill in, so go straight through (or to the confirmation).
			step.value = 3
			if (props.autoCheckout) void handleSubmit()
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
watch(pickedBook, (book) => {
	pickedCopyAccession.value = shelfCopies.value[0]?.accessionNumber ?? null
	if (book && pickedCopyAccession.value) void lookupBook(String(pickedCopyAccession.value))
})
watch(pickedCopyAccession, (accession, before) => {
	if (accession && before && accession !== before) void lookupBook(String(accession))
})

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
function openPickup() {
	showPickup.value = true
	focusSoon(() => document.getElementById('checkout-pickup'))
}

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
		if (!props.initialCode && !scanned.value.lendable) step.value = 3
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
	if (scanned.value.lendable) {
		step.value = 1
		errors.scan = scanned.value.lendable
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
