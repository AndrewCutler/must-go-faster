import { MustGoFaster } from './must-go-faster';
import { ConnectButtonElement, PlayerTypeElement } from './dom';

window.onload = function () {
	try {
		const mustGoFaster = new MustGoFaster();
		const connectButton = new ConnectButtonElement();
		connectButton.element!.addEventListener('click', function () {
			connectButton.waitForOpponent();
			mustGoFaster.connect();
		});

		const playerTypeButton = new PlayerTypeElement();
		playerTypeButton.element!.addEventListener(
			'click',
			function ({ target }) {
				playerTypeButton.toggleActive();

				switch ((target as any)?.id) {
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
