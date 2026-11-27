<template>
    <div>
        <!-- The same Notifications page students have (components/NotificationCenter.vue); only the notices and links differ. -->
        <NotificationCenter side="staff" />
        <AlertToast />
    </div>
</template>

<script setup lang="ts">
import AlertToast from '~/api/alert/AlertToast.vue'

definePageMeta({
    middleware: 'librarian',
    layout: 'librarian',
})

useHead({ title: 'Notifications' })
</script>
