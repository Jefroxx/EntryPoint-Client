<template>
	<div ref="root" class="relative">
		<button type="button" aria-label="Account menu" :aria-expanded="open" aria-haspopup="menu"
			class="ml-1 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[13px] font-bold text-white ring-1 ring-stone-200 transition-transform duration-150 ease-out active:scale-90"
			@click="open = !open">
			<span class="dashboard-heading">{{ initialsText }}</span>
		</button>

		<Transition enter-active-class="transition-[transform,opacity] duration-[160ms] ease-out" enter-from-class="scale-[.96] opacity-0"
			leave-active-class="transition-[transform,opacity] duration-[120ms] ease-out" leave-to-class="scale-[.96] opacity-0">
			<div v-if="open" role="menu" aria-label="Account"
				class="absolute right-0 top-[calc(100%+10px)] z-50 w-[300px] origin-top-right overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_44px_-18px_rgba(40,25,8,.45)]">
				<div class="flex items-center gap-3 border-b border-stone-100 p-4">
					<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-[16px] font-bold text-white">
						<span class="dashboard-heading">{{ initialsText }}</span>
					</div>
					<div class="min-w-0">
						<p class="truncate text-[15px] font-semibold text-stone-900">{{ profile?.fullName ?? `${firstName} ${lastName}` }}</p>
						<p class="font-data mt-0.5 truncate text-[12px] text-stone-400">{{ profile?.studentIDNumber }}{{ profile?.academicProgram ? ` · ${profile.academicProgram}` : '' }}</p>
						<StudentPill tone="good" class="mt-1.5"><Icon name="i-tabler-check" class="h-3 w-3" />Approved</StudentPill>
					</div>
				</div>

				<component :is="link.to ? NuxtLink : 'button'" v-for="link in links" :key="link.label"
					:to="link.to" :type="link.to ? undefined : 'button'" role="menuitem"
					class="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] text-stone-800 transition-colors duration-150 hover:bg-stone-50 active:bg-stone-100"
					@click="pick(link)">
					<span class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-accent-100 text-accent-600"><Icon :name="link.icon" class="h-4 w-4" /></span>
					<span class="flex-1">{{ link.label }}<span v-if="link.hint" class="block text-[12px] text-stone-400">{{ link.hint }}</span></span>
				</component>

				<div v-if="profile" class="space-y-1.5 border-t border-stone-100 px-4 py-3 text-[12.5px] text-stone-400">
					<p class="flex items-center gap-2"><Icon name="i-tabler-mail" class="h-3.5 w-3.5" />{{ profile.email }}</p>
					<p v-if="profile.phoneNumber" class="flex items-center gap-2"><Icon name="i-tabler-phone" class="h-3.5 w-3.5" />{{ profile.phoneNumber }}</p>
					<p v-if="profile.address" class="flex items-center gap-2"><Icon name="i-tabler-map-pin" class="h-3.5 w-3.5" />{{ profile.address }}</p>
					<p class="pt-1">Change your phone, address or password in Profile.</p>
				</div>

				<button type="button" role="menuitem"
					class="flex w-full items-center gap-3 border-t border-stone-100 px-4 py-3 text-left text-[14px] font-medium text-red-600 transition-colors duration-150 hover:bg-red-50 active:bg-red-100"
					@click="askSignOut">
					<span class="flex h-8 w-8 items-center justify-center rounded-[10px] bg-red-50"><Icon name="i-tabler-logout" class="h-4 w-4" /></span>
					Sign out
				</button>
			</div>
		</Transition>

		<StudentSheet :open="confirming" title="Sign out?" @close="confirming = false">
			You'll need your email and password to sign back in.
			<template #actions>
				<ButtonsButton variant="danger" class="!h-[46px] !text-[15px]" :disabled="signingOut" @click="confirmSignOut">Sign out</ButtonsButton>
				<ButtonsButton variant="ghost" class="!h-[46px] !text-[15px]" @click="confirming = false">Stay signed in</ButtonsButton>
			</template>
		</StudentSheet>
	</div>
</template>

<script setup lang="ts">
import { NuxtLink } from '#components'

const { firstName, lastName } = useAuthSession('student')
const { summary, wishlist } = useStudent()
const { signOutStudent } = useStudentSession()
const drawer = useDrawer()

const profile = computed(() => summary.value?.profile ?? null)
const initialsText = computed(() => initials(profile.value?.firstName ?? firstName.value ?? '', profile.value?.lastName ?? lastName.value ?? ''))

interface MenuLink { label: string; hint: string; icon: string; to?: string; action?: () => void }

const links = computed<MenuLink[]>(() => [
	{ label: 'Profile', hint: 'Details, achievements and history', icon: 'i-tabler-user-circle', to: '/student/profile' },
	{ label: 'Library ID', hint: 'Barcode for check-in', icon: 'i-tabler-id', to: '/student/id' },
	{ label: 'Wishlist', hint: `${wishlist.value.length} saved`, icon: 'i-tabler-heart', to: '/student/wishlist' },
	{ label: 'Suggest a book', hint: '', icon: 'i-tabler-bulb', to: '/student/suggest' },
])

function pick(link: MenuLink) {
	open.value = false
	link.action?.()
}

const open = ref(false)
const confirming = ref(false)
const signingOut = ref(false)
const root = ref<HTMLElement | null>(null)

function askSignOut() {
	open.value = false
	confirming.value = true
}

async function confirmSignOut() {
	signingOut.value = true
	await signOutStudent()
}

function onPointerDown(event: PointerEvent) {
	if (open.value && root.value && !root.value.contains(event.target as Node)) open.value = false
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape') open.value = false
}

onMounted(() => {
	document.addEventListener('pointerdown', onPointerDown)
	window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
	document.removeEventListener('pointerdown', onPointerDown)
	window.removeEventListener('keydown', onKeydown)
})
</script>
