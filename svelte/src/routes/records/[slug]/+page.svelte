<script>
	import config from '$lib/config.json';
	import { page } from '$app/stores';
	import { afterNavigate } from '$app/navigation';
	let api = config.api;
	let firstLoad = true;
	let data = fetch(`${api}api` + $page.url.pathname).then((result) => {
		firstLoad = false;
		return result.json();
	});
	afterNavigate(() => {
		if (!firstLoad) {
			data = fetch(`${api}api` + $page.url.pathname).then((result) => {
				return result.json();
			});
		}
	});
</script>

<title
	>{$page.url.pathname
		.substring(9)
		.split('-')
		.map((x) => x.charAt(0).toUpperCase() + x.substring(1).toLowerCase())
		.join(' ')} - IsThisLiv</title
>
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
