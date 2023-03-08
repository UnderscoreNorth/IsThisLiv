<script>
	import config from '$lib/config.json';
	import FFTeamCreator from '$lib/fantasyFootball/FFTeamCreator.svelte';
	import FFCupStats from '$lib/fantasyFootball/FFCupStats.svelte';
	import { ffStore } from '$lib/fantasyFootball/fantasyFootballStore';
	import FFNav from '$lib/fantasyFootball/FFNav.svelte';
	const api = config.api;
	let currentCup = 0;
	const loadData = async () => {
		const response = await fetch(`${api}api/list/cups`, {
			method: 'post',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				order: 'dStart',
				dir: 'DESC'
			})
		});
		let result = await response.json();
		currentCup = result[0].iID;
		ffStore.update((r) => {
			r.cupID = result[0].iID;
			return r;
		});
		return result;
	};
	let data = loadData();
</script>

<svelte:head>
	<title>FF - IsThisLiv</title>
</svelte:head>
<div id="ffContainer">
	{#await data}
		Loading...
	{:then data}
		<h1>
			Fantasy Football
			<select id="slt_cup" bind:value={$ffStore.cupID}>
				{#each data as cup}
					<option value={cup.iID}>{cup.sName}</option>
				{/each}
			</select>
			<FFNav />
		</h1>
		<div id="ffContent">
			<FFCupStats {currentCup} />
		</div>
	{/await}
</div>

<style>
	#slt_cup {
		font-size: inherit;
	}
	#ffContainer {
		display: flex;
		flex-direction: column;
		padding: 1rem;
		padding-bottom: 0;
		height: calc(100% - 1rem);
	}
	h1 {
		flex: 0 0 auto;
	}
	#ffContent {
		flex: 1 1 auto;
		overflow-y: scroll;
	}
</style>
