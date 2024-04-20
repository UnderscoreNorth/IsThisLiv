<script>
	import { page } from '$app/stores';
	import { api } from '$lib/helper';
	//let data;	
	let data = {};
	let id = '';
	page.subscribe((p)=>{
		if(id!==p.url.pathname){
			id = p.url.pathname;
			data = api($page.url.pathname);
		}
	})
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
