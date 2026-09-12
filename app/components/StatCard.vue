<template>
  <div class="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
    <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" :class="iconBgClass">
      <Icon :name="icon" class="h-6 w-6 text-white" />
    </div>

    <div class="min-w-0">
      <p class="text-sm font-medium text-gray-500">{{ title }}</p>
      <p class="mt-1 text-2xl font-bold text-gray-900">{{ value }}</p>

      <p v-if="trendLabel" class="mt-1 flex items-center gap-1 text-xs font-medium" :class="trendColorClass">
        <Icon :name="trendDirection === 'down' ? 'i-lucide-arrow-down' : 'i-lucide-arrow-up'" class="h-3 w-3" />
        {{ trendLabel }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
type StatCardColor = 'brown' | 'gold' | 'red' | 'green'

const props = withDefaults(defineProps<{
  title: string
  value: string | number
  icon: string
  color?: StatCardColor
  trendLabel?: string
  trendDirection?: 'up' | 'down'
  trendVariant?: 'positive' | 'negative'
}>(), {
  color: 'brown',
  trendDirection: 'up',
  trendVariant: 'positive',
})

const colorMap: Record<StatCardColor, string> = {
  brown: 'bg-amber-950',
  gold: 'bg-amber-600',
  red: 'bg-red-800',
  green: 'bg-emerald-700',
}

const iconBgClass = computed(() => colorMap[props.color])
const trendColorClass = computed(() =>
  props.trendVariant === 'negative' ? 'text-red-600' : 'text-emerald-600'
)
</script>
