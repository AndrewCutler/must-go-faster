import * as cg from 'chessground/types';
import type {
	FromMessage,
	FromPayload,
	GameStartedToServer,
	MessageType,
	MoveToServer,
	OpponentType,
	PlayerColor,
	ToMessage,
	ToPayload
} from '$lib/models/models';
import { receiveMessage } from '../../store/must-go-faster.store';

let socket: WebSocket;

// todo: opponent type shouldn't be required for a connection,
// it should be a separate message type unto itself
export function createSocket(opponentType: OpponentType): void {
	if (socket) {
		console.error('socket already created');
		return;
	}

	const baseUrl: string = import.meta.env.VITE_WS_BASE_URL;
	socket = new WebSocket(`${baseUrl}/connect?opponentType=${opponentType}`);

	socket.onopen = function (openEvent: Event) {
		console.log('WebSocket opened.', { event: openEvent });
	};

	socket.onerror = function (errorEvent: Event) {
		console.error('Socket error.', { event: errorEvent });
	};

	socket.onclose = function (closeEvent: CloseEvent) {
		console.log('Socket closed.', { event: closeEvent });
	};

	socket.onmessage = function (event: MessageEvent) {
		try {
			const message: FromMessage<FromPayload> = JSON.parse(event.data);
			receiveMessage(message);
		} catch (e) {
			console.log(event.data);
			console.error(e);
		}
	};
}

export function sendMessage({
	type,
	sessionId,
	isAgainstComputer,
	playerColor,
	move
}: {
	type: MessageType;
	sessionId: string;
	isAgainstComputer: boolean;
	playerColor?: PlayerColor;
	move?: { from: cg.Key; to: cg.Key };
}): void {
	if (!socket) {
		console.error('Socket does not exist.');
		return;
	}

	if (socket.readyState !== socket.OPEN) {
		console.error(
			'Attempted send() on socket that is not open. State: ',
			socket.readyState
		);
		return;
	}

	let message: ToMessage<ToPayload> | undefined = undefined;
	switch (type) {
		case 'MoveToServerType': {
			if (!move)
				throw new Error('move was undefined when called with type move');
			message = {
				payload: { move: move! },
				playerColor: playerColor,
				sessionId: sessionId!,
				type,
				isAgainstComputer: isAgainstComputer!
			} as ToMessage<MoveToServer>;
			break;
		}
		case 'GameStartedToServerType': {
			message = {
				isAgainstComputer: isAgainstComputer!,
				playerColor: playerColor,
				sessionId: sessionId!,
				type
			} as ToMessage<GameStartedToServer>;
			break;
		}
	}

	try {
		socket.send(JSON.stringify(message ?? { invalidMessage: true }));
	} catch (error) {
		console.error('Cannot JSON.stingify message: ', message);
	}
}
