<script lang="ts">
import { page } from '$app/stores';
	import { api } from '$lib/helper';
	import { cupShort, cupToBooru, getBooru} from '$lib/helper';
	import Gallery from '$lib/gallery.svelte'
	import TeamRoster from '$lib/teamRoster.svelte';
	import TeamIcon from '$lib/teamIcon.svelte';
	//let data;	
	let data = {};
	let sortData;
	let id = '';
	let imgs;
	page.subscribe((p)=>{
		if(id!==p.url.pathname){
			if(!p.url.pathname.includes('team')) return;
			id = p.url.pathname;
			data = api($page.url.pathname).then((r)=>{
				imgs = getBooru('/' + $page.url.pathname.replace('/', '').substring(6) + '/')
				sortData = r;
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
</script>

<svelte:head>
	<title>/{$page.url.pathname.replace('/', '').substring(6)}/ - IsThisLiv</title>
</svelte:head>

{#await data}
	<h2>Loading...</h2>
{:then data}
	{#if !data.statsHtml}
		<h2>Team not found</h2>
	{:else}
	<div>
		{#if data.date}
			<div id="pageModifiedTime">Last updated - {data.date}</div>
		{/if}
		<h2 id="header">
			<TeamIcon team={$page.url.pathname.replace('/', '').substring(6)}/> /{$page.url.pathname.replace('/', '').substring(6)}/ - <a href="#stats">Stats</a>
			<a href="#matches">Matches</a>
			<a href='#gallery'>Gallery</a>
			<a href="#roster">Roster Timeline</a>
		</h2>
	</div>
	<container>
		<grid>
			<div>
				<h3>Roster</h3>
				<TeamRoster roster={data.latestRoster} />
			</div>
			<div>
				<h3 id='stats'>Stats</h3>
				{@html data.statsHtml}
			</div>
			<div>
				<h3 id='matches'>Matches</h3>
				{@html data.matchesHtml}
			</div>
			<div>
				<h3 id='gallery'>Gallery</h3>
				<Gallery {imgs} />
			</div>
		</grid>
		<div >
			<h3 id="roster">Roster Timeline</h3>
			<table id="tbl_roster">
				{#each data.roster.header as headerRow}
					<tr>
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
						<td title={player.truename}>{@html player.name}</td>
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
		{@html data.styleHtml}
	</container>
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
	container {
		flex-shrink: 1;
		overflow-y: scroll;
		padding: 1rem;
	}
	grid{
		display:grid;
		grid-template-columns: auto 1fr;
		gap:1rem;
	}
	container :global(table) {
		border: solid 1px grey;
		background: rgba(0, 0, 0, 0.1);
	}
	container :global(td) {
		text-align: left;
	}
</style>
