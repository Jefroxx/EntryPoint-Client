<template>
	<div>
		<p class="mb-4 flex items-start gap-2.5 rounded-xl bg-stone-100 px-4 py-3 text-[13.5px] text-stone-700">
			<Icon name="i-tabler-info-circle" class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
			{{ intro ?? 'The kinds of resource. A resource is given one of these when it is added, so every one is spelled the same way.' }}
		</p>

		<div class="phone-toolbar toolbar-nowrap mb-4 flex flex-wrap items-center gap-2">
			<LibrarianSearchInput id="type-search" v-model="search" class="!min-w-[210px]" placeholder="Search types" />
			<div class="flex-1"></div>
			<ButtonsButton variant="primary" class="toolbar-full" @click="emit('add')">
				<Icon name="i-tabler-plus" class="h-3.5 w-3.5" />Add Type
			</ButtonsButton>
		</div>

		<LibrarianCardSkeleton v-if="loading && !types.length" />
		<p v-else-if="!shown.length" class="rounded-2xl border border-stone-200 bg-white px-4 py-10 text-center text-[15px] text-stone-500">
			{{ types.length ? 'No types match your search.' : (emptyText ?? 'No types yet. Add one (Computer, Study Room…) before adding resources.') }}
		</p>
		<ul v-else class="card-grid grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
			<li v-for="type in shown" :key="type.uuid" class="rounded-2xl border border-stone-200 bg-white p-4 transition-shadow duration-150 hover:shadow-card">
				<div class="flex items-start justify-between gap-3">
					<div class="min-w-0">
						<p class="break-words text-[16px] font-bold leading-snug text-stone-900">{{ type.name }}</p>
						<p class="mt-0.5 text-[13.5px] text-stone-500">{{ type.count }} {{ type.count === 1 ? unit.one : unit.many }}</p>
					</div>
				</div>
				<div class="mt-3 flex items-center justify-end gap-1.5 border-t border-stone-100 pt-3">
					<!-- A type that resources still have can't be removed: they would be left without one. -->
					<ButtonsButton variant="danger" size="sm" :disabled="type.count > 0"
						:title="type.count > 0 ? `${unit.many.charAt(0).toUpperCase()}${unit.many.slice(1)} still use this type` : undefined" @click="emit('delete', type)">Delete</ButtonsButton>
					<ButtonsButton variant="ghost" size="sm" @click="emit('edit', type)">Rename</ButtonsButton>
				</div>
			</li>
		</ul>
		<p v-if="types.length" class="mt-3 text-[13.5px] text-stone-500">Showing {{ shown.length }} of {{ types.length }} types</p>
	</div>
</template>

<script setup lang="ts">
/** One row of the list: a type, and how many resources (or rewards) have it. */
export interface TypeRow { uuid: string; name: string; count: number }

const props = withDefaults(defineProps<{
	types: TypeRow[]
	loading: boolean
	/** The line at the top; defaults to the resources wording. */
	intro?: string
	emptyText?: string
	/** What the types are counted in. */
	unit?: { one: string; many: string }
}>(), { intro: undefined, emptyText: undefined, unit: () => ({ one: 'resource', many: 'resources' }) })
const emit = defineEmits<{
	(e: 'add'): void
	(e: 'edit' | 'delete', type: TypeRow): void
}>()

const search = ref('')
const shown = computed(() => {
	const term = search.value.trim().toLowerCase()
	return props.types.filter((type) => !term || type.name.toLowerCase().includes(term))
})
</script>
