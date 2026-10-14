<template>
	<LibrarianModalShell :open="open" size="xl" title="Create a Facebook post"
		:subtitle="category ? `${category.title} · ${periodText}` : ''" @close="emit('close')">
		<div v-if="category" class="grid gap-5 md:grid-cols-[minmax(0,1fr)_320px]">
			<!-- The poster exactly as it will be downloaded. -->
			<div>
				<canvas ref="canvasEl" class="aspect-square w-full rounded-2xl border border-stone-200 bg-crimson shadow-sm"
					role="img" :aria-label="`Poster for ${category.title}`" />
				<p v-if="!included.length" class="mt-2 text-[13px] text-amber-800">Pick at least one student to put on the poster.</p>
			</div>

			<div class="space-y-4">
				<fieldset>
					<legend class="mb-1.5 text-[13.5px] font-semibold text-stone-800">Students on the poster</legend>
					<ul class="space-y-1.5">
						<li v-for="l in category.leaders" :key="`${l.rank}-${l.name}`">
							<label class="flex cursor-pointer items-start gap-2.5 rounded-xl border border-stone-200 px-3 py-2 hover:bg-stone-50">
								<input v-model="picked" type="checkbox" :value="keyOf(l)" class="mt-1 accent-accent-500" />
								<span class="min-w-0 text-[13.5px]">
									<span class="block truncate font-semibold text-stone-900">{{ l.rank }}. {{ l.name }}</span>
									<span class="block truncate text-[12.5px] text-stone-500">{{ l.program || 'No program' }} · {{ hallOfFameAmount(l.value, category.unit) }}</span>
								</span>
							</label>
						</li>
					</ul>
					<p class="mt-1.5 text-[12.5px] text-stone-500">The poster shows full names and programs. Untick anyone who didn't agree to be posted.</p>
				</fieldset>

				<div>
					<label for="hof-caption" class="mb-1.5 block text-[13.5px] font-semibold text-stone-800">Caption</label>
					<textarea id="hof-caption" v-model="caption" rows="9"
						class="w-full rounded-[10px] border border-stone-200 bg-white px-3 py-2.5 text-[14px] leading-snug text-stone-900 outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-200" />
				</div>
			</div>
		</div>

		<template #footer>
			<ButtonsButton variant="ghost" @click="emit('close')">Close</ButtonsButton>
			<ButtonsButton variant="ghost" :disabled="!included.length" @click="copyCaption">
				<Icon :name="copied ? 'i-tabler-check' : 'i-tabler-copy'" class="h-3.5 w-3.5" />{{ copied ? 'Copied' : copyFailed ? 'Copy by hand' : 'Copy' }}<span class="max-sm:hidden">{{ copied || copyFailed ? '' : ' caption' }}</span>
			</ButtonsButton>
			<ButtonsButton variant="primary" :disabled="!included.length || !ready" @click="download">
				<Icon name="i-tabler-download" class="h-3.5 w-3.5" />Download<span class="max-sm:hidden"> image</span>
			</ButtonsButton>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import type { HallOfFameCategory, HallOfFameLeader } from '~/services/studentService'
import logoUrl from '~/assets/landing/compass-white.png'

const props = defineProps<{
	open: boolean
	category: HallOfFameCategory | null
	/** "October": the month the boards cover. */
	month: string
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const canvasEl = ref<HTMLCanvasElement | null>(null)
const picked = ref<string[]>([])
const caption = ref('')
const copied = ref(false)
const copyFailed = ref(false)
const ready = ref(false)

const keyOf = (l: HallOfFameLeader) => `${l.rank}|${l.name}`
const periodText = computed(() => (props.category?.period === 'month' ? props.month : HALL_OF_FAME_PERIOD[props.category?.period ?? 'month']))
const included = computed(() => (props.category?.leaders ?? []).filter((l) => picked.value.includes(keyOf(l))))

const MEDAL_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function buildCaption(): string {
	const c = props.category
	if (!c) return ''
	const lines = included.value.map((l) =>
		`${MEDAL_EMOJI[l.rank] ?? '🥉'} ${l.name}${l.program ? ` (${l.program})` : ''} — ${hallOfFameAmount(l.value, c.unit)}`)
	return [
		`🏆 EntryPoint Hall of Fame · ${periodText.value}`,
		`${c.title}: ${c.blurb}`,
		'',
		...lines,
		'',
		'Congratulations to our standouts from the STI College Davao Library! 🎉',
		'',
		'#STICollegeDavao #EntryPoint #HallOfFame',
	].join('\n')
}

// A new category starts with everyone ticked; ticking or unticking someone rewrites the caption to match.
watch(() => [props.open, props.category?.key], () => {
	copied.value = false
	picked.value = (props.category?.leaders ?? []).map(keyOf)
}, { immediate: true })

watch(picked, () => { caption.value = buildCaption() }, { immediate: true })

async function render() {
	const c = props.category
	const canvas = canvasEl.value
	if (!props.open || !c || !canvas || !included.value.length) { ready.value = false; return }
	await drawPoster(canvas, {
		month: props.month,
		period: periodText.value,
		title: c.title,
		blurb: c.blurb,
		leaders: included.value.map((l) => ({ rank: l.rank, name: l.name, program: l.program, amount: hallOfFameAmount(l.value, c.unit) })),
	}, logoUrl)
	ready.value = true
}

// The modal teleports its content, so the canvas only exists a tick after it opens.
watch([() => props.open, () => props.category?.key, picked], () => nextTick(render), { deep: true, flush: 'post' })

async function copyCaption() {
	try {
		await navigator.clipboard.writeText(caption.value)
		copied.value = true
		copyFailed.value = false
		setTimeout(() => { copied.value = false }, 2000)
	} catch {
		copyFailed.value = true
	}
}

function download() {
	const c = props.category
	if (!c || !canvasEl.value) return
	canvasEl.value.toBlob((blob) => {
		if (!blob) return
		const slug = `${c.key}-${periodText.value}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `hall-of-fame-${slug}.png`
		a.click()
		URL.revokeObjectURL(url)
	}, 'image/png')
}
</script>
