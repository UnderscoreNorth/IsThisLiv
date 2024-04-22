<script>
	import { ffStore } from './fantasyFootballStore';
	import SignIn from './signIn.svelte';
	import TeamEditor from './teamEditor.svelte';
</script>

<svelte:head>
	<title>FF - IsThisLiv</title>
</svelte:head>
<div id="ffContainer">
	{#if $ffStore.teamID > 0}
		<TeamEditor/>
	{:else}
		<SignIn/>
	{/if}
</div>
<style>
	#ffContainer {
		display: flex;
		flex-direction: column;
		padding-bottom: 0;
		height: calc(100vh - 2.5rem);
	}
</style>
