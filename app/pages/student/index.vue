<template>
    <div />
</template>

<script setup lang="ts">
// Never rendered: /student is only a signpost (guests go to /login, students to their home).
definePageMeta({
    layout: false,
    middleware: 'home',
})
</script>
