import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { SQUARES } from 'chess.js';

const chess = new Chess();
let ws;

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
	return _chess.turn() === 'w' ? 'white' : 'black';
}

function afterMove(board) {
	return function (from, to, meta) {
		console.log({ from, to, meta });
		if (ws) {
			ws.send(JSON.stringify({ from, to }));
		}
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
	const board = Chessground(document.getElementById('board'), initialConfig);
	board.set({
		movable: {
			events: {
				after: afterMove(board),
			},
		},
	});

	const button = document.querySelector('#connect-button');
	button.addEventListener('click', function () {
		ws = new WebSocket('ws://10.0.0.73:8000/connect', []);
		ws.onopen = function (event) {
			console.log('Opened', { event });
			// TODO: eventually,
			// when another player joins, start countdown
			// once countdown finishes, allow action
			document.getElementById('board').style.pointerEvents = 'auto';
		};

		ws.onmessage = function (event) {
			console.log('OnMessage: ', event);
			try {
				const response = JSON.parse(event.data);
				if ('fen' in response) {
					console.log({ response });
					console.log(chess.ascii());
					// only call this when other player moves?
					// chess.move(response.move);
					chess.fen(response.fen);
				} else if ('gameStarted' in response) {
                    if (response.gameStarted) {
                        // start countdown, set fen etc
                    }
                }
			} catch (e) {
				console.error(e);
			}
		};
	});
};
