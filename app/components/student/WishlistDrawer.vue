<template>
	<StudentDrawer :open="open" title="Wishlist" @close="drawer.close()">
		<StudentEmptyState v-if="!wishlist.length" icon="i-lucide-heart" title="Nothing saved yet"
			text="Tap the heart on any book to keep it here for later.">
			<NuxtLink to="/student/discover">
				<ButtonsButton>Browse books</ButtonsButton>
			</NuxtLink>
		</StudentEmptyState>

		<template v-else>
			<p class="mb-3 px-0.5 text-[13.5px] text-stone-500">{{ wishlist.length }} saved for later.</p>
			<TransitionGroup tag="div" class="relative overflow-hidden rounded-2xl border border-stone-200 bg-white"
				leave-active-class="absolute inset-x-0 transition-[opacity,transform] duration-200 ease-out"
				leave-to-class="-translate-x-3 opacity-0" move-class="transition-transform duration-200 ease-out">
				<div v-for="row in wishlist" :key="row.wishlistID" class="relative flex items-center gap-3.5 border-b border-stone-100 bg-white p-3.5 last:border-0">
					<button type="button" class="flex min-w-0 flex-1 items-center gap-3.5 text-left" @click="drawer.open('book', row.bookID)">
						<StudentCover :book="briefOf(row.book)" :width="44" />
						<span class="min-w-0">
							<span class="block text-[14px] font-semibold leading-tight text-stone-900">{{ row.book.title }}</span>
							<span class="mt-0.5 block truncate text-[12.5px] text-stone-400">{{ authorLine(briefOf(row.book)) }}</span>
							<span class="mt-1.5 block">
								<StudentAvailability :available="copyCounts(row.book.copies).available" :total="copyCounts(row.book.copies).total" />
							</span>
						</span>
					</button>
					<div class="flex flex-col items-end gap-1.5">
						<ButtonsButton v-if="row.inCart" size="sm" variant="ghost" disabled class="!border-emerald-200 !bg-emerald-50 !text-emerald-700">In cart</ButtonsButton>
						<ButtonsButton v-else size="sm" variant="ghost" class="!border-accent-100 !bg-accent-100 !text-accent-600" @click="addToCart(row.bookID)">
							Move to cart
						</ButtonsButton>
						<ButtonsButton variant="icon" size="sm" aria-label="Remove from wishlist" @click="removeWishlistRow(row)">
							<Icon name="i-lucide-trash-2" class="h-4 w-4" />
						</ButtonsButton>
					</div>
				</div>
			</TransitionGroup>
		</template>
	</StudentDrawer>
</template>

<script setup lang="ts">
import { briefOf } from '~/services/studentService'

const drawer = useDrawer()
const { wishlist, addToCart, removeWishlistRow } = useStudent()

const open = computed(() => drawer.active.value?.kind === 'wishlist')
</script>
