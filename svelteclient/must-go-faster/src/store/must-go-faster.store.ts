import * as cg from 'chessground/types';
import type {
	MoveToServer,
	OpponentType,
	PlayerColor,
	ToMessage,
	ToPayload
} from '$lib/models/models';
import { move } from 'chessground/drag';
import { writable } from 'svelte/store';

export const playerColor = writable<PlayerColor>('white');
export const opponentType = writable<OpponentType>();
export const isAgainstComputer = writable(false);
export const sessionId = writable<string>();

// todo: baseUrl should go to env variable,
// opponent type shouldn't be required for a connection,
// it should be a separate message type unto itself
export const socket = writable<WebSocket>();

export function createSocket(baseUrl: string, opponentType: OpponentType): WebSocket {
	return new WebSocket(`${baseUrl!}/connect?opponentType=${opponentType}`);
}

export function sendMessage({
	type,
	connection,
	playerColor,
	sessionId,
	isAgainstComputer,
	move
}: {
	type: 'move' | 'premove' | 'timeout'; // etc; move to models.ts
	connection: WebSocket | undefined;
	playerColor: PlayerColor;
	sessionId: string;
	isAgainstComputer: boolean;
	move?: { from: cg.Key; to: cg.Key };
}): void {
	if (!connection) {
		console.error('Connection does not exist.');
		return;
	}

	if (connection.readyState !== connection.OPEN) {
		console.error(
			'Attempted send() on connection that is not open. State: ',
			connection.readyState
		);
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
	}

	try {
		connection.send(JSON.stringify(message ?? { invalidMessage: true }));
	} catch (error) {
		console.error('Cannot JSON.stingify message: ', message);
	}
}
