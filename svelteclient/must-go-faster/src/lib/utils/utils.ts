import * as cg from 'chessground/types';

export function toValidMoves(moves: { [key: string]: string[] }): cg.Dests {
	const validMoves = new Map<cg.Key, cg.Key[]>();
	for (const [key, value] of Object.entries(moves)) {
		validMoves.set(key as cg.Key, value as cg.Key[]);
	}

	return validMoves;
}
