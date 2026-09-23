<template>
	<div>
		<div class="st-in mt-2 flex items-center gap-3.5">
			<div
				class="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[22px] font-extrabold text-white">
				<span class="dashboard-heading">{{ initialsText }}</span>
			</div>
			<div class="min-w-0">
				<h1 class="dashboard-heading truncate text-[22px] font-extrabold leading-tight text-amber-900">{{
					profile?.fullName ?? `${firstName} ${lastName}` }}</h1>
				<p class="font-data mb-1.5 mt-0.5 truncate text-[12.5px] text-stone-500">{{ profile?.studentIDNumber
					}}{{ profile?.academicProgram ? ` · ${profile.academicProgram}` : '' }}</p>
				<StudentPill tone="good">
					<Icon name="i-tabler-check" class="h-3 w-3" />Approved
				</StudentPill>
			</div>
		</div>

		<div class="st-in mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white"
			style="animation-delay: 35ms">
			<component :is="row.to ? NuxtLink : 'button'" v-for="row in rows" :key="row.label" :to="row.to"
				:type="row.to ? undefined : 'button'"
				class="flex w-full items-center gap-3 border-b border-stone-100 px-4 py-3 text-left transition-colors duration-150 last:border-0 active:bg-stone-100"
				@click="row.action?.()">
				<span
					class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-accent-100 text-accent-600">
					<Icon :name="row.icon" class="h-[17px] w-[17px]" />
				</span>
				<span class="min-w-0 flex-1">
					<span class="block text-[14.5px] font-medium text-stone-900">{{ row.label }}</span>
					<span v-if="row.sub" class="block text-[12.5px] text-stone-400">{{ row.sub }}</span>
				</span>
				<Icon name="i-tabler-chevron-right" class="h-4 w-4 text-stone-300" />
			</component>
		</div>

		<h2 class="st-in mb-2.5 mt-6 px-0.5 text-[11px] font-semibold uppercase tracking-[.08em] text-stone-400"
			style="animation-delay: 70ms">Account</h2>
		<div v-if="profile" class="st-in overflow-hidden rounded-2xl border border-stone-200 bg-white"
			style="animation-delay: 70ms">
			<div v-for="info in details" :key="info.icon"
				class="flex items-center gap-3 border-b border-stone-100 px-4 py-3 last:border-0">
				<span
					class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-stone-100 text-stone-500">
					<Icon :name="info.icon" class="h-[17px] w-[17px]" />
				</span>
				<span class="min-w-0 break-words text-[14px] text-stone-900">{{ info.value }}</span>
			</div>
		</div>
		<div v-else class="h-32 animate-pulse rounded-2xl bg-stone-200/70" aria-busy="true" />
		<p class="st-in mx-1 mt-2 text-[12.5px] text-stone-400" style="animation-delay: 70ms">Change your phone, address or password
			in Profile.</p>

		<ButtonsButton variant="danger" class="st-in mt-6 !h-[46px] w-full !text-[15px]" style="animation-delay: 105ms"
			@click="confirming = true">
			<Icon name="i-tabler-logout" class="h-4 w-4" />Sign out
		</ButtonsButton>

		<StudentSheet :open="confirming" title="Sign out?" @close="confirming = false">
			You'll need your email and password to sign back in.
			<template #actions>
				<ButtonsButton variant="danger" class="!h-[46px] !text-[15px]" :disabled="signingOut"
					@click="confirmSignOut">Sign out</ButtonsButton>
				<ButtonsButton variant="ghost" class="!h-[46px] !text-[15px]" @click="confirming = false">Stay signed in
				</ButtonsButton>
			</template>
		</StudentSheet>
	</div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

definePageMeta({ layout: 'student', middleware: 'student', title: 'Me', nav: 'home', tab: 'me' })
useHead({ title: 'Me' })

const drawer = useDrawer()
const { firstName, lastName } = useAuthSession('student')
const { summary, wishlist } = useStudent()
const { unreadCount } = useNotifications()
const { signOutStudent } = useStudentSession()

const profile = computed(() => summary.value?.profile ?? null)
const initialsText = computed(() => initials(profile.value?.firstName ?? firstName.value ?? '', profile.value?.lastName ?? lastName.value ?? ''))

interface Row { label: string; sub: string; icon: string; to?: string; action?: () => void }

const rows = computed<Row[]>(() => [
	{ label: 'Profile', sub: 'Details, achievements and history', icon: 'i-tabler-user-circle', to: '/student/profile' },
	{ label: 'Library ID', sub: 'Barcode for check-in', icon: 'i-tabler-id', to: '/student/id' },
	{ label: 'Notifications', sub: unreadCount.value ? `${unreadCount.value} unread` : 'All read', icon: 'i-tabler-bell', to: '/student/notifications' },
	{ label: 'Wishlist', sub: `${wishlist.value.length} saved`, icon: 'i-tabler-heart', to: '/student/wishlist' },
	{ label: 'Facilities', sub: 'Computers and rooms, live', icon: 'i-tabler-device-desktop', to: '/student/facilities' },
	{ label: 'Suggest a book', sub: 'Tell us what to add', icon: 'i-tabler-bulb', to: '/student/suggest' },
])

const details = computed(() => {
	const p = profile.value
	if (!p) return []
	return [
		{ icon: 'i-tabler-mail', value: p.email },
		p.phoneNumber ? { icon: 'i-tabler-phone', value: p.phoneNumber } : null,
		p.address ? { icon: 'i-tabler-map-pin', value: p.address } : null,
	].filter((row): row is { icon: string; value: string } => !!row)
})

const confirming = ref(false)
const signingOut = ref(false)

async function confirmSignOut() {
	signingOut.value = true
	await signOutStudent()
}
</script>
