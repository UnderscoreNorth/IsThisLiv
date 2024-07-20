<script lang='ts'>
	import { page } from '$app/stores';
	import { api} from '$lib/helper';
	import Modal from '$lib/modal.svelte';
	import TeamIcon from '$lib/teamIcon.svelte';
	import TeamLink from '$lib/teamLink.svelte';
	import { User } from '$lib/user';
	//@ts-ignore
	import MdEdit from 'svelte-icons/md/MdEdit.svelte';
	//@ts-ignore
	import MdCancel from 'svelte-icons/md/MdCancel.svelte'
	//@ts-ignore
	import MdSave from 'svelte-icons/md/MdSave.svelte'
	import Datetime from '$lib/datetime.svelte';
	//let data;	
	let data:any = {};
	let id = '';
	page.subscribe((p)=>{
		if(id!==p.url.pathname){
			id = p.url.pathname;
			data = api($page.url.pathname?.split('-')?.[0]);
		}
	});
	let name = '';
	let editing = false;
	let input:HTMLInputElement;
	async function save(){
		await api('/sql/updateLinkName',{linkID:(await data).linkID,name})
		location.reload();
	}
</script>

<svelte:head>
	{#await data}
		<title>Loading...</title>
	{:then data}
		<title>/{data.playerTeam}/ - {data.playerName} - IsThisLiv</title>
	{/await}
</svelte:head>
<container>
	{#await data}
		<h2>Loading...</h2>
	{:then data}
		{#if data.date}			
			<div id="pageModifiedTime">Last updated - <Datetime date={data.date} multiline={false}/></div>
			<h2>
				<TeamIcon team={data.playerTeam}/><TeamLink team={data.playerTeam}/> - 
				{#if editing}
					<input bind:this={input} bind:value={name}>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<icon on:click={()=>{save()}}><MdSave/></icon>
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<icon on:click={()=>{editing=!editing;name=data.playerName}}><MdCancel/></icon>
				{:else}
					{data.playerName}
					{#if $User.access > 0}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<!-- svelte-ignore a11y-no-static-element-interactions -->
						<icon on:click={()=>{editing=!editing;name=data.playerName;setTimeout(()=>{input.focus()},100) }}><MdEdit/></icon>
					{/if}
				{/if}
			</h2>
			{@html data.html}
		{:else}
			<h2>Player not found</h2>
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
	container :global(table) {
		border: solid 1px grey;
		background: rgba(0, 0, 0, 0.1);
	}
	container :global(td) {
		text-align: left;
	}
	icon{
		height:1.5rem;
		width:1.5rem;
	}
	icon:hover{
		background:#2e51a2
	}
	input{
		font-size:1.5rem;
		width: fit-content;
		border:0;
		padding:0;
	}
</style>
