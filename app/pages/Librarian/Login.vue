<template>
    <main class="min-h-screen">
        <Login portal="librarian" />
    </main>
</template>

<script setup lang="ts">
import Login from '~/components/Login.vue'

definePageMeta({
    layout: false,
    middleware: 'guest',
})

useHead({ title: 'Librarian sign in · EntryPoint' })
</script>
