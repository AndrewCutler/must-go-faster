import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Get initial theme from localStorage or default to 'light'
const getInitialTheme = (): 'light' | 'dark' => {
	if (browser) {
		const saved = localStorage.getItem('theme');
		if (saved === 'dark' || saved === 'light') {
			return saved;
		}
		// Check system preference
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}
	}
	return 'light';
};

export const theme = writable<'light' | 'dark'>(getInitialTheme());

// Subscribe to theme changes and update localStorage and document class
if (browser) {
	theme.subscribe((value) => {
		localStorage.setItem('theme', value);
		document.documentElement.classList.toggle('dark', value === 'dark');
	});
}

export function toggleTheme() {
	theme.update(current => current === 'light' ? 'dark' : 'light');
} 