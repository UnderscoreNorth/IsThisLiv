<script lang='ts'>
	import { page } from '$app/stores';
	import { User } from '$lib/user';
	// @ts-ignore
	import MdAddBox from 'svelte-icons/md/MdAddBox.svelte';
	import { cupShort, cupToBooru, getBooru, teamLink } from '$lib/helper';	
	import MatchEdit from './MatchEdit.svelte';
	import MatchAdd from './MatchAdd.svelte';
	import TeamModal from './teamModal.svelte';
	import { api } from '$lib/helper';
	import TeamIcon from '$lib/teamIcon.svelte';
	import Gallery from '$lib/gallery.svelte'
	import Records from '$lib/records.svelte';
	import type { MainRes } from './types';
	import Sidebar from './sidebar.svelte';
	import Matches from './matches.svelte';
	import Section from './section.svelte';
	import Stats from './stats.svelte';
	let matchID = 0;
	let data:Promise<MainRes>;
	let imgs:Promise<any>;
	function editMatch(ID:number) {
		matchID = ID;
	}
	let displayAddMatchModal = false;
	let toggleAddMatchModal = () => {
		displayAddMatchModal = !displayAddMatchModal;
	};
	let displayTeam = '';
	
	let recordData:Promise<any>;
	async function getData(slug:string){		
		data = api('/cups/' + slug?.split('-')?.[0]).then((data)=>{
			if(data.cupName){
				imgs = getBooru(cupToBooru(data.cupName))
				recordData = api('/records/cups/' + data.cupID);
			}
			return data;
		});
			
	}	
	page.subscribe(async(p)=>{
		if(p.params.slug){
			if(!p.url.pathname.includes('cup')) return;
			if(data){
				data.then((r)=>{
					if(r?.cupID !== parseInt(p.params.slug.split("-")[0])){
						getData(p.params.slug);
					}
				})
			} else {
				getData(p.params.slug);
			}
		}
	})	
	let show = {
		'Records':false,
		'Gallery':false,
		'Statistics':true
	}
</script>

<svelte:head>
	{#await data}
		<title>Loading...</title>
	{:then data}
		{#if data?.cupName}
		<title>{data.cupName} - IsThisLiv</title>
		{/if}
	{/await}
</svelte:head>
<container>
{#if matchID > 0}
	<MatchEdit bind:matchID />
{/if}
{#await data}
<vertNav class="c-1" />
<contents>
	<h1>Loading...</h1>
</contents>
{:then data}
	{#if data?.cupName}
	{#if displayAddMatchModal}
		<MatchAdd
			cupID={data.cupID}
			toggleModal={toggleAddMatchModal}
		/>
	{/if}
	{#if displayTeam}
		<TeamModal
			cupID={data.cupID}
			team={displayTeam}
			clear={()=>{displayTeam=''}}
		/>
	{/if}
	<vertNav class="c-1" style={'font-size:small'}>
		<Sidebar {data}/>
	</vertNav>
	<contents>
		<div id="pageModifiedTime">Last updated - {data.date}</div>
		<h1 id="Top">				
			{data.cupName}{#if $User.user}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<icon
					title={'Add match(es)'}
					on:click={() => {
						displayAddMatchModal = true;
					}}
					style="display:inline-block;vertical-align:text-bottom"><MdAddBox /></icon
				>
			{/if}
		</h1>
		<statContainer class="c-1">
			Dates: {data.dates} Matches: {data.numMatches} Goals Scored: {data.goals} ({data.gpm} gpm)
		</statContainer>
		<teamsContainer id="Teams" class="c-1">
			{#each data.teams as teamData}
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<teamBox on:click={()=>displayTeam=teamData} class="c-2"><TeamIcon team={teamData}/>{@html teamLink(teamData)}</teamBox>
			{/each}
		</teamsContainer>
		<Matches {data} {editMatch}/>
		<Section {show} section='Statistics'>
			<div class='groupsContainer' style="padding:0 2rem">
				<Stats {data} />
			</div>
		</Section>			
		<Section {show} section='Records'>
			<div id='recordsContainer'  class='groupsContainer'  style="padding:0 2rem">
				{#await recordData}
					<h3>Loading...</h3>
					{:then records}
						<Records res={records.data}/>
				{/await}
			</div>
		</Section>
		<Section {show} section='Gallery'>
			<Gallery {imgs} />
		</Section>
		
	</contents>
	{:else}
		<vertNav class="c-1" />
		<contents>
			<h1>Cup not found</h1>
		</contents>
	{/if}
{/await}

</container>

<style>
	container {
		display: grid;
		grid-template-columns: 10rem 1fr;
		position: relative;
		height: 100%;
	}
	contents {
		height: calc(100% - 2rem);
		overflow-y: scroll;
		padding: 1rem;
		width: calc(100% - 2rem);
	}
	statContainer {
		margin: 1rem;
		padding: 0.5rem;
	}
	teamsContainer {
		margin: 1rem;
		border: solid 1px #a2a9b1;
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		width: calc(100% - 3rem);
	}
	
	teamBox {
		display: inline-block;
		padding: 0.5rem 0;
		margin: 0.25rem;
		border-radius: 0.25rem;		
		white-space: nowrap;
	}
	teamBox:hover{
		cursor: pointer;
		background:var(--bg-color)
	}
	
	:global(h2) {
		border-bottom: solid 1px grey;
	}
	
	@media only screen and (max-width: 1000px) {
		vertNav{
			display:none;
		}
		#pageModifiedTime{
			float:none;
			padding:0;
		}
		container {
			grid-template-columns: 1fr;
			font-size: 65%;
		}
		statcontainer{
			display:block;
		}
		teamscontainer{
			display:flex;
			flex-wrap: wrap;
		}
		:global(teamscontainer teambox){
			padding:2px 0.5rem 2px 0!important;
		}
		
	}
	#recordsContainer{
		display:flex;
		flex-wrap: wrap;
		flex-direction: column;
		gap:1rem;
	}
	:global(#recordsContainer table){
		max-width: fit-content;
		border-collapse: collapse;
	}
	:global(#recordsContainer td:not(:first-child):not(:last-child)){
		border-right:solid 1px var(--fg-color);
		border-left:solid 1px var(--fg-color);
	}
	:global(#recordsContainer th:not(:first-child):not(:last-child)){
		border-right:solid 1px var(--fg-color);
		border-left:solid 1px var(--fg-color);
	}
	:global(#recordsContainer table tr:first-child th){
		padding:0 3px;
		border-bottom:solid 1px var(--fg-color);
	}
	:global(#recordsContainer h3){
		margin-bottom: 0;
	}
	:global(#recordsContainer h4){
		margin: 5px;
	}
</style>
