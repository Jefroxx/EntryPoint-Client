<template>
	<LibrarianModalShell :open="open" :title="confirming ? 'Confirm Changes' : item ? 'Edit Item' : 'Add Item'"
		:subtitle="confirming ? 'Check the changes before they are saved.' : 'Students spend knowledge points on these rewards.'" :busy="busy" @close="emit('close')">
		<!-- Step 2 (editing only): what will change. It replaces the form in this same window (no second pop-up). -->
		<div v-if="confirming" class="space-y-4">
			<div class="rounded-xl bg-stone-50 px-4 py-3">
				<p class="text-[12px] font-semibold uppercase tracking-wide text-stone-500">Item</p>
				<p class="text-[15px] font-semibold text-stone-900">{{ item?.name }}</p>
			</div>
			<dl class="divide-y divide-stone-100 rounded-xl border border-stone-200 text-[14px]">
				<div v-for="change in changes" :key="change.label" class="px-4 py-2.5">
					<dt class="text-[12.5px] text-stone-500">{{ change.label }}</dt>
					<dd class="mt-0.5 flex flex-wrap items-center gap-x-2 text-stone-900">
						<span class="text-stone-500 line-through decoration-stone-300">{{ change.from }}</span>
						<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5 shrink-0 text-stone-400" />
						<span class="font-semibold">{{ change.to }}</span>
					</dd>
				</div>
				<div v-if="photoChange" class="px-4 py-2.5">
					<dt class="text-[12.5px] text-stone-500">Photo</dt>
					<dd class="mt-1 flex flex-wrap items-center gap-3 text-stone-900">
						<img v-if="item?.photoURL" :src="item.photoURL" alt="Current photo" class="h-14 w-14 rounded-lg border border-stone-200 object-cover" />
						<span v-else class="text-stone-500">No photo</span>
						<Icon name="i-tabler-arrow-right" class="h-3.5 w-3.5 shrink-0 text-stone-400" />
						<img v-if="localURL" :src="localURL" alt="New photo" class="h-14 w-14 rounded-lg border border-stone-200 object-cover" />
						<span v-else class="font-semibold">Removed</span>
					</dd>
				</div>
			</dl>
			<p v-if="Number(form.stock) === 0 && Number(item?.stock) > 0" class="rounded-xl bg-amber-50 px-3.5 py-2.5 text-[13.5px] text-amber-900">A stock of 0 retires the item: students can no longer redeem it.</p>
		</div>

		<div v-else class="space-y-4">
			<!-- Photo: optional; without one, students see the item type's icon. -->
			<div>
				<p class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Photo <span class="font-normal text-stone-500">(optional)</span></p>
				<div class="flex items-center gap-4">
					<!-- image/* lets a phone offer its camera as well as the gallery. `relative` keeps the sr-only input
						 inside the tile, so focusing it doesn't scroll the window. -->
					<label class="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 text-stone-500 transition-colors hover:border-accent-300 hover:bg-accent-50 hover:text-accent-600"
						:class="[preparing ? 'pointer-events-none opacity-60' : '', previewURL ? 'border-solid' : '']">
						<img v-if="previewURL" :src="previewURL" alt="" class="h-full w-full object-cover" />
						<Icon v-else :name="preparing ? 'i-tabler-loader-2' : 'i-tabler-camera-plus'" class="h-6 w-6" :class="preparing ? 'animate-spin' : ''" />
						<input type="file" accept="image/*" class="sr-only" :disabled="busy" @change="pickPhoto" />
					</label>
					<div class="space-y-1.5 text-[12.5px] text-stone-500">
						<p>{{ previewURL ? 'Click the photo to change it.' : 'Click to add a photo of the reward.' }}</p>
						<ButtonsButton v-if="previewURL" variant="ghost" size="sm" :disabled="busy" @click="removePhoto">
							<Icon name="i-tabler-trash" class="h-3.5 w-3.5" />Remove photo
						</ButtonsButton>
						<p v-if="photoError" class="text-amber-700">{{ photoError }}</p>
					</div>
				</div>
			</div>

			<LibrarianTextField id="item-name" v-model="form.name" label="Name" placeholder="e.g. Free Print Voucher"
				:error="errors.name" @update:model-value="errors.name = ''" />

			<LibrarianTextField id="item-type" v-model="form.type" label="Type" optional placeholder="e.g. Merch, Voucher" />

			<div class="grid grid-cols-2 gap-3">
				<LibrarianTextField id="item-cost" v-model="form.pointCost" type="number" :min="0" label="Cost (points)"
					:error="errors.pointCost" @update:model-value="errors.pointCost = ''" />
				<LibrarianTextField id="item-stock" v-model="form.stock" type="number" :min="0" label="Stock"
					hint="Set to 0 to retire the item." :error="errors.stock" @update:model-value="errors.stock = ''" />
			</div>
		</div>

		<template #footer>
			<template v-if="confirming">
				<ButtonsButton variant="ghost" :disabled="busy" @click="confirming = false">Back</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy" @click="confirm">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else name="i-tabler-check" class="h-3.5 w-3.5" />
					Yes, save changes
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy || preparing || (!!item && !hasChanges)" @click="submit">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					<Icon v-else-if="item" name="i-tabler-arrow-right" class="h-3.5 w-3.5" />
					{{ item ? 'Review' : 'Add Item' }}
				</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { MarketItemPayload, MarketItemPhotoChange, MarketItemRecord } from '~/services/engagementService'
import { compressPagePhoto } from '~/utils/bookPages'

/** A reward shows small on a card; this keeps the upload to roughly 100 KB. */
const PHOTO_MAX_SIDE = 800

const props = defineProps<{
	open: boolean
	item: MarketItemRecord | null
	busy?: boolean
}>()

const emit = defineEmits<{
	(e: 'close'): void
	(e: 'submit', payload: MarketItemPayload, photo: MarketItemPhotoChange): void
}>()

const form = reactive({ name: '', type: '', pointCost: '', stock: '' })
const errors = reactive({ name: '', pointCost: '', stock: '' })

const newPhoto = ref<Blob | null>(null)
const removeCurrent = ref(false)
const localURL = ref<string | null>(null) // object URL for newPhoto's preview
const preparing = ref(false)
const photoError = ref('')

const previewURL = computed(() => localURL.value ?? (removeCurrent.value ? null : props.item?.photoURL ?? null))

// Editing asks once more before saving: this is the summary of what is about to change.
const confirming = ref(false)

// A new photo, or the current one taken away; null when the photo is left as it is.
const photoChange = computed<'changed' | 'removed' | null>(() => {
	if (newPhoto.value) return 'changed'
	return removeCurrent.value && props.item?.photoURL ? 'removed' : null
})

const changes = computed(() => {
	const it = props.item
	if (!it) return []
	const rows: { label: string; from: string; to: string }[] = []
	if (form.name.trim() !== it.name) rows.push({ label: 'Name', from: it.name, to: form.name.trim() })
	if (form.type.trim() !== (it.type ?? '')) rows.push({ label: 'Type', from: it.type || '—', to: form.type.trim() || '—' })
	if (Number(form.pointCost) !== Number(it.pointCost)) rows.push({ label: 'Cost (points)', from: String(it.pointCost), to: String(Number(form.pointCost)) })
	if (Number(form.stock) !== Number(it.stock)) rows.push({ label: 'Stock', from: String(it.stock), to: String(Number(form.stock)) })
	return rows
})
const hasChanges = computed(() => changes.value.length > 0 || photoChange.value !== null)

function setLocalPhoto(blob: Blob | null) {
	if (localURL.value) URL.revokeObjectURL(localURL.value)
	newPhoto.value = blob
	localURL.value = blob ? URL.createObjectURL(blob) : null
}

watch(() => props.open, (isOpen) => {
	setLocalPhoto(null)
	confirming.value = false
	if (!isOpen) return
	form.name = props.item?.name ?? ''
	form.type = props.item?.type ?? ''
	form.pointCost = String(props.item?.pointCost ?? '')
	form.stock = String(props.item?.stock ?? '')
	errors.name = errors.pointCost = errors.stock = ''
	removeCurrent.value = false
	photoError.value = ''
})

onBeforeUnmount(() => setLocalPhoto(null))

async function pickPhoto(event: Event) {
	const input = event.target as HTMLInputElement
	const file = input.files?.[0]
	input.value = '' // picking the same file again still fires change
	if (!file) return

	preparing.value = true
	photoError.value = ''
	try {
		setLocalPhoto(await compressPagePhoto(file, PHOTO_MAX_SIDE))
	} catch {
		photoError.value = "That file isn't a photo this browser can read."
	} finally {
		preparing.value = false
	}
}

function removePhoto() {
	setLocalPhoto(null)
	removeCurrent.value = true
}

const isWhole = (value: string) => value !== '' && Number.isInteger(Number(value)) && Number(value) >= 0

function submit() {
	errors.name = form.name.trim() ? '' : 'Name is required.'
	errors.pointCost = isWhole(form.pointCost) ? '' : 'Enter a whole number, 0 or more.'
	errors.stock = isWhole(form.stock) ? '' : 'Enter a whole number, 0 or more.'
	if (errors.name || errors.pointCost || errors.stock) return

	// Adding saves straight away; editing shows what will change and asks first.
	if (props.item) confirming.value = true
	else confirm()
}

function confirm() {
	emit('submit', {
		name: form.name.trim(),
		type: form.type.trim() || null,
		pointCost: Number(form.pointCost),
		stock: Number(form.stock),
	}, {
		blob: newPhoto.value,
		remove: !newPhoto.value && removeCurrent.value && !!props.item?.photoURL,
	})
}
</script>
