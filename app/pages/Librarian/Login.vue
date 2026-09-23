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
	pageTransition: { name: 'auth-swap', mode: 'default' },
})

useHead({ title: 'Librarian sign-in' })
</script>
