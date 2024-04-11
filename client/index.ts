import { Chessground } from 'chessground';
import { Config as ChessgroundConfig } from 'chessground/config';
import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';
import {
	BaseResponse,
	GameStartedResponse,
	GameStatus,
	Timer,
	isGameStartedResponse,
} from './models';

let ws: WebSocket;
let board: ChessgroundApi;
let gameId: string;
// let timer: Timer;
let timeLeft: number;
let interval: number;

// todo: stop using regions
// region chess utils
function checkIsPromotion(to: cg.Key): cg.Key {
	const movedPiece = board.state.pieces.get(to);
	// any pawn move ending in 1 or 8, i.e. last rank
	if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
		to += 'q';
	}

	return to;
}

function afterMove(from: cg.Key, to: cg.Key, meta: cg.MoveMetadata): void {
	// handle promotion here; autopromote to queen for now
	to = checkIsPromotion(to);

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
		// timer = new Timer(30.0); // '30.0s';
        timeLeft = 30;
		// todo: start countdown, set fen etc
		showTime();
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

function onMove(response: BaseResponse): void {
	console.log('making move...');
	console.log(response);
	let gameStatus: GameStatus | 'lost' | 'won' = 'ongoing';
	if (response.isCheckmated) {
		gameStatus =
			response.isCheckmated === response.playerColor ? 'lost' : 'won';
		gameOver(gameStatus);
	}
	// timer.timeLeft = response.timeLeft;
	timeLeft = response.timeLeft;
	console.log({ timeLeft });
	window.clearInterval(interval);
	showTime();
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
//endregion

// region ui
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

function gameOver(gameStatus: Omit<GameStatus, 'ongoing' | 'draw'>): void {
	// let's render a modal
	const modal = document.querySelector<HTMLDivElement>('#game-status-modal')!;
	modal.style.display = 'block';
	const modalHeader =
		document.querySelector<HTMLDivElement>('#modal-header')!;
	modalHeader.innerHTML = `<div style="display: flex; align-items: center; font-color: white;">You ${gameStatus}!</div>`;
	const modalContent =
		document.querySelector<HTMLDivElement>('#modal-content')!;
	modalContent.innerHTML = 'Try again?';
}

function showTime(): void {
	const timerDiv = document.querySelector<HTMLDivElement>('#timer')!;
	const start = new Date();
	interval = window.setInterval(function () {
		const diff = new Date().getTime() - start.getTime();
		if (diff >= 30 * 1000) {
			window.clearInterval(interval);
			return;
		}
        const countdown = (timeLeft - (diff / 1_000)).toFixed(1);

		timerDiv.innerHTML = '<div>' + countdown + 's</div>';
	}, 10);
}

//endregion

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
