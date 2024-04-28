import { awaitGame, getConfig, initializeBoard } from './must-go-faster';

window.onload = function () {
	initializeBoard()
		.then(getConfig)
		.then(function (config) {
			awaitGame(config);
		})
		.catch(function (error: Error) {
			console.error('Initialization error: ', error);
		});
};
