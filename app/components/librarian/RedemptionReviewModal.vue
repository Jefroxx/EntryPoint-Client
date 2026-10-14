<template>
	<LibrarianModalShell :open="open" size="xl" :title="step === 'confirm' ? words.confirmTitle : words.title"
		:subtitle="step === 'confirm' ? words.confirmSubtitle : words.subtitle" :busy="busy" @close="emit('close')">
		<!-- Step 2: the final confirmation. Nothing has changed yet; the button below is what does it. -->
		<div v-if="redemption && step === 'confirm'" class="space-y-4">
			<section class="rounded-2xl border p-4" :class="words.confirmBox">
				<p class="text-[12px] font-bold uppercase tracking-wide" :class="words.tone">{{ words.about }}</p>
				<p class="mt-1.5 text-[20px] font-extrabold leading-snug text-stone-900">{{ quantityText }}{{ itemName }}</p>
				<p class="text-[14px] text-stone-700">for <b class="text-stone-900">{{ studentName }}</b> ({{ student?.studentIDNumber || 'no ID' }}) · {{ redemption.pointsSpent }} pts</p>

				<ul v-if="mode === 'cancel'" class="mt-3 space-y-1.5 text-[14px] text-amber-950">
					<li class="flex items-start gap-2"><Icon name="i-tabler-coins" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
						<span><b class="tabular-nums">{{ redemption.pointsSpent }} points</b> go back to {{ studentFirst }}: {{ balance }} → <b class="tabular-nums">{{ balance + redemption.pointsSpent }}</b>.</span></li>
					<li class="flex items-start gap-2"><Icon name="i-tabler-package" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
						<span>{{ redemption.quantity }} {{ redemption.quantity === 1 ? 'unit goes' : 'units go' }} back in stock: {{ item?.stock ?? '?' }} → <b class="tabular-nums">{{ (item?.stock ?? 0) + redemption.quantity }}</b>.</span></li>
					<li class="flex items-start gap-2"><Icon name="i-tabler-bell" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
						<span>{{ studentFirst }} is told it was cancelled and refunded.</span></li>
				</ul>
				<p v-else class="mt-2.5 text-[14px]" :class="words.tone">{{ words.outcome }}</p>
			</section>
		</div>

		<!-- Step 1: everything about the redemption on one screen. -->
		<div v-else-if="redemption" class="space-y-4">
			<section class="flex items-start gap-3 rounded-2xl border p-4" :class="words.banner">
				<Icon :name="words.icon" class="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
				<div>
					<p class="text-[15px] font-bold">{{ words.bannerTitle }}</p>
					<p class="mt-0.5 text-[14px] leading-snug">{{ words.bannerText }}</p>
				</div>
			</section>

			<div class="grid gap-3 md:grid-cols-3">
				<section class="rounded-xl border border-stone-200 p-4">
					<h3 class="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
						<Icon name="i-tabler-gift" class="h-4 w-4" aria-hidden="true" />Item
					</h3>
					<p class="text-[15.5px] font-bold leading-snug text-stone-900">{{ itemName }}</p>
					<dl class="mt-3 grid grid-cols-1 gap-y-2.5">
						<div v-for="f in itemFields" :key="f.label">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="text-[14px] font-medium text-stone-800">{{ f.value || '—' }}</dd>
						</div>
					</dl>
				</section>

				<section class="rounded-xl border border-stone-200 p-4">
					<h3 class="mb-2.5 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
						<Icon name="i-tabler-user" class="h-4 w-4" aria-hidden="true" />Student
					</h3>
					<p class="text-[15.5px] font-bold leading-snug text-stone-900">{{ studentName }}</p>
					<p class="font-data text-[13px] text-stone-600">{{ student?.studentIDNumber || '—' }}</p>
					<dl class="mt-3 grid grid-cols-1 gap-y-2.5">
						<div v-for="f in studentFields" :key="f.label">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="break-words text-[14px] font-medium text-stone-800">{{ f.value || '—' }}</dd>
						</div>
					</dl>
				</section>

				<section class="rounded-xl border border-stone-200 p-4">
					<div class="mb-2.5 flex items-center justify-between gap-3">
						<h3 class="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wide text-stone-500">
							<Icon name="i-tabler-receipt" class="h-4 w-4" aria-hidden="true" />Redemption #{{ redemption.redemptionID }}
						</h3>
						<LibrarianStatusPill :label="redemption.fulfillmentStatus" tone="warning" />
					</div>
					<dl class="grid grid-cols-1 gap-y-2.5">
						<div v-for="f in redemptionFields" :key="f.label">
							<dt class="text-[11.5px] font-semibold uppercase tracking-wide text-stone-500">{{ f.label }}</dt>
							<dd class="text-[14px] font-medium text-stone-800">{{ f.value }}</dd>
						</div>
					</dl>
				</section>
			</div>
		</div>

		<template #footer>
			<template v-if="step === 'confirm'">
				<ButtonsButton variant="ghost" :disabled="busy" @click="step = 'details'">
					<Icon name="i-tabler-arrow-left" class="h-3.5 w-3.5" />Back
				</ButtonsButton>
				<ButtonsButton :variant="mode === 'cancel' ? 'danger' : 'primary'" :disabled="busy" @click="emit('submit')">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else :name="words.icon" class="h-3.5 w-3.5" />
					{{ words.confirm }}
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Close</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="!redemption" @click="step = 'confirm'">
					Continue<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5" />
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { RedemptionRecord } from '~/services/engagementService'

const props = defineProps<{
	open: boolean
	/** fulfill: the reward has been handed over. cancel: it can't be given, so the points are refunded. */
	mode: 'fulfill' | 'cancel'
	redemption: RedemptionRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit'): void
}>()

// Two steps: the details, then a last look before anything is changed.
const step = ref<'details' | 'confirm'>('details')
watch(() => [props.open, props.redemption?.redemptionID, props.mode], () => { step.value = 'details' })

const WORDS = {
	fulfill: {
		title: 'Fulfill this redemption?', subtitle: 'Check the details, then continue.',
		confirmTitle: 'Confirm the fulfillment', confirmSubtitle: 'This is the last step. Check it, then mark it fulfilled.',
		banner: 'border-emerald-300 bg-emerald-50 text-emerald-900', icon: 'i-tabler-circle-check',
		bannerTitle: 'Hand over the reward first.', bannerText: 'Fulfilling marks it as given to the student, and they are told it is done.',
		about: 'You are about to mark as fulfilled', outcome: 'The student is told their reward is ready. The points stay spent.',
		confirmBox: 'border-emerald-300 bg-emerald-50', tone: 'text-emerald-800', confirm: 'Yes, mark it fulfilled',
	},
	cancel: {
		title: 'Cancel this redemption?', subtitle: 'Check the details, then continue.',
		confirmTitle: 'Confirm the cancellation', confirmSubtitle: 'This is the last step. Check it, then cancel the redemption.',
		banner: 'border-amber-300 bg-amber-50 text-amber-900', icon: 'i-tabler-circle-x',
		bannerTitle: 'Cancelling refunds the student.', bannerText: 'Use this when the reward turned out to be unavailable. Their points go back and the item is restocked.',
		about: 'You are about to cancel', outcome: '',
		confirmBox: 'border-amber-300 bg-amber-50', tone: 'text-amber-900', confirm: 'Yes, cancel and refund',
	},
} as const

const words = computed(() => WORDS[props.mode])

const item = computed(() => props.redemption?.item ?? null)
const student = computed(() => props.redemption?.student ?? null)
const itemName = computed(() => item.value?.name ?? 'Removed item')
const studentName = computed(() => personName(student.value?.user))
const studentFirst = computed(() => student.value?.user?.firstName ?? 'The student')
const quantityText = computed(() => ((props.redemption?.quantity ?? 1) > 1 ? `${props.redemption?.quantity} × ` : ''))
const balance = computed(() => student.value?.knowledgeScore ?? 0)

const itemFields = computed(() => [
	{ label: 'Type', value: item.value?.type ? item.value.type.charAt(0).toUpperCase() + item.value.type.slice(1) : '' },
	{ label: 'Cost each', value: item.value?.pointCost != null ? `${item.value.pointCost} pts` : '' },
	{ label: 'In stock now', value: item.value?.stock != null ? String(item.value.stock) : '' },
])

const studentFields = computed(() => [
	{ label: 'Program', value: student.value?.academicProgram ?? '' },
	{ label: 'Points balance', value: student.value?.knowledgeScore != null ? `${student.value.knowledgeScore} pts` : '' },
	{ label: 'Email', value: student.value?.user?.email ?? '' },
])

const redemptionFields = computed(() => {
	const r = props.redemption
	if (!r) return []
	return [
		{ label: 'Quantity', value: String(r.quantity) },
		{ label: 'Points spent', value: `${r.pointsSpent} pts` },
		{ label: 'Redeemed', value: formatDateTime(r.redeemedAt) },
	]
})
</script>
