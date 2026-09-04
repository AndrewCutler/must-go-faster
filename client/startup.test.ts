/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pingBackend } from './startup';

describe('pingBackend', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
	});

	it('accepts a 2xx response', async () => {
		vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true })));

		await expect(pingBackend('http://example.test')).resolves.toBe(true);
		expect(fetch).toHaveBeenCalledWith('http://example.test/ping', {
			signal: expect.any(AbortSignal),
		});
	});

	it('rejects a non-2xx response', async () => {
		vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false })));

		await expect(pingBackend('http://example.test')).resolves.toBe(false);
	});

	it('propagates network failures', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(() => Promise.reject(new Error('network failure'))),
		);

		await expect(pingBackend('http://example.test')).rejects.toThrow(
			'network failure',
		);
	});

	it('aborts requests that exceed the timeout', async () => {
		const fetchMock = vi.fn(
			(_url: string, options: { signal: AbortSignal }) =>
				new Promise((_resolve, reject) => {
					options.signal.addEventListener('abort', () =>
						reject(new DOMException('The operation was aborted.', 'AbortError')),
					);
				}),
		);
		vi.stubGlobal('fetch', fetchMock);

		const ping = pingBackend('http://example.test', 1000);
		const rejectedPing = expect(ping).rejects.toThrow('aborted');
		await vi.advanceTimersByTimeAsync(1000);

		await rejectedPing;
	});
});
