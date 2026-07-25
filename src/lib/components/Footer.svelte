<script lang="ts">
	import { m } from '$lib/i18n/paraglide.js';

	import { page } from '$app/state';
</script>

<footer class="shell-colophon mb-[var(--bottom-nav-reserved-space)] md:mb-0">
	<span>{m.footer_tagline()}</span>
	<span class="shell-colophon-links">
		<a href="/{page.data.lang}/about" class="touch-target">{m.footer_about()}</a>
		<a href="/{page.data.lang}/explore/series" class="touch-target">{m.footer_all_series()}</a>
		<a href="/{page.data.lang}/explore/artists" class="touch-target">{m.nav_artists()}</a>
		<a href="/{page.data.lang}/explore/ships" class="touch-target">{m.nav_ships()}</a>
	</span>
</footer>
