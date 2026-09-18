<template>
    <main class="h-screen">
        <Login portal="librarian" />
    </main>
</template>

<script setup lang="ts">
import Login from '~/components/Login.vue'

definePageMeta({
    layout: false
})
</script>
