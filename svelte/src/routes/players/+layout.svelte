<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { api } from '$lib/constants';
	let width: any;
	let data = [];
	let search = '';
	let searching = false;
	let lastSearch = '-1';
	afterNavigate(() => {
		if (width <= 1000) {
			search = '';
			data = [];
		}
	});
	async function searchPlayer() {		
		if (!searching) {
			searching = true;
			data = await api('/players/search',{search});
			searching = false;
			if (lastSearch != '-1') {
				lastSearch = '-1';
				searchPlayer();
			}
		} else {
			lastSearch = search;
		}
	}
</script>

<svelte:window bind:innerWidth={width} />
<div id="container">
	{#if width <= 1000}
		<div>
			<div>
				<input id="playerSearch" bind:value={search} placeholder="Search" on:input={searchPlayer} />
				<button
					id="clearSearch"
					on:click={() => {
						search = '';
						data = [];
					}}>X</button
				>
			</div>
		</div>
		{#if search.length}
			<div id="searchResults">
				{#each data as player}
					<div style="margin-bottom:0.2rem">
						<a href="/players/{player.id}-{player.urlName}">
							<div class="teamTag">/{player.team}/</div>
							<div class="playerTag">{player.name}</div></a
						>
					</div>
				{/each}
			</div>
		{:else}
			<slot />
		{/if}
	{:else}
		<vertNav class="c-1">
			<input bind:value={search} placeholder="Search" on:input={searchPlayer} />
			<div id="searchResults">
				{#each data as player}
					<div style="margin-bottom:0.2rem">
						<a href="/players/{player.id}-{player.urlName}">
							<div class="teamTag">/{player.team}/</div>
							<div class="playerTag">{player.name}</div></a
						>
					</div>
				{/each}
			</div>
		</vertNav>
		<slot />
	{/if}
</div>

<style>
	#container {
		display: grid;
		grid-template-columns: 14rem 1fr;
		position: relative;
		height: 100%;
	}

	#searchResults {
		margin-top: 1rem;
		overflow-x: hidden;
		overflow-y: scroll;
		overflow-wrap: break-word;
		margin-right: -1rem;
		height: calc(100vh - 7rem);
	}
	@media only screen and (max-width: 1000px) {
		#container {
			grid-template-columns: 1fr;
			grid-template-rows: 2.5rem 1fr;
		}
		#searchResults {
			margin-right: 0;
			background: var(--bg-color);
			padding-left: 1rem;
		}
		#playerSearch {
			width: calc(100% - 3rem - 10px);
			border-radius: 5px;
			padding: 5px;
			line-height: 1rem;
		}
		#clearSearch {
			width: 2rem;
			height: calc(1rem + 10px);
			padding: 0 0.5rem;
			background: none;
			color: var(--fg-color);
			border-radius: 5px;
			border: solid 1px var(--fg-color);
			text-align: center;
		}
	}
	#searchResults a {
		display: block;
		font-size: 0.9rem;
	}
	#searchResults a div {
		display: inline-block;
	}
	.teamTag {
		width: 2.8rem;
		vertical-align: top;
	}
	.playerTag {
		padding-left: 0.1rem;
		width: calc(100% - 3.2rem);
	}
</style>
