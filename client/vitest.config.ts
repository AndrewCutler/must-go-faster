/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
*/

import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'jsdom',
		globals: false,
		restoreMocks: true,
		clearMocks: true,
		include: ['**/*.test.ts'],
	},
});
