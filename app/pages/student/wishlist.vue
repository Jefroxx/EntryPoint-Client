<template>
	<div>
		<div class="st-in mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
			<div>
				<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Wishlist</h1>
				<p class="mt-1 text-[14px] text-stone-500">
					<template v-if="books.length">
						<span class="font-semibold text-stone-800 tabular-nums">{{ books.length }}</span> saved ·
						<span class="font-semibold text-emerald-700 tabular-nums">{{ onShelf }}</span> on the shelf right now
					</template>
					<template v-else>Books you heart show up here, ready to move to your cart.</template>
				</p>
			</div>

			<!-- The cart holds three; say how much room is left before someone tries a fourth. -->
			<button v-if="books.length" type="button"
				class="flex h-10 items-center gap-2.5 rounded-xl border border-stone-200 bg-white pl-1.5 pr-3.5 text-[13.5px] transition-colors duration-150 hover:border-accent-200"
				@click="drawer.open('cart')">
				<span class="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-100 text-accent-600">
					<StudentCartIcon class="h-[18px] w-[18px]" />
				</span>
				<span class="font-semibold text-stone-900 tabular-nums">{{ cart.length }}/{{ CART_LIMIT }}</span>
				<span class="text-stone-500">in your cart</span>
			</button>
		</div>

		<StudentEmptyState v-if="!books.length" class="st-in rounded-[22px] border border-stone-200 bg-white" icon="i-tabler-heart"
			title="Nothing saved yet" text="Tap the heart on any book to keep it here for later.">
			<NuxtLink to="/student/discover"><ButtonsButton>Browse books</ButtonsButton></NuxtLink>
		</StudentEmptyState>

		<template v-else>
			<!-- Phones: the compact rows, as on Discover -->
			<TransitionGroup tag="div" class="st-in relative overflow-hidden rounded-2xl border border-stone-200 bg-white md:hidden"
				leave-active-class="absolute inset-x-0 transition-[opacity,transform] duration-200 ease-out" leave-to-class="-translate-x-3 opacity-0"
				move-class="transition-transform duration-200 ease-out">
				<div v-for="book in books" :key="book.bookID" class="border-b border-stone-100 bg-white last:border-0">
					<StudentBookRow :book="book" />
				</div>
			</TransitionGroup>

			<!-- Wide screens: the same cards as Discover. Un-hearting a card lets it drop out of the grid. -->
			<TransitionGroup tag="div" class="st-in relative hidden gap-4 md:grid md:grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
				leave-active-class="absolute transition-[opacity,transform] duration-200 ease-out" leave-to-class="scale-95 opacity-0"
				move-class="transition-transform duration-300 ease-out">
				<StudentBookCard v-for="book in books" :key="book.bookID" :book="book" />
			</TransitionGroup>
		</template>
	</div>
</template>

<script setup lang="ts">
import { briefOf, type CatalogBook } from '~/services/studentService'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Wishlist', nav: 'wishlist', tab: 'wishlist', wide: true })
useHead({ title: 'Wishlist' })

const CART_LIMIT = 3

const drawer = useDrawer()
const { wishlist, cart, refreshWishlist } = useStudent()

// Wishlist rows carry the raw book and its copies; the cards want the catalog shape.
const books = computed<CatalogBook[]>(() =>
	wishlist.value.map((row) => {
		const { available, total } = copyCounts(row.book.copies)
		return {
			...briefOf(row.book),
			callNumber: null,
			isbn: null,
			publicationYear: null,
			shelfLocation: null,
			circulationType: '',
			totalCopies: total,
			availableCopies: available,
			queueLength: 0,
		}
	}),
)
const onShelf = computed(() => books.value.filter((b) => b.availableCopies > 0).length)

// Availability changes while the page is open (someone borrows the last copy), so fetch fresh on arrival.
onMounted(() => { void refreshWishlist() })
</script>
