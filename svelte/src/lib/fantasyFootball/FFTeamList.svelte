<script lang="ts">
	import { api } from "$lib/constants";

	let data = (async () => {
		return Object.values(await api('/list/teams',{aliveTeams:true,order:'sTeam',dir:'ASC'}));
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
