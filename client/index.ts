import { Chessground } from 'chessground';
import { SQUARES } from 'chess.js';
import { Config as ChessgroundConfig } from 'chessground/config';
import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';

let ws: WebSocket;
function getValidMoves(x: any) {
	const dests = new Map();
	SQUARES.forEach((s) => {
		// const moves = _chess.moves({ square: s, verbose: true });
		// if (moves.length)
		// 	dests.set(
		// 		s,
		// 		moves.map((m) => m.to),
		// 	);
	});

	return dests;
}

function afterMove(
	board: ChessgroundApi,
): (from: cg.Key, to: cg.Key, meta: cg.MoveMetadata) => void {
	return function (from: cg.Key, to: cg.Key, meta: cg.MoveMetadata): void {
		console.log('$$$ afterMove $$$\n');
		type move = { from: cg.Key; to: cg.Key };
		const move: move = { from, to };
		// board.set({
		// 	fen: fen,
		// 	turnColor: getColor(chess),
		// 	movable: {
		// 		color: getColor(chess),
		// 		dests: getValidMoves(chess),
		// 	},
		// });

		// send gameId too
		if (ws) {
			ws.send(JSON.stringify({ move }));
		}
	};
}

window.onload = function () {
	const initialConfig: ChessgroundConfig = {
		movable: {
			free: false,
			color: 'white',
			// dests: getValidMoves(chess),
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
					console.log('game started...', response);
					if (response.gameStarted) {
						type response = {
							gameStarted: boolean;
							fen: string;
							color: 'white' | 'black';
							validMoves: cg.Dests;
						};
						const _response = response as response;
						let validMoves;
						try {
							validMoves = JSON.parse(response.validMoves);
							console.log(validMoves);
						} catch (e) {
							console.error(e);
						}
						// start countdown, set fen etc
						board.set({
							// ...board.state,
							fen: _response.fen,
							turnColor: _response.color,
							orientation: _response.color,
							movable: {
								// ...board.state.movable,
								dests: validMoves,
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
					console.log({ fen: _response.fen });
					board.set({
						// ...board.state,
						fen: _response.fen,
						// turnColor: chess.,
						movable: {
							// ...board.state.movable,
							// dests: getValidMoves(chess),
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
