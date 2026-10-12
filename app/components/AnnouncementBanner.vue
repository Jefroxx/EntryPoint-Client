<template>
	<!-- Notices from the administrator. Each can be dismissed; the browser remembers which, so a notice you closed
		 stays closed (a new one still shows). -->
	<section v-if="visible.length" aria-label="Announcements" class="space-y-2.5">
		<article v-for="a in visible" :key="a.uuid"
			class="flex items-start gap-3 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3.5">
			<span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-accent-600">
				<Icon name="i-tabler-speakerphone" class="h-[18px] w-[18px]" aria-hidden="true" />
			</span>
			<div class="min-w-0 flex-1">
				<h2 class="text-[14.5px] font-bold leading-snug text-stone-900">{{ a.title }}</h2>
				<p class="mt-0.5 whitespace-pre-line text-[13.5px] leading-snug text-stone-700">{{ a.body }}</p>
			</div>
			<button type="button" :aria-label="`Dismiss: ${a.title}`"
				class="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-white hover:text-stone-900"
				@click="dismiss(a.uuid)">
				<Icon name="i-tabler-x" class="h-4 w-4" />
			</button>
		</article>
	</section>
</template>

<script setup lang="ts">
import type { Announcement } from '~/services/announcementService'

const props = defineProps<{ items: Announcement[] }>()

const KEY = 'entrypoint-dismissed-announcements'
const dismissed = ref<string[]>([])

// Read after the page is in the browser (there is no storage on the server).
onMounted(() => {
	try { dismissed.value = JSON.parse(localStorage.getItem(KEY) ?? '[]') } catch { dismissed.value = [] }
})

const visible = computed(() => props.items.filter((a) => !dismissed.value.includes(a.uuid)))

function dismiss(uuid: string) {
	dismissed.value = [...dismissed.value, uuid].slice(-50)
	try { localStorage.setItem(KEY, JSON.stringify(dismissed.value)) } catch { /* private window: it simply comes back next time */ }
}
</script>
