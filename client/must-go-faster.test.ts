/*
 * CODEX-GENERATED: the contents of this file were fully constructed by a Codex agent and not a human.
*/

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MustGoFaster } from './must-go-faster';
import { PlayerTypeElement } from './dom';

type MockBoard = {
	set: ReturnType<typeof vi.fn>;
	move: ReturnType<typeof vi.fn>;
	playPremove: ReturnType<typeof vi.fn>;
	cancelMove: ReturnType<typeof vi.fn>;
		stop: ReturnType<typeof vi.fn>;
		selectSquare: ReturnType<typeof vi.fn>;
		state: {
		pieces: Map<string, { role?: string; color?: string }>;
		movable: {
			color?: string;
			free?: boolean;
			dests?: unknown;
			events?: {
				after?: (
					from: string,
					to: string,
					meta: Record<string, unknown>,
				) => void;
			};
		};
		premovable: {
			current?: string[];
			enabled?: boolean;
			showDests?: boolean;
			customDests?: unknown;
			events?: {
				set?: (from: string, to: string) => void;
				unset?: () => void;
			};
		};
		draggable: {
			current?: { orig: string; pos: [number, number] };
		};
		viewOnly?: boolean;
		turnColor?: string;
		fen?: string;
		lastMove?: string[];
		selected?: string;
	};
};

const chessgroundMock = vi.hoisted(() => ({
	lastBoard: undefined as MockBoard | undefined,
}));

vi.mock('chessground', () => {
	return {
		Chessground: vi.fn(() => {
			const board: MockBoard = {
				set: vi.fn((config: Record<string, unknown> = {}) => {
					if ('viewOnly' in config) {
						board.state.viewOnly = config.viewOnly as boolean;
					}
					if ('movable' in config) {
						Object.assign(
							board.state.movable,
							config.movable as Record<string, unknown>,
						);
					}
					if ('fen' in config) {
						board.state.fen = config.fen as string;
					}
					if ('turnColor' in config) {
						board.state.turnColor = config.turnColor as string;
					}
					if ('lastMove' in config) {
						board.state.lastMove = config.lastMove as string[];
					}
					if ('selected' in config) {
						board.state.selected = config.selected as string;
					}
					if ('premovable' in config) {
						Object.assign(
							board.state.premovable,
							config.premovable as Record<string, unknown>,
						);
					}
				}),
				move: vi.fn(),
				playPremove: vi.fn(() => {
					if (!board.state.premovable.current) {
						return false;
					}
					board.state.premovable.current = undefined;
					return true;
				}),
				cancelMove: vi.fn(() => {
					board.state.selected = undefined;
					if (!board.state.premovable.current) {
						return;
					}
					board.state.premovable.current = undefined;
					board.state.premovable.events?.unset?.();
				}),
				stop: vi.fn(() => {
					board.state.premovable.current = undefined;
				}),
				selectSquare: vi.fn((key: string | null) => {
					board.state.selected = key ?? undefined;
				}),
				state: {
					pieces: new Map(),
					movable: {},
					premovable: {},
					draggable: {},
				},
			};

			chessgroundMock.lastBoard = board;
			return board;
		}),
	};
});

class FakeWebSocket {
	static OPEN = 1;
	static CLOSED = 3;

	OPEN = 1;
	CLOSED = 3;
	CONNECTING = 0;
	CLOSING = 2;
	readyState = 0;
	url: string;
	onopen: ((event: Event) => void) | null = null;
	onclose: ((event: CloseEvent) => void) | null = null;
	onerror: ((event: Event) => void) | null = null;
	onmessage: ((event: MessageEvent<string>) => void) | null = null;
	send = vi.fn();
	close = vi.fn((code?: number, reason?: string) => {
		this.readyState = FakeWebSocket.CLOSED;
		this.onclose?.({
			code: code ?? 1000,
			reason: reason ?? '',
			wasClean: true,
		} as CloseEvent);
	});

	constructor(url: string) {
		this.url = url;
		fakeSockets.push(this);
	}
}

const fakeSockets: FakeWebSocket[] = [];
const originalEnv = {
	WS_BASE_URL: process.env.WS_BASE_URL,
	API_BASE_URL: process.env.API_BASE_URL,
};

function renderDom(): void {
	document.body.innerHTML = `
		<div id="board"></div>
		<button
			id="cancel-button"
			class="button is-dark"
			aria-label="Cancel pending game"
			style="display:none"
		>
			<span class="icon">
				<i class="fa-solid fa-xmark"></i>
			</span>
		</button>
		<div id="connection-status"></div>
		<div id="player-type-panel">
			<button id="player-type-computer" class="button is-dark">
				Play computer
			</button>
			<button id="player-type-human" class="button is-dark">
				Play human
			</button>
		</div>
		<div id="controls">
			<div id="black-clock"></div>
			<div id="white-clock"></div>
		</div>
		<div id="board-container"></div>
	`;
}

function createApp(opponentType: 'computer' | 'human' = 'computer'): MustGoFaster {
	renderDom();
	fakeSockets.length = 0;
	chessgroundMock.lastBoard = undefined;
	process.env.WS_BASE_URL = 'ws://example.test';
	process.env.API_BASE_URL = 'http://example.test';
	vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({} as Response)));
	vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);

	const app = new MustGoFaster();
	app.setOpponentType(opponentType);
	new PlayerTypeElement().setSelection(opponentType);
	return app;
}

beforeEach(() => {
	renderDom();
	fakeSockets.length = 0;
	chessgroundMock.lastBoard = undefined;
	process.env.WS_BASE_URL = 'ws://example.test';
	process.env.API_BASE_URL = 'http://example.test';
	vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({} as Response)));
	vi.stubGlobal('WebSocket', FakeWebSocket as unknown as typeof WebSocket);
});

afterEach(() => {
	vi.useRealTimers();
	document.body.innerHTML = '';
	process.env.WS_BASE_URL = originalEnv.WS_BASE_URL;
	process.env.API_BASE_URL = originalEnv.API_BASE_URL;
	vi.unstubAllGlobals();
});

function emitJoinedMessage(
	socket: FakeWebSocket,
	overrides: Partial<Record<string, unknown>> = {},
): void {
	const {
		isAgainstComputer = false,
		playerColor = 'white',
		...payloadOverrides
	} =
		overrides as Partial<Record<string, unknown>> & {
			isAgainstComputer?: boolean;
			playerColor?: string;
		};
	const message = {
		sessionId: 'session-1',
		playerColor,
		isAgainstComputer,
		type: 'GameJoinedFromServerType',
		payload: {
			fen: 'test-fen',
			validMoves: {},
			whosNext: 'white',
			whiteTimeLeft: 600,
			blackTimeLeft: 600,
			countdownStartAt: new Date(Date.now() + 1_000).toISOString(),
			...payloadOverrides,
		},
	};
	socket.readyState = FakeWebSocket.OPEN;
	socket.onmessage?.(
		new MessageEvent('message', {
			data: JSON.stringify(message),
		}),
	);
}

function emitGameStartedMessage(
	socket: FakeWebSocket,
	overrides: Partial<Record<string, unknown>> = {},
): void {
	const {
		isAgainstComputer = false,
		playerColor = 'white',
		...payloadOverrides
	} =
		overrides as Partial<Record<string, unknown>> & {
			isAgainstComputer?: boolean;
			playerColor?: string;
		};
	const message = {
		sessionId: 'session-1',
		playerColor,
		isAgainstComputer,
		type: 'GameStartedFromServerType',
		payload: {
			fen: 'test-fen',
			validMoves: {},
			whosNext: 'white',
			whiteTimeLeft: 600,
			blackTimeLeft: 600,
			...payloadOverrides,
		},
	};
	socket.readyState = FakeWebSocket.OPEN;
	socket.onmessage?.(
		new MessageEvent('message', {
			data: JSON.stringify(message),
		}),
	);
}

function emitMoveMessage(
	socket: FakeWebSocket,
	overrides: Partial<Record<string, unknown>> = {},
): void {
	const { playerColor = 'white', ...payloadOverrides } =
		overrides as Partial<Record<string, unknown>> & {
			playerColor?: string;
		};
	const message = {
		sessionId: 'session-1',
		playerColor,
		isAgainstComputer: false,
		type: 'MoveFromServerType',
		payload: {
			accepted: true,
			whiteTimeLeft: 599.5,
			blackTimeLeft: 600,
			fen: 'test-fen',
			validMoves: {},
			whosNext: 'black',
			isCheckmated: '',
			gameOutcome: '*',
			gameOutcomeMethod: 'NoMethod',
			move: {
				from: 'e7',
				to: 'e5',
			},
			...payloadOverrides,
		},
	};
	socket.readyState = FakeWebSocket.OPEN;
	socket.onmessage?.(
		new MessageEvent('message', {
			data: JSON.stringify(message),
		}),
	);
}

function emitPremoveResponseMessage(
	socket: FakeWebSocket,
	overrides: Partial<Record<string, unknown>> = {},
): void {
	const { playerColor = 'white', ...payloadOverrides } =
		overrides as Partial<Record<string, unknown>> & {
			playerColor?: string;
		};
	const message = {
		sessionId: 'session-1',
		playerColor,
		isAgainstComputer: false,
		type: 'PremoveFromServerType',
		payload: {
			accepted: false,
			premove: {
				from: 'g1',
				to: 'f3',
			},
			...payloadOverrides,
		},
	};
	socket.readyState = FakeWebSocket.OPEN;
	socket.onmessage?.(
		new MessageEvent('message', {
			data: JSON.stringify(message),
		}),
	);
}

function emitTimeoutMessage(
	socket: FakeWebSocket,
	overrides: Partial<Record<string, unknown>> = {},
): void {
	const { playerColor = 'white', ...payloadOverrides } =
		overrides as Partial<Record<string, unknown>> & {
			playerColor?: string;
		};
	const message = {
		sessionId: 'session-1',
		playerColor,
		isAgainstComputer: false,
		type: 'TimeoutFromServerType',
		payload: {
			fen: 'test-fen',
			validMoves: {},
			whosNext: 'white',
			loser: 'black',
			...payloadOverrides,
		},
	};
	socket.readyState = FakeWebSocket.OPEN;
	socket.onmessage?.(
		new MessageEvent('message', {
			data: JSON.stringify(message),
		}),
	);
}

describe('MustGoFaster connect flow', () => {
	it('shows the waiting copy for a human opponent and ignores duplicate play clicks', () => {
		const app = createApp('human');

		app.connect();

	expect(fakeSockets).toHaveLength(1);
	expect(fakeSockets[0].url).toBe(
			'ws://example.test/connect?opponentType=human',
		);

		const computerButton = document.querySelector<HTMLButtonElement>(
			'#player-type-computer',
		)!;
		const humanButton = document.querySelector<HTMLButtonElement>(
			'#player-type-human',
		)!;
		const cancelButton = document.querySelector<HTMLButtonElement>(
			'#cancel-button',
		)!;
		const playerType = document.querySelector<HTMLDivElement>(
			'#player-type-panel',
		)!;
		const status = document.querySelector<HTMLDivElement>(
			'#connection-status',
		)!;

		expect(computerButton.disabled).toBe(true);
		expect(humanButton.disabled).toBe(true);
		expect(playerType.dataset.pending).toBe('human');
		expect(status.textContent).toBe('Waiting for opponent...');
		expect(status.dataset.tone).toBe('info');
		expect(cancelButton.style.display).toBe('');

		app.connect();
		expect(fakeSockets).toHaveLength(1);
	});

	it('shows the starting copy for a computer opponent', () => {
		const app = createApp('computer');

		app.connect();

		const status = document.querySelector<HTMLDivElement>(
			'#connection-status',
		)!;

		expect(status.textContent).toBe('Starting game...');
		expect(status.dataset.tone).toBe('info');
	});

	it('restores the play button if a pending connection is canceled', () => {
		const app = createApp('human');

		app.connect();
		const socket = fakeSockets[0];
		app.cancelPendingGame();

		const computerButton = document.querySelector<HTMLButtonElement>(
			'#player-type-computer',
		)!;
		const humanButton = document.querySelector<HTMLButtonElement>(
			'#player-type-human',
		)!;
		const cancelButton = document.querySelector<HTMLButtonElement>(
			'#cancel-button',
		)!;
		const playerType = document.querySelector<HTMLDivElement>(
			'#player-type-panel',
		)!;
		const status = document.querySelector<HTMLDivElement>(
			'#connection-status',
		)!;

		expect(socket.close).toHaveBeenCalledWith(
			1000,
			'Canceled by user.',
		);
		expect(computerButton.disabled).toBe(false);
		expect(humanButton.disabled).toBe(false);
		expect(cancelButton.style.display).toBe('none');
		expect(playerType.style.display).toBe('');
		expect(status.textContent).toBe('');
		expect(status.dataset.tone).toBe('info');
		expect(status.style.visibility).toBe('hidden');
	});

	it('waits for the shared countdown before starting the game', async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-08-29T12:00:00.000Z'));

		const app = createApp('human');

		app.connect();
		const socket = fakeSockets[0];
		socket.onopen?.(new Event('open'));
		emitJoinedMessage(socket);

		const cancelButton = document.querySelector<HTMLButtonElement>(
			'#cancel-button',
		)!;

		expect(cancelButton.style.display).toBe('none');

		await vi.advanceTimersByTimeAsync(999);
		expect(socket.send).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1_000);
		await vi.advanceTimersByTimeAsync(5_000);

		expect(socket.send).toHaveBeenCalledTimes(1);
		expect(socket.send).toHaveBeenCalledWith(
			expect.stringContaining('GameStartedToServerType'),
		);
		expect(document.querySelector<HTMLDivElement>('#board')!.style.pointerEvents).toBe(
			'auto',
		);
	});

	it('resets the opponent selector to Computer after an unexpected disconnect', () => {
		const app = createApp('human');

		app.connect();
		const socket = fakeSockets[0];
		socket.onopen?.(new Event('open'));
		emitJoinedMessage(socket);
		socket.onclose?.({
			code: 1006,
			reason: '',
			wasClean: false,
		} as CloseEvent);

		const playerType = document.querySelector<HTMLDivElement>(
			'#player-type-panel',
		)!;
		expect(playerType.style.display).toBe('');
	});

	it('surfaces a lobby-expired close reason before the game starts', () => {
		const app = createApp('human');

		app.connect();
		fakeSockets[0].close(1000, 'Lobby expired after 2 minutes.');

		const computerButton = document.querySelector<HTMLButtonElement>(
			'#player-type-computer',
		)!;
		const humanButton = document.querySelector<HTMLButtonElement>(
			'#player-type-human',
		)!;
		const status = document.querySelector<HTMLDivElement>(
			'#connection-status',
		)!;

		expect(computerButton.disabled).toBe(false);
		expect(humanButton.disabled).toBe(false);
		expect(status.textContent).toBe('Lobby expired after 2 minutes.');
		expect(status.dataset.tone).toBe('error');
	});

	it('shows a startup error if the websocket fails before opening', () => {
		const app = createApp('human');

		app.connect();
		fakeSockets[0].onerror?.(new Event('error'));

		const computerButton = document.querySelector<HTMLButtonElement>(
			'#player-type-computer',
		)!;
		const humanButton = document.querySelector<HTMLButtonElement>(
			'#player-type-human',
		)!;
		const cancelButton = document.querySelector<HTMLButtonElement>(
			'#cancel-button',
		)!;
		const status = document.querySelector<HTMLDivElement>(
			'#connection-status',
		)!;

		expect(computerButton.disabled).toBe(false);
		expect(humanButton.disabled).toBe(false);
		expect(cancelButton.style.display).toBe('none');
		expect(status.textContent).toBe(
			'Unable to start a game. Please try again.',
		);
		expect(status.dataset.tone).toBe('error');
	});

	it('enables premoves for human games once the local player is waiting', () => {
		const app = createApp('human');

		app.connect();
		const socket = fakeSockets[0];
		socket.onopen?.(new Event('open'));
		emitJoinedMessage(socket, {
			playerColor: 'black',
			isAgainstComputer: false,
			whosNext: 'white',
			validMoves: {
				g1: ['f3', 'h3'],
				b1: ['a3', 'c3'],
			},
		});
		emitGameStartedMessage(socket, {
			playerColor: 'black',
			isAgainstComputer: false,
			whosNext: 'white',
			validMoves: {
				g1: ['f3', 'h3'],
				b1: ['a3', 'c3'],
			},
		});

		expect(chessgroundMock.lastBoard?.state.premovable.enabled).toBe(true);
		expect(chessgroundMock.lastBoard?.state.viewOnly).toBe(false);
		expect(chessgroundMock.lastBoard?.state.movable.color).toBe('black');
		expect(chessgroundMock.lastBoard?.state.movable.free).toBe(true);
		expect(chessgroundMock.lastBoard?.state.premovable.customDests).toBeDefined();
		expect(document.querySelector<HTMLDivElement>('#board')!.style.pointerEvents).toBe(
			'auto',
		);
	});

	it('keeps premoves available for computer games so the human can premove', () => {
		const app = createApp('computer');

		app.connect();
		const socket = fakeSockets[0];
		socket.onopen?.(new Event('open'));
		emitJoinedMessage(socket, {
			playerColor: 'black',
			isAgainstComputer: true,
			whosNext: 'white',
			validMoves: {
				g1: ['f3', 'h3'],
			},
		});
		emitGameStartedMessage(socket, {
			playerColor: 'black',
			isAgainstComputer: true,
			whosNext: 'white',
			validMoves: {
				g1: ['f3', 'h3'],
			},
		});

		expect(chessgroundMock.lastBoard?.state.premovable.enabled).toBe(true);
		expect(chessgroundMock.lastBoard?.state.movable.free).toBe(true);
		expect(chessgroundMock.lastBoard?.state.premovable.customDests).toBeDefined();
	});

	it('sends a premove immediately when the player queues one', () => {
		const app = createApp('human');

		app.connect();
		const socket = fakeSockets[0];
		socket.onopen?.(new Event('open'));
		emitJoinedMessage(socket, {
			playerColor: 'black',
			isAgainstComputer: false,
			whosNext: 'white',
		});
		emitGameStartedMessage(socket, {
			playerColor: 'black',
			isAgainstComputer: false,
			whosNext: 'white',
		});

		chessgroundMock.lastBoard!.state.premovable.events?.set?.('g1', 'f3');

		const sent = JSON.parse(
			socket.send.mock.calls[socket.send.mock.calls.length - 1][0] as string,
		);
		expect(sent.type).toBe('PremoveToServerType');
		expect(sent.payload.cancel).toBeUndefined();
		expect(sent.payload.premove).toEqual({
			from: 'g1',
			to: 'f3',
		});
	});

	it('sends a premove cancellation when the server rejects the premove', () => {
		const app = createApp('human');

		app.connect();
		const socket = fakeSockets[0];
		socket.onopen?.(new Event('open'));
		emitJoinedMessage(socket, {
			playerColor: 'black',
			isAgainstComputer: false,
			whosNext: 'white',
		});
		emitGameStartedMessage(socket, {
			playerColor: 'black',
			isAgainstComputer: false,
			whosNext: 'white',
		});

		chessgroundMock.lastBoard!.state.premovable.current = ['g1', 'f3'];
		chessgroundMock.lastBoard!.state.premovable.events?.set?.('g1', 'f3');

		emitPremoveResponseMessage(socket, {
			playerColor: 'black',
			accepted: false,
			premove: {
				from: 'g1',
				to: 'f3',
			},
		});

		expect(chessgroundMock.lastBoard?.cancelMove).toHaveBeenCalled();
		expect(chessgroundMock.lastBoard?.state.premovable.current).toBe(
			undefined,
		);

		const messages = socket.send.mock.calls.map(([value]) =>
			JSON.parse(value as string),
		);
		expect(
			messages.some(
				(message) =>
					message.type === 'PremoveToServerType' &&
					message.payload.cancel === true,
			),
		).toBe(true);
	});

	it('reverts an illegal move when the server rejects it', () => {
		const app = createApp('human');

		app.connect();
		const socket = fakeSockets[0];
		socket.onopen?.(new Event('open'));
		emitJoinedMessage(socket, {
			playerColor: 'white',
			isAgainstComputer: false,
			whosNext: 'white',
		});
		emitGameStartedMessage(socket, {
			playerColor: 'white',
			isAgainstComputer: false,
			whosNext: 'white',
		});

		emitMoveMessage(socket, {
			accepted: false,
			move: {
				from: 'a1',
				to: 'a3',
			},
			whosNext: 'white',
			fen: 'authoritative-fen',
			validMoves: {},
			whiteTimeLeft: 12.5,
			blackTimeLeft: 9.2,
		});

		expect(chessgroundMock.lastBoard?.cancelMove).toHaveBeenCalled();
		expect(chessgroundMock.lastBoard?.state.fen).toBe('authoritative-fen');
		expect(chessgroundMock.lastBoard?.state.lastMove).toBeUndefined();
	});

	it("preserves the selected piece when the opponent's move updates the board", () => {
		const app = createApp('human');

		app.connect();
		const socket = fakeSockets[0];
		socket.onopen?.(new Event('open'));
		emitJoinedMessage(socket, {
			playerColor: 'white',
			isAgainstComputer: false,
			whosNext: 'black',
		});
		emitGameStartedMessage(socket, {
			playerColor: 'white',
			isAgainstComputer: false,
			whosNext: 'black',
		});

		const board = chessgroundMock.lastBoard!;
		board.selectSquare('g1');
		board.state.draggable.current = { orig: 'g1', pos: [100, 100] };

		emitMoveMessage(socket, {
			playerColor: 'black',
			whosNext: 'white',
			move: { from: 'e7', to: 'e5' },
			fen: 'opponent-move-fen',
		});

		expect(board.state.fen).toBe('opponent-move-fen');
		expect(board.selectSquare).toHaveBeenLastCalledWith('g1', true);
		expect(board.state.selected).toBe('g1');
		expect(board.state.draggable.current).toEqual({
			orig: 'g1',
			pos: [100, 100],
		});
		expect(board.cancelMove).not.toHaveBeenCalled();
	});
});
