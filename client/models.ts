import * as cg from 'chessground/types.js';
import { Config as CGConfig } from 'chessground/config';

export type PlayerColor = 'white' | 'black';

export type GameStatus = 'ongoing' | 'lost' | 'won' | 'draw';

type BaseResponse = {
	fen: string;
	gameId: string;
	whosNext: PlayerColor;
	playerColor: PlayerColor;
};

export type MoveResponse = BaseResponse & {
	validMoves: { [key: string]: string[] };
	isCheckmated: PlayerColor | '';
	// timeLeft: number;
	whiteTimeLeft: number;
	blackTimeLeft: number;
};

export type GameStartedResponse = Omit<MoveResponse, 'isCheckmated'> & {
	gameStarted: boolean;
};

export type TimeoutResponse = BaseResponse & {
	loser: PlayerColor;
};

export type AbandonedResponse = {
	abandoned: boolean;
};

export function isGameStartedResponse(
	obj: unknown,
): obj is GameStartedResponse {
	return (obj as any).gameStarted !== undefined;
}

export function isMoveResponse(obj: unknown): obj is MoveResponse {
	return (
		(obj as any).validMoves !== undefined &&
		(obj as any).gameStarted === undefined
	);
}

export function isTimeoutResponse(obj: any): obj is TimeoutResponse {
	return obj.loser !== undefined;
}

export function isAbandonedResponse(obj: any): obj is AbandonedResponse {
	return obj.abandoned !== undefined;
}

export type Move = {
	from: cg.Key;
	to: cg.Key;
};

type BaseRequest = {
	gameId: string;
	type: 'move' | 'premove' | 'timeout' | 'gameStarted';
};

export type GameStartedRequest = BaseRequest;

export type MoveRequest = {
	move: Move;
} & BaseRequest;

export type TimeoutRequest = {
	timeout: true;
	playerColor: PlayerColor;
} & BaseRequest;

export type PremoveRequest = {
	premove: Move;
} & BaseRequest;

export type Config = {
	startingTime: number;
	chainablePremove: boolean;
};

export interface ChessgroundConfig extends CGConfig {
	premovable?: CGConfig['premovable'] & { current?: string[] };
}
