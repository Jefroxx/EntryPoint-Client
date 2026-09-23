<template>
	<article
		class="flex flex-col overflow-hidden rounded-[20px] border border-stone-200 bg-white transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_18px_34px_-22px_rgba(60,35,10,.5)]">
		<button type="button" :aria-label="`View ${book.title}`"
			class="flex w-full justify-center pb-[18px] pt-[22px] transition-transform duration-150 ease-out active:scale-[.98]"
			:style="{ background: `linear-gradient(180deg, color-mix(in srgb, ${swatch} 18%, white), white)` }"
			@click="drawer.open('book', book.bookID)">
			<StudentCover :book="book" :width="112" />
		</button>
		<div class="px-4">
			<!-- Always two lines tall, so availability and the buttons line up across a row of cards. -->
			<button type="button" :title="book.title"
				class="line-clamp-2 min-h-[2.75em] text-left text-[14.5px] font-semibold leading-snug text-stone-900 hover:text-accent-500"
				@click="drawer.open('book', book.bookID)">{{ book.title }}</button>
			<p class="mt-0.5 truncate text-[12.5px] text-stone-500">{{ authorLine(book) }}</p>
			<div class="mt-2">
				<StudentAvailability :available="book.availableCopies" :total="book.totalCopies" :queue="book.queueLength" />
			</div>
		</div>
		<div class="mt-auto flex items-center justify-between gap-2 py-3.5 pl-4 pr-3">
			<ButtonsButton v-if="isInCart(book.bookID)" variant="ghost" size="sm" class="!border-emerald-200 !bg-emerald-50 !text-emerald-700"
				@click="drawer.open('cart')">
				<Icon name="i-tabler-check" class="h-3.5 w-3.5" />In cart
			</ButtonsButton>
			<ButtonsButton v-else variant="ghost" size="sm" class="!border-accent-100 !bg-accent-100 !text-accent-600"
				@click="addToCart(book.bookID)">
				<Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add to cart
			</ButtonsButton>
			<StudentHeartButton :active="isWished(book.bookID)" @toggle="toggleWish(book.bookID)" />
		</div>
	</article>
</template>

<script setup lang="ts">
import type { CatalogBook } from '~/services/studentService'

const props = defineProps<{ book: CatalogBook }>()

const drawer = useDrawer()
const { isWished, isInCart, toggleWish, addToCart } = useStudent()

const swatch = computed(() => subjectSwatch(props.book.subject?.name ?? props.book.title))
</script>
