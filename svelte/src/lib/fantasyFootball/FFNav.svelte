<script lang="ts">
	import { User } from '$lib/user';
	import { ffStore } from '$lib/fantasyFootball/fantasyFootballStore';
	import config from '$lib/config.json';
	const api = config.api;
	let ffCalculating = false;
	const calcFF = async () => {
		ffCalculating = true;
		const response = await fetch(`${api}api/ff/calculate`, {
			method: 'post',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				cupID: $ffStore.cupID
			})
		});
		ffCalculating = false;
	};
</script>

{#if $User.username}
	<button on:click={calcFF} disabled={ffCalculating}>Calculate FF</button>
{/if}

<style>
	button {
		font-size: inherit;
		background: none;
		color: inherit;
		margin-left: 5px;
		border: none;
	}
	button:hover {
		cursor: pointer;
		background: rgba(255, 255, 255, 0.5);
	}
</style>
