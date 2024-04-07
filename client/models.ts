export type BaseResponse = {
	fen: string;
	gameId: string;
	whosNext: 'white' | 'black';
	playerColor: 'white' | 'black';
	validMoves: { [key: string]: string[] };
};

export type GameStartedResponse = BaseResponse & {
	gameStarted: boolean;
};

export type MoveResponse = BaseResponse & {
	move: any; // todo
};
