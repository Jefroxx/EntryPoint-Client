<template>
	<div>
		<div class="st-in mb-5">
			<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Rewards</h1>
			<p class="dashboard-heading mt-1 text-amber-900">Spend your knowledge points. A librarian hands over what you pick.</p>
		</div>

		<!-- Same shape as Home's points card: balance left, its one action pinned top-right, progress along the bottom. -->
		<section class="st-in relative overflow-hidden rounded-[22px] bg-gradient-to-br from-accent-600 via-accent-500 to-accent-400 p-5 text-white md:p-6" style="animation-delay: 35ms">
			<span class="pointer-events-none absolute -right-12 -top-12 h-[170px] w-[170px] rounded-full bg-white/10" />
			<div class="relative flex items-start justify-between gap-4">
				<div>
					<p class="text-[12.5px] font-medium text-white/85">Your balance</p>
					<p class="dashboard-heading mt-1 text-[48px] font-extrabold leading-none tracking-tight tabular-nums">
						{{ shownPoints }}<span class="ml-1.5 text-[16px] font-semibold text-white/80">pts</span>
					</p>
				</div>
				<NuxtLink to="/student/profile?tab=achievements"
					class="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] bg-white px-3.5 text-[13.5px] font-semibold text-accent-600 transition-transform duration-150 ease-out active:scale-95">
					<Icon name="i-tabler-trophy" class="h-4 w-4" />Achievements
				</NuxtLink>
			</div>

			<div v-if="nextPoints" class="relative mt-4">
				<div class="mb-2 flex justify-between gap-3 text-[12.5px]">
					<span class="text-white/90">Next: <b class="font-semibold text-white">{{ nextPoints.name }}</b></span>
					<span class="tabular-nums text-white/85">{{ points }} / {{ nextPoints.threshold }}</span>
				</div>
				<StudentMeter light :value="points / nextPoints.threshold" />
			</div>
			<p v-else class="relative mt-3 text-[13px] text-white/85">Earn points by visiting the library and claiming achievements.</p>
		</section>

		<div v-if="pending && !data" class="mt-6 space-y-3" aria-busy="true">
			<div v-for="n in 3" :key="n" class="h-20 animate-pulse rounded-2xl bg-stone-200/70" />
		</div>

		<!-- Wide screens: your picks sit in a panel beside the shelf, so they never get pushed down the page. -->
		<div v-else-if="data" class="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-6">
			<section id="market" class="st-in min-w-0 scroll-mt-20" style="animation-delay: 105ms">
				<h2 class="mb-2.5 mt-6 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Marketplace</h2>

				<p v-if="!data.items.length" class="rounded-2xl bg-stone-100 px-4 py-6 text-center text-[13.5px] text-stone-500">Nothing is on the marketplace yet.</p>
				<div v-else class="grid grid-cols-2 gap-2.5 md:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] md:gap-3">
					<article v-for="item in data.items" :key="item.itemID" class="flex flex-col rounded-2xl border border-stone-200 bg-white p-3" :class="!item.inStock ? 'opacity-60' : ''">
						<div class="mb-2.5 flex h-20 items-center justify-center rounded-xl" :class="!item.inStock ? TONE_SOFT.neutral : TONE_SOFT[artTone(item.itemID)]">
							<Icon :name="artIcon(item.type)" class="h-7 w-7" />
						</div>
						<p class="text-[13.5px] font-semibold leading-tight text-stone-900">{{ item.name }}</p>
						<p class="mb-2.5 mt-0.5 text-[11.5px] text-stone-400">{{ item.type ?? 'Item' }}{{ item.inStock && item.stock < 5 ? ` · ${item.stock} left` : '' }}</p>
						<div class="mt-auto flex min-h-8 items-center justify-between gap-1.5">
							<span class="text-[14px] font-bold tabular-nums">{{ item.pointCost }} <small class="font-medium text-stone-400">pts</small></span>

							<StudentPill v-if="!item.inStock">Out of stock</StudentPill>
							<span v-else-if="!qty(item.itemID) && item.pointCost > points" class="text-[11.5px] text-stone-400">Need {{ item.pointCost - points }} more</span>
							<div v-else-if="qty(item.itemID)" class="inline-flex h-8 items-center overflow-hidden rounded-[10px] bg-accent-100 text-accent-600">
								<button type="button" aria-label="Fewer" class="flex h-8 w-8 items-center justify-center transition-transform duration-150 ease-out active:scale-75" @click="step(item, -1)"><Icon name="i-tabler-minus" class="h-3.5 w-3.5" /></button>
								<b class="min-w-5 text-center text-[14px] tabular-nums">{{ qty(item.itemID) }}</b>
								<button type="button" aria-label="More" class="flex h-8 w-8 items-center justify-center transition-transform duration-150 ease-out active:scale-75" @click="step(item, 1)"><Icon name="i-tabler-plus" class="h-3.5 w-3.5" /></button>
							</div>
							<ButtonsButton v-else size="sm" variant="ghost" class="!border-accent-100 !bg-accent-100 !text-accent-600" @click="step(item, 1)">
								<Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add
							</ButtonsButton>
						</div>
					</article>
				</div>

				<!-- Phones and tablets: no room for the side panel, so the picks ride along at the bottom. -->
				<Transition enter-active-class="transition-[transform,opacity] duration-[250ms] ease-out" enter-from-class="translate-y-2 opacity-0"
					leave-active-class="transition-[transform,opacity] duration-150 ease-out" leave-to-class="translate-y-2 opacity-0">
					<div v-if="cartLines.length"
						class="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-30 mt-3.5 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/85 px-3.5 py-3 shadow-[0_18px_44px_-18px_rgba(40,25,8,.45)] backdrop-blur-xl md:bottom-4 lg:hidden">
						<div>
							<p class="text-[12px] text-stone-400">Balance {{ points }} pts</p>
							<b class="text-[15px] tabular-nums">{{ cartTotal }} pts · {{ cartCount }} item{{ cartCount === 1 ? '' : 's' }}</b>
						</div>
						<ButtonsButton class="!h-10" @click="reviewing = true">Review &amp; redeem</ButtonsButton>
					</div>
				</Transition>

				<NuxtLink to="/student/profile?tab=history" class="mt-5 inline-flex items-center gap-1.5 px-0.5 text-[13px] font-semibold text-accent-600 hover:underline">
					<Icon name="i-tabler-receipt" class="h-4 w-4" />Points history: what you earned and redeemed
				</NuxtLink>
			</section>

			<aside class="st-in sticky top-[92px] mt-6 hidden max-h-[calc(100dvh-116px)] flex-col overflow-hidden rounded-[22px] border border-stone-200 bg-white lg:flex"
				style="animation-delay: 140ms" aria-label="Your picks">
				<div class="flex items-baseline justify-between gap-3 px-5 pb-3 pt-4">
					<h2 class="text-[16px] font-bold text-stone-900">Your picks</h2>
					<span v-if="cartCount" class="text-[12.5px] text-stone-500 tabular-nums">{{ cartCount }} item{{ cartCount === 1 ? '' : 's' }}</span>
				</div>

				<div v-if="!cartLines.length" class="flex flex-col items-center px-6 pb-7 pt-3 text-center">
					<span class="flex h-12 w-12 items-center justify-center rounded-full bg-accent-50 text-accent-500">
						<Icon name="i-tabler-gift" class="h-6 w-6" />
					</span>
					<p class="mt-3 text-[13.5px] text-stone-500">Nothing picked yet. Tap <b class="font-semibold text-stone-700">Add</b> on an item to start.</p>
				</div>

				<template v-else>
					<TransitionGroup tag="div" class="no-scrollbar relative min-h-0 flex-1 overflow-y-auto border-t border-stone-100"
						leave-active-class="absolute inset-x-0 transition-opacity duration-150 ease-out" leave-to-class="opacity-0"
						move-class="transition-transform duration-200 ease-out">
						<div v-for="line in cartLines" :key="line.cartItemID" class="flex items-center gap-3 border-b border-stone-100 bg-white px-5 py-3">
							<div class="min-w-0 flex-1">
								<p class="truncate text-[14px] font-medium text-stone-900">{{ line.item.name }}</p>
								<p class="text-[12px] text-stone-500 tabular-nums">{{ line.item.pointCost ? `${line.item.pointCost * line.quantity} pts` : 'Free' }}</p>
							</div>
							<div class="inline-flex h-8 shrink-0 items-center overflow-hidden rounded-[10px] bg-accent-100 text-accent-600">
								<button type="button" :aria-label="`One fewer ${line.item.name}`" class="flex h-8 w-8 items-center justify-center transition-transform duration-150 ease-out active:scale-75" @click="step(line.item, -1)">
									<Icon :name="line.quantity === 1 ? 'i-tabler-trash' : 'i-tabler-minus'" class="h-3.5 w-3.5" />
								</button>
								<b class="min-w-5 text-center text-[14px] tabular-nums">{{ line.quantity }}</b>
								<button type="button" :aria-label="`One more ${line.item.name}`" class="flex h-8 w-8 items-center justify-center transition-transform duration-150 ease-out active:scale-75" @click="step(line.item, 1)">
									<Icon name="i-tabler-plus" class="h-3.5 w-3.5" />
								</button>
							</div>
						</div>
					</TransitionGroup>

					<dl class="space-y-1.5 border-t border-stone-100 px-5 py-3.5 text-[13.5px]">
						<div class="flex justify-between"><dt class="text-stone-500">Balance now</dt><dd class="tabular-nums">{{ points }} pts</dd></div>
						<div class="flex justify-between"><dt class="text-stone-500">These picks</dt><dd class="tabular-nums">{{ cartTotal ? `−${cartTotal} pts` : 'Free' }}</dd></div>
						<div class="flex justify-between border-t border-dashed border-stone-200 pt-1.5 font-semibold">
							<dt>Balance after</dt>
							<dd class="tabular-nums" :class="points - cartTotal < 0 ? 'text-red-600' : 'text-accent-600'">{{ points - cartTotal }} pts</dd>
						</div>
					</dl>
					<div class="px-5 pb-5">
						<ButtonsButton class="!h-11 w-full" :disabled="cartTotal > points" @click="reviewing = true">Review &amp; redeem</ButtonsButton>
						<p class="mt-2 text-center text-[12px] text-stone-500">Collect your items at the desk.</p>
					</div>
				</template>
			</aside>
		</div>

		<StudentSheet :open="reviewing" title="Redeem these?" @close="reviewing = false">
			<div class="mb-3">
				<div v-for="line in cartLines" :key="line.cartItemID" class="flex justify-between gap-3 border-b border-stone-100 py-2.5 text-[14px]">
					<span class="text-stone-900">{{ line.item.name }}{{ line.quantity > 1 ? ` ×${line.quantity}` : '' }}</span>
					<b class="tabular-nums">{{ line.item.pointCost * line.quantity }} pts</b>
				</div>
				<div class="flex justify-between py-2.5 text-[14px]"><span class="text-stone-400">Balance now</span><b class="tabular-nums">{{ points }} pts</b></div>
				<div class="flex justify-between py-2.5 text-[14px]"><span class="text-stone-400">Balance after</span><b class="tabular-nums text-accent-500">{{ points - cartTotal }} pts</b></div>
			</div>
			<p class="text-[13px] text-stone-500">A librarian will prepare your items. Collect them at the desk.</p>
			<template #actions>
				<ButtonsButton class="!h-[46px] !text-[15px]" :disabled="checkingOut || cartTotal > points" @click="checkout">
					<span v-if="checkingOut" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Redeem {{ cartTotal }} pts
				</ButtonsButton>
				<ButtonsButton variant="ghost" class="!h-[46px] !text-[15px]" @click="reviewing = false">Back</ButtonsButton>
			</template>
		</StudentSheet>
	</div>
</template>

<script setup lang="ts">
import { studentService, type MarketCartLine, type MarketItem } from '~/services/studentService'
import { TONE_SOFT, type StudentTone } from '~/utils/studentNotifications'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Rewards', nav: 'rewards', tab: 'rewards' })
useHead({ title: 'Rewards' })

const alert = useAlert()
const { perform } = useAction()
const { points, refreshProfile, bumpData } = useStudent()
const shownPoints = useCountUp(points)

const { data, pending } = useStudentData('student-rewards', async () => {
	// Achievements only feed the "Next:" meter on the balance card; the list itself is in Profile.
	const [achievements, market, cart] = await Promise.all([
		studentService.achievements(), studentService.marketItems(), studentService.marketCart(),
	])
	return { achievements: achievements.achievements, items: market.items, cart: cart.cart }
})

/* ---- balance card ---- */
const nextPoints = computed(() => {
	const ahead = (data.value?.achievements ?? [])
		.filter((a) => a.status === 'Locked' && a.criteria?.metric === 'knowledgeScore' && a.criteria.threshold > points.value)
		.sort((a, b) => a.criteria!.threshold - b.criteria!.threshold)[0]
	return ahead ? { name: ahead.name, threshold: ahead.criteria!.threshold } : null
})

/* ---- marketplace (the cart is stored server-side, so it survives a refresh) ---- */
const cartLines = ref<MarketCartLine[]>([])
watch(() => data.value?.cart, (lines) => { if (lines) cartLines.value = lines }, { immediate: true })

const cartTotal = computed(() => cartLines.value.reduce((sum, l) => sum + l.item.pointCost * l.quantity, 0))
const cartCount = computed(() => cartLines.value.reduce((sum, l) => sum + l.quantity, 0))
const qty = (itemID: number) => cartLines.value.find((l) => l.itemID === itemID)?.quantity ?? 0

async function reloadCart() {
	cartLines.value = (await studentService.marketCart()).cart
}

async function step(item: Pick<MarketItem, 'itemID' | 'stock' | 'pointCost'>, delta: 1 | -1) {
	const line = cartLines.value.find((l) => l.itemID === item.itemID)
	const next = (line?.quantity ?? 0) + delta

	if (delta > 0) {
		if (next > item.stock) return alert.error(`Only ${item.stock} left`)
		if (cartTotal.value + item.pointCost > points.value) return alert.error('Not enough points for another')
	}

	try {
		if (!line) await studentService.addToMarketCart(item.itemID, 1)
		else if (next <= 0) await studentService.removeMarketCartLine(line.cartItemID)
		else await studentService.updateMarketCartLine(line.cartItemID, next)
		await reloadCart()
	} catch (error: any) {
		alert.error('Could not update your selection', apiErrorMessage(error))
	}
}

const reviewing = ref(false)
const checkingOut = ref(false)

async function checkout() {
	if (checkingOut.value || !cartLines.value.length) return
	checkingOut.value = true

	const ok = await perform(() => studentService.checkoutMarketCart(), 'Redeemed', 'Could not redeem', [refreshProfile])
	checkingOut.value = false

	if (ok) {
		reviewing.value = false
		cartLines.value = []
		bumpData()
	}
}

function artIcon(type: string | null): string {
	const t = (type ?? '').toLowerCase()
	if (t.includes('service') || t.includes('print')) return 'i-tabler-printer'
	if (t.includes('perk') || t.includes('room')) return 'i-tabler-door-enter'
	if (t.includes('station')) return 'i-tabler-pencil'
	return 'i-tabler-gift'
}

const TONES: StudentTone[] = ['accent', 'good', 'warn']
const artTone = (id: number): StudentTone => TONES[id % TONES.length]!
</script>
