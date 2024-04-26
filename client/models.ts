import * as cg from 'chessground/types.js';

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
	timeLeft: number;
};

export type GameStartedResponse = Omit<MoveResponse, 'isCheckmated'> & {
	gameStarted: boolean;
};

export type TimeoutResponse = BaseResponse & {
	loser: PlayerColor;
};

export type AbandondedResponse = {
	abandonded: boolean;
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

export function isAbandondedResponse(obj: any): obj is AbandondedResponse {
	return obj.abandonded !== undefined;
}

export type Move = {
	from: cg.Key;
	to: cg.Key;
};

type WithGameId = {
	gameId: string;
};

export type MoveRequest = {
	move: Move;
} & WithGameId;

export type TimeoutRequest = {
	timeout: true;
	playerColor: PlayerColor;
} & WithGameId;

export type Config = {
	startingTime: number;
	chainablePremove: boolean;
};
