<template>
	<StudentDrawer :open="open" title="Cart" @close="drawer.close()">
		<!-- After reserving -->
		<div v-if="done">
			<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
				<Icon name="i-lucide-check" class="h-6 w-6" />
			</div>
			<h3 class="dashboard-heading text-[22px] font-extrabold text-amber-900">Reservation sent</h3>
			<ul class="mt-2 space-y-1 text-[14px] text-stone-600">
				<li v-for="line in done" :key="line.title">
					<b class="text-stone-900">{{ line.title }}</b> · you're #{{ line.queue }} in line
				</li>
			</ul>
			<p class="mt-3 text-[14px] text-stone-500">A librarian will review it. We'll notify you when it's ready.</p>
		</div>

		<div v-else>
			<div class="space-y-3 rounded-2xl border border-stone-200 bg-white p-4">
				<div>
					<div class="flex justify-between text-[13px]"><b>Books in cart</b><span class="tabular-nums">{{ cart.length }} / 3</span></div>
					<StudentMeter class="mt-2" :value="cart.length / 3" />
				</div>
				<div>
					<div class="flex justify-between text-[13px]"><b>Reservation slots left</b><span class="tabular-nums">{{ slotsLeft }} / 3</span></div>
					<StudentMeter class="mt-2" :value="slotsLeft / 3" />
				</div>
			</div>

			<div v-if="over" role="alert"
				class="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-red-50 px-3.5 py-3 text-[13px] leading-snug text-red-600">
				<Icon name="i-lucide-circle-alert" class="mt-px h-4 w-4 shrink-0" />
				<span>
					You have {{ slotsLeft }} reservation slot{{ slotsLeft === 1 ? '' : 's' }} left. Remove
					{{ cart.length - slotsLeft }} book{{ cart.length - slotsLeft === 1 ? '' : 's' }} to continue.
				</span>
			</div>

			<template v-if="cart.length">
				<TransitionGroup tag="div" class="relative mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white"
					leave-active-class="absolute inset-x-0 transition-[opacity,transform] duration-200 ease-out"
					leave-to-class="-translate-x-3 opacity-0" move-class="transition-transform duration-200 ease-out">
					<div v-for="row in cart" :key="row.wishlistID" class="relative flex items-center gap-3.5 border-b border-stone-100 bg-white p-3.5 last:border-0">
						<StudentCover :book="briefOf(row.book)" :width="44" />
						<div class="min-w-0 flex-1">
							<p class="text-[14px] font-semibold leading-tight text-stone-900">{{ row.book.title }}</p>
							<p class="mt-0.5 truncate text-[12.5px] text-stone-400">{{ authorLine(briefOf(row.book)) }}</p>
							<div class="mt-1.5">
								<StudentAvailability :available="copyCounts(row.book.copies).available" :total="copyCounts(row.book.copies).total" />
							</div>
						</div>
						<ButtonsButton variant="icon" aria-label="Remove from cart" @click="removeFromCart(row)">
							<Icon name="i-lucide-x" class="h-4 w-4" />
						</ButtonsButton>
					</div>
				</TransitionGroup>

				<div class="mt-3.5 flex items-start gap-2.5 rounded-2xl bg-accent-100 px-3.5 py-3 text-[13px] leading-snug text-accent-600">
					<Icon name="i-lucide-id-card" class="mt-px h-4 w-4 shrink-0" />
					<span>Reserving doesn't check the book out. A librarian accepts your request, then you collect it at the desk with your ID.</span>
				</div>
			</template>

			<StudentEmptyState v-else icon="i-lucide-shopping-bag" title="Your cart is empty"
				text="Add books from Discover or your wishlist.">
				<NuxtLink to="/student/discover">
					<ButtonsButton>Browse books</ButtonsButton>
				</NuxtLink>
			</StudentEmptyState>
		</div>

		<template #footer>
			<ButtonsButton v-if="done" class="!h-[46px] w-full !text-[15px]" @click="viewReservations">View reservations</ButtonsButton>
			<ButtonsButton v-else class="!h-[46px] w-full !text-[15px]" :disabled="!cart.length || over || reserving" @click="reserve">
				<span v-if="reserving" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
				{{ reserving ? 'Reserving…' : `Reserve ${cart.length || ''} book${cart.length === 1 ? '' : 's'}` }}
			</ButtonsButton>
		</template>
	</StudentDrawer>
</template>

<script setup lang="ts">
import { studentService, briefOf } from '~/services/studentService'
import { useAlert } from '~/api/alert/useAlert'

const drawer = useDrawer()
const alert = useAlert()
const { cart, slotsLeft, removeFromCart, refreshShell, bumpData } = useStudent()

const open = computed(() => drawer.active.value?.kind === 'cart')
const over = computed(() => cart.value.length > slotsLeft.value)

const reserving = ref(false)
const done = ref<{ title: string; queue: number }[] | null>(null)

// A fresh cart every time it's opened; the confirmation is only for the moment it happens.
watch(open, (isOpen) => { if (isOpen) done.value = null })

async function reserve() {
	if (!cart.value.length || over.value || reserving.value) return
	reserving.value = true

	try {
		const { reservations } = await studentService.reserveCart()
		const created = new Set(reservations.map((r) => r.reservationID))
		const [{ reservations: all }] = await Promise.all([studentService.reservations(), refreshShell()])

		done.value = all
			.filter((r) => created.has(r.reservationID))
			.map((r) => ({ title: r.book.title, queue: r.queuePosition ?? 1 }))
		bumpData()
	} catch (error: any) {
		alert.error('Could not reserve', apiErrorMessage(error))
	} finally {
		reserving.value = false
	}
}

async function viewReservations() {
	done.value = null
	await navigateTo({ path: '/student/books', query: { tab: 'reservations' } })
}
</script>
