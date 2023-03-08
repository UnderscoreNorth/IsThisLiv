<script>
	import config from '$lib/config.json';
	/**
	 * @type {any[]}
	 */
	let api = config.api;
	let data = (async () => {
		const response = await fetch(`${api}api/teams`);
		return await response.json();
	})();
</script>

<svelte:head>
	<title>Teams - IsThisLiv</title>
</svelte:head>
<div id="container">
	<h1>Team Stats</h1>
	{#await data}
		<p>Loading...</p>
	{:then data}
		<p>Click on a header to sort</p>
		<table>
			<thead>
				<tr>
					<th>Team</th>
					<th>Elites</th>
					<th>Babbies</th>
					<th>Cups</th>
					<th>Pld</th>
					<th>W</th>
					<th>D</th>
					<th>L</th>
					<th>Eff</th>
					<th>Pts</th>
					<th>APts</th>
					<th>GF</th>
					<th>AGF</th>
					<th>GA</th>
					<th>AGA</th>
					<th>GD</th>
					<th>AGD</th>
				</tr>
			</thead>
			<tbody>
				{#each data as row}
					<tr>
						{#each row as cell}
							<td>{@html cell}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/await}
</div>

<style>
	table {
		border: solid 1px grey;
		background: rgba(0, 0, 0, 0.1);
	}
</style>
