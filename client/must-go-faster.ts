import './index.css';
import { Chessground } from 'chessground';
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
	isAbandonedResponse,
	Config,
	ChessgroundConfig,
	PremoveRequest,
	Move,
} from './models';

let ws: WebSocket;
let board: ChessgroundApi;
let gameId: string;
let timeLeft: number;
let countdown: number;
let timerInterval: number;
let playerColor: PlayerColor;
let config: Config;

function checkIsPromotion(to: cg.Key): cg.Key {
	const movedPiece = board.state.pieces.get(to);
	// any pawn move ending in 1 or 8, i.e. last rank
	if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
		to += 'q';
	}

	return to;
}

function afterClientMove(
	from: cg.Key,
	to: cg.Key,
	meta: cg.MoveMetadata,
): void {
	// handle promotion here; autopromote to queen for now
	to = checkIsPromotion(to);
	// premove is set here
	board.move(from, to);

	const move: { from: cg.Key; to: cg.Key } = { from, to };
	if (ws) {
		const message: MoveRequest = { move, gameId, type: 'move' };
		ws.send(JSON.stringify(message));
	}
	console.log({ state: board.state });
	board.set({
		turnColor: playerColor === 'white' ? 'black' : 'white',
		movable: {
			color: playerColor,
		},
		premovable: {
			enabled: true,
		},
	});
}

function toValidMoves(moves: { [key: string]: string[] }): cg.Dests {
	const validMoves = new Map();
	for (const [key, value] of Object.entries(moves)) {
		validMoves.set(key, value);
	}

	return validMoves;
}

function showCountdownToStartGame(): Promise<void> {
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

async function handleGameStartedResponse(
	response: GameStartedResponse,
): Promise<void> {
	if (response.gameStarted) {
		gameId = response.gameId;
		playerColor = response.playerColor;
		timeLeft = countdown = config.startingTime;

		const gameMeta = document.querySelector<HTMLDivElement>('#game-meta')!;
		gameMeta.style.visibility = 'inherit';
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
			},
			premovable: {
				enabled: true,
				showDests: true,
			},
			draggable: {
				enabled: true,
			},
		} as ChessgroundConfig);

		await showCountdownToStartGame();

		console.log(board.state);
		setTimer();
		board.set({
			viewOnly: false,
		});
	}
}

function handleMoveResponse(response: MoveResponse): void {
	let gameStatus: GameStatus | 'lost' | 'won' = 'ongoing';
	if (response.isCheckmated) {
		gameStatus = response.isCheckmated === playerColor ? 'lost' : 'won';
		gameOver(gameStatus, 'checkmate');
		countdown = 0;
		return;
	}

	timeLeft = response.timeLeft;
	setTimer();
	if (board.state.premovable.current) {
		// send premove message which checks if premove is valid
		// if so, play response on server and send updated fen
		const [from, to] = board.state.premovable.current;
		sendPremoveMessage({ from, to });
		board.playPremove();
	}

	board.set({
		fen: response.fen,
		turnColor: response.whosNext,
		movable: {
			dests: toValidMoves(response.validMoves),
		},
	});
}

function handleTimeoutResponse(response: TimeoutResponse): void {
	let status: GameStatus = 'won';
	if (response.loser === playerColor) {
		status = 'lost';
	}
	gameOver(status, 'timeout');
}

function handleAbandonedResponse(): void {
	console.log('handle abandoned');
	let status: GameStatus = 'won';
	gameOver(status, 'abandonment');
	if (ws) {
		ws.close();
	}
}
//endregion

function handleResponse(response: unknown): void {
	if (isGameStartedResponse(response)) {
		console.log({ gameStartedResponse: response });

		const connectButton =
			document.querySelector<HTMLButtonElement>('#connect-button')!;
		connectButton.classList.remove('is-loading');
		const connectButtonContainer = document.querySelector<HTMLDivElement>(
			'#connect-button-container',
		)!;
		connectButtonContainer.style.display = 'none';

		handleGameStartedResponse(response);
	}

	if (isMoveResponse(response)) {
		console.log({ moveResponse: response });
		handleMoveResponse(response);
	}

	if (isTimeoutResponse(response)) {
		console.log({ timeoutResponse: response });
		handleTimeoutResponse(response);
	}

	if (isAbandonedResponse(response)) {
		console.log({ abandonedResponse: response });
		handleAbandonedResponse();
	}
}

export function awaitGame(c: Config): void {
	config = c;
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
				handleResponse(response);
			} catch (e) {
				console.error(e);
			}
		};
	});
}

function gameOver(
	gameStatus: Omit<GameStatus, 'ongoing' | 'draw'>,
	method: 'timeout' | 'checkmate' | 'resignation' | 'abandonment',
): void {
	// have to add draws
	const modal = document.querySelector<HTMLDivElement>('#game-status-modal')!;
	modal.style.display = 'block';
	const modalHeader =
		document.querySelector<HTMLDivElement>('#modal-header')!;
	modalHeader.innerText = `You ${gameStatus} via ${method}.`;
}

function sendTimeoutMessage(): void {
	// send message to server to end game/find out the outcome
	if (ws) {
		const timeout: TimeoutRequest = {
			type: 'timeout',
			gameId,
			playerColor,
			timeout: true,
		};
		ws.send(JSON.stringify(timeout));
	}
}

function sendPremoveMessage(p: Move): void {
	if (ws) {
		const premove: PremoveRequest = {
			type: 'premove',
			gameId,
			premove: p,
		};
		ws.send(JSON.stringify(premove));
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

function initializeTestBoard(initialConfig: ChessgroundConfig): void {
	const testBoardDiv = document.getElementById('test-board')!;
	testBoardDiv.style.display = 'block';
	const testBoard = Chessground(testBoardDiv, initialConfig);
	testBoard.set({
		viewOnly: false,
		movable: {
			events: {
				after: afterClientMove,
			},
		},
		premovable: {
			enabled: true,
			showDests: true,
			events: {
				set: function (o, d, meta) {
					console.log('initializeBoard.premovable.set:', {
						o,
						d,
						meta,
					});
				},
			},
		},
		predroppable: {
			enabled: true,
			events: {
				set: function (role, key) {
					console.log('initializeBoard.predroppable.set:', {
						role,
						key,
					});
				},
			},
		},
		draggable: {
			enabled: true,
		},
	});
}

// todo: config model
export function getConfig(): Promise<Config> {
	// todo: pull from config
	return fetch('http://10.0.0.73:8000/config').then(function (r) {
		return r.json();
	});
}

export function initializeBoard(): Promise<void> {
	return new Promise<void>(function (resolve, reject) {
		try {
			const initialConfig: ChessgroundConfig = {
				movable: {
					free: false,
					color: 'white',
				},
			};
			board = Chessground(
				document.getElementById('board')!,
				initialConfig,
			);
			board.set({
				viewOnly: false,
				movable: {
					events: {
						after: afterClientMove,
					},
				},
				premovable: {
					enabled: true,
					showDests: true,
				},
				predroppable: {
					enabled: true,
				},
				draggable: {
					enabled: true,
				},
			});

			// initializeTestBoard(initialConfig);
			resolve();
		} catch (error) {
			console.error(error);
			reject('Failed to initialize board.');
		}
	});
}
