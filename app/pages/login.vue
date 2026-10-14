<template>
	<section class="auth-pane" data-side="left">
		<Login />
	</section>
</template>

<script setup lang="ts">
import Login from '~/components/Login.vue'

definePageMeta({
	layout: 'auth',
	middleware: 'guest',
	// Fades to and from the landing page (the only layout change these pages see).
	layoutTransition: { name: 'soft-fade', mode: 'out-in' },
	// Both auth pages are on screen for a moment while the panel slides (see layouts/auth.vue).
	pageTransition: { name: 'auth-swap', mode: 'default' },
})

useHead({ title: 'Sign in' })
</script>
