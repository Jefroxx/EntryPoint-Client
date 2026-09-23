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
	// Both auth pages are on screen for a moment while the panel slides (see layouts/auth.vue).
	pageTransition: { name: 'auth-swap', mode: 'default' },
})

useHead({ title: 'Sign in' })
</script>
