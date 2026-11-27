<template>
	<NotificationCenter side="student" class="st-in" />
</template>

<script setup lang="ts">
// The same Notifications page staff have (components/NotificationCenter.vue); only the notices and links differ.
// (Said here, not as a template comment: a comment beside the component would be a second root node, and Nuxt can't
// leave a page like that, so the next page would stay blank.)
// `centered`: this page sits in the middle of the screen (the others start at the left edge).
definePageMeta({ layout: 'student', middleware: 'student', title: 'Notifications', nav: 'home', tab: 'me', back: '/student/me', centered: true })
useHead({ title: 'Notifications' })
</script>
