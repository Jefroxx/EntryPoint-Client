<template>
	<div class="flex items-center gap-2 px-3.5 py-3 transition-colors duration-150 active:bg-stone-50">
		<button type="button" class="flex min-w-0 flex-1 items-center gap-3.5 text-left" @click="drawer.open('book', book.uuid)">
			<StudentCover :book="book" :width="52" />
			<span class="min-w-0">
				<span class="block text-[14.5px] font-semibold leading-tight text-stone-900">{{ book.title }}</span>
				<span class="mt-0.5 line-clamp-2 text-[12.5px] text-stone-500">{{ authorLine(book) }}</span>
				<span class="mt-1.5 block">
					<StudentAvailability :available="book.availableCopies" :total="book.totalCopies" wrap />
				</span>
			</span>
		</button>
		<!-- Phones show this compact row instead of the card, so the cart button lives here too. -->
		<!-- A book can be reserved only once at a time, so one that already is shows a bookmark (to My books) instead of the cart. -->
		<ButtonsButton v-if="isReserved(book.bookID)" variant="icon" size="md" :aria-label="`${book.title} is in your reservations. View reservations`"
			class="shrink-0 !text-amber-600" @click="navigateTo({ path: '/student/books', query: { tab: 'reservations' } })">
			<Icon name="i-tabler-bookmark-filled" class="h-[18px] w-[18px]" />
		</ButtonsButton>
		<ButtonsButton v-else-if="isInCart(book.bookID)" variant="icon" size="md" :aria-label="`${book.title} is in your cart. View cart`"
			class="shrink-0 !text-emerald-600" @click="drawer.open('cart')">
			<Icon name="i-tabler-check" class="h-[18px] w-[18px]" />
		</ButtonsButton>
		<ButtonsButton v-else-if="book.borrowable !== false" variant="icon" size="md" :aria-label="`Add ${book.title} to cart`"
			class="shrink-0 !text-accent-600" @click="addToCart(book.bookID)">
			<StudentCartIcon class="h-[18px] w-[18px]" />
		</ButtonsButton>
		<StudentHeartButton :active="isWished(book.bookID)" @toggle="toggleWish(book.bookID)" />
	</div>
</template>

<script setup lang="ts">
import type { CatalogBook } from '~/services/studentService'

defineProps<{ book: CatalogBook }>()

const drawer = useDrawer()
const { isWished, isInCart, isReserved, toggleWish, addToCart } = useStudent()
</script>
