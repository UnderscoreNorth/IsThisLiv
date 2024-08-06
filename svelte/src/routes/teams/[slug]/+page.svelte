<script lang="ts">
import { page } from '$app/stores';
	import { api } from '$lib/helper';
	import { cupShort, cupToBooru, getBooru} from '$lib/helper';
	import Gallery from '$lib/gallery.svelte'
	import TeamRoster from '$lib/teamRoster.svelte';
	import TeamIcon from '$lib/teamIcon.svelte';
	import Records from '$lib/records.svelte';
	import Datetime from '$lib/datetime.svelte';
		//@ts-ignore
	import MdAssessment from 'svelte-icons/md/MdAssessment.svelte'
	import MatchDetails from '$lib/matches/matchDetails.svelte';
	//let data;	
	let data = {};
	let sortData;
	let id = '';
	let imgs;
	let records:Promise<any>;
	let team:string;
	page.subscribe((p)=>{
		if(id!==p.url.pathname){
			if(!p.url.pathname.includes('team')) return;
			id = p.url.pathname;
			team = $page.url.pathname.replace('/', '').substring(6);
			data = api($page.url.pathname).then((r)=>{
				imgs = getBooru('/' + team + '/')
				sortData = r;
				records =  api('/records/teams/' + team);
				return r;
			});
		}
	})
	
	let sortAsc = false;
	let sortField = '';
	const sortTable = (field: string, defaultSort = false) => {
		if (field == sortField) {
			sortAsc = !sortAsc;
		} else {
			sortAsc = defaultSort;
			sortField = field;
		}
		sortData.roster.data.sort((a, b) => {
			let res = 0;
			let af = a[field] || -99999999;
			let bf = b[field] || -99999999;
			if (parseFloat(af) == af) {
				af = parseFloat(af);
			} else {
				af = af.toString().toUpperCase();
			}
			if (parseFloat(bf) == bf) {
				bf = parseFloat(bf);
			} else {
				bf = bf.toString().toUpperCase();
			}
			if (af > bf) {
				res = 1;
			} else if (af < bf) {
				res = -1;
			}
			if (!sortAsc) res *= -1;
			return res;
		});
		data = sortData;
	};
	let matchID = 0;
</script>

<svelte:head>
	<title>/{team}/ - IsThisLiv</title>
</svelte:head>
{#if matchID > 0}
	<MatchDetails bind:matchID />
{/if}
{#await data}
	<h2>Loading...</h2>
{:then data}
	{#if !data.statsHtml}
		<h2>Team not found</h2>
	{:else}
	<div style='display:flex;flex-direction:column;height:100%'>
		<div>
			{#if data.date}
				<div id="pageModifiedTime">Last updated - <Datetime date={data.date} multiline={false}/></div>
			{/if}
			<h2 id="header">
				<TeamIcon team={team}/> /{team}/ - 
				<a href='#roster'>Roster</a>
				<a href="#stats">Stats</a>
				<a href="#matches">Matches</a>
				<a href='#gallery'>Gallery</a>
				<a href="#rostertimeline">Roster Timeline</a>
				<a href='#records'>Records</a>
			</h2>
		</div>
		<container>
			<grid>
				<div>
					<h3 id='roster'>Roster</h3>
					<TeamRoster roster={data.latestRoster} />
				</div>
				<div>
					<h3 id='stats'>Stats</h3>
					{@html data.statsHtml}
				</div>
				<div>
					<h3 id='matches'>Matches</h3>
					<table>
						<tr>
						  <th>Cup</th>
						  <th>Round</th>
						  <th>Date</th>
						  <th>Team</th>
						  <th>Result</th>
						  <th>Scorers</th>
						</tr>
						{#each data.matchesHtml as row}
						<tr class={row.status}>
							{@html row.cup}
							<td>{row.round}</td>
							<td>{row.date}</td>
							<td>{@html row.team}</td>
							<td>{row.result}</td>
							<td>{@html row.scorers}</td>
							<td><icon on:click={()=>matchID = row.matchID}><MdAssessment /></icon></td>
							{@html row.num}
						</tr>
						{/each}
					</table>
					
				</div>
				<div>
					<h3 id='gallery'>Gallery</h3>
					<Gallery {imgs} />
				</div>
			</grid>
			<div >
				<h3 id="rostertimeline">Roster Timeline</h3>
				<div id='rosterContainer'>
				<table id="tbl_roster">
					{#each data.roster.header as headerRow,i}
						<tr style='position:sticky;top:calc({i*1.2}rem;z-index:1'>
							{#each headerRow as header}
								<th
									class={header.sort ? 'pointer' : ''}
									colspan={header.colSpan || 1}
									on:click={() => {
										if (header.sort) sortTable(header.sort, header.dir);
									}}
								>
									{header.text}
								</th>
							{/each}
						</tr>
					{/each}
					{#each data.roster.data as player}
						<tr class="playerRow">
							<td class='rosterPlayerNameCell'  title={player.truename}>{@html player.name}</td>
							<td>{player.apps}</td>
							<td>{player.cups}</td>
							<td>{player.goals}</td>
							<td>{player.assists}</td>
							<td>{player.saves}</td>
							<td>{player.rating}</td>
							{#each data.roster.cups as cup}
								<td
									class={'rosterCell ' +
										('t' + Math.floor(player[cup.year + cup.season]) || 'no') +
										(player[cup.year + cup.season] % 1 > 0 ? ' cap' : '')}
									>{player[cup.year + cup.season] ? '_' : ''}</td
								>
							{/each}
						</tr>
					{/each}
					{@html data.roster.footer}
				</table>
			</div>
			</div>
			<div id='recordsContainer'>
				<h3 id='records'>Records</h3>
				{#await records}
					Loading...
				{:then records}	
					<Records res={records.data}/>
				{/await}
			</div>
			{@html data.styleHtml}
		</container>
	</div>
	{/if}
	
{:catch}
	<h2>Error</h2>
	Thank you, spaghetti code
{/await}

<style>
	.pointer:hover {
		cursor: pointer;
		background: var(--bg-c2);
	}
	#rosterContainer{
		overflow-x: auto;
		max-height: calc(100vh - 7rem);
		overflow-y: auto;
	}
	.rosterPlayerNameCell{
		position:sticky;
		left:0;
		background:var(--bg-color)
	}
	#tbl_roster td {
		font-size: 0.9rem;
		overflow: hidden;
		white-space: nowrap;
		border-bottom: solid 1px rgba(255, 255, 255, 0.25);
		text-overflow: ellipsis;
		max-width: 12rem;
	}
	#tbl_roster {
		border-collapse: collapse;
	}
	.rosterCell {
		width: 1.5rem;
	}
	#tbl_roster tr:nth-child(-n + 25) {
		background: rgba(109, 126, 116, 0.5);
	}
	#tbl_roster tr:nth-child(-n + 2) {
		background: var(--bg-color);
	}
	#tbl_roster .playerRow:hover {
		background: #94a6d1;
	}
	#header {
		padding: 1rem;
		margin: 0;
		height: 1.5rem;
		flex-shrink: 0;
	}
	#recordsContainer :global(.recordContainer){
		display:inline-block;
		padding: 1rem;
	}
	#recordsContainer :global(h3){
		margin-bottom: 0;
	}
	#recordsContainer:global( h4){
		margin: 5px;
	}
	container {
		flex-shrink: 1;
		overflow-y: auto;
		padding:1rem;
	}
	grid{
		display:flex;
		flex-wrap: wrap;
		gap:1rem;
	}
	container :global(table) {
		border: solid 1px grey;
		background: rgba(0, 0, 0, 0.1);
	}
	container :global(td) {
		text-align: left;
	}
	@media only screen and (max-width: 1500px) {
		grid{
			grid-template-columns: 1fr;
		}
	}
	icon {
		height: 1rem;
		width: 1rem;
		float: right;
		display: block;
		cursor: pointer;
		border-radius: 0.25rem;
		padding: 0.25rem;
	}
	icon:hover {
		background: #2e51a2;
	}
</style>
