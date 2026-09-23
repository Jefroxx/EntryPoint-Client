<template>
	<div>
		<div class="st-in mb-5">
			<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Facilities</h1>
			<p class="mt-1 text-[14px] text-stone-500">Computers, rooms and study spaces, live, so you know before you walk over.</p>
		</div>

		<!-- Same filter pattern as Discover: a panel on the right from xl up, a chip toolbar below that. -->
		<div class="xl:grid xl:grid-cols-[minmax(0,1fr)_240px] xl:items-start xl:gap-6">
			<div class="min-w-0">
				<div v-if="types.length" class="st-in mb-4 flex items-center gap-3 xl:hidden" style="animation-delay: 35ms">
					<div class="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto [mask-image:linear-gradient(to_right,black_calc(100%-32px),transparent)] md:pr-8"
						role="group" aria-label="Filter by category">
						<button v-for="c in categories" :key="c.value" type="button" :aria-pressed="type === c.value"
							class="flex h-9 shrink-0 items-center gap-1.5 rounded-xl px-3.5 text-[13.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200"
							:class="type === c.value ? 'bg-accent-500 text-white' : 'bg-accent-50 text-accent-700 hover:bg-accent-100'"
							@click="setParam({ type: c.value || undefined })">
							{{ c.label }}
							<span class="font-data text-[11.5px] font-medium" :class="type === c.value ? 'text-white/75' : 'text-accent-700/60'">{{ c.count }}</span>
						</button>
					</div>
					<button type="button" role="switch" :aria-checked="availableOnly"
						class="flex h-9 shrink-0 items-center gap-2.5 rounded-xl border bg-white pl-3 pr-2 text-[13.5px] font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200"
						:class="availableOnly ? 'border-emerald-200 text-emerald-700' : 'border-stone-200 text-stone-600 hover:border-stone-300'"
						@click="setParam({ available: availableOnly ? undefined : '1' })">
						<span class="hidden sm:inline">Available now</span>
						<span class="sm:hidden">Free</span>
						<span class="relative h-[20px] w-[34px] shrink-0 rounded-full transition-colors duration-200 ease-out" :class="availableOnly ? 'bg-emerald-600' : 'bg-stone-200'">
							<span class="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-[250ms] ease-drawer" :class="availableOnly ? 'translate-x-3.5' : ''" />
						</span>
					</button>
				</div>

				<div v-if="pending && !data" class="grid gap-3 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]" aria-busy="true">
					<div v-for="n in 6" :key="n" class="h-[68px] animate-pulse rounded-2xl bg-stone-200/70" />
				</div>

				<template v-else-if="data">
					<StudentEmptyState v-if="!data.resources.length" class="rounded-[22px] border border-stone-200 bg-white" icon="i-tabler-device-desktop"
						title="Nothing listed yet" text="Computers and study rooms will appear here once the library adds them." />

					<template v-else>
						<div class="st-in flex items-start gap-2.5 rounded-2xl bg-accent-100 px-3.5 py-3 text-[13px] leading-snug text-accent-700" style="animation-delay: 70ms">
							<Icon name="i-tabler-device-desktop" class="mt-px h-4 w-4 shrink-0" />
							<span><b class="tabular-nums">{{ freeInView }} of {{ inType.length }}</b> {{ type ? plural(type).toLowerCase() : 'facilities' }} available right now. To use one, ask at the desk. A librarian starts your session.</span>
						</div>

						<p v-if="!list.length" class="mt-4 rounded-2xl border border-stone-200 bg-white px-4 py-8 text-center text-[13.5px] text-stone-500">
							Nothing free in this category right now.
							<button type="button" class="font-semibold text-accent-600 hover:underline" @click="setParam({ available: undefined })">Show all</button>
						</p>

						<div v-else :key="`${type}|${availableOnly}`" class="st-swap mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
							<div v-for="r in list" :key="r.resID" class="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5">
								<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" :class="toneOf(r.status)">
									<Icon :name="iconOf(r.resourceType)" class="h-[17px] w-[17px]" />
								</span>
								<div class="min-w-0">
									<p class="truncate text-[14px] font-semibold text-stone-900">{{ r.name }}</p>
									<p class="mt-0.5 flex items-center gap-1.5 text-[12.5px]" :class="textOf(r.status)">
										<i class="h-[7px] w-[7px] rounded-full" :class="dotOf(r.status)" />{{ r.status }}<span class="text-stone-400">· {{ plural(keyOf(r.resourceType)).replace(/s$/, "") }}</span>
									</p>
								</div>
							</div>
						</div>
					</template>
				</template>

				<StudentEmptyState v-else icon="i-tabler-wifi-off" title="Couldn't load availability" text="Check your connection and try again.">
					<ButtonsButton @click="refresh()">Try again</ButtonsButton>
				</StudentEmptyState>
			</div>

			<aside class="st-in sticky top-[92px] hidden max-h-[calc(100dvh-116px)] flex-col overflow-hidden rounded-[22px] border border-stone-200 bg-white xl:flex"
				style="animation-delay: 105ms" aria-label="Filters">
				<div class="border-b border-stone-100 p-3">
					<button type="button" role="switch" :aria-checked="availableOnly"
						class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-semibold transition-colors duration-150 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200"
						:class="availableOnly ? 'text-emerald-700' : 'text-stone-700'"
						@click="setParam({ available: availableOnly ? undefined : '1' })">
						<span>
							Available now
							<span class="block text-[12px] font-normal text-stone-500">Only ones nobody is using</span>
						</span>
						<span class="relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors duration-200 ease-out" :class="availableOnly ? 'bg-emerald-600' : 'bg-stone-200'">
							<span class="absolute left-0.5 top-0.5 h-[18px] w-[18px] rounded-full bg-white shadow transition-transform duration-[250ms] ease-drawer" :class="availableOnly ? 'translate-x-4' : ''" />
						</span>
					</button>
				</div>

				<h2 class="px-6 pb-1.5 pt-4 text-[15px] font-bold text-stone-900">Categories</h2>
				<div class="no-scrollbar min-h-0 flex-1 overflow-y-auto px-3 pb-3" role="group" aria-label="Filter by category">
					<button v-for="c in categories" :key="c.value" type="button" :aria-pressed="type === c.value"
						class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-200"
						:class="type === c.value ? 'bg-accent-100 font-semibold text-accent-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'"
						@click="setParam({ type: c.value || undefined })">
						<span class="flex min-w-0 items-center gap-2.5">
							<Icon :name="c.icon" class="h-4 w-4 shrink-0 opacity-70" />
							<span class="truncate">{{ c.label }}</span>
						</span>
						<span class="font-data shrink-0 text-[12px]" :class="type === c.value ? 'text-accent-700/70' : 'text-stone-400'"
							:title="`${c.free} of ${c.count} free`">{{ c.free }}/{{ c.count }}</span>
					</button>
				</div>
			</aside>
		</div>
	</div>
</template>

<script setup lang="ts">
import { studentService } from '~/services/studentService'
import { TONE_SOFT } from '~/utils/studentNotifications'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Facilities', nav: 'facilities', tab: 'home', wide: true })
useHead({ title: 'Facilities' })

const route = useRoute()
const router = useRouter()

const { data, pending, refresh } = useStudentData('student-facilities', () => studentService.resources())

/* Filters live in the URL (?type=&available=1), as on Discover. */
const str = (v: unknown) => (typeof v === 'string' ? v : '')
const type = computed(() => str(route.query.type))
const availableOnly = computed(() => str(route.query.available) === '1')

function setParam(patch: Record<string, string | undefined>) {
	void router.replace({ query: { ...route.query, ...patch } })
}

const all = computed(() => data.value?.resources ?? [])
// Types are typed in by librarians ("Computer", "computer "), so group them ignoring case and spaces.
const keyOf = (t: string) => t.trim().toLowerCase()
const types = computed(() => [...new Set(all.value.map((r) => keyOf(r.resourceType)))].sort())
const isFree = (status: string) => status === 'Available'

const plural = (t: string) => {
	const word = t.charAt(0).toUpperCase() + t.slice(1)
	return /s$/i.test(word) ? word : `${word}s`
}
const iconOf = (t: string) => (/comput|pc|laptop/i.test(t) ? 'i-tabler-device-desktop' : /room|space/i.test(t) ? 'i-tabler-door-enter' : 'i-tabler-armchair')

// "All" first, then each type, with how many are free out of how many there are.
const categories = computed(() => [
	{ value: '', label: 'All', icon: 'i-tabler-layout-grid', count: all.value.length, free: all.value.filter((r) => isFree(r.status)).length },
	...types.value.map((t) => {
		const ofType = all.value.filter((r) => keyOf(r.resourceType) === t)
		return { value: t, label: plural(t), icon: iconOf(t), count: ofType.length, free: ofType.filter((r) => isFree(r.status)).length }
	}),
])

const inType = computed(() => all.value.filter((r) => !type.value || keyOf(r.resourceType) === keyOf(type.value)))
const freeInView = computed(() => inType.value.filter((r) => isFree(r.status)).length)
const list = computed(() => inType.value.filter((r) => !availableOnly.value || isFree(r.status)))

const toneOf = (status: string) => (status === 'Available' ? TONE_SOFT.good : status === 'In Use' ? TONE_SOFT.warn : TONE_SOFT.neutral)
const textOf = (status: string) => (status === 'Available' ? 'text-emerald-700' : status === 'In Use' ? 'text-amber-700' : 'text-stone-400')
const dotOf = (status: string) => (status === 'Available' ? 'bg-emerald-600' : status === 'In Use' ? 'bg-amber-600' : 'bg-stone-400')
</script>
