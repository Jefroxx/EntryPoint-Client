<template>
	<div>
		<div class="relative aspect-video overflow-hidden rounded-2xl bg-stone-900 text-white">
			<video ref="video" muted playsinline autoplay class="absolute inset-0 h-full w-full object-cover" />

			<template v-if="camState === 'live'">
				<div class="pointer-events-none absolute rounded-[10px] shadow-[0_0_0_9999px_rgba(12,10,9,.45)]" :style="frameStyle">
					<i v-for="corner in CORNERS" :key="corner" class="absolute h-6 w-6 border-[3px] transition-colors duration-150"
						:class="[corner, flash ? 'border-emerald-300' : 'border-white/90']" />
				</div>
				<p class="pointer-events-none absolute inset-x-0 bottom-3 px-3 text-center text-[13.5px] text-white/90">{{ flash ? 'Got it' : hint }}</p>
				<div class="pointer-events-none absolute inset-0 bg-emerald-300 transition-opacity duration-300" :class="flash ? 'opacity-40' : 'opacity-0'" />
				<button v-if="torchAvailable" type="button" aria-label="Torch" :aria-pressed="torchOn"
					class="absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full transition-[transform,background-color] duration-150 ease-out active:scale-[0.96]"
					:class="torchOn ? 'bg-amber-300 text-stone-900' : 'bg-black/45 text-white'" @click="toggleTorch">
					<Icon name="i-tabler-bolt" class="h-4 w-4" />
				</button>
			</template>

			<div v-else class="absolute inset-0 grid place-items-center bg-stone-900/80 p-4 text-center text-[14px] leading-snug">
				<div v-if="camState === 'starting'" class="flex items-center gap-2.5 text-white/85">
					<span class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Starting the camera…
				</div>
				<div v-else class="max-w-[300px]">
					<Icon name="i-tabler-camera-off" class="mx-auto mb-2 h-8 w-8 opacity-80" />
					<p class="mb-0.5 text-[15px] font-semibold">{{ message.title }}</p>
					<p class="mb-3 text-white/70">{{ message.text }}</p>
					<ButtonsButton v-if="camState !== 'unsupported'" class="!bg-white !text-stone-900" @click="begin">
						{{ camState === 'idle' ? 'Turn on camera' : 'Try again' }}
					</ButtonsButton>
				</div>
			</div>
		</div>
		<p class="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium" :class="status.class">
			<i class="h-2 w-2 rounded-full" :class="status.dot" />{{ status.label }}
		</p>
	</div>
</template>

<script setup lang="ts">
import type { ScanRegion } from '~/composables/useCameraScanner'

/**
 * A camera that reads barcodes, for any window that needs to scan something (an ID, a book, a slip) without sending
 * the librarian to the Station tab. It is on while `active` is true. While it is on it tells the Station tab (over
 * the same channel Checkout uses) to leave its own camera reads alone, since both read the same webcam.
 */
const props = defineProps<{
	active: boolean
	/** What to hold up, shown inside the frame ("Hold the student's ID inside the box"). */
	hint: string
}>()

const emit = defineEmits<{ (e: 'code', value: string): void }>()

// Wide and short like a barcode. The decoder reads only inside this box, so what is drawn is what is read.
const REGION: ScanRegion = { left: 0.14, top: 0.32, width: 0.72, height: 0.36 }
const frameStyle = { left: `${REGION.left * 100}%`, top: `${REGION.top * 100}%`, width: `${REGION.width * 100}%`, height: `${REGION.height * 100}%` }
const CORNERS = ['left-0 top-0 border-b-0 border-r-0 rounded-tl-[10px]', 'right-0 top-0 border-b-0 border-l-0 rounded-tr-[10px]', 'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-[10px]', 'bottom-0 right-0 border-l-0 border-t-0 rounded-br-[10px]']

const { video, state: camState, torchAvailable, torchOn, start, stop, toggleTorch } = useCameraScanner(onCameraCode, () => REGION)
const desk = useCheckoutDeskAnnouncer()

const flash = ref(false)
let paused = false

// A read flashes the frame and pauses for a moment, so one barcode held up is never reported twice.
function onCameraCode(value: string) {
	if (paused || !props.active) return
	paused = true
	flash.value = true
	emit('code', value)
	setTimeout(() => { flash.value = false; paused = false }, 1600)
}

async function begin() {
	await nextTick()
	if (!props.active) return
	desk.begin()
	await start()
}

function end() {
	stop()
	desk.end()
}

watch(() => props.active, (on) => { if (on) void begin(); else end() }, { immediate: true })
onBeforeUnmount(end)

const message = computed(() => {
	if (camState.value === 'blocked') return { title: 'Camera is blocked', text: "Allow camera access in your browser's site settings. You can still type the number." }
	if (camState.value === 'nocamera') return { title: 'No camera found', text: 'Plug in a webcam, or type the number instead.' }
	if (camState.value === 'unsupported') {
		return import.meta.client && !window.isSecureContext
			? { title: 'The camera needs a secure connection', text: 'Open this site over https (or on localhost). Browsers block the camera on plain http.' }
			: { title: "This browser can't read barcodes", text: 'Try Chrome or Edge, or type the number.' }
	}
	return { title: 'Camera is off', text: 'Turn it on to scan by holding a barcode up.' }
})

const status = computed(() => {
	if (camState.value === 'live') return { label: 'Camera live', class: 'text-emerald-700', dot: 'bg-emerald-600' }
	if (camState.value === 'starting') return { label: 'Starting camera…', class: 'text-amber-700', dot: 'bg-amber-600' }
	return camState.value === 'idle' ? { label: 'Camera off', class: 'text-stone-500', dot: 'bg-stone-400' } : { label: 'Camera unavailable', class: 'text-red-600', dot: 'bg-red-500' }
})
</script>
