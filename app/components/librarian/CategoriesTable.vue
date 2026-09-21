<template>
	<LibrarianTableShell :columns="['Category', 'Dewey code', 'Books', '']" :loading="loading" :empty="subjects.length === 0"
		empty-text="No categories match your search." min-width="640px">
		<tr v-for="(subject, index) in subjects" :key="subject.subjectID"
			class="row-fade-in border-b border-stone-100 transition-colors duration-150 last:border-0 hover:bg-accent-50"
			:style="{ animationDelay: `${index * 35}ms` }">
			<td class="px-4 py-3">
				<div class="flex items-center gap-2.5 text-[15px] font-semibold text-stone-900">
					<span class="h-2.5 w-2.5 shrink-0 rounded-[3px]" :style="{ backgroundColor: subjectSwatch(subject.name) }" />
					{{ subject.name }}
				</div>
			</td>
			<td class="font-data px-4 py-3 text-[13.5px] text-stone-500">{{ subject.classificationCode ?? '—' }}</td>
			<td class="px-4 py-3">
				<div class="flex items-center gap-3">
					<span class="min-w-[18px] font-bold tabular-nums text-stone-900">{{ subject.books_count }}</span>
					<div class="h-1.5 w-28 overflow-hidden rounded-full bg-stone-100">
						<div class="h-full rounded-full bg-accent-500 transition-[width] duration-500 ease-out"
							:style="{ width: `${maxBooks ? (subject.books_count / maxBooks) * 100 : 0}%` }" />
					</div>
				</div>
			</td>
			<td class="px-4 py-3">
				<div class="flex items-center justify-end gap-1.5">
					<ButtonsButton variant="ghost" size="sm" @click="emit('edit', subject)">Edit</ButtonsButton>
					<ButtonsButton variant="danger" size="sm" :disabled="subject.books_count > 0"
						:title="subject.books_count > 0 ? `Can't delete — ${subject.books_count} book${subject.books_count > 1 ? 's' : ''} still use this category` : undefined"
						@click="emit('delete', subject)">
						Delete
					</ButtonsButton>
				</div>
			</td>
		</tr>
	</LibrarianTableShell>
</template>

<script setup lang="ts">
import type { SubjectRecord } from '~/services/subjectService'

const props = defineProps<{
	subjects: SubjectRecord[]
	loading: boolean
}>()

const emit = defineEmits<{
	(e: 'edit', subject: SubjectRecord): void
	(e: 'delete', subject: SubjectRecord): void
}>()

const maxBooks = computed(() => Math.max(0, ...props.subjects.map((s) => s.books_count)))
</script>
