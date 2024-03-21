import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { SQUARES } from 'chess.js';

const chess = new Chess();

function getValidMoves(_chess) {
	const dests = new Map();
	SQUARES.forEach((s) => {
		const moves = _chess.moves({ square: s, verbose: true });
		if (moves.length)
			dests.set(
				s,
				moves.map((m) => m.to),
			);
	});

	return dests;
}

function getColor(_chess) {
	console.log(_chess.turn());
	return _chess.turn() === 'w' ? 'white' : 'black';
}

function afterMove(board) {
	return function (from, to, meta) {
		console.log({ from, to, meta });
		chess.move({ from, to });
		board.set({
			turnColor: getColor(chess),
			movable: {
				color: getColor(chess),
				dests: getValidMoves(chess),
			},
		});
	};
}

function connectToWS() {
	fetch('ws://10.0.0.73:8000/connect').then().catch();
	const button = document.querySelector('#connect-button');
	console.log({ button });
	button.addEventListener('click', function () {
		ws = new WebSocket('ws://10.0.0.73:8000/connect', []);
		ws.send('testing send...');
	});
}

window.onload = function () {
	const initialConfig = {
		movable: {
			free: false,
			color: 'white',
			dests: getValidMoves(chess),
		},
	};
	const board = Chessground(document.querySelector('#board'), initialConfig);
	board.set({
		movable: {
			events: {
				after: afterMove(board),
			},
		},
	});

	connectToWS();
};
