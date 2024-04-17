<script lang="ts">
	import { User } from '$lib/user';
	import { ffStore } from '$lib/fantasyFootball/fantasyFootballStore';
	import { api } from '$lib/constants';
	let ffCalculating = false;
	const calcFF = async () => {
		ffCalculating = true;
		await api('/ff/calculate',{cupID:$ffStore.cupID});
		ffCalculating = false;
	};
</script>

{#if $User.user}
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
