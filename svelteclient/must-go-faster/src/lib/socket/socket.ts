import * as cg from 'chessground/types';
import type {
	FromMessage,
	FromPayload,
	GameStartedToServer,
	MoveToServer,
	OpponentType,
	PlayerColor,
	ToMessage,
	ToPayload
} from '$lib/models/models';
import { gameState, receiveMessage } from '../../store/must-go-faster.store';

let socket: WebSocket;

// todo: opponent type shouldn't be required for a connection,
// it should be a separate message type unto itself
export async function createSocket(opponentType: OpponentType): Promise<void> {
	if (socket) {
		console.error('socket already created');
		return;
	}

	const baseUrl: string = import.meta.env.VITE_WS_BASE_URL;
	socket = new WebSocket(`${baseUrl}/connect?opponentType=${opponentType}`);

	socket.onopen = function (openEvent) {
		// console.log('WebSocket opened.', { event: openEvent });
		// new BoardElement()!.enable();
	};

	socket.onerror = function (errorEvent) {
		console.error('Socket error.', { event: errorEvent });
	};

	socket.onclose = function (closeEvent) {
		console.log('Socket closed.', { event: closeEvent });
	};

	socket.onmessage = function (event) {
		try {
			const message: FromMessage<FromPayload> = JSON.parse(event.data);
			console.log(message);
			receiveMessage(message);
			// self.handleMessage(message);
		} catch (e) {
			console.error(e);
		}
	};

	return Promise.resolve();
}

export function createSocket2(opponentType: OpponentType): Promise<void> {
	return new Promise(function (res, rej) {
		try {
			if (socket) {
				console.error('socket already created');
				return;
			}

			const baseUrl: string = import.meta.env.VITE_WS_BASE_URL;
			socket = new WebSocket(`${baseUrl}/connect?opponentType=${opponentType}`);

			socket.onopen = function (openEvent) {
				// console.log('WebSocket opened.', { event: openEvent });
				// new BoardElement()!.enable();
			};

			socket.onerror = function (errorEvent) {
				console.error('Socket error.', { event: errorEvent });
			};

			socket.onclose = function (closeEvent) {
				console.log('Socket closed.', { event: closeEvent });
			};

			socket.onmessage = function (event) {
				try {
					const message: FromMessage<FromPayload> = JSON.parse(event.data);
					console.log(message);
					receiveMessage(message);
					// self.handleMessage(message);
				} catch (e) {
					console.error(e);
				}
			};

			res();
		} catch (e) {
			console.error(e);
			rej(e);
		}
	});
}

export function sendMessage({
	type,
	playerColor,
	sessionId,
	isAgainstComputer,
	move
}: {
	type: 'move' | 'premove' | 'timeout' | 'gameStarted'; // etc; move to models.ts
	playerColor: PlayerColor;
	sessionId: string;
	isAgainstComputer: boolean;
	move?: { from: cg.Key; to: cg.Key };
}): void {
	if (!socket) {
		console.error('Socket does not exist.');
		return;
	}

	if (socket.readyState !== socket.OPEN) {
		console.error('Attempted send() on socket that is not open. State: ', socket.readyState);
		return;
	}

	let message: ToMessage<ToPayload> | undefined = undefined;
	switch (type) {
		case 'move': {
			if (!move) throw new Error('move was undefined when called with type move');
			message = {
				payload: { move: move! },
				playerColor: playerColor!,
				sessionId: sessionId!,
				type: 'MoveToServerType',
				isAgainstComputer: isAgainstComputer!
			} as ToMessage<MoveToServer>;
			break;
		}
		case 'gameStarted': {
			message = {
				isAgainstComputer: isAgainstComputer!,
				playerColor: playerColor!,
				sessionId: sessionId!,
				type: 'GameStartedToServerType'
			} as ToMessage<GameStartedToServer>;
		}
	}

	try {
		socket.send(JSON.stringify(message ?? { invalidMessage: true }));
	} catch (error) {
		console.error('Cannot JSON.stingify message: ', message);
	}
}
