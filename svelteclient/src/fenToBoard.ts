const border = ['#', '#', '#', '#', '#', '#', '#', '#', '#', '#'];

// assume input is valid
export function fenToBoard(fen: string) {
	const [board, activeColor, castling, enPassant, halfMoves, fullMoves] =
		fen.split(' ');
	const ranks = board.split('/');
	const textRankArray = [border];

	for (const rank of ranks) {
		const textRank = ['#'];

		for (const square of rank) {
			if (Number.isInteger(+square)) {
				let skip = +square;

				while (skip) {
					textRank.push('_');
					skip--;
				}
			} else {
				textRank.push(square);
			}
		}

		textRank.push('#');
		textRankArray.push(textRank);
	}

	textRankArray.push(border);

	let output = '';
	for (const textRank of textRankArray) {
		for (const square of textRank) {
			output += square + ' ';
		}
		output += '\n';
	}

	console.log(output);
}

// fenToBoard(startingFen);
