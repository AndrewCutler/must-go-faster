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
};
