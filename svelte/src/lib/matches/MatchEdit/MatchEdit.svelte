<script lang='ts'>
	export let matchID:number;
	import config from '$lib/config.json';
	import MatchEditData from './MatchEditData.svelte';
	let api = config.api;
	function close() {
		matchID = 0;
	}
	let data = (async () => {
		let response = await fetch(`${api}api/sql/matchDisplay/` + matchID);
		let returnObject = await response.json();
		returnObject.matchID = matchID;
		let tzOffset = new Date().getTimezoneOffset() * 60000;
		returnObject.date = new Date(returnObject.date);
		returnObject.date = new Date(returnObject.date - tzOffset).toISOString().replace('Z','');
		for(let i in returnObject.performances){
			for(let j = 0;j<15;j++){
				returnObject.performances[i][j] = returnObject.performances[i][j] || {};
				if(returnObject.performances[i][j].bMotM){
					returnObject.motm = returnObject.performances[i][j].iPlayerID
				}
			}
		}
		console.log(returnObject);
		return returnObject;
	})();
	function getData(data) {
		console.log(data);
		console.log(new Date(data.date));
	}
</script>

<closeout>
	{#await data}
		<container class="c-2"> Loading... </container>
	{:then data}
		<container class="c-2">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<x
				on:click={() => {
					close();
				}}>X</x
			>
			<button
				on:click={() => {
					getData(data);
				}}>Save</button
			>
			<MatchEditData {data} />
		</container>
	{/await}
</closeout>

<style>
	container {
		position: fixed;
		top: 3rem;
		left: 3rem;
		right: 3rem;
		bottom: 3rem;
		z-index: 3;
		overflow-y: scroll;
		padding: 1rem;
		text-align: center;
		box-shadow: 0 0.5rem 0.5rem black;
	}
	closeout {
		position: fixed;
		height: 100%;
		width: 100%;
		z-index: 2;
		top: 0;
		left: 0;
	}
	x {
		float: right;
		width: 2rem;
		height: 2rem;
		text-align: center;
		line-height: 2rem;
		margin: 0.5rem;
		cursor: pointer;
		border-radius: 0.25rem;
		background: rgb(145, 3, 3);
		color: white;
	}
	x:hover {
		background: rgb(95, 8, 8);
	}
</style>
