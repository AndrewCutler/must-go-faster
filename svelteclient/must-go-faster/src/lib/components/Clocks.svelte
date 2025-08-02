<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		gameState,
		isAgainstComputer,
		type GameState
	} from '../../store/must-go-faster.store';
	import type { PlayerColor } from '$lib/models/models';
	import { sendMessage } from '$lib/socket/socket';

	let whiteTime = 30;
	let blackTime = 30;
	let isWhiteTurn = true;
	let timer: number;

	onMount(() => {
		const unsub = gameState.subscribe((value) => {
			// TODO: switch statement
			if (value) {
				if (
					value.type === 'GameStartedToServerType' ||
					value.type === 'MoveFromServerType'
				) {
					if (value.premove) {
						console.log('playing premove...');
						console.log(value.premove);
						// wipe out premove
						gameState.update((prev) => ({
							...(prev as GameState),
							premove: undefined
						}));
						// send premove message
						sendMessage({
							type: 'PremoveToServerType',
							move: value.premove,
							playerColor: value.playerColor,
							sessionId: value.sessionId,
							isAgainstComputer: $isAgainstComputer
						});
					}
					isWhiteTurn = value.whosNext === 'white';
					whiteTime = value.whiteTimeLeft;
					blackTime = value.blackTimeLeft;
					runClock({
						whosNext: value.whosNext,
						whiteTimeLeft: value.whiteTimeLeft,
						blackTimeLeft: value.blackTimeLeft,
						sessionId: value.sessionId,
						playerColor: value.playerColor
					});
					return;
				}

				if (value.type === 'GameOverFromServerType' && timer) {
					cancelAnimationFrame(timer);
				}
			}
		});

		return unsub;
	});

	function runClock({
		whosNext,
		whiteTimeLeft,
		blackTimeLeft,
		sessionId,
		playerColor
	}: Required<
		Pick<
			GameState,
			| 'whiteTimeLeft'
			| 'blackTimeLeft'
			| 'sessionId'
			| 'playerColor'
			| 'whosNext'
		>
	>): void {
		if (timer) {
			cancelAnimationFrame(timer);
		}

		if (!whosNext) return;

		const startTime = performance.now();
		const initialTime = whosNext === 'white' ? whiteTimeLeft : blackTimeLeft;

		function animate(): void {
			const elapsed = (performance.now() - startTime) / 1000;
			const remainingTime = Math.max(0, initialTime - elapsed);

			if (whosNext === 'white') {
				whiteTime = remainingTime;
			} else {
				blackTime = remainingTime;
			}

			// if (remainingTime <= 0) {
			if (remainingTime <= 0 && whosNext === playerColor) {
				sendMessage({
					type: 'TimeoutToServerType',
					sessionId,
					isAgainstComputer: $isAgainstComputer,
					playerColor: whosNext
				});
				return;
			}

			timer = requestAnimationFrame(animate);
		}

		timer = requestAnimationFrame(animate);
	}

	onDestroy(() => {
		if (timer) {
			cancelAnimationFrame(timer);
		}
	});

	function formatTime(seconds: number): string {
		return (seconds > 0 ? seconds : 0).toFixed(1);
	}
</script>

<div class="flex items-center">
	<div class="flex-coltext-lg font-semibold">
		<div
			class="flex rounded-t-md border-2 border-b-0 border-gray-700 bg-white p-1 px-3 py-1 text-black"
		>
			{formatTime(whiteTime)}
		</div>
		<div
			class="flex rounded-b-md border-2 border-gray-700 bg-black p-1 px-3 py-1 text-white"
		>
			{formatTime(blackTime)}
		</div>
	</div>
</div>
