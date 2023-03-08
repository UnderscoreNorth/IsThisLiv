<script lang="ts">
	import config from '$lib/config.json';
	const api = config.api;
	let data = (async () => {
		const response = await fetch(`${api}api/list/teams`, {
			method: 'post',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				aliveTeams: true,
				order: 'sTeam',
				dir: 'ASC'
			})
		});
		return Object.values(await response.json());
	})();
</script>

<div>
	{#await data}
		Loading...
	{:then data}
		{#each data as team}
			<div>/{team.sTeam}/</div>
		{/each}
	{/await}
</div>
