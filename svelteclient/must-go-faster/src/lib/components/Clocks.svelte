<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { gameState } from '../../store/must-go-faster.store';

	let whiteTime = 0;
	let blackTime = 600;
	let isWhiteTurn = true;
	let isRunning = false;
	let interval: number;

	onMount(() => {
		// Start the clock
		// startClock();
		const unsub = gameState.subscribe((value) => {
			whiteTime = value?.whiteTimeLeft;
			blackTime = value?.blackTimeLeft;
		});

		return unsub;
	});

	onDestroy(() => {
		if (interval) {
			clearInterval(interval);
		}
	});

	function startClock() {
		isRunning = true;
		interval = setInterval(() => {
			if (isWhiteTurn) {
				whiteTime--;
			} else {
				blackTime--;
			}
		}, 1000);
	}

	function stopClock() {
		isRunning = false;
		if (interval) {
			clearInterval(interval);
		}
	}

	function formatTime(seconds: number): string {
		return seconds?.toPrecision(4);
	}

	function toggleTurn() {
		if (isRunning) {
			return; // Prevent turn changes while clock is running
		}
		isWhiteTurn = !isWhiteTurn;
	}

	function resetClocks() {
		stopClock();
		whiteTime = 600;
		blackTime = 600;
		isWhiteTurn = true;
	}
	function toggleClock() {
		if (isRunning) {
			stopClock();
		} else {
			startClock();
		}
	}
</script>

<div class="mb-4">
	<!-- TODO change this entire ui. it's ugly and bulky. -->
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

		<div class="flex flex-wrap gap-2">
			<button
				class="min-w-[80px] flex-1 rounded-md bg-gray-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-gray-700"
				on:click={toggleClock}
			>
				{isRunning ? 'Pause' : 'Start'}
			</button>
			<button
				class="min-w-[80px] flex-1 rounded-md bg-gray-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-gray-700"
				on:click={toggleTurn}
			>
				Toggle Turn
			</button>
			<button
				class="min-w-[80px] flex-1 rounded-md bg-red-600 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-red-700"
				on:click={resetClocks}
			>
				Reset
			</button>
		</div>
	</div>
</div>
