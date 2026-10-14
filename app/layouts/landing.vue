<template>
	<div>
		<!-- The public landing page has no frame of its own. This layout exists so that moving between it and the
			 sign-in pages (the auth layout) can fade, which Nuxt only does between two real layouts. -->
		<slot />
	</div>
</template>
