/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
 */

export const STARTUP_PING_TIMEOUT_MS = 10_000;

export async function pingBackend(
	apiBaseUrl: string,
	timeoutMs = STARTUP_PING_TIMEOUT_MS,
): Promise<boolean> {
	const controller = new AbortController();
	const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

	try {
		const response = await fetch(`${apiBaseUrl}/ping`, {
			signal: controller.signal,
		});
		return response.ok;
	} finally {
		window.clearTimeout(timeout);
	}
}
