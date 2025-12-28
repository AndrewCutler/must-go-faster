<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import {
		Action,
		gameState,
		isAgainstComputer,
		type GameState
	} from '../../store/must-go-faster.store';
	import { sendMessage } from '$lib/socket/socket';

	let whiteTime = 30;
	let blackTime = 30;
	let timer: number;

	onMount(() => {
		const unsub = gameState.subscribe((state) => {
			console.log(state);
			console.log('2');

			// TODO: switch statement
			if (state && state.action) {
				if (state.action === Action.GameJoined) {
					// if (state.action === 'game joined') {
					whiteTime = 30;
					blackTime = 30;
					if (timer) {
						cancelAnimationFrame(timer);
					}
				}

				if (state.action === Action.SendPremove) {
					gameState.update((prev) => ({
						...(prev as GameState),
						action: Action.ReceiveMove,
						premove: undefined
					}));
					sendMessage({
						type: 'PremoveToServerType',
						move: state.premove,
						playerColor: state.playerColor,
						sessionId: state.sessionId,
						isAgainstComputer: $isAgainstComputer
					});
					return;
				}

				if (state.action === Action.ReceiveMove) {
					whiteTime = state.whiteTimeLeft;
					blackTime = state.blackTimeLeft;
					runClock({
						whosNext: state.whosNext,
						whiteTimeLeft: state.whiteTimeLeft,
						blackTimeLeft: state.blackTimeLeft,
						sessionId: state.sessionId,
						playerColor: state.playerColor
					});
					return;
				}

				if (state.action === 'game over' && timer) {
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
	<div class="flex-col text-lg font-semibold">
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
