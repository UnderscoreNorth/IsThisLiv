<script lang="ts">
	import { api } from '$lib/constants';
	import FFPositionList from './FFPositionList.svelte';
	import FFTeamList from './FFTeamList.svelte';
	import { ffStore } from './fantasyFootballStore.js';
	let user = '';
	let inputUser = '';
	let pvtKey = '';
	let cupID = $ffStore.cupID;
	const teamList = async () => {
		return await api('/ff/teamList',{cupID});
	};
	const login = async () => {};
	const register = async () => {};
</script>

<div id="ffTeamCreateContainer">
	{#if user}
		<FFTeamList />
		<FFPositionList />
	{:else}
		{#await teamList()}
			Loading...
		{:then data}
			<div id="ffTeamLogin">
				<input bind:value={inputUser} placeholder="Fantasy Team Name" list="teamNames" /><br />
				<input
					bind:value={pvtKey}
					placeholder="Private Key (for existing teams)"
					type="password"
				/><br />
				<datalist id="teamNames">
					{#each data as team}
						<option value={team} />
					{/each}
				</datalist>
				<button on:click={login}>Login</button><button on:click={register}>Register</button>
			</div>
		{/await}
	{/if}
</div>

<style>
	#ffTeamCreateContainer {
		padding-left: 1rem;
		width: calc(100% - 1rem);
	}
	#ffTeamLogin {
		width: 30rem;
		margin: auto;
		padding: 0.5rem;
	}
	#ffTeamLogin input {
		width: calc(100% - 1rem);
		padding: 0.5rem;
		margin-bottom: 0.5rem;
	}
	#ffTeamLogin button {
		padding: 0.5rem;
		margin-right: 0.5rem;
	}
</style>
