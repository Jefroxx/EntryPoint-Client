<template>
	<div class="space-y-3">
		<div v-if="!configured.length"
			class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14px] leading-relaxed text-amber-800">
			<strong>No fine rules are set up yet.</strong> Late returns are currently not being charged, because a fine
			only accrues in an area that has a rule.
		</div>

		<section class="rounded-2xl border border-stone-200 bg-white p-5 md:p-6">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div class="min-w-0 flex-1">
					<h2 class="text-[16px] font-bold text-stone-900">Fine rules</h2>
					<p class="mt-0.5 text-[14px] text-stone-500">What a late return costs in each area of the library, charged per unit of lateness after the grace period.</p>
				</div>
				<ButtonsButton variant="primary" class="max-sm:w-full" :disabled="!available.length" @click="openForm(null)">
					<Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Fine Rule
				</ButtonsButton>
			</div>
			<p v-if="configured.length && !available.length" class="mt-2 text-[12.5px] text-stone-500">Every area that can be borrowed already has a rule.</p>

			<ul v-if="configured.length" class="mt-4 divide-y divide-stone-100 rounded-2xl border border-stone-200">
				<li v-for="rule in configured" :key="rule.area" class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2.5 px-4 py-3.5">
					<div class="min-w-0 flex-1">
						<p class="break-words text-[15px] font-semibold leading-snug text-stone-900">{{ rule.areaName }}</p>
						<p class="mt-0.5 text-[13.5px] text-stone-600">
							<span class="font-semibold tabular-nums text-stone-800">₱{{ money(rule.rate) }}</span> per {{ rule.rateUnit }} late
							<span class="text-stone-300"> · </span>{{ graceText(rule.gracePeriodDays) }}
						</p>
						<p v-if="!rule.loanable" class="mt-0.5 text-[12.5px] text-stone-500">This area is library use only, so this rule is not used right now.</p>
					</div>
					<div class="flex shrink-0 items-center gap-1.5 max-sm:w-full max-sm:[&>*]:flex-1">
						<ButtonsButton variant="ghost" size="sm" :disabled="busy" @click="openForm(rule)">Edit</ButtonsButton>
						<ButtonsButton variant="danger" size="sm" :disabled="busy" @click="askRemove(rule)">Remove</ButtonsButton>
					</div>
				</li>
			</ul>
		</section>

		<LibrarianFineRuleFormModal :open="formOpen" :rule="editing" :areas="available" :busy="busy" :server-errors="serverErrors"
			@close="formOpen = false" @submit="save" />

		<LibrarianConfirmModal :open="!!removing" title="Remove Fine Rule?"
			:message="`Late returns in ${removing?.areaName ?? 'this area'} will stop being charged. Fines already recorded stay as they are.`"
			confirm-label="Remove" :loading="busy" @close="removing = null" @confirm="remove" />
	</div>
</template>

<script setup lang="ts">
import { settingsService, type FineRule } from '~/services/settingsService'
import { useAlert } from '~/api/alert/useAlert'

const props = defineProps<{ rules: FineRule[] }>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const alert = useAlert()

/** The rules that exist, and the areas that can still be given one (only areas that can be borrowed). */
const configured = computed(() => props.rules.filter((r) => r.configured))
const available = computed(() => props.rules.filter((r) => !r.configured && r.loanable))

const money = (value: number | null) => Number(value ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const graceText = (days: number) => (days === 0 ? 'no grace period' : `${days} ${days === 1 ? 'day' : 'days'} grace`)

const busy = ref(false)
const formOpen = ref(false)
const editing = ref<FineRule | null>(null)
const serverErrors = ref<Record<string, string> | null>(null)

function openForm(rule: FineRule | null) {
	editing.value = rule
	serverErrors.value = null
	formOpen.value = true
}

async function save(payload: { area: string; rate: number; rateUnit: 'day' | 'hour'; gracePeriodDays: number }) {
	busy.value = true
	serverErrors.value = null
	try {
		await settingsService.saveFineRule(payload.area, { rate: payload.rate, rateUnit: payload.rateUnit, gracePeriodDays: payload.gracePeriodDays })
		alert.success(editing.value ? 'Fine rule saved' : 'Fine rule added')
		formOpen.value = false
		emit('saved')
	} catch (error) {
		serverErrors.value = apiFieldErrors(error)
		alert.error('Could not save the fine rule', apiErrorMessage(error))
	} finally {
		busy.value = false
	}
}

const removing = ref<FineRule | null>(null)

function askRemove(rule: FineRule) {
	removing.value = rule
}

async function remove() {
	const rule = removing.value
	if (!rule) return
	busy.value = true
	try {
		await settingsService.deleteFineRule(rule.area)
		alert.success('Fine rule removed')
		removing.value = null
		emit('saved')
	} catch (error) {
		alert.error('Could not remove the fine rule', apiErrorMessage(error))
	} finally {
		busy.value = false
	}
}
</script>
