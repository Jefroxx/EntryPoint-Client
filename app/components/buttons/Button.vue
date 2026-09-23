<template>
	<button type="button"
		class="inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-[transform,background-color,color,border-color] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-40"
		:class="[sizeClasses, variantClasses]" :disabled="disabled" v-bind="$attrs">
		<slot />
	</button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
	variant?: 'primary' | 'ghost' | 'danger' | 'icon'
	size?: 'sm' | 'md'
	disabled?: boolean
}>(), {
	variant: 'primary',
	size: 'md',
	disabled: false,
})

defineOptions({ inheritAttrs: false })

const variantMap = {
	primary: 'border border-accent-500 bg-accent-500 text-white shadow-sm hover:bg-accent-600 hover:border-accent-600 active:scale-95',
	ghost: 'border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 active:scale-95',
	danger: 'border-[1.5px] border-red-200 bg-white text-red-600 hover:bg-red-50 active:scale-95',
	icon: 'text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:scale-90',
}

const sizeMap = {
	sm: props.variant === 'icon' ? 'h-9 w-9 text-[13.5px]' : 'h-9 px-3.5 text-[13.5px]',
	md: props.variant === 'icon' ? 'h-10 w-10 text-sm' : 'h-[42px] px-4 text-[14px]',
}

const variantClasses = computed(() => variantMap[props.variant])
const sizeClasses = computed(() => sizeMap[props.size])
</script>
