<template>
	<div>
		<div class="st-in mb-5">
			<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Rewards</h1>
			<p class="dashboard-heading mt-1 text-amber-900">Visit, read and redeem. A librarian hands over what you pick.</p>
		</div>

		<section class="st-in relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-[22px] bg-gradient-to-br from-accent-600 via-accent-500 to-accent-400 p-5 text-white" style="animation-delay: 35ms">
			<span class="pointer-events-none absolute -right-12 -top-12 h-[170px] w-[170px] rounded-full bg-white/10" />
			<div>
				<p class="text-[12.5px] font-medium opacity-85">Your balance</p>
				<p class="dashboard-heading mt-1 text-[48px] font-extrabold leading-none tracking-tight tabular-nums">{{ shownPoints }}</p>
			</div>
			<div class="min-w-[220px] max-w-[340px] flex-1">
				<template v-if="nextPoints">
					<p class="mb-2 text-[12.5px] opacity-90">Next: {{ nextPoints.name }} · {{ points }} / {{ nextPoints.threshold }}</p>
					<StudentMeter light :value="points / nextPoints.threshold" />
				</template>
				<ButtonsButton size="sm" variant="ghost" class="mt-3 !border-white !bg-white !text-accent-600" @click="toMarket">
					<Icon name="i-lucide-gift" class="h-3.5 w-3.5" />Open marketplace
				</ButtonsButton>
			</div>
		</section>

		<div v-if="pending && !data" class="mt-6 space-y-3" aria-busy="true">
			<div v-for="n in 3" :key="n" class="h-20 animate-pulse rounded-2xl bg-stone-200/70" />
		</div>

		<div v-else-if="data" class="lg:grid lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start lg:gap-7">
			<section class="st-in" style="animation-delay: 70ms">
				<h2 class="mb-2.5 mt-6 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">Achievements</h2>
				<div v-if="data.achievements.length" class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
					<div v-for="a in data.achievements" :key="a.achievementID" class="flex items-center gap-3.5 border-b border-stone-100 px-4 py-4 last:border-0">
						<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]"
							:class="a.status === 'Locked' ? TONE_SOFT.neutral : a.status === 'Unlocked' ? TONE_SOFT.accent : TONE_SOFT.good">
							<Icon name="i-lucide-trophy" class="h-[17px] w-[17px]" />
						</span>
						<div class="min-w-0 flex-1">
							<p class="text-[14.5px] font-semibold text-stone-900">{{ a.name }}</p>
							<p class="text-[12.5px] text-stone-400">{{ criteriaText(a) }}</p>
							<template v-if="a.status === 'Locked' && a.criteria">
								<StudentMeter class="mt-2" :value="progress(a) / a.criteria.threshold" />
								<p class="mt-1 text-[11.5px] tabular-nums text-stone-400">{{ Math.min(progress(a), a.criteria.threshold) }} / {{ a.criteria.threshold }}</p>
							</template>
						</div>
						<div class="text-right">
							<ButtonsButton v-if="a.status === 'Unlocked'" size="sm" :disabled="redeeming === a.achievementID" @click="redeem(a)">Redeem +{{ a.pointsReward }}</ButtonsButton>
							<StudentPill v-else :tone="a.status === 'Redeemed' ? 'good' : 'neutral'">
								<Icon v-if="a.status === 'Redeemed'" name="i-lucide-check" class="h-3 w-3" />{{ a.status }}
							</StudentPill>
							<p class="mt-1 text-[11px] text-stone-400">+{{ a.pointsReward }} pts</p>
						</div>
					</div>
				</div>
				<p v-else class="rounded-2xl bg-stone-100 px-4 py-6 text-center text-[13.5px] text-stone-500">No achievements have been set up yet.</p>
			</section>

			<section id="market" class="st-in scroll-mt-20" style="animation-delay: 105ms">
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
								<button type="button" aria-label="Fewer" class="flex h-8 w-8 items-center justify-center transition-transform duration-150 ease-out active:scale-75" @click="step(item, -1)"><Icon name="i-lucide-minus" class="h-3.5 w-3.5" /></button>
								<b class="min-w-5 text-center text-[14px] tabular-nums">{{ qty(item.itemID) }}</b>
								<button type="button" aria-label="More" class="flex h-8 w-8 items-center justify-center transition-transform duration-150 ease-out active:scale-75" @click="step(item, 1)"><Icon name="i-lucide-plus" class="h-3.5 w-3.5" /></button>
							</div>
							<ButtonsButton v-else size="sm" variant="ghost" class="!border-accent-100 !bg-accent-100 !text-accent-600" @click="step(item, 1)">
								<Icon name="i-lucide-plus" class="h-3.5 w-3.5" />Add
							</ButtonsButton>
						</div>
					</article>
				</div>

				<Transition enter-active-class="transition-[transform,opacity] duration-[250ms] ease-out" enter-from-class="translate-y-2 opacity-0"
					leave-active-class="transition-[transform,opacity] duration-150 ease-out" leave-to-class="translate-y-2 opacity-0">
					<div v-if="cartLines.length"
						class="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] z-30 mt-3.5 flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white/85 px-3.5 py-3 shadow-[0_18px_44px_-18px_rgba(40,25,8,.45)] backdrop-blur-xl md:bottom-4">
						<div>
							<p class="text-[12px] text-stone-400">Balance {{ points }} pts</p>
							<b class="text-[15px] tabular-nums">{{ cartTotal }} pts · {{ cartCount }} item{{ cartCount === 1 ? '' : 's' }}</b>
						</div>
						<ButtonsButton class="!h-10" @click="reviewing = true">Review &amp; redeem</ButtonsButton>
					</div>
				</Transition>

				<template v-if="data.redemptions.length">
					<h2 class="mb-2.5 mt-7 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400">My redemptions</h2>
					<div class="overflow-hidden rounded-2xl border border-stone-200 bg-white">
						<div v-for="r in data.redemptions" :key="r.redemptionID" class="flex items-center gap-3.5 border-b border-stone-100 px-4 py-3 last:border-0">
							<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" :class="r.status === 'Fulfilled' ? TONE_SOFT.good : r.status === 'Cancelled' ? TONE_SOFT.bad : TONE_SOFT.warn">
								<Icon :name="r.status === 'Fulfilled' ? 'i-lucide-check' : r.status === 'Cancelled' ? 'i-lucide-x' : 'i-lucide-clock'" class="h-[17px] w-[17px]" />
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-[14px] font-medium text-stone-900">{{ r.itemName }}{{ r.quantity > 1 ? ` ×${r.quantity}` : '' }}</p>
								<p class="text-[12.5px] text-stone-400">{{ r.pointsSpent }} pts · {{ formatDate(r.redeemedAt) }}</p>
							</div>
							<StudentPill :tone="r.status === 'Fulfilled' ? 'good' : r.status === 'Cancelled' ? 'bad' : 'warn'">{{ r.status }}</StudentPill>
						</div>
					</div>
				</template>
			</section>
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
import { studentService, type AchievementRow, type MarketCartLine, type MarketItem } from '~/services/studentService'
import { TONE_SOFT, type StudentTone } from '~/utils/studentNotifications'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Rewards', nav: 'rewards', tab: 'rewards' })
useHead({ title: 'Rewards · EntryPoint' })

const alert = useAlert()
const { perform } = useAction()
const { points, streak, refreshProfile, bumpData } = useStudent()
const shownPoints = useCountUp(points)

const { data, pending } = useStudentData('student-rewards', async () => {
	const [achievements, market, cart, redemptions] = await Promise.all([
		studentService.achievements(), studentService.marketItems(), studentService.marketCart(), studentService.redemptions(),
	])
	return { achievements: achievements.achievements, items: market.items, cart: cart.cart, redemptions: redemptions.redemptions }
})

/* ---- achievements ---- */
const progress = (a: AchievementRow) => (a.criteria?.metric === 'visitStreak' ? streak.value : points.value)

function criteriaText(a: AchievementRow): string {
	if (!a.criteria) return 'Keep using the library to unlock it'
	return a.criteria.metric === 'visitStreak'
		? `Visit ${a.criteria.threshold} day${a.criteria.threshold === 1 ? '' : 's'} in a row`
		: `Reach ${a.criteria.threshold} knowledge points`
}

const nextPoints = computed(() => {
	const ahead = (data.value?.achievements ?? [])
		.filter((a) => a.status === 'Locked' && a.criteria?.metric === 'knowledgeScore' && a.criteria.threshold > points.value)
		.sort((a, b) => a.criteria!.threshold - b.criteria!.threshold)[0]
	return ahead ? { name: ahead.name, threshold: ahead.criteria!.threshold } : null
})

const redeeming = ref<number | null>(null)

async function redeem(a: AchievementRow) {
	redeeming.value = a.achievementID
	const ok = await perform(() => studentService.redeemAchievement(a.achievementID), `+${a.pointsReward} points · ${a.name}`, 'Could not redeem it', [refreshProfile])
	redeeming.value = null
	if (ok) bumpData()
}

/* ---- marketplace (the cart is stored server-side, so it survives a refresh) ---- */
const cartLines = ref<MarketCartLine[]>([])
watch(() => data.value?.cart, (lines) => { if (lines) cartLines.value = lines }, { immediate: true })

const cartTotal = computed(() => cartLines.value.reduce((sum, l) => sum + l.item.pointCost * l.quantity, 0))
const cartCount = computed(() => cartLines.value.reduce((sum, l) => sum + l.quantity, 0))
const qty = (itemID: number) => cartLines.value.find((l) => l.itemID === itemID)?.quantity ?? 0

async function reloadCart() {
	cartLines.value = (await studentService.marketCart()).cart
}

async function step(item: MarketItem, delta: 1 | -1) {
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

function toMarket() {
	document.getElementById('market')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}

function artIcon(type: string | null): string {
	const t = (type ?? '').toLowerCase()
	if (t.includes('service') || t.includes('print')) return 'i-lucide-printer'
	if (t.includes('perk') || t.includes('room')) return 'i-lucide-door-open'
	if (t.includes('station')) return 'i-lucide-pencil'
	return 'i-lucide-gift'
}

const TONES: StudentTone[] = ['accent', 'good', 'warn']
const artTone = (id: number): StudentTone => TONES[id % TONES.length]!
</script>
