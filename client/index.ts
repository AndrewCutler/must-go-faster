import { awaitGame, getConfig, initializeBoard } from './must-go-faster';

window.onload = function () {
	initializeBoard()
		.then(getConfig)
		.then(function ({ config, myClass }): void {
			console.log({ config, myClass });
			awaitGame(config, myClass);
		})
		.catch(function (error: Error) {
			console.error('Initialization error: ', error);
		});
};
