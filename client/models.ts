export type BaseResponse = {
	fen: string;
	gameId: string;
	whosNext: 'white' | 'black';
    playerColor: 'white' | 'black'
};

export type GameStartedResponse = BaseResponse & {
	gameStarted: boolean;
	validMoves: { [key: string]: string[] };
};

export type MoveResponse = BaseResponse & {
	move: any; // todo
};
