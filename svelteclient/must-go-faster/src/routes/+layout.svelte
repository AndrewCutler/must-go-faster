<script lang="ts">
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { theme } from '../store/theme.store';

	let { children } = $props();
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
	<ThemeToggle />
	{@render children()}
</div>
