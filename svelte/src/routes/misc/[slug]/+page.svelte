<script>
	import { page } from '$app/stores';
	import { api } from '$lib/constants';
	let data = api('/misc/' + $page.params.slug);
</script>

<svelte:head>
	<title
		>{$page.url.pathname
			.substring(6)
			.split('_')
			.map((x) => x.charAt(0).toUpperCase() + x.substring(1).toLowerCase())
			.join(' ')} - IsThisLiv</title
	>
</svelte:head>

<container>
	{#await data}
		<h2>Loading...</h2>
	{:then data}
		{#if data.date}
			<div id="pageModifiedTime">Last updated - {data.date}</div>
		{/if}
		{@html data.html}
	{:catch}
		<h2>Error</h2>
		Thank you, spaghetti code
	{/await}
</container>

<style>
	container {
		display: block;
		padding: 1rem;
		height: calc(100% - 2rem);
		overflow-y: scroll;
	}
	#pageModifiedTime {
		float: right;
	}
	container :global(table) {
		border: solid 1px grey;
		background: rgba(0, 0, 0, 0.1);
	}
</style>
