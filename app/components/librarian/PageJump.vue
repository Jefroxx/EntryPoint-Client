<template>
	<!-- The middle of a pager: the current page as a box you can type in ("2 / 13"). Enter or leaving the box jumps there;
		 a number out of range is pulled back to the nearest real page, and anything else puts the old page back. -->
	<label class="flex items-center gap-1 text-[13.5px] font-semibold tabular-nums text-stone-700">
		<span class="sr-only">Go to page</span>
		<input v-model="draft" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" :aria-label="`Page ${page} of ${lastPage}. Type a page number`"
			class="h-8 rounded-lg border border-stone-200 bg-white text-center font-semibold text-stone-800 transition-colors duration-150 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-200"
			:style="{ width: `calc(${String(lastPage).length}ch + 1.4rem)` }"
			@focus="($event.target as HTMLInputElement).select()" @input="draft = draft.replace(/\D/g, '')"
			@keydown.enter.prevent="($event.target as HTMLInputElement).blur()" @keydown.esc.prevent="cancel" @blur="commit" />
		<span class="text-stone-500" aria-hidden="true">/ {{ lastPage }}</span>
	</label>
</template>

<script setup lang="ts">
const props = defineProps<{ page: number; lastPage: number }>()
const emit = defineEmits<{ (e: 'change', page: number): void }>()

const draft = ref(String(props.page))
watch(() => props.page, (page) => { draft.value = String(page) })

function cancel() {
	draft.value = String(props.page)
	;(document.activeElement as HTMLElement | null)?.blur()
}

function commit() {
	const typed = Number.parseInt(draft.value, 10)
	if (Number.isNaN(typed)) {
		draft.value = String(props.page)
		return
	}

	const target = Math.min(Math.max(typed, 1), props.lastPage)
	draft.value = String(target)
	if (target !== props.page) emit('change', target)
}
</script>
