<template>
	<StudentSheet :open="!!loan" :title="`Returned “${shown?.book.title ?? ''}”?`" @close="emit('close')">
		Only report it once you've handed the book back. A librarian will verify it, and until then the loan stays open{{ shown && shown.daysLeft < 0 ? ' and the fine may keep counting' : '' }}.
		<template #actions>
			<ButtonsButton class="!h-[46px] !text-[15px]" :disabled="busy" @click="confirm">
				<span v-if="busy" class="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
				Yes, I returned it
			</ButtonsButton>
			<ButtonsButton variant="ghost" class="!h-[46px] !text-[15px]" @click="emit('close')">Not yet</ButtonsButton>
		</template>
	</StudentSheet>
</template>

<script setup lang="ts">
import { studentService, type LoanRow } from '~/services/studentService'

const props = defineProps<{ loan: LoanRow | null }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const { perform } = useAction()
const { refreshProfile, bumpData } = useStudent()

// Keep the book's title while the sheet slides away.
const shown = ref<LoanRow | null>(props.loan)
watch(() => props.loan, (loan) => { if (loan) shown.value = loan })

const busy = ref(false)

async function confirm() {
	if (!shown.value || busy.value) return
	busy.value = true

	const ok = await perform(
		() => studentService.selfReturn(shown.value!.loanID),
		'Return reported',
		'Could not report the return',
		[refreshProfile],
	)

	busy.value = false
	if (ok) {
		bumpData()
		emit('close')
	}
}
</script>
