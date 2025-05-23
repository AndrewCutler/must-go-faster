import * as cg from 'chessground/types.js';
import { Api as ChessgroundApi } from 'chessground/api';
import { Config as CGConfig } from 'chessground/config';

export type PlayerColor = 'white' | 'black';

export type GameStatus = 'ongoing' | 'lost' | 'won' | 'draw';

export type OpponentType = 'computer' | 'human';

export type MessageType =
	| 'GameJoinedFromServerType'
	| 'GameStartedFromServerType'
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
	type: MessageType;
};

export type ToMessage<T extends ToPayload> = Message & {
	payload?: T;
};

export type FromMessage<T extends FromPayload> = Message & {
	payload?: T;
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
	| MoveFromServer
	| TimeoutFromServer
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

export type TimeoutFromServer = {
	// whiteTimeLeft: number;
	// blackTimeLeft: number;
	fen: string;
	whosNext: PlayerColor;
	validMoves: { [key: string]: string[] };
	loser: PlayerColor;
};

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
