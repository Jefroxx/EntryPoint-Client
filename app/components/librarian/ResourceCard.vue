<template>
	<div
		class="row-fade-in flex flex-col gap-3.5 rounded-2xl border border-stone-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
		:style="{ animationDelay: `${index * 40}ms` }">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" :class="iconTone">
				<Icon :name="typeIcon" class="h-[18px] w-[18px]" />
			</div>
			<div class="min-w-0 flex-1">
				<p class="truncate text-[14px] font-bold text-stone-900">{{ resource.name }}</p>
				<p class="truncate text-[11.5px] text-stone-400">{{ resource.resourceType }}</p>
			</div>
			<LibrarianStatusPill :label="resource.status" :tone="statusTone" />

			<div class="relative" @click.stop>
				<ButtonsButton variant="icon" size="sm" aria-label="More actions" @click="menuOpen = !menuOpen">
					<Icon name="i-lucide-ellipsis-vertical" class="h-[15px] w-[15px]" />
				</ButtonsButton>
				<div class="absolute right-0 top-[calc(100%+6px)] z-30 min-w-[170px] origin-top-right rounded-xl border border-stone-200 bg-white p-1.5 shadow-lg transition-all duration-150"
					:class="menuOpen ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'">
					<button type="button" class="menu-item text-stone-700 hover:bg-stone-50" @click="pick('edit')">
						<Icon name="i-lucide-pencil" class="h-[14px] w-[14px] opacity-70" />Edit
					</button>
					<button type="button" class="menu-item text-stone-700 hover:bg-stone-50" :disabled="inUse" @click="pick('toggle')">
						<Icon name="i-lucide-power" class="h-[14px] w-[14px] opacity-70" />
						{{ resource.status === 'Unavailable' ? 'Make available' : 'Mark unavailable' }}
					</button>
					<button type="button" class="menu-item text-red-500 hover:bg-red-50" :disabled="inUse" @click="pick('delete')">
						<Icon name="i-lucide-trash-2" class="h-[14px] w-[14px] opacity-70" />Delete
					</button>
				</div>
			</div>
		</div>

		<div class="flex min-h-[38px] items-center justify-between gap-2 border-t border-stone-100 pt-3 text-[12px] text-stone-500">
			<template v-if="resource.status === 'In Use' && resource.active_usage">
				<div class="flex min-w-0 items-center gap-2">
					<LibrarianStudentAvatar :name="studentName" class="!h-6 !w-6 !text-[9px]" />
					<div class="min-w-0">
						<p class="truncate text-[12px] font-semibold text-stone-800">{{ studentName }}</p>
						<p class="font-data text-[11px] font-semibold text-amber-600">
							since {{ formatTime(resource.active_usage.startTime) }} · {{ formatDuration(resource.active_usage.startTime, null, nowMs) }}
						</p>
					</div>
				</div>
				<ButtonsButton variant="danger" size="sm" @click="emit('end', resource)">End session</ButtonsButton>
			</template>
			<template v-else-if="resource.status === 'Available'">
				<span>Ready for a student</span>
				<ButtonsButton variant="primary" size="sm" @click="emit('start', resource)">Start session</ButtonsButton>
			</template>
			<template v-else>
				<span>Marked unavailable</span>
				<ButtonsButton variant="ghost" size="sm" @click="emit('toggle', resource)">Make available</ButtonsButton>
			</template>
		</div>
	</div>
</template>

<script setup lang="ts">
import type { ResourceRecord } from '~/services/resourceService'

const props = defineProps<{
	resource: ResourceRecord
	index: number
	nowMs: number
}>()

const emit = defineEmits<{
	(e: 'start', resource: ResourceRecord): void
	(e: 'end', resource: ResourceRecord): void
	(e: 'edit', resource: ResourceRecord): void
	(e: 'toggle', resource: ResourceRecord): void
	(e: 'delete', resource: ResourceRecord): void
}>()

const menuOpen = ref(false)
const closeMenu = () => { menuOpen.value = false }
onMounted(() => window.addEventListener('click', closeMenu))
onUnmounted(() => window.removeEventListener('click', closeMenu))

const inUse = computed(() => props.resource.status === 'In Use')

function pick(action: 'edit' | 'toggle' | 'delete') {
	menuOpen.value = false
	if (action === 'edit') emit('edit', props.resource)
	else if (action === 'toggle') emit('toggle', props.resource)
	else emit('delete', props.resource)
}

const studentName = computed(() => personName(props.resource.active_usage?.student?.user))

const statusTone = computed(() => ({ Available: 'success', 'In Use': 'warning', Unavailable: 'neutral' } as const)[props.resource.status])

const iconTone = computed(() => ({
	Available: 'bg-emerald-100 text-emerald-600',
	'In Use': 'bg-amber-100 text-amber-600',
	Unavailable: 'bg-stone-100 text-stone-400',
}[props.resource.status]))

const typeIcon = computed(() => {
	const type = props.resource.resourceType.toLowerCase()
	if (type.includes('computer') || type.includes('pc')) return 'i-lucide-monitor'
	if (type.includes('room')) return 'i-lucide-door-open'
	if (type.includes('table') || type.includes('desk')) return 'i-lucide-users'
	return 'i-lucide-box'
})
</script>

<style scoped>
.menu-item {
	display: flex;
	width: 100%;
	align-items: center;
	gap: 0.5rem;
	border-radius: 0.5rem;
	padding: 0.5rem 0.625rem;
	text-align: left;
	font-size: 13px;
	transition: background-color 150ms;
}

.menu-item:disabled {
	cursor: not-allowed;
	opacity: 0.4;
}
</style>
