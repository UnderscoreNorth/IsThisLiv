<script lang='ts'>
	import { page } from '$app/stores';
	import Datetime from '$lib/datetime.svelte';
	import { api } from '$lib/helper';
	import Records from '$lib/records.svelte';
	import { sidebarStore } from '$lib/sideBarStore';
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
			$sidebarStore = p.url.pathname.replace('/records/','').replace('Misc-','').replaceAll('%20', ' ');
		}
	})
</script>

<title
	>{$page.url.pathname
		.substring(9).replace('Misc','')
		.split(/-|%20/gm)
		.map((x) => x.charAt(0).toUpperCase() + x.substring(1).toLowerCase())
		.join(' ')} - IsThisLiv</title
>
<div id='container'>
	{#await res}
		<h2>Loading...</h2>
	{:then res}
		{#if res.date}
		<div id="pageModifiedTime">Last updated - <Datetime date={res.date} multiline={false}/></div>
			{#if res.data}
			<h2>Records</h2>
			<div id='recordContainer'>
				<Records res={res.data}/>
			</div>
			{/if}
			{#if res.html}
				{@html res.html}
			{/if}
		{/if}
	{:catch}
		<h2>Error</h2>
		Thank you, spaghetti code
	{/await}
</div>

<style>
	#container {
		padding: 1rem;
	}
	#pageModifiedTime {
		float: right;
	}
	#recordContainer{		
		display: flex;
		flex-wrap: wrap;
		flex-direction: row;
	}
	#recordContainer :global(h3){
		width:100%
	}
	#recordContainer :global(.recordContainer){
		padding:1rem;
		border: solid 1px grey;
		background: rgba(0, 0, 0, 0.1);
		margin:1rem;
		vertical-align:top
	}
	#recordContainer :global(.recordContainer td){
		max-width:15rem;
	}
	#recordContainer :global(.recordContainer .teamIcon){
		max-height: 1rem;
	}
	#recordContainer :global(.recordContainer a){
		vertical-align: bottom;
	}
    #recordContainer :global(th){text-align:center}
	#recordContainer :global(h4){margin:10px 0}

</style>
