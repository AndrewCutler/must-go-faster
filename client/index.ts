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
let timerInterval: number;
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

function showCountdown(): Promise<void> {
	return new Promise((resolve) => {
		const countdownDisplay = document.querySelector<HTMLDivElement>(
			'#countdown-container',
		)!;
		countdownDisplay.style.display = 'block';
		let countdownInterval: number;
		let i = 5;
		countdownInterval = window.setInterval(function () {
			if (i <= 0) {
				window.clearInterval(countdownInterval);
				countdownDisplay.style.display = 'none';
				resolve();
			} else {
				countdownDisplay.innerText = i.toString();
				i--;
			}
		}, 1000);
	});
}

async function onGameStarted(response: GameStartedResponse): Promise<void> {
	if (response.gameStarted) {
		gameId = response.gameId;
		playerColor = response.playerColor;
		timeLeft = countdown = 30;

		const gameMeta = document.querySelector<HTMLDivElement>('#game-meta')!;
		gameMeta.style.display = 'flex';
		const gameMetaIcon =
			document.querySelector<HTMLElement>('#game-meta .icon i');
		if (playerColor === 'black') {
			gameMetaIcon?.classList.add('is-black');
		} else {
			gameMetaIcon?.classList.remove('is-black');
		}
		const whoseMove = document.querySelector<HTMLDivElement>(
			'#game-meta #whose-move',
		)!;
		whoseMove.innerText = `${
			response.whosNext === 'white' ? 'White' : 'Black'
		} to play.`;
		const playerColorDiv = document.querySelector<HTMLDivElement>(
			'#game-meta #player-color',
		)!;
		playerColorDiv.innerText = `You play ${playerColor}.`;

		board.set({
			viewOnly: true,
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

		await showCountdown();

		setTimer();
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
	let gameStatus: GameStatus | 'lost' | 'won' = 'ongoing';
	if (response.isCheckmated) {
		gameStatus = response.isCheckmated === playerColor ? 'lost' : 'won';
		gameOver(gameStatus, 'checkmate');
		countdown = 0;
		return;
	}

	timeLeft = response.timeLeft;
	setTimer();

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
	gameOver(status, 'timeout');
}
//endregion

// region ui utils
function handleGameStarted(response: unknown): void {
	if (isGameStartedResponse(response)) {
		response as GameStartedResponse;
		console.log({ gameStartedResponse: response });
		const connectButton =
			document.querySelector<HTMLButtonElement>('#connect-button')!;
		connectButton.classList.remove('is-loading');
		const connectButtonContainer = document.querySelector<HTMLDivElement>(
			'#connect-button-container',
		)!;
		connectButtonContainer.style.display = 'none';

		onGameStarted(response);
	}
}

function handleMove(response: unknown): void {
	if (isMoveResponse(response)) {
		console.log({ moveResponse: response });
		onMove(response);
	}
}

function handleTimeout(response: any): void {
	if (isTimeoutResponse(response)) {
		console.log({ timeoutResponse: response });
		onTimeout(response);
	}
}
// endregion

// region ui
function joinGame(): void {
	const button = document.querySelector('#connect-button')!;
	button.addEventListener('click', function () {
		button.classList.add('is-loading');
		// todo: grab from config
		ws = new WebSocket('ws://10.0.0.73:8000/connect', []);
		ws.onopen = function (event) {
			document.getElementById('board')!.style.pointerEvents = 'auto';
		};

		ws.onmessage = function (event) {
			try {
				const response: unknown = JSON.parse(event.data);
				handleGameStarted(response);
				handleMove(response);
				handleTimeout(response);
			} catch (e) {
				console.error(e);
			}
		};
	});
}

function gameOver(
	gameStatus: Omit<GameStatus, 'ongoing' | 'draw'>,
	method: 'timeout' | 'checkmate' | 'resignation',
): void {
	// have to add draws
	const modal = document.querySelector<HTMLDivElement>('#game-status-modal')!;
	modal.style.display = 'block';
	const modalHeader =
		document.querySelector<HTMLDivElement>('#modal-header')!;
	modalHeader.innerText = `You ${gameStatus} via ${method}.`;
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

function setTimer(): void {
	// clear previous interval
	window.clearInterval(timerInterval);

	const timerDiv = document.querySelector<HTMLDivElement>('#timer')!;
	const start = new Date();
	timerInterval = window.setInterval(function () {
		if (countdown <= 0) {
			window.clearInterval(timerInterval);
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
