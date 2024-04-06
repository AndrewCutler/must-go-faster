import { Chessground } from 'chessground';
import { Config as ChessgroundConfig } from 'chessground/config';
import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';
import { GameStartedResponse, MoveResponse } from './models';

let ws: WebSocket;
let board: ChessgroundApi;

function afterMove(from: cg.Key, to: cg.Key, meta: cg.MoveMetadata): void {
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
}

function onGameStarted(response: GameStartedResponse): void {
	console.log('game started...', response);
	if (response.gameStarted) {
		const validMoves = new Map();
		for (const key in response.validMoves) {
			validMoves.set(key, response.validMoves[key]);
		}
		console.log(response, validMoves);
		// start countdown, set fen etc
		board.set({
			// ...board.state,
			fen: response.fen,
			turnColor: response.color,
			orientation: response.color,
			movable: {
				// ...board.state.movable,
				dests: validMoves,
				color: response.color,
				events: {
					after: afterMove,
				},
			},
		});
	}
}

function onMove(response: MoveResponse): void {
	type response = {
		move: any;
		fen: string;
	};
	console.log('making move...');
	console.log({ fen: response.fen });
	board.set({
		// ...board.state,
		fen: response.fen,
		// turnColor: chess.,
		movable: {
			// ...board.state.movable,
			// dests: getValidMoves(chess),
			// color: chess.,
			events: {
				after: afterMove,
			},
		},
	});
}

function joinGame(): void {
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
					onGameStarted(response);
				} else if ('fen' in response) {
					onMove(response);
				}
			} catch (e) {
				console.error(e);
			}
		};
	});
}

function initialize(): void {
	const initialConfig: ChessgroundConfig = {
		movable: {
			free: false,
			color: 'white',
		},
	};
	board = Chessground(document.getElementById('board')!, initialConfig);
	board.set({
		movable: {
			events: {
				after: afterMove,
			},
		},
	});
}

window.onload = function () {
	initialize();
	joinGame();
};
