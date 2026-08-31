/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
*/

import { MustGoFaster } from './must-go-faster';
import { PlayerTypeElement } from './dom';
import { GAME_CLOCK_DURATION } from './constants';


window.onload = function () {
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
};
