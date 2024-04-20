<script lang='ts'>
	import { page } from '$app/stores';
	import { api } from '$lib/helper';
	import Records from '$lib/records.svelte';
	type Res = {
		date: Date,
		data:Record<string,Record<
			string,
			{
				header: Array<{ header: string; colspan?: number }>;
				rows: Array<Array<string | number>>;
				numbered: boolean;
			}
		>>
	}
	let res: Promise<Res>;
	let id = '';
	page.subscribe((p)=>{
		if(id!==p.url.pathname){
			id = p.url.pathname;
			res = api($page.url.pathname);
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
	{#await res}
		<h2>Loading...</h2>
	{:then res}
		{#if res.date}
			<div id="pageModifiedTime">Last updated - {res.date}</div>
			<h2>Records</h2>
			<Records res={res.data}/>
		{/if}
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
	:global(.recordContainer){
		padding:1rem;
		border: solid 1px grey;
		background: rgba(0, 0, 0, 0.1);
		margin:1rem;
		display:inline-block;
		max-width:50rem;
		vertical-align:top
	}
    :global(th){text-align:center}
	:global(h4){margin:10px 0}

</style>
