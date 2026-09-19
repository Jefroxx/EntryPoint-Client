<template>
	<div>
		<div class="st-in mb-5 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="dashboard-heading text-3xl font-bold text-amber-900">Computers &amp; rooms</h1>
				<p class="dashboard-heading mt-1 text-amber-900">Live availability, so you know before you walk over.</p>
			</div>
			<div v-if="types.length > 1" class="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 md:mx-0 md:px-0">
				<button v-for="t in ['All', ...types]" :key="t" type="button"
					class="h-8 shrink-0 rounded-full border px-3.5 text-[13px] font-medium transition-[transform,background-color,color] duration-150 ease-out active:scale-95"
					:class="type === t ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-500'" :aria-pressed="type === t"
					@click="type = t">{{ t === 'All' ? 'All' : `${t}s` }}</button>
			</div>
		</div>

		<div v-if="pending && !data" class="grid gap-3 sm:grid-cols-2" aria-busy="true">
			<div v-for="n in 6" :key="n" class="h-[68px] animate-pulse rounded-2xl bg-stone-200/70" />
		</div>

		<template v-else-if="data">
			<StudentEmptyState v-if="!data.resources.length" icon="i-lucide-monitor" title="Nothing listed yet"
				text="Computers and study rooms will appear here once the library adds them." />

			<template v-else>
				<div class="st-in flex items-start gap-2.5 rounded-2xl bg-accent-100 px-3.5 py-3 text-[13px] leading-snug text-accent-600">
					<Icon name="i-lucide-monitor" class="mt-px h-4 w-4 shrink-0" />
					<span><b>{{ free }} of {{ list.length }}</b> available right now. To use one, ask at the desk. A librarian starts your session.</span>
				</div>

				<div :key="type" class="st-swap mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
					<div v-for="r in list" :key="r.resID" class="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5">
						<span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px]" :class="toneOf(r.status)">
							<Icon :name="/comput|pc/i.test(r.resourceType) ? 'i-lucide-monitor' : 'i-lucide-door-open'" class="h-[17px] w-[17px]" />
						</span>
						<div class="min-w-0">
							<p class="truncate text-[14px] font-semibold text-stone-900">{{ r.name }}</p>
							<p class="mt-0.5 flex items-center gap-1.5 text-[12.5px]" :class="textOf(r.status)">
								<i class="h-[7px] w-[7px] rounded-full" :class="dotOf(r.status)" />{{ r.status }}
							</p>
						</div>
					</div>
				</div>
			</template>
		</template>

		<StudentEmptyState v-else icon="i-lucide-wifi-off" title="Couldn't load availability" text="Check your connection and try again.">
			<ButtonsButton @click="refresh()">Try again</ButtonsButton>
		</StudentEmptyState>
	</div>
</template>

<script setup lang="ts">
import { studentService } from '~/services/studentService'
import { TONE_SOFT } from '~/utils/studentNotifications'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Computers & rooms', nav: 'spaces', tab: 'home' })
useHead({ title: 'Computers & rooms · EntryPoint' })

const { data, pending, refresh } = useStudentData('student-spaces', () => studentService.resources())

const type = ref('All')
const types = computed(() => [...new Set((data.value?.resources ?? []).map((r) => r.resourceType))])
const list = computed(() => (data.value?.resources ?? []).filter((r) => type.value === 'All' || r.resourceType === type.value))
const free = computed(() => list.value.filter((r) => r.status === 'Available').length)

const toneOf = (status: string) => (status === 'Available' ? TONE_SOFT.good : status === 'In Use' ? TONE_SOFT.warn : TONE_SOFT.neutral)
const textOf = (status: string) => (status === 'Available' ? 'text-emerald-700' : status === 'In Use' ? 'text-amber-700' : 'text-stone-400')
const dotOf = (status: string) => (status === 'Available' ? 'bg-emerald-600' : status === 'In Use' ? 'bg-amber-600' : 'bg-stone-400')
</script>
