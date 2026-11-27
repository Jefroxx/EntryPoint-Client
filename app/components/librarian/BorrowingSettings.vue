<template>
	<div class="space-y-3">
		<section class="rounded-2xl border border-stone-200 bg-white p-5 md:p-6">
			<h2 class="text-[16px] font-bold text-stone-900">Reservations</h2>
			<p class="mt-0.5 text-[14px] text-stone-500">How long an accepted reservation keeps a copy waiting for its student.</p>

			<div class="mt-5 grid max-w-[420px] grid-cols-2 gap-3">
				<LibrarianTextField id="reservation-hold" v-model="holdValue" type="number" label="Hold a reserved book for" :min="1"
					:max="holdUnit === 'days' ? 30 : 720" :error="holdError" @update:model-value="holdError = ''" @keydown.enter.prevent="save" />
				<div>
					<label for="reservation-hold-unit" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Unit<FieldRequired /></label>
					<select id="reservation-hold-unit" v-model="holdUnit" class="h-11 w-full rounded-[10px] border border-stone-200 bg-white px-3 text-[15px] text-stone-900 outline-none transition-colors focus:border-accent-500 focus:ring-2 focus:ring-accent-200" @change="holdError = ''">
						<option value="hours">Hours</option>
						<option value="days">Days</option>
					</select>
				</div>
			</div>
			<p class="mt-1.5 max-w-[420px] text-[12.5px] text-stone-500">After this, the book is released to the next student in line and the student is told. Up to 30 days.</p>
		</section>

		<section class="rounded-2xl border border-stone-200 bg-white p-5 md:p-6">
			<h2 class="text-[16px] font-bold text-stone-900">Borrowing limit</h2>
			<p class="mt-0.5 text-[14px] text-stone-500">The most books one student can have at a time: books they have borrowed plus books they have reserved.</p>

			<div class="mt-5 max-w-[200px]">
				<LibrarianTextField id="max-books" v-model="maxBooks" type="number" label="Books at a time" :min="1" :max="20"
					:error="maxError" @update:model-value="maxError = ''" @keydown.enter.prevent="save" />
			</div>
			<p class="mt-1.5 max-w-[420px] text-[12.5px] text-stone-500">Lowering it cancels the newest reservations of any student who is then over the limit. Books already borrowed are never taken back.</p>
		</section>

		<div class="flex items-center gap-2">
			<ButtonsButton variant="primary" :disabled="busy || !dirty" @click="save">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />Save
			</ButtonsButton>
			<ButtonsButton v-if="dirty" variant="ghost" :disabled="busy" @click="reset">Undo</ButtonsButton>
		</div>

		<!-- A lower limit takes effect for students who are already over it: say who, and ask, before doing it. -->
		<LibrarianConfirmModal :open="!!impact" title="Cancel Reservations?"
			:message="impact ? `Lowering the limit to ${maxBooks} ${Number(maxBooks) === 1 ? 'book' : 'books'} will cancel ${impact.reservations} ${impact.reservations === 1 ? 'reservation' : 'reservations'} from ${impact.students} ${impact.students === 1 ? 'student' : 'students'}: the newest ones of each student who is over the new limit. They are told why. Books already borrowed are not affected.` : ''"
			confirm-label="Lower the Limit" :loading="busy" @close="impact = null" @confirm="confirmLower" />
	</div>
</template>

<script setup lang="ts">
import { settingsService } from '~/services/settingsService'
import { useAlert } from '~/api/alert/useAlert'

const props = defineProps<{ holdHours: number; maxBooksAllowed: number }>()
const emit = defineEmits<{ (e: 'saved'): void; (e: 'dirty', value: boolean): void }>()

const { perform } = useAction()
const alert = useAlert()

// A whole number of days shows as days (24 hours = 1 day); anything else shows as hours.
const asDays = (hours: number) => hours % 24 === 0
const holdUnit = ref<'hours' | 'days'>(asDays(props.holdHours) ? 'days' : 'hours')
const holdValue = ref<string | number>(asDays(props.holdHours) ? props.holdHours / 24 : props.holdHours)
const maxBooks = ref<string | number>(props.maxBooksAllowed)
const holdError = ref('')
const maxError = ref('')
const busy = ref(false)

function reset() {
	holdUnit.value = asDays(props.holdHours) ? 'days' : 'hours'
	holdValue.value = asDays(props.holdHours) ? props.holdHours / 24 : props.holdHours
	maxBooks.value = props.maxBooksAllowed
}
watch(() => [props.holdHours, props.maxBooksAllowed], reset)

const holdAsHours = computed(() => Number(holdValue.value) * (holdUnit.value === 'days' ? 24 : 1))
const dirty = computed(() => holdAsHours.value !== props.holdHours || Number(maxBooks.value) !== props.maxBooksAllowed)

// Tells the page there is something unsaved here, so switching to another section can ask first.
watch(dirty, (value) => emit('dirty', value), { immediate: true })
onBeforeUnmount(() => emit('dirty', false))

const impact = ref<{ students: number; reservations: number } | null>(null)

async function save() {
	const hours = holdAsHours.value
	holdError.value = Number.isInteger(hours) && hours >= 1 && hours <= 720 ? '' : (holdUnit.value === 'days' ? 'Enter a whole number of days from 1 to 30.' : 'Enter a whole number of hours from 1 to 720.')
	const max = Number(maxBooks.value)
	maxError.value = Number.isInteger(max) && max >= 1 && max <= 20 ? '' : 'Enter a whole number from 1 to 20.'
	if (holdError.value || maxError.value) return

	// Only a lower limit can cancel anything: find out how much, and ask, before changing it.
	if (max < props.maxBooksAllowed) {
		busy.value = true
		try {
			const found = await settingsService.borrowingImpact(max)
			if (found.reservations > 0) {
				impact.value = found
				return
			}
		} catch (error) {
			alert.error('Could not check the new limit', apiErrorMessage(error))
			return
		} finally {
			busy.value = false
		}
	}

	await commit(hours, max)
}

async function confirmLower() {
	impact.value = null
	await commit(holdAsHours.value, Number(maxBooks.value))
}

async function commit(hours: number, max: number) {
	busy.value = true
	const ok = await perform(() => settingsService.saveBorrowing(hours, max), 'Borrowing settings saved', 'Could not save the borrowing settings')
	busy.value = false
	if (ok) emit('saved')
}
</script>
