<template>
	<div class="flex items-center gap-2 px-3.5 py-3 transition-colors duration-150 active:bg-stone-50">
		<button type="button" class="flex min-w-0 flex-1 items-center gap-3.5 text-left" @click="drawer.open('book', book.bookID)">
			<StudentCover :book="book" :width="52" />
			<span class="min-w-0">
				<span class="block text-[14.5px] font-semibold leading-tight text-stone-900">{{ book.title }}</span>
				<span class="mt-0.5 block truncate text-[12.5px] text-stone-400">{{ authorLine(book) }}</span>
				<span class="mt-1.5 block">
					<StudentAvailability :available="book.availableCopies" :total="book.totalCopies" :queue="book.queueLength" />
				</span>
			</span>
		</button>
		<StudentHeartButton :active="isWished(book.bookID)" @toggle="toggleWish(book.bookID)" />
	</div>
</template>

<script setup lang="ts">
import type { CatalogBook } from '~/services/studentService'

defineProps<{ book: CatalogBook }>()

const drawer = useDrawer()
const { isWished, toggleWish } = useStudent()
</script>
