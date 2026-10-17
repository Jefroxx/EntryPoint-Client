<template>
	<LibrarianTableShell :columns="['Book', 'Status', 'Last Borrower', 'Marked', '']" :loading="loading"
		:empty="copies.length === 0" empty-text="No copies are marked lost or damaged.">
		<!-- Phones: one card per copy, with its buttons on it. -->
		<template #cards>
			<li v-for="copy in copies" :key="`card-${copy.copyID}`">
				<div class="px-4 py-3.5">
					<div class="flex items-start justify-between gap-3">
						<LibrarianBookCell :title="copy.book.title" :sub="`Accession no. ${copy.accessionNumber}`" />
						<LibrarianStatusPill v-bind="pill(copy)" class="shrink-0" />
					</div>
					<p class="mt-2 text-[12.5px] text-stone-500">
						<template v-if="copy.lastLoan?.studentName">Last with {{ copy.lastLoan.studentName }} · </template>Marked {{ formatDate(copy.markedAt) }}
					</p>
					<div class="mt-3 flex gap-2">
						<ButtonsButton variant="ghost" class="flex-1" @click="emit('restore', copy)">{{ restoreLabel(copy) }}</ButtonsButton>
						<ButtonsButton variant="danger" class="flex-1" @click="emit('remove', copy)">Remove</ButtonsButton>
					</div>
				</div>
			</li>
		</template>

		<tr v-for="(copy, index) in copies" :key="copy.copyID"
			class="row-fade-in border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:style="{ animationDelay: `${index * 40}ms` }">
			<td class="px-4 py-3">
				<LibrarianBookCell :title="copy.book.title" :sub="`Accession no. ${copy.accessionNumber}`" />
			</td>
			<td class="px-4 py-3">
				<LibrarianStatusPill v-bind="pill(copy)" />
			</td>
			<td class="px-4 py-3">
				<LibrarianPersonCell v-if="copy.lastLoan?.studentName" :name="copy.lastLoan.studentName" :sub="copy.lastLoan.studentIDNumber ?? undefined" />
				<span v-else class="text-[13.5px] text-stone-400">Never lent</span>
			</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ formatDate(copy.markedAt) }}</td>
			<td class="px-4 py-3">
				<div class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="ghost" size="sm" @click="emit('restore', copy)">{{ restoreLabel(copy) }}</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" @click="emit('remove', copy)">Remove</ButtonsButton>
				</div>
			</td>
		</tr>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { LostDamagedCopy } from '~/services/librarianService'

defineProps<{
	copies: LostDamagedCopy[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'restore', copy: LostDamagedCopy): void
	(e: 'remove', copy: LostDamagedCopy): void
}>()

function pill(copy: LostDamagedCopy) {
	return copy.status === 'lost'
		? { label: 'Lost', tone: 'danger' as const }
		: { label: 'Damaged', tone: 'warning' as const }
}

// Putting it back on the shelf: a lost copy was found, a damaged one was repaired.
function restoreLabel(copy: LostDamagedCopy): string {
	return copy.status === 'lost' ? 'Found' : 'Repaired'
}
</script>
