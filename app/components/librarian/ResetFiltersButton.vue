<template>
	<ButtonsButton variant="ghost" v-bind="$attrs">
		<Icon name="i-tabler-rotate" class="h-3.5 w-3.5" />Reset
	</ButtonsButton>
</template>

<script setup lang="ts">
// Always shown at the right of a table toolbar, just before any Add button, so the toolbar never shifts.
defineOptions({ inheritAttrs: false })
</script>
