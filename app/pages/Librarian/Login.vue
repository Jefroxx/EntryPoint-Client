<template>
	<section class="auth-pane" data-side="left">
		<Login portal="librarian" />
	</section>
</template>

<script setup lang="ts">
import Login from '~/components/Login.vue'

definePageMeta({
	layout: 'auth',
	middleware: 'guest',
	// Fades to and from the landing page (the only layout change these pages see).
	layoutTransition: { name: 'soft-fade', mode: 'out-in' },
	pageTransition: { name: 'auth-swap', mode: 'default' },
})

useHead({ title: 'Librarian sign-in' })
</script>
