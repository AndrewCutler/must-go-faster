import { Chessground } from 'chessground';
import { Config as ChessgroundConfig } from 'chessground/config';
import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';
import { BaseResponse, GameStartedResponse, MoveResponse } from './models';

let ws: WebSocket;
let board: ChessgroundApi;
let gameId: string;

function afterMove(from: cg.Key, to: cg.Key, meta: cg.MoveMetadata): void {
	console.log('$$$ afterMove $$$\n');
	const move: { from: cg.Key; to: cg.Key } = { from, to };
	if (ws) {
		const message = { move, gameId };
		ws.send(JSON.stringify(message));
	}
}

function toValidMoves(moves: { [key: string]: string[] }): cg.Dests {
	const validMoves = new Map();
	for (const [key, value] of Object.entries(moves)) {
		validMoves.set(key, value);
	}
	// for (const key in moves) {
	// 	validMoves.set(key, moves[key]);
	// }

	return validMoves;
}

function onGameStarted(response: GameStartedResponse): void {
	console.log('game started...', response);
	if (response.gameStarted) {
		gameId = response.gameId;
		// todo: start countdown, set fen etc
		board.set({
			viewOnly: response.whosNext !== response.playerColor,
			fen: response.fen,
			turnColor: response.whosNext,
			orientation: response.playerColor,
			movable: {
				dests: toValidMoves(response.validMoves),
				color: response.playerColor,
				events: {
					after: afterMove,
				},
			},
		});
	}
}

function onMove(response: MoveResponse): void {
	console.log('making move...');
	console.log({ fen: response.fen });
	board.set({
		viewOnly: response.whosNext !== response.playerColor,
		fen: response.fen,
		turnColor: response.whosNext,
		orientation: response.playerColor,
		movable: {
			dests: toValidMoves(response.validMoves),
			color: response.whosNext,
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
			console.log('OnMessage: ', event.data);
			try {
				const response: BaseResponse = JSON.parse(event.data);
				if ('gameStarted' in response && 'playerColor' in response) {
					onGameStarted(response as GameStartedResponse);
				} else if ('fen' in response) {
					onMove(response as MoveResponse);
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
