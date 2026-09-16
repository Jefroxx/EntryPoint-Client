<template>
    <UPopover>
        <UButton color="neutral" variant="outline" class="rounded-full" icon="i-lucide-calendar"
            trailing-icon="i-lucide-chevron-down">
            {{ formattedDate }}
        </UButton>

        <template #content>
            <UCalendar v-model="selectedDate" class="p-2" />
        </template>
    </UPopover>
</template>

<script setup lang="ts">
import { CalendarDate, getLocalTimeZone, today } from '@internationalized/date'

// Always initializes from the real system date — not hardcoded.
const selectedDate = ref(today(getLocalTimeZone()))

const formattedDate = computed(() => {
    const jsDate = selectedDate.value.toDate(getLocalTimeZone())

    const datePart = new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(jsDate)

    const weekday = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
    }).format(jsDate)

    return `${datePart} (${weekday})`
})

console.log('DatePickerButton mounted, current system date:', formattedDate.value)
</script>