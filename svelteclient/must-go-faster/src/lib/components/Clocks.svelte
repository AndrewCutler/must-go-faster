<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gameState } from '../../store/must-go-faster.store';
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
					isWhiteTurn = value.whosNext === 'white';
					whiteTime = value.whiteTimeLeft;
					blackTime = value.blackTimeLeft;
					runClock({
						whoseMove: isWhiteTurn ? 'white' : 'black',
						whiteTimeLeft: value.whiteTimeLeft,
						blackTimeLeft: value.blackTimeLeft
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
		whoseMove,
		whiteTimeLeft,
		blackTimeLeft
	}: {
		whoseMove: PlayerColor | undefined;
		whiteTimeLeft: number;
		blackTimeLeft: number;
	}): void {
		if (timer) {
			cancelAnimationFrame(timer);
		}

		if (!whoseMove) return;

		const startTime = performance.now();
		const initialTime = whoseMove === 'white' ? whiteTimeLeft : blackTimeLeft;

		function animate(): void {
			const elapsed = (performance.now() - startTime) / 1000;
			const remainingTime = Math.max(0, initialTime - elapsed);

			if (whoseMove === 'white') {
				whiteTime = remainingTime;
			} else {
				blackTime = remainingTime;
			}

			if (remainingTime <= 0) {
				// Handle timeout
				// TODO: Implement sendMessage for timeout
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
	<div class="flex-col text-lg font-semibold">
		<div
			class="flex rounded-t-md border-2 border-b-0 border-gray-700 p-1 dark:bg-white dark:text-black"
		>
			{formatTime(whiteTime)}
		</div>
		<div
			class="flex rounded-b-md border-2 border-gray-700 p-1 dark:bg-black dark:text-white"
		>
			{formatTime(blackTime)}
		</div>
	</div>
</div>
<!-- 
<div class="mb-4">
	<div
		class="rounded-lg border border-gray-200 bg-white p-6 shadow-lg dark:border-gray-700 dark:bg-gray-800"
	>
		<div class="mb-4 border-b border-gray-200 pb-2 dark:border-gray-600">
			<h3 class="text-lg font-semibold text-gray-800 dark:text-white">Chess Clocks</h3>
		</div>

		<div class="mb-4 flex flex-col gap-4">
			<div
				class="flex items-center justify-between rounded-md border-2 border-transparent bg-gray-50 p-4 transition-all duration-300 dark:bg-gray-700 {isWhiteTurn
					? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
					: ''}"
			>
				<div class="font-semibold text-gray-700 dark:text-gray-300">White</div>
				<div class="font-mono text-xl font-bold text-gray-900 dark:text-white">
					{formatTime(whiteTime)}
				</div>
			</div>

			<div
				class="flex items-center justify-between rounded-md border-2 border-transparent bg-gray-50 p-4 transition-all duration-300 dark:bg-gray-700 {!isWhiteTurn
					? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
					: ''}"
			>
				<div class="font-semibold text-gray-700 dark:text-gray-300">Black</div>
				<div class="font-mono text-xl font-bold text-gray-900 dark:text-white">
					{formatTime(blackTime)}
				</div>
			</div>
		</div>
	</div>
</div> -->
