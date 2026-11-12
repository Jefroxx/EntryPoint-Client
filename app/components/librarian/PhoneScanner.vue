<template>
	<div>
		<button v-if="!on" type="button"
			class="flex w-full items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-3 text-left transition-[transform,background-color,border-color] duration-150 ease-out hover:border-accent-300 hover:bg-accent-50 active:scale-[0.99]"
			@click="turnOn">
			<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-600"><Icon name="i-tabler-device-mobile" class="h-[18px] w-[18px]" /></span>
			<span class="min-w-0">
				<span class="block text-[14px] font-semibold text-stone-900">Use your phone as the camera</span>
				<span class="block text-[12.5px] text-stone-500">An alternative when the webcam is far away or not working.</span>
			</span>
		</button>

		<section v-else class="rounded-2xl border border-stone-200 bg-white p-4" aria-label="Phone camera">
			<div class="flex items-start justify-between gap-3">
				<div class="flex items-center gap-2.5">
					<span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" :class="phone.connected.value ? 'bg-emerald-50 text-emerald-600' : 'bg-accent-50 text-accent-600'">
						<Icon name="i-tabler-device-mobile" class="h-[18px] w-[18px]" />
					</span>
					<div>
						<p class="text-[14px] font-semibold text-stone-900">Phone camera</p>
						<p class="flex items-center gap-1.5 text-[12.5px] font-medium" :class="phone.connected.value ? 'text-emerald-700' : 'text-amber-700'">
							<i class="h-2 w-2 rounded-full" :class="phone.connected.value ? 'bg-emerald-600' : 'bg-amber-500'" />
							{{ phone.connected.value ? 'Phone connected' : 'Waiting for the phone…' }}
						</p>
					</div>
				</div>
				<button type="button" class="shrink-0 rounded-lg px-2 py-1 text-[12.5px] font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800" @click="turnOff">Use the webcam</button>
			</div>

			<!-- Connected: nothing to scan, just say so (and what it last heard). -->
			<div v-if="phone.connected.value && !showCode" class="mt-3">
				<p class="text-[13.5px] leading-snug text-stone-600">Point the phone at a barcode. It is used here as soon as the phone reads it.</p>
				<p v-if="phone.lastCode.value" class="mt-2 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-[13px] text-emerald-800">
					<Icon name="i-tabler-check" class="h-4 w-4 shrink-0" />Received <span class="font-data truncate">{{ phone.lastCode.value }}</span>
				</p>
				<div class="mt-3 flex flex-wrap gap-2">
					<ButtonsButton variant="ghost" size="sm" @click="addAnother"><Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add another phone</ButtonsButton>
					<ButtonsButton variant="ghost" size="sm" @click="phone.disconnect()"><Icon name="i-tabler-plug-off" class="h-3.5 w-3.5" />Disconnect</ButtonsButton>
				</div>
			</div>

			<!-- Not connected yet: the QR, or a way to say where the phone should go. -->
			<div v-else class="mt-3">
				<div v-if="!address" class="rounded-xl bg-amber-50 p-3 text-[13px] leading-snug text-amber-900">
					<p class="font-semibold">A phone can't open this address.</p>
					<p class="mt-0.5">This is a local copy of the site (<span class="font-data">localhost</span>), and a phone can only use the camera on a secure public (https) address. On the live site the QR code appears by itself. To try it here, type a public address that reaches this computer, once:</p>
					<form class="mt-2 flex gap-2" @submit.prevent="saveAddress">
						<input v-model="addressInput" type="text" inputmode="url" autocomplete="off" placeholder="https://your-address.trycloudflare.com"
							class="font-data h-10 min-w-0 flex-1 rounded-xl border bg-white px-3 text-[13px] text-stone-900 outline-none focus:border-accent-400"
							:class="addressError ? 'border-red-400' : 'border-stone-200'" aria-label="Public address of this site" />
						<ButtonsButton type="submit" size="sm">Save</ButtonsButton>
					</form>
					<p v-if="addressError" class="mt-1 text-[12.5px] text-red-600">{{ addressError }}</p>
				</div>

				<div v-else class="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
					<div class="flex h-[140px] w-[140px] shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white p-1.5">
						<img v-if="qr" :src="qr" alt="QR code to open the scanner on your phone" class="h-full w-full" />
						<span v-else class="h-5 w-5 animate-spin rounded-full border-2 border-stone-200 border-t-accent-500" />
					</div>
					<div class="min-w-0 text-[12.5px] leading-snug text-stone-600">
						<ol class="list-decimal space-y-0.5 pl-4">
							<li>Point your phone's camera at this code.</li>
							<li>Tap the link that appears. No sign-in needed.</li>
							<li>Allow the camera, then scan a barcode.</li>
						</ol>
						<p class="mt-1.5 text-[12px] text-stone-500" title="The code works once and lasts ten minutes. The phone stays connected for about twelve hours.">One-time code. The phone stays connected for hours.</p>
						<div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
							<ButtonsButton variant="ghost" size="sm" :disabled="phone.busy.value" @click="phone.newCode()"><Icon name="i-tabler-refresh" class="h-3.5 w-3.5" />New code</ButtonsButton>
							<ButtonsButton variant="ghost" size="sm" @click="copyLink"><Icon name="i-tabler-copy" class="h-3.5 w-3.5" />{{ copied ? 'Copied' : 'Copy link' }}</ButtonsButton>
							<button v-if="!onPublicAddress && !serverOrigin" type="button" class="text-[12.5px] font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline" @click="changeAddress">Change address</button>
							<button v-if="phone.connected.value" type="button" class="text-[12.5px] font-medium text-stone-500 underline-offset-2 hover:text-stone-800 hover:underline" @click="showCode = false">Done</button>
						</div>
					</div>
				</div>

				<p v-if="phone.error.value" class="mt-2 text-[12.5px] text-red-600">{{ phone.error.value }}</p>
			</div>
		</section>
	</div>
</template>

<script setup lang="ts">
import { cleanPhoneAddress, phoneLink, phoneOrigin, savePhoneAddress, savedPhoneAddress } from '~/utils/phoneLink'

/**
 * "Use your phone as the camera", for any desk window that reads barcodes. Closed, it is one line; opened, it shows a
 * QR code for the phone and, once a phone has connected, says so. Every barcode the phone reads is sent up as `code`,
 * which the window should handle exactly like one from its own camera. Nothing is listened for while `active` is false.
 */
const props = withDefaults(defineProps<{
	active: boolean
	/** Checkout and Start Session ("desk", the default) come before the Station when both are open. */
	as?: 'desk' | 'station'
}>(), { as: 'desk' })
const emit = defineEmits<{ (e: 'code', value: string): void }>()

const phone = usePhoneScanner((value) => emit('code', value), props.as)
// Open means the phone is being used instead of the webcam: the window hides its own camera while this is true.
const on = defineModel<boolean>('open', { default: false })
const showCode = ref(false)
const origin = ref<string | null>(null)
const addressInput = ref('')
const addressError = ref('')
const qr = ref('')
const copied = ref(false)

// The server says which address phones should open (its PORTAL_URL: the real domain once hosted). The code only works
// against the server that made it, so that address is always the right one and nothing has to be typed.
const serverOrigin = computed(() => cleanPhoneAddress(phone.pairing.value?.portalUrl ?? ''))
// In order of preference: the server's address, then the one this window is open on, then one typed in once.
const address = computed(() => serverOrigin.value ?? origin.value)
const link = computed(() => (address.value && phone.pairing.value ? phoneLink(address.value, phone.pairing.value.code) : ''))

async function turnOn() {
	on.value = true
	origin.value = phoneOrigin()
	await phone.enable()
}

function turnOff() {
	on.value = false
	showCode.value = false
	phone.disable()
}

async function addAnother() {
	showCode.value = true
	await phone.newCode()
}

function saveAddress() {
	const clean = cleanPhoneAddress(addressInput.value)
	if (!clean) {
		addressError.value = 'Use the https address people reach this site on, like https://something.trycloudflare.com. Local addresses (localhost, 192.168…) can\'t work on a phone.'
		return
	}
	addressError.value = ''
	savePhoneAddress(clean)
	origin.value = clean
}

// Only offered when this window is not itself on a public https address (then a typed one is what is being used).
const onPublicAddress = computed(() => import.meta.client && cleanPhoneAddress(location.origin) === location.origin)

function changeAddress() {
	addressInput.value = savedPhoneAddress() ?? ''
	savePhoneAddress(null)
	origin.value = null
}

async function copyLink() {
	if (!link.value) return
	try {
		await navigator.clipboard.writeText(link.value)
		copied.value = true
		setTimeout(() => { copied.value = false }, 1800)
	} catch { /* clipboard blocked: the QR still works */ }
}

// The QR is drawn in the browser from the link; the library loads only when someone opens this panel.
watch(link, async (value) => {
	if (!value) { qr.value = ''; return }
	const QRCode = (await import('qrcode')).default
	qr.value = await QRCode.toDataURL(value, { margin: 1, width: 280, errorCorrectionLevel: 'M' })
})

// The panel can be opened from outside (the Scan station's "Phone camera" tab, or a choice remembered from last time),
// not only by its own button. The address is worked out whenever it is open, however it got that way; before, it was
// only set by the button, so those windows had no address and showed the "type an address" box even on the real domain.
watch(on, (isOn) => { if (isOn && !origin.value) origin.value = phoneOrigin() }, { immediate: true })

// A phone that connects ends the QR; losing it brings the QR back.
watch(() => phone.connected.value, (isConnected) => { if (isConnected) showCode.value = false })

// Listening follows the window: on while it is open, off when it closes. A librarian who left the panel open last
// time finds it open again (the phone is usually still connected, so there is no QR to scan).
watch(() => props.active, (isActive) => {
	if (!import.meta.client) return
	if (!isActive) { phone.disable(); return }
	// The phone is never reopened by itself: every window starts on the computer's own camera, and the phone is
	// something the librarian picks each time. (It used to remember the last choice, which hid the webcam for good.)
	if (on.value) void phone.enable()
}, { immediate: true })
</script>
