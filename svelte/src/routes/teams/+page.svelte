<script lang='ts'>
	import { api } from "$lib/helper";
	import TeamIcon from "$lib/teamIcon.svelte";
	import TeamLink from "$lib/teamLink.svelte";
	let call = api('/teams/overall').then((r)=>{
		data = r;
	sort(0);
	}
);
	let data: {headers:Array<string>,data:Array<Record<string,string|number>>} = {headers:[],data:[]};
	let sortAsc = true;
	let sortField = -1;
	const sort = (field: number) => {
		if (field == sortField) {
			sortAsc = !sortAsc;
		} else {
			sortAsc = field == 0 ? true : false;
			sortField = field;
		}
		data.data.sort((a, b) => {
			console.log(a, b);
			let res = 0;
			let af = Object.values(a)[field];
			let bf = Object.values(b)[field];
			if (af > bf) {
				res = 1;
			} else if (af < bf) {
				res = -1;
			}
			if (!sortAsc) res *= -1;
			return res;
		});
		data = data;
	};
</script>

<svelte:head>
	<title>Teams - IsThisLiv</title>
</svelte:head>
<div id="container">
	<h1>Team Stats</h1>
	{#await call}
		<p>Loading...</p>
	{:then r}
		<p>Click on a header to sort</p>
		<table>
			<thead>
				<tr>
					<th>#</th>
					{#each data.headers as header,i}
						<th
							on:click={() => {
								sort(i);
							}}>{@html header}</th
						>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each data.data as row, i}
					<tr>
						<td>{i + 1}</td>
						{#each Object.values(row) as field,j}
							{#if j == 0}
							<td style:text-align='left'><TeamIcon team={field.toString()}/><TeamLink team={field.toString()} /></td>
							{:else}
							<td>{j==16 && field > 0 ? '+' : ''}{field}{[4,9].includes(j) ? '%' : ''}</td>
							{/if}
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/await}
</div>

<style>
	th {
		background: var(--bg-color);
	}
	th:not(:first-child):hover {
		cursor: pointer;
	}
	tr:nth-of-type(2n) {
		background: rgba(0, 0, 0, 0.25);
	}
	tr:hover {
		background: rgba(255, 255, 255, 0.3);
	}
	thead {
		position: sticky;
		top: 0;
		background: inherit;
		z-index: 1;
	}
	table {
		background: inherit;
	}
	td > span {
		border-radius: 0.25rem;
	}
</style>

