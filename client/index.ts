/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
 */

import { MustGoFaster } from './must-go-faster';
import { PlayerTypeElement } from './dom';
import { GAME_CLOCK_DURATION } from './constants';
import { pingBackend } from './startup';

function initializeApplication(): void {
	document.querySelector('#white-clock')!.textContent =
		GAME_CLOCK_DURATION.toString();
	document.querySelector('#black-clock')!.textContent =
		GAME_CLOCK_DURATION.toString();

	try {
		const mustGoFaster = new MustGoFaster();
		document
			.querySelector('#cancel-button')!
			.addEventListener('click', function () {
				mustGoFaster.cancelPendingGame();
			});

		const playerTypeButton = new PlayerTypeElement();
		playerTypeButton.element!.addEventListener(
			'click',
			function ({ target }) {
				switch ((target as HTMLElement)?.id) {
					case 'player-type-computer':
						playerTypeButton.setSelection('computer');
						mustGoFaster.setOpponentType('computer');
						break;
					case 'player-type-human':
						playerTypeButton.setSelection('human');
						mustGoFaster.setOpponentType('human');
						break;
					default:
						break;
				}
			},
		);
	} catch (error) {
		console.error('Failed to initialize: ', error);
	}
}

export async function startApplication(): Promise<void> {
	const startupState = document.querySelector<HTMLElement>('#startup-state')!;
	const spinner = document.querySelector<HTMLElement>('#startup-spinner')!;
	const error = document.querySelector<HTMLElement>('#startup-error')!;
	const appShell = document.querySelector<HTMLElement>('#app-shell')!;

	try {
		const isBackendReady = await pingBackend(process.env.API_BASE_URL!);
		if (!isBackendReady) {
			throw new Error('Backend ping returned a non-2xx response.');
		}

		startupState.hidden = true;
		appShell.hidden = false;
		initializeApplication();
	} catch (startupFailure) {
		console.error('Backend startup ping failed: ', startupFailure);
		spinner.hidden = true;
		error.hidden = false;
	}
}

window.onload = function () {
	void startApplication();
};
