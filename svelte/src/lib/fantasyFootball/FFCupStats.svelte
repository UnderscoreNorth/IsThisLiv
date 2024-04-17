<script lang="ts">
	import { ffStore } from './fantasyFootballStore';
	import FFTable from '$lib/fantasyFootball/FFtable.svelte';
	import FFTeamCreator from './FFTeamCreator.svelte';
	import { api } from '$lib/constants';
	export let currentCup: number;	
	let cupID = $ffStore.cupID;
	let selectedTab = 'Board stats';
	const tabs = ['Board stats', 'Team stats', 'Player stats', 'Fantasy Team'];
	const selectTab = (tab: string) => {
		selectedTab = tab;
	};
	const loadData = async () => {
		return await api('/ff/cup',{cupID});
	};
	let promise = loadData();
	ffStore.subscribe((value) => {
		if (cupID != value.cupID) {
			cupID = value.cupID;
			console.log(cupID, currentCup);
			promise = loadData();
		}
	});
</script>

{#await promise}
	Loading...
{:then data}
	{#if Object.values(data.boardData).length}
		<div id="cupStatContainer">
			<div id="cupStatNav">
				{#each tabs as tab}
					<button
						class={selectedTab == tab ? 'buttonHighlighted' : ''}
						on:click={() => {
							selectTab(tab);
						}}
						disabled={tab == 'Fantasy Team' && cupID !== currentCup}>{tab}</button
					><br />
				{/each}
			</div>
			{#if selectedTab == 'Board stats'}
				<div>
					<FFTable data={Object.values(data.boardData)} />
				</div>
			{:else if selectedTab == 'Team stats'}
				<div>
					<FFTable data={Object.values(data.teamData)} />
				</div>
			{:else if selectedTab == 'Player stats'}
				<div>
					<FFTable data={Object.values(data.playerData)} />
				</div>
			{:else if selectedTab == 'Fantasy Team'}
				<FFTeamCreator />
			{/if}
		</div>
	{:else}
		No data for this cup
	{/if}
{/await}

<style>
	#cupStatNav {
		position: sticky;
		top: 0;
		height: 10rem;
	}
	#cupStatContainer {
		display: flex;
	}
	button {
		color: inherit;
		background: none;
		border: none;
		padding-right: 1rem;
		width: 4rem;
	}
	.buttonHighlighted {
		box-shadow: inset -0.5rem 0px var(--fg-color);
	}
	button:hover {
		background: rgba(100, 100, 100, 0.25);
		cursor: pointer;
	}
	button:disabled {
		cursor: default;
		background: none;
		opacity: 0.5;
	}
</style>
