<script lang="ts">
	import { sendMessage } from '$lib/socket/socket';
	import { clear } from 'chessground/draw';
	import {
		gameState,
		isAgainstComputer
	} from '../../store/must-go-faster.store';

	let { board } = $props();

	let countdownInterval: number | undefined = $state(undefined);
	let countdownValue = $state(0);

	export function startCountdown(): void {
		if (countdownInterval) {
			clearInterval(countdownInterval);
		}

		if ($gameState?.sessionId && $gameState?.playerColor) {
			countdownValue = 5;
			countdownInterval = setInterval(function () {
				--countdownValue;
				if (countdownValue <= 0) {
					gameState.update((state) => ({
						...state!,
						type: 'GameStartedToServerType'
					}));
					sendMessage({
						type: 'GameStartedToServerType',
						playerColor: $gameState?.playerColor,
						sessionId: $gameState.sessionId,
						isAgainstComputer: $isAgainstComputer
					});
					board?.set({
						viewOnly: false,
						movable: {
							dests: board.state.movable.dests,
							color: board.state.movable.color
						},
						draggable: {
							enabled: true
						}
					});

					clearInterval(countdownInterval);
				}
			}, 1000);
		} else {
			console.error(
				'Cannot start countdown: missing sessionId or playerColor',
				{
					sessionId: $gameState?.sessionId,
					playerColor: $gameState?.playerColor
				}
			);
		}
	}
</script>

<div
	id="countdown-timer"
	class={[
		countdownValue ? ' block' : 'hidden',
		'absolute',
		'top-1/2',
		'left-1/2',
		'-translate-1/2',
		'font-black',
		'text-8xl',
		'z-20'
	]}
>
	{countdownValue}
</div>
