import { Chessground } from 'chessground';
import { Config as ChessgroundConfig } from 'chessground/config';
import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';
import {
	MoveResponse,
	GameStartedResponse,
	GameStatus,
	MoveRequest,
	PlayerColor,
	TimeoutRequest,
	isGameStartedResponse,
	isMoveResponse,
	isTimeoutResponse,
	TimeoutResponse,
} from './models';

let ws: WebSocket;
let board: ChessgroundApi;
let gameId: string;
let timeLeft: number;
let countdown: number;
let interval: number;
let playerColor: PlayerColor;

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
		const message: MoveRequest = { move, gameId };
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
	if (response.gameStarted) {
		gameId = response.gameId;
		playerColor = response.playerColor;
		timeLeft = countdown = 30;
		// todo: start countdown, set fen etc
		showTime();
		board.set({
			viewOnly: response.whosNext !== playerColor,
			fen: response.fen,
			turnColor: response.whosNext,
			orientation: playerColor,
			movable: {
				dests: toValidMoves(response.validMoves),
				color: playerColor,
				events: {
					after: afterMove,
				},
			},
		});
	}
}

function onMove(response: MoveResponse): void {
	console.log('making move...');
	console.log(response);
	let gameStatus: GameStatus | 'lost' | 'won' = 'ongoing';
	if (response.isCheckmated) {
		gameStatus = response.isCheckmated === playerColor ? 'lost' : 'won';
		gameOver(gameStatus);
		countdown = 0;
		return;
	}

	timeLeft = response.timeLeft;
	showTime();

	board.set({
		viewOnly: response.whosNext !== playerColor,
		fen: response.fen,
		turnColor: response.whosNext,
		orientation: playerColor,
		movable: {
			dests: toValidMoves(response.validMoves),
			color: response.whosNext,
			events: {
				after: afterMove,
			},
		},
	});
}

function onTimeout(response: TimeoutResponse): void {
	let status: GameStatus = 'won';
	if (response.loser === playerColor) {
		status = 'lost';
	}
	gameOver(status);
}
//endregion

// region ui utils
function handleGameStarted(response: any): void {
	if (isGameStartedResponse(response)) {
		onGameStarted(response as GameStartedResponse);
	}
}

function handleMove(response: any): void {
	if (isMoveResponse(response)) {
		onMove(response);
	}
}

function handleTimeout(response: any): void {
	if (isTimeoutResponse(response)) {
		console.log('is timeout response', response);
		onTimeout(response);
	}
}
// endregion

// region ui
function joinGame(): void {
	const button = document.querySelector('#connect-button')!;
	button.addEventListener('click', function () {
		ws = new WebSocket('ws://10.0.0.73:8000/connect', []);
		ws.onopen = function (event) {
			// TODO: eventually,
			// when another player joins, start countdown
			// once countdown finishes, allow action
			document.getElementById('board')!.style.pointerEvents = 'auto';
		};

		ws.onmessage = function (event) {
			try {
				const response: any = JSON.parse(event.data);
				console.log(response);
				handleGameStarted(response);
				handleMove(response);
				handleTimeout(response);
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

function sendTimeoutMessage() {
	// send message to server to end game/find out the outcome
	if (ws) {
		const timeout: TimeoutRequest = {
			gameId,
			playerColor,
			timeout: true,
		};
		ws.send(JSON.stringify(timeout));
	} else {
		console.error('ws is undefined.');
	}
}

function showTime(): void {
	// clear previous interval
	window.clearInterval(interval);

	const timerDiv = document.querySelector<HTMLDivElement>('#timer')!;
	const start = new Date();
	interval = window.setInterval(function () {
		if (countdown <= 0) {
			window.clearInterval(interval);
			sendTimeoutMessage();
			return;
		}
		const diff = new Date().getTime() - start.getTime();
		countdown = timeLeft - diff / 1_000;

		timerDiv.innerHTML =
			'<div>' + (countdown > 0 ? countdown : 0).toFixed(1) + 's</div>';
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
