/*
 * CODEX-MODIFIED: the contents of this file were written by a human and modified after the fact by a Codex agent.
 */

import { Chessground } from 'chessground';
import {
	ChessgroundConfig,
	GameJoinedFromServer,
	GameStartedToServer,
	GameStatus,
	Message,
	Move,
	MoveFromServer,
	MoveToServer,
	ToPayload,
	PlayerColor,
	PremoveFromServer,
	PremoveToServer,
	TimeoutFromServer,
	TimeoutToServer,
	ToMessage,
	FromMessage,
	FromPayload,
	OpponentType,
	MustGoFasterState,
} from './models';
import { GAME_CLOCK_DURATION } from './constants';

import { Api as ChessgroundApi } from 'chessground/api';
import * as cg from 'chessground/types.js';
import {
	BoardElement,
	CancelButtonElement,
	ConfettiElement,
	PlayerTypeElement,
	CountdownContainerElement,
	ConnectionStatusElement,
	ControlsElement,
} from './dom';

export class MustGoFaster {
	#state: MustGoFasterState = {};

	constructor() {
		console.log('Initializing MustGoFaster.');
		this.connect = this.connect.bind(this);
		this.cancelPendingGame = this.cancelPendingGame.bind(this);
		this.#state.opponentType = 'computer';
		this.#state.connectionPhase = 'idle';
		this.#state.closeReason = undefined;
		const initialConfig: ChessgroundConfig = {
			movable: {
				free: true,
				color: 'white',
			},
		};
		this.#state.board = Chessground(
			new BoardElement().element!,
			initialConfig,
		);
		new BoardElement().disable();
		this.#state.board.set({
			viewOnly: false,
			movable: {
				events: {
					after: this.handleClientMove(),
				},
			},
			premovable: {
				enabled: false,
				showDests: true,
				events: {
					set: this.handlePremoveSet(),
					unset: this.handlePremoveUnset(),
				},
			},
			predroppable: {
				enabled: true,
			},
			draggable: {
				enabled: true,
			},
		});
		this.#state.wsBaseUrl = process.env.WS_BASE_URL;
		this.#state.apiBaseUrl = process.env.API_BASE_URL;

		const playerType = new PlayerTypeElement();
		playerType.show();
		playerType.onComputerClick(() => {
			this.setOpponentType('computer');
			this.connect();
		});
		playerType.onHumanClick(() => {
			this.setOpponentType('human');
			this.connect();
		});
		new CancelButtonElement().hide();
		new ConnectionStatusElement().clear();

		this.ping();
	}

	connect(): void {
		if (
			this.#state.connection &&
			this.#state.connection.readyState !== WebSocket.CLOSED
		) {
			return;
		}
		if (this.#state.connectionPhase !== 'idle') {
			return;
		}

		this.#state.closeReason = undefined;
		this.#state.connectionPhase = 'connecting';
		this.setConnectionUiPending();

		let ws: WebSocket;
		try {
			ws = new WebSocket(
				`${this.#state.wsBaseUrl!}/connect?opponentType=${
					this.#state.opponentType
				}`,
				[],
			);
		} catch (error) {
			this.#state.connectionPhase = 'idle';
			this.#state.closeReason = 'error';
			this.setConnectionUiError(
				'Unable to open a game connection. Please try again.',
			);
			return;
		}
		// console.log('Creating WebSocket.');

		ws.onopen = () => {
			// console.log('WebSocket opened.', { event: openEvent });
			this.#state.connectionPhase = 'pending';
		};

		ws.onerror = () => {
			this.#state.closeReason = 'error';
			this.#state.connectionPhase = 'idle';
			this.#state.connection = undefined;
			this.setConnectionUiError(
				'Unable to start a game. Please try again.',
			);
		};

		ws.onclose = (closeEvent) => {
			// console.log('WebSocket closed.', { event: closeEvent });
			const closeReason = this.#state.closeReason;
			this.#state.connection = undefined;
			this.#state.connectionPhase = 'idle';

			if (closeReason === 'cancel' || closeReason === 'gameover') {
				this.#state.closeReason = undefined;
				return;
			}

			if (closeReason === 'error') {
				this.#state.closeReason = undefined;
				return;
			}

			if (closeEvent.code === 1000 && closeEvent.reason) {
				this.setConnectionUiError(closeEvent.reason);
			} else {
				this.setConnectionUiError(
					'The game connection closed unexpectedly. Please try again.',
					true,
				);
			}
			this.#state.closeReason = 'error';
		};

		const self = this;
		ws.onmessage = function (event) {
			try {
				const message: FromMessage<FromPayload> = JSON.parse(
					event.data,
				);
				self.handleMessage(message);
			} catch (e) {
				console.error(e);
			}
		};

		this.#state.connection = ws;
	}

	cancelPendingGame(): void {
		if (!this.#state.connection) {
			return;
		}
		if (this.#state.connectionPhase === 'active') {
			return;
		}

		this.#state.closeReason = 'cancel';
		this.#state.connectionPhase = 'idle';
		const connection = this.#state.connection;
		this.#state.connection = undefined;
		connection.close(1000, 'Canceled by user.');
		this.resetConnectionUi();
	}

	setOpponentType(type: OpponentType): void {
		this.#state.opponentType = type;
	}

	private async ping() {
		try {
			await fetch(`${this.#state.apiBaseUrl!}/ping`);
		} catch (error) {
			console.error(error);
		}
	}

	private async handleMessage(message: FromMessage<FromPayload>) {
		this.#state.message = message;

		// console.log('Handle message: ', { message });
		switch (message.type) {
			case 'GameJoinedFromServerType':
				this.#state.connectionPhase = 'active';
				this.#state.closeReason = undefined;
				await this.setupGame();
				break;
			case 'GameStartedFromServerType':
				this.enableBoard();
				break;
			case 'MoveFromServerType':
				this.updateBoardWithMove();
				break;
			case 'PremoveFromServerType':
				this.handlePremoveResponse();
				break;
			case 'TimeoutFromServerType':
				this.timeout();
				break;
			case 'AbandonedFromServerType':
				this.abandoned();
				break;
		}
	}

	private sendMessage(message: ToMessage<ToPayload>): void {
		if (!this.#state.connection) {
			console.error('Connection does not exist.');
			return;
		}

		if (this.#state.connection.readyState !== this.#state.connection.OPEN) {
			console.error(
				'Attempted send() on connection that is not open. State: ',
				this.#state.connection.readyState,
			);
			return;
		}

		try {
			this.#state.connection.send(JSON.stringify(message));
		} catch (error) {
			console.error('Cannot JSON.stingify message: ', message);
		}
	}

	private async setupGame(): Promise<void> {
		// console.log('start: ', { response: this.#state.message });
		const message = this.#state
			.message as FromMessage<GameJoinedFromServer>;
		this.setupBoard(message);
		this.#state.isAgainstComputer = this.#state.message!.isAgainstComputer;
		this.setConnectionUiGameJoined();

		const {
			payload: {
				whiteTimeLeft,
				blackTimeLeft,
				whosNext,
				countdownStartAt,
			} = {},
		} = message;
		this.initializeClock(whiteTimeLeft!, blackTimeLeft!);

		await this.showCountdownToStartGame(whosNext!, countdownStartAt!);
	}

	private enableBoard(): void {
		const payload = (
			this.#state.message as FromMessage<GameJoinedFromServer>
		).payload!;
		new BoardElement().enable();
		this.toggleClock(payload.whosNext);
		this.#state.board!.set({
			viewOnly: false,
			selectable: {
				enabled: true,
			},
			movable: {
				color: this.#state.playerColor!,
				free: true,
			},
			premovable: {
				enabled: true,
				showDests: true,
				customDests: this.getPremoveDests(payload.whosNext),
			},
			draggable: {
				enabled: true,
			},
		});
	}

	private updateBoardWithMove(): void {
		const {
			accepted,
			isCheckmated,
			gameOutcome,
			gameOutcomeMethod,
			whiteTimeLeft,
			blackTimeLeft,
			whosNext,
			fen,
			validMoves,
			move: { from, to },
		} = (this.#state.message! as FromMessage<MoveFromServer>).payload!;
		if (accepted === false) {
			this.#state.board!.cancelMove();
			this.#state.whiteTimeLeft = whiteTimeLeft;
			this.#state.blackTimeLeft = blackTimeLeft;
			this.toggleClock(whosNext);
			this.#state.board!.set({
				fen,
				turnColor: whosNext,
				selectable: {
					enabled: true,
				},
				movable: {
					color: this.#state.playerColor!,
					free: true,
					dests: this.toValidMoves(validMoves),
				},
				lastMove: undefined,
				premovable: {
					enabled: true,
					showDests: true,
					customDests: this.getPremoveDests(whosNext),
				},
				draggable: {
					enabled: true,
				},
			});
			return;
		}

		const selectedSquare = this.#state.board!.state.selected;
		this.#state.board!.cancelMove();

		let endState:
			| {
					gameStatus: Exclude<GameStatus, 'ongoing'>;
					method: string;
			  }
			| undefined;

		if (gameOutcome && gameOutcome !== '*') {
			if (gameOutcome === '1/2-1/2') {
				endState = {
					gameStatus: 'draw',
					method: this.formatGameOutcomeMethod(gameOutcomeMethod),
				};
				this.#state.whiteTimeLeft = 0;
				this.#state.blackTimeLeft = 0;
			} else {
				const gameStatus: Exclude<GameStatus, 'ongoing'> =
					gameOutcome ===
					(this.#state.playerColor === 'white' ? '1-0' : '0-1')
						? 'won'
						: 'lost';
				endState = {
					gameStatus,
					method: isCheckmated
						? 'checkmate'
						: this.formatGameOutcomeMethod(gameOutcomeMethod),
				};
				this.#state.whiteTimeLeft = 0;
				this.#state.blackTimeLeft = 0;
			}
		} else {
			this.#state.whiteTimeLeft = whiteTimeLeft;
			this.#state.blackTimeLeft = blackTimeLeft;
		}

		if (!endState) {
			this.toggleClock(whosNext);
		}

		this.#state.board!.set({
			fen,
			turnColor: whosNext,
			selectable: {
				enabled: true,
			},
			movable: {
				color: this.#state.playerColor!,
				free: true,
				dests: this.toValidMoves(validMoves),
			},
			lastMove: [from, to],
			premovable: {
				enabled: true,
				showDests: true,
				customDests: this.getPremoveDests(whosNext),
			},
			draggable: {
				enabled: true,
			},
		});
		if (selectedSquare) {
			this.#state.board!.selectSquare(selectedSquare, true);
		}
		if (endState) {
			this.gameOver(endState.gameStatus, endState.method);
		}
	}

	private timeout(): void {
		let status: GameStatus = 'won';
		if (
			(this.#state.message! as FromMessage<TimeoutFromServer>).payload!
				.loser === this.#state.playerColor
		) {
			status = 'lost';
		}
		this.gameOver(status, 'timeout');
	}

	private abandoned(): void {
		let status: GameStatus = 'won';
		this.gameOver(status, 'abandonment');
		if (this.#state.connection) {
			this.#state.connection.close(1000, 'Game abandoned by opponent.');
			this.#state.connection = undefined;
		}
		// wipe out all game-specific data in class?
	}

	private async showCountdownToStartGame(
		whoMovesFirst: PlayerColor,
		countdownStartAt: string,
	): Promise<void> {
		return new Promise((resolve) => {
			const countdownDisplay = new CountdownContainerElement(
				whoMovesFirst,
				this.#state.playerColor!,
			);
			const self = this;
			const startedAt = new Date(countdownStartAt).getTime();
			const beginCountdown = () => {
				let currentSecond = 5;
				countdownDisplay.setCountdownText(currentSecond);
				const countdownInterval = window.setInterval(function () {
					currentSecond--;
					if (currentSecond <= 0) {
						window.clearInterval(countdownInterval);
						countdownDisplay.hide(whoMovesFirst);

						self.enableBoard();
						if (self.#state.connection) {
							const gameStartedRequest: ToMessage<GameStartedToServer> =
								{
									type: 'GameStartedToServerType',
									sessionId: self.#state.sessionId!,
									playerColor: self.#state.playerColor!,
									isAgainstComputer:
										self.#state.isAgainstComputer!,
								};
							self.sendMessage(gameStartedRequest);
						}
						resolve();
					} else {
						countdownDisplay.setCountdownText(currentSecond);
					}
				}, 1000);
			};

			const delay = startedAt - Date.now();
			if (delay <= 0) {
				beginCountdown();
				return;
			}

			window.setTimeout(beginCountdown, delay);
		});
	}

	private initializeClock(
		whiteTimeLeft: number,
		blackTimeLeft: number,
	): void {
		if (this.#state.whiteTimer) {
			cancelAnimationFrame(this.#state.whiteTimer);
		}
		if (this.#state.blackTimer) {
			cancelAnimationFrame(this.#state.blackTimer);
		}

		const controlsDiv = new ControlsElement()!;

		controlsDiv.setTime(whiteTimeLeft, blackTimeLeft);
	}

	private toggleClock(whosNext: PlayerColor): void {
		if (this.#state.whiteTimer) {
			cancelAnimationFrame(this.#state.whiteTimer);
		}
		if (this.#state.blackTimer) {
			cancelAnimationFrame(this.#state.blackTimer);
		}
		const controlsDiv = new ControlsElement()!;
		const start = performance.now();
		const self = this;

		if (whosNext === 'white') {
			controlsDiv.setActive('white');
			function updateWhiteTimer(): void {
				if (!self.#state.whiteTimeLeft) {
					return;
				}
				const diff = performance.now() - start;
				const gameClock = self.#state.whiteTimeLeft - diff / 1_000;

				if (gameClock <= 0) {
					// send message to server to end game/find out the outcome
					if (self.#state.connection) {
						const timeout: ToMessage<TimeoutToServer> = {
							type: 'TimeoutToServerType',
							sessionId: self.#state.sessionId!,
							playerColor: self.#state.playerColor!,
							isAgainstComputer: self.#state.isAgainstComputer!,
							payload: {
								timeout: true,
							},
						};
						self.sendMessage(timeout);
					}
					return;
				}

				controlsDiv.setTime(gameClock, self.#state.blackTimeLeft!);
				if (self.#state.whiteTimer) {
					cancelAnimationFrame(self.#state.whiteTimer);
				}
				self.#state.whiteTimer =
					requestAnimationFrame(updateWhiteTimer);
			}
			if (this.#state.whiteTimer) {
				cancelAnimationFrame(this.#state.whiteTimer);
			}
			this.#state.whiteTimer = requestAnimationFrame(updateWhiteTimer);
		} else {
			controlsDiv.setActive('black');
			function updateBlackTimer(): void {
				if (!self.#state.blackTimeLeft) {
					return;
				}
				const diff = performance.now() - start;
				const gameClock = self.#state.blackTimeLeft - diff / 1_000;

				if (gameClock <= 0) {
					// send message to server to end game/find out the outcome
					if (self.#state.connection) {
						const timeout: ToMessage<TimeoutToServer> = {
							type: 'TimeoutToServerType',
							sessionId: self.#state.sessionId!,
							playerColor: self.#state.playerColor!,
							isAgainstComputer: self.#state.isAgainstComputer!,
							payload: {
								timeout: true,
							},
						};
						self.sendMessage(timeout);
					}
					return;
				}

				controlsDiv.setTime(self.#state.whiteTimeLeft!, gameClock);
				if (self.#state.blackTimer) {
					cancelAnimationFrame(self.#state.blackTimer);
				}
				self.#state.blackTimer =
					requestAnimationFrame(updateBlackTimer);
			}
			if (this.#state.blackTimer) {
				cancelAnimationFrame(this.#state.blackTimer);
			}
			this.#state.blackTimer = requestAnimationFrame(updateBlackTimer);
		}
	}

	private toValidMoves(moves: { [key: string]: string[] }): cg.Dests {
		const validMoves = new Map<cg.Key, cg.Key[]>();
		for (const [key, value] of Object.entries(moves)) {
			validMoves.set(key as cg.Key, value as cg.Key[]);
		}

		return validMoves;
	}

	private getPremoveDests(turnColor: PlayerColor): cg.Dests | undefined {
		if (turnColor === this.#state.playerColor) {
			return undefined;
		}
		const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
		const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
		const dests = new Map<cg.Key, cg.Key[]>();
		for (const file of files) {
			for (const rank of ranks) {
				const orig = `${file}${rank}` as cg.Key;
				const values: cg.Key[] = [];
				for (const destinationFile of files) {
					for (const destinationRank of ranks) {
						values.push(
							`${destinationFile}${destinationRank}` as cg.Key,
						);
					}
				}
				dests.set(orig, values);
			}
		}
		return dests;
	}

	private gameOver(
		gameStatus: Exclude<GameStatus, 'ongoing'>,
		method: string,
	): void {
		// console.log('gameOver: ', { gameStatus, method });
		if (this.#state.whiteTimer) {
			cancelAnimationFrame(this.#state.whiteTimer);
			this.#state.whiteTimer = undefined;
		}
		if (this.#state.blackTimer) {
			cancelAnimationFrame(this.#state.blackTimer);
			this.#state.blackTimer = undefined;
		}
		if (this.#state.connection) {
			this.#state.closeReason = 'gameover';
			this.#state.connectionPhase = 'idle';
			this.#state.connection.close(1000, 'Game over.');
			this.#state.connection = undefined;
		}
		new BoardElement().disable();
		this.#state.board!.set({
			viewOnly: true,
			premovable: {
				enabled: false,
				showDests: true,
				customDests: undefined,
			},
		});
		this.#state.board!.stop();
		new CancelButtonElement().hide();
		new ConnectionStatusElement().clear();
		const self = this;
		function sendNewGameMessage() {
			// listen for click of modal button
			self.connect();
		}
		// have to add draws
		if (gameStatus === 'won') {
			new ConfettiElement().show();
		}
	}

	private formatGameOutcomeMethod(method?: string): string {
		switch (method) {
			case 'Checkmate':
				return 'checkmate';
			case 'DrawOffer':
				return 'draw offer';
			case 'Stalemate':
				return 'stalemate';
			case 'ThreefoldRepetition':
				return 'threefold repetition';
			case 'FivefoldRepetition':
				return 'fivefold repetition';
			case 'FiftyMoveRule':
				return '50-move rule';
			case 'SeventyFiveMoveRule':
				return '75-move rule';
			case 'InsufficientMaterial':
				return 'insufficient material';
			case 'NoMethod':
			case undefined:
				return 'game over';
			default:
				return method.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
		}
	}

	private setupBoard(message: FromMessage<GameJoinedFromServer>) {
		new BoardElement().disable();
		this.#state.sessionId = message.sessionId;
		this.#state.playerColor = message.playerColor;
		this.#state.whiteTimeLeft = GAME_CLOCK_DURATION;
		this.#state.blackTimeLeft = GAME_CLOCK_DURATION;

		const payload = message.payload as GameJoinedFromServer;
		// const gameMeta = new GameMetaElement({
		// 	playerColor: this.#state.playerColor,
		// 	whosNext: payload.whosNext,
		// });

		this.#state.board!.set({
			viewOnly: true,
			selectable: {
				enabled: true,
			},
			fen: payload.fen,
			turnColor: payload.whosNext,
			orientation: this.#state.playerColor,
			movable: {
				dests: this.toValidMoves(payload.validMoves),
				color: this.#state.playerColor,
				free: true,
			},
			premovable: {
				enabled: false,
				showDests: true,
				customDests: undefined,
			},
			draggable: {
				enabled: true,
			},
		} as ChessgroundConfig);
		if (this.#state.board!.state.selected) {
			this.#state.board!.selectSquare(
				this.#state.board!.state.selected,
				true,
			);
		}
	}

	private setConnectionUiPending(): void {
		const cancelButton = new CancelButtonElement();
		const playerType = new PlayerTypeElement();
		const status = new ConnectionStatusElement();

		playerType.setPending(this.#state.opponentType);
		cancelButton.show();
		status.show(
			this.#state.opponentType === 'computer'
				? 'Starting game...'
				: 'Waiting for opponent...',
			'info',
		);
	}

	private setConnectionUiGameJoined(): void {
		const playerType = new PlayerTypeElement();

		new CancelButtonElement().hide();
		playerType.clearPending();
		new ConnectionStatusElement().clear();
	}

	private setConnectionUiError(
		message: string,
		resetOpponentType = false,
	): void {
		const cancelButton = new CancelButtonElement();
		const playerType = new PlayerTypeElement();
		const status = new ConnectionStatusElement();

		playerType.clearPending();
		cancelButton.hide();
		if (resetOpponentType) {
			this.#state.opponentType = 'computer';
			playerType.setSelection('computer');
		}
		status.show(message, 'error');
	}

	private resetConnectionUi(): void {
		const cancelButton = new CancelButtonElement();
		const playerType = new PlayerTypeElement();
		const status = new ConnectionStatusElement();

		playerType.clearPending();
		cancelButton.hide();
		status.clear();
	}

	private sendPremoveMessage(move?: Move, cancel = false): void {
		if (!this.#state.connection) {
			return;
		}

		const premove: ToMessage<PremoveToServer> = {
			type: 'PremoveToServerType',
			sessionId: this.#state.sessionId!,
			playerColor: this.#state.playerColor!,
			isAgainstComputer: this.#state.isAgainstComputer!,
			payload: cancel ? { cancel: true } : { premove: move! },
		};
		this.sendMessage(premove);
	}

	private handlePremoveSet() {
		const self = this;
		return function (from: cg.Key, to: cg.Key): void {
			self.sendPremoveMessage({ from, to }, false);
		};
	}

	private handlePremoveUnset() {
		const self = this;
		return function (): void {
			self.sendPremoveMessage(undefined, true);
		};
	}

	private handlePremoveResponse(): void {
		const payload = (this.#state.message as FromMessage<PremoveFromServer>)
			?.payload;
		if (!payload || payload.accepted !== false) {
			return;
		}

		this.#state.board!.cancelMove();
	}

	private handleClientMove() {
		const self = this;
		return function (
			from: cg.Key,
			to: cg.Key,
			meta: cg.MoveMetadata,
		): void {
			// console.log('Handle move: ', { from, to });
			// handle promotion here; autopromote to queen for now
			to = self.checkIsPromotion(to);

			const move: { from: cg.Key; to: cg.Key } = { from, to };
			if (self.#state.connection) {
				const moveMessage: ToMessage<MoveToServer> = {
					payload: { move },
					playerColor: self.#state.playerColor!,
					sessionId: self.#state.sessionId!,
					type: 'MoveToServerType',
					isAgainstComputer: self.#state.isAgainstComputer!,
				};
				self.sendMessage(moveMessage);
			}
		};
	}

	private checkIsPromotion(to: cg.Key): cg.Key {
		const movedPiece = this.#state.board!.state.pieces.get(to);
		// any pawn move ending in 1 or 8, i.e. last rank
		if (movedPiece?.role === 'pawn' && /(1|8)$/.test(to)) {
			to += 'q';
		}

		return to;
	}
}
