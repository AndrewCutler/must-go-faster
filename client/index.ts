import { Chessground } from 'chessground';
import { Config as ChessgroundConfig } from 'chessground/config';
import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';
import {
	BaseResponse,
	GameStartedResponse,
	GameStatus,
	isGameStartedResponse,
} from './models';

let ws: WebSocket;
let board: ChessgroundApi;
let gameId: string;

function afterMove(from: cg.Key, to: cg.Key, meta: cg.MoveMetadata): void {
	console.log('$$$ afterMove $$$\n');
	const movedPiece = board.state.pieces.get(to);

	// handle promotion here; autopromote to queen for now
	console.log(movedPiece, to);
	if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
		console.log('PROMOTE');
		to += 'q';
	}

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

function gameOver(gameStatus: Omit<GameStatus, 'ongoing'>): void {
	// let's render a modal
	const modal = document.querySelector<HTMLDivElement>('#game-status-modal')!;
	modal.style.display = 'block';
	modal.innerHTML = `You ${gameStatus}!`;
}

function onMove(response: BaseResponse): void {
	console.log('making move...');
	console.log(response);
	let gameStatus: GameStatus | 'lost' | 'won' = 'ongoing';
	if (response.isCheckmated) {
		gameStatus =
			response.isCheckmated === response.playerColor ? 'lost' : 'won';
		gameOver(gameStatus);
	}
	console.log({ gameStatus });
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
			try {
				const response: BaseResponse = JSON.parse(event.data);
				if (isGameStartedResponse(response)) {
					onGameStarted(response as GameStartedResponse);
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
