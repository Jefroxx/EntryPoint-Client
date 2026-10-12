<template>
	<LibrarianModalShell :open="open" size="xl" :title="step === 'done' ? 'Import finished' : 'Import from a CSV file'"
		:subtitle="subtitle" :busy="busy" @close="close">
		<!-- Step 1: choose the file -->
		<div v-if="step === 'file'" class="space-y-4">
			<div class="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
				<Icon name="i-tabler-file-spreadsheet" class="mx-auto h-9 w-9 text-stone-400" aria-hidden="true" />
				<p class="mt-2 text-[15px] font-semibold text-stone-900">Choose a CSV file</p>
				<p class="mt-0.5 text-[13px] text-stone-500">Up to {{ MAX_ROWS }} people. Each gets a temporary password to hand over.</p>
				<label class="mt-4 inline-flex">
					<input ref="fileInput" type="file" accept=".csv,text/csv" class="sr-only" @change="onFile" />
					<span class="inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-accent-500 px-4 text-[14.5px] font-semibold text-white transition-colors hover:bg-accent-600">
						<Icon name="i-tabler-upload" class="h-4 w-4" />Choose file
					</span>
				</label>
				<p v-if="problem" role="alert" class="mt-3 text-[13px] font-medium text-red-600">{{ problem }}</p>
			</div>

			<div class="rounded-2xl border border-stone-200 p-4">
				<div class="flex flex-wrap items-center justify-between gap-2">
					<h3 class="text-[14px] font-bold text-stone-900">The columns</h3>
					<ButtonsButton variant="ghost" size="sm" @click="downloadTemplate"><Icon name="i-tabler-download" class="h-3.5 w-3.5" />Download a template</ButtonsButton>
				</div>
				<dl class="mt-3 grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
					<div v-for="c in COLUMNS" :key="c.key" class="flex gap-2">
						<dt class="font-data w-[150px] shrink-0 text-[12.5px] font-semibold text-stone-800">{{ c.key }}<span v-if="!c.optional" class="text-red-500">*</span></dt>
						<dd class="text-stone-500">{{ c.hint }}</dd>
					</div>
				</dl>
			</div>
		</div>

		<!-- Step 2: what would happen -->
		<div v-else-if="step === 'review' && check" class="space-y-4">
			<div class="grid grid-cols-2 gap-3">
				<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
					<p class="text-[28px] font-bold leading-none tabular-nums text-emerald-800">{{ check.creatable }}</p>
					<p class="mt-1 text-[13px] text-emerald-800">will be created</p>
				</div>
				<div class="rounded-2xl border p-4" :class="check.skipped ? 'border-amber-200 bg-amber-50' : 'border-stone-200 bg-stone-50'">
					<p class="text-[28px] font-bold leading-none tabular-nums" :class="check.skipped ? 'text-amber-800' : 'text-stone-400'">{{ check.skipped }}</p>
					<p class="mt-1 text-[13px]" :class="check.skipped ? 'text-amber-800' : 'text-stone-500'">will be skipped</p>
				</div>
			</div>

			<ul class="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200">
				<li v-for="r in check.rows" :key="r.row" class="flex items-start gap-3 px-4 py-2.5" :class="r.ok ? '' : 'bg-amber-50/60'">
					<span class="font-data mt-0.5 w-8 shrink-0 text-[12px] text-stone-400">{{ r.row }}</span>
					<div class="min-w-0 flex-1">
						<p class="truncate text-[14px] font-semibold text-stone-900">{{ [r.data.firstName, r.data.lastName].filter(Boolean).join(' ') || '(no name)' }}
							<span class="ml-1 text-[12.5px] font-normal capitalize text-stone-500">{{ r.data.type }}</span></p>
						<p class="truncate text-[12.5px] text-stone-500">{{ r.data.email }} · {{ r.data.idNumber }} · {{ r.data.programOrDepartment }}</p>
						<p v-for="(message, field) in r.errors" :key="field" class="text-[12.5px] font-medium text-amber-800">{{ message }}</p>
					</div>
					<LibrarianStatusPill :label="r.ok ? 'Will create' : 'Skipped'" :tone="r.ok ? 'success' : 'warning'" class="shrink-0" />
				</li>
			</ul>
		</div>

		<!-- Step 3: the passwords, once -->
		<div v-else-if="step === 'done' && result" class="space-y-4">
			<div class="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
				<p class="text-[15px] font-bold text-emerald-900">{{ result.created.length }} account{{ result.created.length === 1 ? '' : 's' }} created</p>
				<p class="mt-0.5 text-[13.5px] text-emerald-900">
					Download the list of temporary passwords now. It can't be shown again, and each person is asked for a new password when they first sign in.
				</p>
				<ButtonsButton variant="primary" class="mt-3" @click="downloadPasswords"><Icon name="i-tabler-download" class="h-4 w-4" />Download passwords (CSV)</ButtonsButton>
			</div>
			<div v-if="result.skipped.length" class="rounded-2xl border border-amber-200 bg-amber-50 p-4">
				<p class="text-[14px] font-bold text-amber-900">{{ result.skipped.length }} skipped</p>
				<ul class="mt-1 space-y-0.5 text-[13px] text-amber-900">
					<li v-for="r in result.skipped" :key="r.row">Row {{ r.row }}: {{ Object.values(r.errors).join(' ') }}</li>
				</ul>
			</div>
		</div>

		<template #footer>
			<template v-if="step === 'file'">
				<ButtonsButton variant="ghost" @click="close">Cancel</ButtonsButton>
			</template>
			<template v-else-if="step === 'review'">
				<ButtonsButton variant="ghost" :disabled="busy" @click="reset">Choose another file</ButtonsButton>
				<ButtonsButton variant="primary" :disabled="busy || !check?.creatable" @click="runImport">
					<Icon v-if="busy" name="i-tabler-loader-2" class="h-3.5 w-3.5 animate-spin" />
					Create {{ check?.creatable ?? 0 }} account{{ check?.creatable === 1 ? '' : 's' }}
				</ButtonsButton>
			</template>
			<template v-else>
				<ButtonsButton variant="primary" @click="close">Done</ButtonsButton>
			</template>
		</template>
	</LibrarianModalShell>
</template>

<script setup lang="ts">
import { adminService, type ImportCheck, type ImportResult, type ImportRow } from '~/services/adminService'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'imported'): void }>()

const MAX_ROWS = 500

// The file's columns. Headers are matched loosely (case, spaces and a few common names), in any order.
const COLUMNS: { key: keyof ImportRow; hint: string; optional?: boolean; aliases: string[] }[] = [
	{ key: 'type', hint: 'student, faculty or staff', aliases: ['type', 'membertype', 'role'] },
	{ key: 'idNumber', hint: 'Student ID or employee ID', aliases: ['idnumber', 'id', 'studentid', 'employeeid', 'studentidnumber', 'employeeidnumber'] },
	{ key: 'firstName', hint: 'First name', aliases: ['firstname', 'first', 'givenname'] },
	{ key: 'middleInitial', hint: 'One letter', optional: true, aliases: ['middleinitial', 'mi', 'middle'] },
	{ key: 'lastName', hint: 'Last name', aliases: ['lastname', 'last', 'surname', 'familyname'] },
	{ key: 'email', hint: 'Their school email', aliases: ['email', 'emailaddress'] },
	{ key: 'programOrDepartment', hint: 'Program (students) or department', aliases: ['programordepartment', 'program', 'department', 'course'] },
	{ key: 'phoneNumber', hint: 'Phone', optional: true, aliases: ['phonenumber', 'phone', 'mobile', 'contact'] },
]

const step = ref<'file' | 'review' | 'done'>('file')
const busy = ref(false)
const problem = ref('')
const rows = ref<ImportRow[]>([])
const check = ref<ImportCheck | null>(null)
const result = ref<ImportResult | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const subtitle = computed(() => ({
	file: 'Add students, faculty and staff in one go from a spreadsheet.',
	review: 'Check this before anything is created.',
	done: 'Hand the temporary passwords over; they are shown once.',
})[step.value])

watch(() => props.open, (isOpen) => { if (isOpen) reset() })

function reset() {
	step.value = 'file'
	problem.value = ''
	rows.value = []
	check.value = null
	result.value = null
	busy.value = false
	if (fileInput.value) fileInput.value.value = ''
}

function close() {
	if (busy.value) return
	const created = step.value === 'done'
	emit('close')
	if (created) emit('imported')
}

const normal = (header: string) => header.toLowerCase().replace(/[^a-z]/g, '')

async function onFile(event: Event) {
	const file = (event.target as HTMLInputElement).files?.[0]
	if (!file) return
	problem.value = ''

	const table = parseCsv(await file.text())
	if (table.length < 2) { problem.value = 'That file has no rows. It needs a header line and at least one person.'; return }

	// Which column is which, by its header.
	const header = table[0]!.map(normal)
	const index = new Map<keyof ImportRow, number>()
	for (const c of COLUMNS) {
		const at = header.findIndex((h) => c.aliases.includes(h))
		if (at >= 0) index.set(c.key, at)
	}
	const missing = COLUMNS.filter((c) => !c.optional && !index.has(c.key)).map((c) => c.key)
	if (missing.length) { problem.value = `The header line is missing: ${missing.join(', ')}. Download the template to see the columns.`; return }

	const body = table.slice(1)
	if (body.length > MAX_ROWS) { problem.value = `That file has ${body.length} people. Import up to ${MAX_ROWS} at a time.`; return }

	rows.value = body.map((cells) => Object.fromEntries(COLUMNS.map((c) => [c.key, (cells[index.get(c.key) ?? -1] ?? '').trim()])) as unknown as ImportRow)

	busy.value = true
	try {
		check.value = await adminService.checkImport(rows.value)
		step.value = 'review'
	} catch (error) {
		problem.value = apiErrorMessage(error, 'Could not check the file. Please try again.')
	} finally {
		busy.value = false
	}
}

async function runImport() {
	busy.value = true
	try {
		result.value = await adminService.importMembers(rows.value)
		step.value = 'done'
	} catch (error) {
		problem.value = apiErrorMessage(error, 'The import failed. Nothing was created.')
		step.value = 'file'
	} finally {
		busy.value = false
	}
}

function downloadTemplate() {
	downloadCsv('members-template.csv', [
		COLUMNS.map((c) => c.key),
		['faculty', 'EMP-2024-001', 'Roberto', 'M', 'Alcantara', 'roberto.alcantara@davao.sti.edu.ph', 'Information Technology', ''],
		['student', '02-2024-0001', 'Mia', '', 'Cruz', 'mia.cruz@davao.sti.edu.ph', 'BS Nursing', '09171234567'],
	])
}

function downloadPasswords() {
	downloadCsv(`temporary-passwords-${new Date().toISOString().slice(0, 10)}.csv`, [
		['Name', 'Email', 'Type', 'ID number', 'Temporary password'],
		...(result.value?.created ?? []).map((c) => [c.name, c.email, c.type, c.idNumber, c.temporaryPassword]),
	])
}
</script>
