import { Chessground } from 'chessground';
import { Chess } from 'chess.js';
import { SQUARES } from 'chess.js';
import { Config as ChessgroundConfig } from 'chessground/config';
import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';

const chess = new Chess();
let ws: WebSocket;

function getValidMoves(_chess: Chess) {
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

function getColor(_chess: Chess) {
	return _chess.turn() === 'w' ? 'white' : 'black';
}

function afterMove(
	board: ChessgroundApi,
): (from: cg.Key, to: cg.Key, meta: cg.MoveMetadata) => void {
	return function (from: cg.Key, to: cg.Key, meta: cg.MoveMetadata): void {
		console.log('$$$ afterMove $$$\n');
		type move = { from: cg.Key; to: cg.Key };
		const move: move = { from, to };
		chess.move(move);
		const fen = chess.fen();
		console.log(chess.ascii());
		console.log({ move, meta, fen });
		board.set({
			fen: fen,
			turnColor: getColor(chess),
			movable: {
				color: getColor(chess),
				dests: getValidMoves(chess),
			},
		});

		if (ws) {
			ws.send(JSON.stringify({ move, fen }));
		}
	};
}

window.onload = function () {
	const initialConfig: ChessgroundConfig = {
		movable: {
			free: false,
			color: 'white',
			dests: getValidMoves(chess),
		},
	};
	const board: ChessgroundApi = Chessground(
		document.getElementById('board')!,
		initialConfig,
	);
	board.set({
		movable: {
			events: {
				after: afterMove(board),
			},
		},
	});

	const button = document.querySelector('#connect-button')!;
	button.addEventListener('click', function () {
		ws = new WebSocket('ws://10.0.0.73:8000/connect', []);
		ws.onopen = function (event) {
			console.log('Opened', { event });
			// TODO: eventually,
			// when another player joins, start countdown
			// once countdown finishes, allow action
			document.getElementById('board')!.style.pointerEvents = 'auto';
		};

		ws.onmessage = function (event) {
			console.log('OnMessage: ', event);
			try {
				const response = JSON.parse(event.data);
				if ('gameStarted' in response && 'color' in response) {
					console.log('game started...');
					if (response.gameStarted) {
						type response = {
							gameStarted: boolean;
							fen: string;
							color: 'white' | 'black';
						};
						const _response = response as response;
						// start countdown, set fen etc
						chess.load(_response.fen);
						board.set({
							// ...board.state,
							fen: _response.fen,
							turnColor: _response.color,
							orientation: _response.color,
							movable: {
								// ...board.state.movable,
								dests: getValidMoves(chess),
								color: _response.color,
								events: {
									after: afterMove(board),
								},
							},
						});
					}
				} else if ('fen' in response) {
					type response = {
						move: any;
						fen: string;
					};
					const _response = response as response;
					console.log('making move...');
					// console.log({ _response });
					chess.load(_response.fen);
					console.log(chess.ascii(), { fen: _response.fen });
					board.set({
						// ...board.state,
						fen: _response.fen,
						// turnColor: chess.,
						movable: {
							// ...board.state.movable,
							dests: getValidMoves(chess),
							// color: chess.,
							events: {
								after: afterMove(board),
							},
						},
					});
				}
			} catch (e) {
				console.error(e);
			}
		};
	});
};
