import * as cg from 'chessground/types';
import type { Api as ChessgroundApi } from 'chessground/api';
import type { Config as CGConfig } from 'chessground/config';

export type PlayerColor = 'white' | 'black';

export type GameStatus = 'ongoing' | 'lost' | 'won' | 'draw';

export type OpponentType = 'computer' | 'human';

export type MessageType =
	| 'GameJoinedFromServerType'
	| 'GameStartedFromServerType'
	| 'GameOverFromServerType'
	| 'MoveFromServerType'
	| 'PremoveFromServerType'
	| 'TimeoutFromServerType'
	| 'AbandonedFromServerType'
	| 'GameJoinedToServerType'
	| 'GameStartedToServerType'
	| 'MoveToServerType'
	| 'PremoveToServerType'
	| 'TimeoutToServerType'
	| 'AbandonedToServerType'
	| 'NewGameToServerType';

export type Message = {
	sessionId: string;
	playerColor: PlayerColor;
	isAgainstComputer: boolean;
	type: unknown;
};

export type ToMessage<T extends ToPayload> = Message & {
	payload?: T;
	type: Omit<
		MessageType,
		| 'GameJoinedFromServerType'
		| 'GameStartedFromServerType'
		| 'MoveFromServerType'
		| 'PremoveFromServerType'
		| 'TimeoutFromServerType'
		| 'AbandonedFromServerType'
	>;
};

export type FromMessage<T extends FromPayload> = Message & {
	payload: T;
	serverTimeStamp: string; // todo: luxon datetime
	type: Omit<
		MessageType,
		| 'GameJoinedToServerType'
		| 'GameStartedToServerType'
		| 'MoveToServerType'
		| 'PremoveToServerType'
		| 'TimeoutToServerType'
		| 'AbandonedToServerType'
		| 'NewGameToServerType'
	>;
};

export type ToPayload =
	| GameJoinedFromServer
	| GameStartedFromServer
	| GameStartedToServer
	| MoveToServer
	| PremoveToServer
	| TimeoutToServer
	| NewGameToServer;

export type FromPayload =
	| GameJoinedFromServer
	| GameStartedFromServer
	| GameOverFromServerType
	| MoveFromServer
	// | TimeoutFromServer
	| AbandonedFromServer;

export type GameJoinedFromServer = {
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
};

export type GameStartedFromServer = GameJoinedFromServer;

export type GameStartedToServer = undefined;

export type MoveFromServer = {
	whiteTimeLeft: number;
	blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
	isCheckmated: PlayerColor;
	move: Move;
};

export type GameOverFromServerType = {
    loser: PlayerColor;
    outcome: string; // checkmate | timeout | stalemate | etc.
	move: Move;
}

// export type TimeoutFromServer = {
// 	// whiteTimeLeft: number;
// 	// blackTimeLeft: number;
// 	fen: string;
// 	whosNext: PlayerColor;
// 	validMoves: { [key: string]: string[] };
// 	loser: PlayerColor;
// };

export type AbandonedFromServer = {
	abandoned: boolean;
};

export type TimeoutToServer = {
	timeout: boolean;
};

export type MoveToServer = { move: Move };

export type PremoveToServer = {
	premove: Move;
};

export type NewGameToServer = undefined;

export type Move = {
	from: cg.Key;
	to: cg.Key;
};

export interface ChessgroundConfig extends CGConfig {
	premovable?: CGConfig['premovable'] & { current?: string[] };
}

export interface MustGoFasterState {
	sessionId?: string;
	playerColor?: PlayerColor;
	whiteTimeLeft?: number;
	blackTimeLeft?: number;
	whiteTimer?: number;
	blackTimer?: number;
	connection?: WebSocket;
	board?: ChessgroundApi;
	message?: Message;
	wsBaseUrl?: string;
	apiBaseUrl?: string;
	opponentType?: OpponentType;
	isAgainstComputer?: boolean;
}

export type { CGConfig };
