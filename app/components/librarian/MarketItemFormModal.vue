<template>
	<LibrarianModalShell :open="open" :title="item ? 'Edit Item' : 'Add Item'"
		subtitle="Students spend knowledge points on these rewards." :busy="busy" @close="emit('close')">
		<div class="space-y-4">
			<!-- Photo: optional; without one, students see the item type's icon. -->
			<div>
				<p class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Photo <span class="font-normal text-stone-400">(optional)</span></p>
				<div class="flex items-center gap-4">
					<!-- image/* lets a phone offer its camera as well as the gallery. `relative` keeps the sr-only input
						 inside the tile, so focusing it doesn't scroll the window. -->
					<label class="relative flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-stone-300 text-stone-400 transition-colors hover:border-accent-300 hover:bg-accent-50 hover:text-accent-600"
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
			<ButtonsButton variant="ghost" :disabled="busy" @click="emit('close')">Cancel</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="busy || preparing" @click="submit">
				<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
				{{ item ? 'Save changes' : 'Add Item' }}
			</ButtonsButton>
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

function setLocalPhoto(blob: Blob | null) {
	if (localURL.value) URL.revokeObjectURL(localURL.value)
	newPhoto.value = blob
	localURL.value = blob ? URL.createObjectURL(blob) : null
}

watch(() => props.open, (isOpen) => {
	setLocalPhoto(null)
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
