<template>
	<div>
		<!-- Who you are, then the three things you can do about it -->
		<section class="st-in mb-5 flex flex-wrap items-center gap-x-6 gap-y-4 rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
			<div class="flex min-w-0 flex-1 items-center gap-4">
				<div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[22px] font-extrabold text-white">
					{{ initials }}
				</div>
				<div class="min-w-0">
					<h1 class="dashboard-heading truncate text-[26px] font-extrabold leading-tight text-amber-900">{{ profile?.fullName ?? `${firstName} ${lastName}` }}</h1>
					<p class="font-data mt-0.5 truncate text-[13px] text-stone-500">
						{{ profile?.studentIDNumber }}{{ profile?.academicProgram ? ` · ${profile.academicProgram}` : '' }}
					</p>
				</div>
			</div>
			<LibrarianSegmentedTabs v-model="tab" :tabs="tabs" />
		</section>

		<div :key="tab" class="st-swap">
			<!-- DETAILS -->
			<div v-if="tab === 'details'" class="grid gap-5 lg:grid-cols-2 lg:items-start">
				<section class="rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
					<h2 class="text-[17px] font-bold text-stone-900">Contact details</h2>
					<p class="mt-0.5 text-[13px] text-stone-500">So the library can reach you about loans and pickups.</p>

					<form class="mt-4 grid gap-3.5" novalidate @submit.prevent="saveContact">
						<LibrarianTextField id="phoneNumber" v-model="contact.phoneNumber" label="Phone" optional type="tel" autocomplete="tel"
							placeholder="0917 123 4567" :maxlength="20" :error="contactErrors.phoneNumber" @update:model-value="contactErrors.phoneNumber = ''" />
						<LibrarianTextField id="address" v-model="contact.address" label="Address" optional autocomplete="street-address"
							placeholder="Street, barangay, city" :maxlength="255" :error="contactErrors.address" @update:model-value="contactErrors.address = ''" />
						<LibrarianTextField id="birthDate" v-model="contact.birthDate" label="Birth date" optional type="date"
							:error="contactErrors.birthDate" @update:model-value="contactErrors.birthDate = ''" />
						<div class="mt-1 flex items-center gap-3">
							<ButtonsButton type="submit" :disabled="!contactDirty || savingContact">
								<span v-if="savingContact" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
								{{ savingContact ? 'Saving…' : 'Save changes' }}
							</ButtonsButton>
							<button v-if="contactDirty && !savingContact" type="button" class="text-[13px] font-semibold text-stone-500 hover:text-stone-800" @click="resetContact">
								Undo
							</button>
						</div>
					</form>
				</section>

				<div class="grid gap-5">
					<section class="rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
						<h2 class="text-[17px] font-bold text-stone-900">School record</h2>
						<p class="mt-0.5 text-[13px] text-stone-500">Checked by a librarian when your account was approved. Ask at the desk to change these.</p>
						<dl class="mt-3">
							<div v-for="row in lockedRows" :key="row.label" class="flex items-center justify-between gap-4 border-b border-stone-100 py-2.5 text-[14px] last:border-0">
								<dt class="flex items-center gap-2 text-stone-500"><Icon name="i-tabler-lock" class="h-3.5 w-3.5 text-stone-400" />{{ row.label }}</dt>
								<dd class="min-w-0 truncate text-right text-stone-900" :class="row.mono ? 'font-data text-[13px]' : ''">{{ row.value || '—' }}</dd>
							</div>
						</dl>
					</section>

					<section class="rounded-[22px] border border-stone-200 bg-white p-5 md:p-6">
						<h2 class="text-[17px] font-bold text-stone-900">Password</h2>
						<form class="mt-3.5 grid gap-3.5" novalidate @submit.prevent="savePassword">
							<AuthPasswordField id="currentPassword" v-model="pw.currentPassword" label="Current password" autocomplete="current-password"
								:error="pwErrors.currentPassword" @update:model-value="pwErrors.currentPassword = ''" />
							<div class="grid gap-3.5 sm:grid-cols-2">
								<AuthPasswordField id="newPassword" v-model="pw.newPassword" label="New password" autocomplete="new-password"
									placeholder="At least 8 characters" :error="pwErrors.newPassword" @update:model-value="pwErrors.newPassword = ''" />
								<AuthPasswordField id="newPassword_confirmation" v-model="pw.confirm" label="Confirm new password" autocomplete="new-password"
									placeholder="Repeat it" :error="pwErrors.confirm" @update:model-value="pwErrors.confirm = ''" />
							</div>
							<ul class="flex flex-wrap gap-x-4 gap-y-1.5 text-[11.5px]" aria-label="Password requirements">
								<li v-for="rule in pwRules" :key="rule.label" class="inline-flex items-center gap-1.5 transition-colors duration-200"
									:class="rule.met ? 'text-emerald-600' : 'text-stone-400'">
									<span class="h-[7px] w-[7px] rounded-full transition-colors duration-200" :class="rule.met ? 'bg-emerald-500' : 'bg-stone-200'" />{{ rule.label }}
								</li>
							</ul>
							<div>
								<ButtonsButton type="submit" :disabled="!pwReady || savingPw">
									<span v-if="savingPw" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
									{{ savingPw ? 'Changing…' : 'Change password' }}
								</ButtonsButton>
							</div>
						</form>
					</section>
				</div>
			</div>

			<!-- ACHIEVEMENTS -->
			<template v-else-if="tab === 'achievements'">
				<div v-if="pending && !data" class="space-y-3" aria-busy="true">
					<div v-for="n in 4" :key="n" class="h-[76px] animate-pulse rounded-2xl bg-stone-200/70" />
				</div>

				<template v-else-if="data">
					<p class="mb-3 px-0.5 text-[13.5px] text-stone-500">
						<span class="font-semibold text-stone-800 tabular-nums">{{ earnedCount }}</span> of {{ data.achievements.length }} earned<template v-if="claimable.length"> ·
							<span class="font-semibold text-accent-600">{{ claimable.length }} ready to claim</span></template>
					</p>

					<p v-if="!data.achievements.length" class="rounded-[22px] border border-stone-200 bg-white px-4 py-10 text-center text-[13.5px] text-stone-500">
						No achievements have been set up yet.
					</p>

					<div v-else class="grid gap-3 md:grid-cols-2">
						<article v-for="a in sortedAchievements" :key="a.achievementID"
							class="flex items-center gap-3.5 rounded-2xl border bg-white px-4 py-4"
							:class="a.status === 'Unlocked' ? 'border-accent-200 shadow-card' : 'border-stone-200'">
							<span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
								:class="a.status === 'Locked' ? TONE_SOFT.neutral : a.status === 'Unlocked' ? TONE_SOFT.accent : TONE_SOFT.good">
								<Icon :name="a.status === 'Locked' ? 'i-tabler-lock' : 'i-tabler-trophy'" class="h-5 w-5" />
							</span>
							<div class="min-w-0 flex-1">
								<p class="text-[15px] font-semibold text-stone-900">{{ a.name }}</p>
								<p class="text-[12.5px] text-stone-500">{{ criteriaText(a) }}</p>
								<template v-if="a.status === 'Locked' && a.criteria">
									<StudentMeter class="mt-2" :value="progress(a) / a.criteria.threshold" />
									<p class="mt-1 text-[11.5px] tabular-nums text-stone-500">{{ Math.min(progress(a), a.criteria.threshold) }} / {{ a.criteria.threshold }}</p>
								</template>
								<p v-else-if="a.status === 'Redeemed' && a.redeemedAt" class="mt-0.5 text-[11.5px] text-stone-400">Claimed {{ formatDate(a.redeemedAt) }}</p>
							</div>
							<div class="shrink-0 text-right">
								<ButtonsButton v-if="a.status === 'Unlocked'" size="sm" :disabled="redeeming === a.achievementID" @click="redeem(a)">
									Claim +{{ a.pointsReward }}
								</ButtonsButton>
								<template v-else>
									<StudentPill :tone="a.status === 'Redeemed' ? 'good' : 'neutral'">
										<Icon v-if="a.status === 'Redeemed'" name="i-tabler-check" class="h-3 w-3" />{{ a.status === 'Redeemed' ? 'Claimed' : 'Locked' }}
									</StudentPill>
									<p class="mt-1 text-[11px] text-stone-500">+{{ a.pointsReward }} pts</p>
								</template>
							</div>
						</article>
					</div>
				</template>
			</template>

			<!-- HISTORY -->
			<template v-else>
				<div v-if="pending && !data" class="grid gap-5 lg:grid-cols-2" aria-busy="true">
					<div v-for="n in 2" :key="n" class="h-[260px] animate-pulse rounded-[22px] bg-stone-200/70" />
				</div>

				<div v-else-if="data" class="grid gap-5 lg:grid-cols-2 lg:items-start">
					<section class="overflow-hidden rounded-[22px] border border-stone-200 bg-white">
						<div class="flex items-baseline justify-between gap-3 px-5 pb-2 pt-4">
							<h2 class="text-[17px] font-bold text-stone-900">Points</h2>
							<span class="text-[12.5px] text-stone-500">Earned and spent</span>
						</div>
						<p v-if="!pointMoves.length" class="px-5 pb-6 pt-2 text-[13.5px] text-stone-500">No points earned or spent yet.</p>
						<div v-for="m in pointMoves" :key="m.key" class="flex items-center gap-3.5 border-t border-stone-100 px-5 py-3">
							<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" :class="TONE_SOFT[m.tone]">
								<Icon :name="m.icon" class="h-[17px] w-[17px]" />
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-[14px] font-medium text-stone-900">{{ m.title }}</p>
								<p class="text-[12.5px] text-stone-500">{{ m.sub }}</p>
							</div>
							<span class="font-data shrink-0 text-[14px] font-bold tabular-nums" :class="m.points > 0 ? 'text-emerald-700' : m.cancelled ? 'text-stone-400 line-through' : 'text-stone-900'">
								{{ m.points === 0 ? 'Free' : `${m.points > 0 ? '+' : '−'}${Math.abs(m.points)}` }}
							</span>
						</div>
					</section>

					<section class="overflow-hidden rounded-[22px] border border-stone-200 bg-white">
						<div class="flex items-baseline justify-between gap-3 px-5 pb-2 pt-4">
							<h2 class="text-[17px] font-bold text-stone-900">Fines</h2>
							<span class="text-[12.5px] text-stone-500">{{ data.unpaidTotal ? `${formatPeso(data.unpaidTotal)} unpaid` : 'All settled' }}</span>
						</div>
						<p v-if="!data.penalties.length" class="px-5 pb-6 pt-2 text-[13.5px] text-stone-500">No fines, ever. Nice.</p>
						<div v-for="f in data.penalties" :key="f.penaltyID" class="flex items-center gap-3.5 border-t border-stone-100 px-5 py-3">
							<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" :class="f.paymentStatus === 'Paid' ? TONE_SOFT.good : TONE_SOFT.bad">
								<Icon :name="f.paymentStatus === 'Paid' ? 'i-tabler-check' : 'i-tabler-alert-circle'" class="h-[17px] w-[17px]" />
							</span>
							<div class="min-w-0 flex-1">
								<p class="truncate text-[14px] font-medium text-stone-900">{{ f.book.title }}</p>
								<p class="text-[12.5px] text-stone-500">
									{{ f.paymentStatus === 'Paid' && f.settledAt ? `Paid ${formatDate(f.settledAt)}` : `Charged ${formatDate(f.computedAt)}` }}
								</p>
							</div>
							<div class="shrink-0 text-right">
								<p class="font-data text-[14px] font-bold tabular-nums" :class="f.paymentStatus === 'Paid' ? 'text-stone-500' : 'text-red-600'">{{ formatPeso(f.amount) }}</p>
								<StudentPill class="mt-0.5" :tone="f.paymentStatus === 'Paid' ? 'good' : 'bad'">{{ f.paymentStatus }}</StudentPill>
							</div>
						</div>
					</section>
				</div>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import { studentService, type AchievementRow } from '~/services/studentService'
import { TONE_SOFT, type StudentTone } from '~/utils/studentNotifications'
import { useAlert } from '~/api/alert/useAlert'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Profile', nav: 'profile', tab: 'me' })
useHead({ title: 'Profile' })

const route = useRoute()
const router = useRouter()
const alert = useAlert()
const { perform } = useAction()
const { firstName, lastName } = useAuthSession('student')
const { summary, points, streak, refreshProfile, bumpData } = useStudent()
const profile = computed(() => summary.value?.profile ?? null)

const initials = computed(() => {
	const f = profile.value?.firstName ?? firstName.value ?? ''
	const l = profile.value?.lastName ?? lastName.value ?? ''
	return `${f.charAt(0)}${l.charAt(0)}`.toUpperCase()
})

/* ---- tabs (?tab=, so notifications can link straight to Achievements) ---- */
const TABS = ['details', 'achievements', 'history']
const tab = computed<string>({
	get: () => (TABS.includes(String(route.query.tab)) ? String(route.query.tab) : TABS[0]!),
	set: (value) => { void router.replace({ query: { ...route.query, tab: value } }) },
})

const { data, pending } = useStudentData('student-profile-page', async () => {
	const [achievements, penalties, redemptions] = await Promise.all([
		studentService.achievements(), studentService.penalties(), studentService.redemptions(),
	])
	return { achievements: achievements.achievements, penalties: penalties.penalties, unpaidTotal: penalties.unpaidTotal, redemptions: redemptions.redemptions }
})

const claimable = computed(() => (data.value?.achievements ?? []).filter((a) => a.status === 'Unlocked'))

const tabs = computed(() => [
	{ label: 'Details', value: 'details' },
	{ label: 'Achievements', value: 'achievements', badge: claimable.value.length || undefined },
	{ label: 'History', value: 'history' },
])

/* ---- details: contact form ---- */
type ContactField = 'phoneNumber' | 'address' | 'birthDate'
const contact = reactive<Record<ContactField, string>>({ phoneNumber: '', address: '', birthDate: '' })
const contactErrors = reactive<Record<ContactField, string>>({ phoneNumber: '', address: '', birthDate: '' })
const saved = computed<Record<ContactField, string>>(() => ({
	phoneNumber: profile.value?.phoneNumber ?? '',
	address: profile.value?.address ?? '',
	birthDate: profile.value?.birthDate ?? '',
}))
const contactDirty = computed(() => (Object.keys(contact) as ContactField[]).some((k) => contact[k].trim() !== saved.value[k]))

function resetContact() {
	Object.assign(contact, saved.value)
	Object.assign(contactErrors, { phoneNumber: '', address: '', birthDate: '' })
}
// Fill the form once the profile arrives, and again after a save; never over the top of unsaved typing.
watch(saved, () => { if (!contactDirty.value) resetContact() }, { immediate: true })

const savingContact = ref(false)
async function saveContact() {
	if (contact.birthDate && contact.birthDate > new Date().toISOString().slice(0, 10)) {
		contactErrors.birthDate = "Birth date can't be in the future."
		return
	}
	savingContact.value = true
	try {
		const res = await studentService.updateContact({
			phoneNumber: contact.phoneNumber.trim() || null,
			address: contact.address.trim() || null,
			birthDate: contact.birthDate || null,
		})
		summary.value = { profile: res.profile, points: res.points, visitStreak: res.visitStreak, stats: res.stats }
		resetContact()
		alert.success('Details saved')
	} catch (error: any) {
		const fields = apiFieldErrors(error) as Partial<Record<ContactField, string>>
		Object.assign(contactErrors, fields)
		if (!Object.keys(fields).length) alert.error('Could not save your details', apiErrorMessage(error))
	} finally {
		savingContact.value = false
	}
}

const lockedRows = computed(() => [
	{ label: 'Name', value: profile.value?.fullName },
	{ label: 'Student ID', value: profile.value?.studentIDNumber, mono: true },
	{ label: 'Program', value: profile.value?.academicProgram },
	{ label: 'Email', value: profile.value?.email },
])

/* ---- details: password ---- */
const pw = reactive({ currentPassword: '', newPassword: '', confirm: '' })
const pwErrors = reactive({ currentPassword: '', newPassword: '', confirm: '' })
const pwRules = computed(() => [
	{ label: '8+ characters', met: pw.newPassword.length >= 8 },
	{ label: 'Passwords match', met: !!pw.newPassword && pw.newPassword === pw.confirm },
	{ label: 'Different from current', met: !!pw.newPassword && pw.newPassword !== pw.currentPassword },
])
const pwReady = computed(() => !!pw.currentPassword && pwRules.value.every((r) => r.met))

const savingPw = ref(false)
async function savePassword() {
	if (!pwReady.value) return
	savingPw.value = true
	try {
		await studentService.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword, newPassword_confirmation: pw.confirm })
		Object.assign(pw, { currentPassword: '', newPassword: '', confirm: '' })
		alert.success('Password changed', 'Use the new one next time you sign in.')
	} catch (error: any) {
		const fields = apiFieldErrors(error) as Record<string, string>
		pwErrors.currentPassword = fields.currentPassword ?? ''
		pwErrors.newPassword = fields.newPassword ?? ''
		if (!Object.keys(fields).length) {
			alert.error('Could not change your password', error?.response?.status === 429 ? 'Too many tries. Wait a minute and try again.' : apiErrorMessage(error))
		} else if (fields.currentPassword) {
			document.getElementById('currentPassword')?.focus()
		}
	} finally {
		savingPw.value = false
	}
}

/* ---- achievements (moved here from Rewards) ---- */
const progress = (a: AchievementRow) => (a.criteria?.metric === 'visitStreak' ? streak.value : points.value)

function criteriaText(a: AchievementRow): string {
	if (!a.criteria) return 'Keep using the library to unlock it'
	return a.criteria.metric === 'visitStreak'
		? `Visit ${a.criteria.threshold} day${a.criteria.threshold === 1 ? '' : 's'} in a row`
		: `Reach ${a.criteria.threshold} knowledge points`
}

// Ready to claim first, then the ones in progress, then what's already claimed.
const ORDER: Record<AchievementRow['status'], number> = { Unlocked: 0, Locked: 1, Redeemed: 2 }
const sortedAchievements = computed(() => [...(data.value?.achievements ?? [])].sort((a, b) => ORDER[a.status] - ORDER[b.status]))
const earnedCount = computed(() => (data.value?.achievements ?? []).filter((a) => a.status !== 'Locked').length)

const redeeming = ref<number | null>(null)
async function redeem(a: AchievementRow) {
	redeeming.value = a.achievementID
	const ok = await perform(() => studentService.redeemAchievement(a.achievementID), `+${a.pointsReward} points · ${a.name}`, 'Could not claim it', [refreshProfile])
	redeeming.value = null
	if (ok) bumpData()
}

/* ---- history: one points timeline from claims (earned) and redemptions (spent) ---- */
interface PointMove { key: string; title: string; sub: string; points: number; at: string; icon: string; tone: StudentTone; cancelled?: boolean }

const pointMoves = computed<PointMove[]>(() => {
	if (!data.value) return []
	const earned = data.value.achievements
		.filter((a) => a.status === 'Redeemed' && a.redeemedAt)
		.map<PointMove>((a) => ({ key: `a${a.achievementID}`, title: a.name, sub: `Achievement · ${formatDate(a.redeemedAt!)}`, points: a.pointsReward, at: a.redeemedAt!, icon: 'i-tabler-trophy', tone: 'good' }))
	const spent = data.value.redemptions.map<PointMove>((r) => ({
		key: `r${r.redemptionID}`,
		title: `${r.itemName}${r.quantity > 1 ? ` ×${r.quantity}` : ''}`,
		sub: `${r.status === 'Cancelled' ? 'Cancelled, points returned' : r.status === 'Fulfilled' ? 'Collected' : 'Waiting at the desk'} · ${formatDate(r.redeemedAt)}`,
		points: -r.pointsSpent,
		at: r.redeemedAt,
		icon: r.status === 'Cancelled' ? 'i-tabler-x' : 'i-tabler-gift',
		tone: r.status === 'Cancelled' ? 'neutral' : r.status === 'Fulfilled' ? 'accent' : 'warn',
		cancelled: r.status === 'Cancelled',
	}))
	return [...earned, ...spent].sort((a, b) => b.at.localeCompare(a.at))
})
</script>
