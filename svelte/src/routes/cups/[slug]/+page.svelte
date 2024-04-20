<script lang='ts'>
	import { page } from '$app/stores';
	import { User } from '$lib/user';
	// @ts-ignore
	import MdAddBox from 'svelte-icons/md/MdAddBox.svelte';
	import { cupShort, cupToBooru, getBooru, teamLink } from '$lib/helper';
	import MdAdd from 'svelte-icons/md/MdAdd.svelte'
	import MdRemove from 'svelte-icons/md/MdRemove.svelte'
	import MatchEdit from '$lib/matches/MatchEdit/MatchEdit.svelte';
	import MatchDisplay from '$lib/matches/matchDisplay.svelte';
	import Brackets from '$lib/brackets.svelte';
	import MatchAdd from '$lib/matches/MatchAdd.svelte';
	import TeamModal from '$lib/team/teamModal.svelte';
	import { browser } from '$app/environment';
	import { api } from '$lib/helper';
	import { goto } from '$app/navigation';
	import TeamIcon from '$lib/teamIcon.svelte';
	import Gallery from '$lib/gallery.svelte'
	import Records from '$lib/records.svelte';
	let matchID = 0;
	let data:Promise<{
		teams: string[];
		cupID: number;
		cupName: string;
		dates: string;
		matches: Record<
			"groups" | "kos",
			{
				name: string;
				matches: [
				{
					date: string;
					time: string;
					stadium: string;
					attendance: number;
					home: string;
					away: string;
					winner: string;
					homeg: number;
					awayg: number;
					id: number;
					official: number;
					roundOrder: number;
				}
				];
				table: any;
			}[]
		>;
		goals: number;
		numMatches: number;
		gpm: number;
		scorers: any[];
		assisters: any[];
		owngoalers: any[];
		goalies: any[];
		cards: any[];
		date:Date;
	}>;
	let imgs:Promise<any>;
	function editMatch(ID:number) {
		matchID = ID;
	}
	let displayAddMatchModal = false;
	let toggleAddMatchModal = () => {
		displayAddMatchModal = !displayAddMatchModal;
	};
	let displayTeam = '';
	let cupsData = api('/cups/list');
	let select:HTMLSelectElement;
	let recordData:Promise<any>;
	async function getData(slug:string){
		data = api('/cups/' + slug).then((data)=>{
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
	function changeCup(id=0){
		goto(select.value + '-' + select.options[select.selectedIndex].text.replace(" ","-"))
		//$page.params.slug = select.value + '-' + select.options[select.selectedIndex].text.replace(" ","-");
		//data = api('/cups/' + select.value + '-' + select.options[select.selectedIndex].text.replace(" ","-"));
		/*if(browser){
			if(id == 0){
				window.location.replace('/cups/' + select.value + '-' + select.options[select.selectedIndex].text.replace(" ","-"))
			} else {
				console.log(id,Array.from(select.options).filter((x)=>x.value == id.toString()));
				window.location.replace('/cups/' + id + '-' + Array.from(select.options).filter((x)=>x.value == id.toString())[0].label.replace(" ","-"))
			}			
		}*/
	}
	function getCupURL(cups,id){
		return id + '-' + cupShort(cups.filter((x)=>x.cupID == id)[0].cupName).replace(" ","-");
	}
	//<a href='/cups/{getCupURL(cups,data.cupID-1)}' on:click={()=>{changeCup(data.cupID-1)}}  class='element' style='float:left'>&lt;</a>
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
{#await data}
<container>
	<vertNav class="c-1" />
	<contents>
		<h1>Loading...</h1>
	</contents>
</container>
{:then data}
	{#if data?.cupName}
	{#if displayAddMatchModal}
		<MatchAdd
			cupID={data.cupID}
			toggleModal={toggleAddMatchModal}
			hasMatches={Object.values(data.matches).length > 0}
		/>
	{/if}
	{#if displayTeam}
		<TeamModal
			cupID={data.cupID}
			team={displayTeam}
			clear={()=>{displayTeam=''}}
		/>
	{/if}
	<container>
		<vertNav class="c-1" style={'font-size:small'}>
			<img src='/icons/cups/{data.cupID}.png' alt='logo' style='border-radius:1rem;background:var(--bg-color);padding:5px' /><br/>
				{#await cupsData}
				<select></select>
				{:then cups}
				<div>
				<select class='element' style='margin-bottom:0.7rem' bind:this={select} value={data.cupID} on:change={()=>{changeCup()}}>
					{#each cups as row}
						<option value={row.cupID}>{cupShort(row.cupName)}</option>
					{/each}
				</select>
				</div>
				{/await}
			<a href="#Top">Top</a>
			<a href="#Teams">Competitors</a>
			{#if data.matches.groups}
				<a href="#Groups">Group Stage</a>
				{#each data.matches.groups as group}
					<a style="padding-left:1rem" href="#{group.name}">{group.name}</a>
				{/each}
			{/if}
			{#if data.matches.kos}
				<a href="#Knockouts">Knockout Stage</a>
				{#each data.matches.kos as group}
					<a style="padding-left:1rem" href="#{group.name}">{group.name}</a>
				{/each}
			{/if}
			<a href="#Stats">Statistics</a>
			<a style="padding-left:1rem" href="#goals">Goals</a>
			<a style="padding-left:1rem" href="#assists">Assists</a>
			<a style="padding-left:1rem" href="#saves">Saves</a>
			<a style="padding-left:1rem" href="#cards">Cards</a>
			<a href="#Records">Records</a>
			<a href="#Gallery">Gallery</a>
		</vertNav>
		<contents>
			<div id="pageModifiedTime">Last updated - {data.date}</div>
			<h1 id="Top">				
				{data.cupName}{#if $User.user}
					<!-- svelte-ignore a11y-click-events-have-key-events -->
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
					<teamBox on:click={()=>displayTeam=teamData} class="c-2"><TeamIcon team={teamData}/>{@html teamLink(teamData)}</teamBox>
				{/each}
			</teamsContainer>
			{#if data.matches.groups}
				<h2 id="Groups">Group Stage</h2>
				<div class='groupsContainer' style="padding:0 2rem">
					{#each data.matches.groups as group}
						<div class="groups">
							<h3 id={group.name}>{group.name}</h3>
							{#if !['Playoff Knockout'].includes(group.name)}
								<groupTable>
									<tr>
										<th>Team</th>
										<th>Pld</th>
										<th>W</th>
										<th>D</th>
										<th>L</th>
										<th>GF</th>
										<th>GA</th>
										<th>GD</th>
										<th>Pts</th>
									</tr>
									{#each group.table as row}
										<tr class={row.status}>
											{#each row.data as cell}
												<td>{@html cell}</td>
											{/each}
										</tr>
									{/each}
								</groupTable>
							{/if}
							{#each group.matches as match}
								<match>
									<MatchDisplay {editMatch} {match} />
								</match>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
			{#if data.matches.kos}
				<h2 id="Knockouts">Knockout Stage</h2>
				<div id='bracketContainer'>
				<Brackets data2={data} />
			</div>
				<div class='groupsContainer' style="padding:0 2rem">
					{#each data.matches.kos as group}
						<div class="kos">
							<h3 id={group.name}>{group.name}</h3>
							{#each group.matches as match}
								<match>
									<MatchDisplay {editMatch} {match} />
								</match>
							{/each}
						</div>
					{/each}
				</div>
			{/if}
			{#if matchID > 0}
				<MatchEdit bind:matchID />
			{/if}
			<h2 id="Stats">Statistics</h2>
			<div class='groupsContainer' style="padding:0 2rem">
				<h2 id='goals'>Goals</h2>
				{#each data.scorers as subArr}
					{#if subArr?.num}
						<h3>{subArr.num}</h3>
						{#each subArr.players as scorer}
							<div style="display:inline-block;width:20%">{@html scorer}</div>
						{/each}
					{/if}
				{/each}
				<h2 id='assists'>Assists</h2>
				{#each data.assisters as subArr}
					{#if subArr?.num}
						<h3>{subArr.num}</h3>
						{#each subArr.players as scorer}
							<div style="display:inline-block;width:20%">{@html scorer}</div>
						{/each}
					{/if}
				{/each}
				<h2 id='saves'>Saves</h2>
				{#each data.goalies as subArr}
					{#if subArr?.num}
						<h3>{subArr.num}</h3>
						{#each subArr.players as scorer}
							<div style="display:inline-block;width:20%">{@html scorer}</div>
						{/each}
					{/if}
				{/each}
				<h2 id='cards'>Cards</h2>
				{#each data.cards as subArr}
					{#if subArr?.num}
						<h3>{subArr.num}</h3>
						{#each subArr.players as scorer}
							<div style="display:inline-block;width:20%">{@html scorer}</div>
						{/each}
					{/if}
				{/each}
			</div>
			<h2 id='Records'>Records</h2>
			<div id='recordsContainer'  class='groupsContainer'  style="padding:0 2rem">
				{#await recordData}
					<h3>Loading...</h3>
				 {:then records}
					{#if records.data}
						<Records res={records.data}/>
					{/if}
				{/await}
			</div>
			<h2 id='Gallery'>Gallery</h2>
			<Gallery {imgs} />
		</contents>
	</container>
	{:else}
	<container>
	<vertNav class="c-1" />
	<contents>
		<h1>Cup not found</h1>
	</contents>
</container>
	{/if}
	
{/await}

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
	groupTable {
		display: table;
		border-collapse: collapse;
		border-radius: 2px;
		margin-bottom: 1rem;
	}
	groupTable th {
		background: #eee;
	}
	groupTable,
	th,
	td {
		border: solid 1px #c9c9c9;
		color: black;
		padding: 2px;
		text-align: center;
		min-width: 2rem;
	}
	:global(.groups td a) {
		color: black !important;
	}
	tr.green {
		background: #ccffcc;
	}
	tr.red {
		background: #ffcccc;
	}
	teamBox {
		display: inline-block;
		padding: 1rem;
		margin: 0.25rem;
		border-radius: 0.25rem;		
	}
	teamBox:hover{
		cursor: pointer;
		background:var(--bg-color)
	}
	match {
		display: grid;
		grid-template-columns: 3fr 2fr 1fr 2fr 3fr;
		padding-bottom: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.groups match:nth-child(2n):not(:last-of-type) {
		border-bottom: solid 1px grey;
	}
	.kos match:not(:last-of-type) {
		border-bottom: solid 1px grey;
	}
	h2 {
		border-bottom: solid 1px grey;
	}
	.element{
		background: var(--bg-color);
		color: var(--fg-color);
		padding: 0.2rem;
	}
	groupTable tr td:nth-child(1){
		text-align: left;
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
		.groups{
			display:flex;
			flex-wrap: wrap;
			flex-direction: column;
		}
		groupTable th, groupTable td{
			min-width: 0 !important;
		}
		.groupsContainer{
			padding:0 !important;	
		}
		#bracketContainer{
			overflow-x: auto;
			min-width: 40rem;
			min-height: fit-content;
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
