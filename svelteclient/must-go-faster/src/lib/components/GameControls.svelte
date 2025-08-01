<script lang="ts">
	import { createSocket } from '$lib/socket/socket';
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();

	let { playerType = 'Computer', isConnected = false } = $props();
	let isDropdownOpen = false;

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function selectPlayerType(type: string) {
		playerType = type;
		isDropdownOpen = false;
		dispatch('playerTypeChange', { type });
	}

	function connect() {
		createSocket('computer');
	}

	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		const dropdown = document.querySelector('[data-dropdown]');
		if (dropdown && !dropdown.contains(target)) {
			isDropdownOpen = false;
		}
	}

	// Add click outside listener
	$effect(() => {
		if (isDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => document.removeEventListener('click', handleClickOutside);
		}
	});
</script>

<div class="flex items-center">
	<div class="rounded-lg border border-gray-700 bg-gray-800 p-3 shadow-lg">
		<div class="mb-4 border-b border-gray-600 pb-2">
			<h3 class="text-lg font-semibold text-white">Game Controls</h3>
		</div>

		<div class="flex flex-col gap-4">
			<!-- Player Type Dropdown -->
			<div class="flex flex-col gap-2">
				<div class="relative">
					<button
						class={[
							'flex',
							'w-full',
							'cursor-pointer',
							'items-center',
							'justify-between',
							'rounded-md',
							'border',
							'border-gray-600',
							'bg-gray-700',
							'px-2',
							'py-1',
							'text-base',
							'transition-all',
							'duration-200',
							'hover:bg-gray-600'
						]}
						onclick={toggleDropdown}
						type="button"
						aria-expanded={isDropdownOpen}
						aria-haspopup="listbox"
						aria-label="Select player type"
					>
						<span class="font-medium text-white">{playerType}</span>
						<!-- TODO: chevron icon -->
						<span
							class="text-gray-400 transition-transform duration-200 {isDropdownOpen
								? 'rotate-180'
								: ''}"
						>
							<svg
								class="h-4 w-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								></path>
							</svg>
						</span>
					</button>
					{#if isDropdownOpen}
						<div
							class="absolute left-0 right-0 top-full z-10 mt-1 rounded-md border border-gray-600 bg-gray-700 shadow-lg"
							role="listbox"
							data-dropdown
						>
							<div class="py-1">
								<button
									class="w-full px-4 py-3 text-left text-white transition-colors duration-200 hover:bg-gray-600 {playerType ===
									'Computer'
										? 'bg-blue-900/20 font-semibold text-blue-300'
										: ''}"
									onclick={() => selectPlayerType('Computer')}
									type="button"
									role="option"
									aria-selected={playerType === 'Computer'}
								>
									Computer
								</button>
								<button
									class="w-full px-4 py-3 text-left text-white transition-colors duration-200 hover:bg-gray-600 {playerType ===
									'Human'
										? 'bg-blue-900/20 font-semibold text-blue-300'
										: ''}"
									onclick={() => selectPlayerType('Human')}
									type="button"
									role="option"
									aria-selected={playerType === 'Human'}
								>
									Human
								</button>
							</div>
						</div>
					{/if}
				</div>
			</div>

			<!-- Connection Button -->
			<div class="flex flex-col gap-2">
				<button
					class="w-full rounded-md px-2 py-1 text-base font-semibold transition-colors duration-200 {!isConnected
						? 'bg-gray-700 text-white hover:bg-gray-600'
						: 'bg-red-600 text-white hover:bg-red-700'}"
					onclick={connect}
					type="button"
				>
					{isConnected ? 'Disconnect' : 'Find a game'}
				</button>
			</div>
		</div>
	</div>
</div>
