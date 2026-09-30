<template>
	<!-- The Library ID, enlarged for the door: plain white (scanners read best on it), the barcode as wide as the
		 screen allows, name and ID number big enough to read at arm's length. While it's open the screen is asked
		 to stay awake, so it doesn't dim mid-queue. Tap anywhere, the close button or Escape to go back. -->
	<Teleport to="body">
		<Transition enter-active-class="transition-opacity duration-200 ease-out" enter-from-class="opacity-0"
			leave-active-class="transition-opacity duration-150 ease-out" leave-to-class="opacity-0">
			<div v-if="open" ref="panel" role="dialog" aria-modal="true" aria-label="Library ID, enlarged" tabindex="-1"
				class="fixed inset-0 z-[200] flex flex-col bg-white px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-[calc(1rem+env(safe-area-inset-top,0px))] outline-none"
				@click="emit('close')">
				<div class="flex items-center justify-between">
					<img src="~/assets/css/logo/EntryPointLogo.png" alt="EntryPoint" class="h-8 w-auto" />
					<button type="button" aria-label="Close"
						class="flex h-11 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-700 transition-transform duration-150 active:scale-90"
						@click.stop="emit('close')">
						<Icon name="i-tabler-x" class="h-5 w-5" />
					</button>
				</div>

				<div class="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center text-center">
					<p class="dashboard-heading text-[clamp(26px,6vw,48px)] font-extrabold leading-tight text-crimson">{{ profile.fullName }}</p>
					<p class="font-data mt-1 text-[clamp(16px,3.4vw,24px)] font-semibold text-stone-600">{{ profile.studentIDNumber }}</p>

					<div class="mt-[6vh] w-full">
						<svg :viewBox="`0 0 ${barcode.width} 64`" preserveAspectRatio="none" role="img"
							:aria-label="`Barcode ${profile.barcodeValue}`" class="block h-[min(30vh,220px)] w-full">
							<rect v-for="([x, w], i) in barcode.bars" :key="i" :x="x" y="0" :width="w" height="64" fill="#000" />
						</svg>
						<p class="font-data mt-3 text-[clamp(16px,3.6vw,26px)] tracking-[.2em] text-stone-900">{{ profile.barcodeValue }}</p>
					</div>
				</div>

				<p class="text-center text-[13px] text-stone-500">
					<Icon name="i-tabler-sun" class="mr-1 inline h-4 w-4 align-[-3px]" />Turn your brightness up. Tap anywhere to close.
				</p>
			</div>
		</Transition>
	</Teleport>
</template>

<script setup lang="ts">
const props = defineProps<{
	open: boolean
	profile: { fullName: string; studentIDNumber: string; barcodeValue: string }
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const barcode = computed(() => code128(props.profile.barcodeValue))
const panel = ref<HTMLElement | null>(null)

/* Keep the screen awake while the ID is up (Screen Wake Lock; quietly skipped where unsupported). */
let wakeLock: { release: () => Promise<void> } | null = null

async function holdScreen() {
	try {
		wakeLock = await (navigator as Navigator & { wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> } })
			.wakeLock?.request('screen') ?? null
	} catch {
		wakeLock = null
	}
}

function releaseScreen() {
	void wakeLock?.release().catch(() => {})
	wakeLock = null
}

// The browser drops the lock when the tab is hidden; take it again on return if the ID is still up.
function onVisibility() {
	if (props.open && document.visibilityState === 'visible') void holdScreen()
}

function onKeydown(event: KeyboardEvent) {
	if (event.key === 'Escape' && props.open) emit('close')
}

watch(() => props.open, async (isOpen) => {
	if (!import.meta.client) return
	document.documentElement.style.overflow = isOpen ? 'hidden' : ''
	if (isOpen) {
		void holdScreen()
		await nextTick()
		panel.value?.focus({ preventScroll: true })
	} else {
		releaseScreen()
	}
})

onMounted(() => {
	window.addEventListener('keydown', onKeydown)
	document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
	window.removeEventListener('keydown', onKeydown)
	document.removeEventListener('visibilitychange', onVisibility)
	document.documentElement.style.overflow = ''
	releaseScreen()
})
</script>
