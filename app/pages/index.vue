<template>
    <div />
</template>

<script setup lang="ts">
// Never rendered: the middleware redirects to /login or the user's home.
definePageMeta({
    layout: false,
    middleware: 'home',
})
</script>
