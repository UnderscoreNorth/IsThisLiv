<script>
	export let toggleModal;
	export let cupID;
	export let hasMatches;
	import { User } from '../user';
	import config from '$lib/config.json';
	let api = config.api;
	let bulkType = 0;
	const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
	let bulkTeams = {};
	for (let groupLetter of groupLetters) {
		bulkTeams[groupLetter] = {};
		for (let i = 0; i < 5; i++) {
			bulkTeams[groupLetter][i] = '';
		}
	}
	let submitBulk = async () => {
		if ($User.username && bulkType) {
			let data = {
				bulkTeams,
				bulkType,
				user: $User.username,
				cupID
			};
			let response = await fetch(`${api}api/matches/bulk`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			});
			let jsonResponse = await response.json();
			location.reload();
		}
	};
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<closeout on:click={toggleModal}>
	<container
		class="c-2"
		on:click={(e) => {
			e.stopPropagation();
		}}
	>
		<h3>Match Add</h3>

		{#if !hasMatches}
			<hr />
			<h3>Bulk Add</h3>
			Group type
			<select bind:value={bulkType}>
				<option value="1">32 Teams Traditional Schedule</option>
				<option value="1.1">32 Teams Modern Schedule</option>
				<option value="2">40 Teams Traditional Schedule</option>
				<option value="2.1">40 Teams Modern Schedule</option>
			</select>
			<groupsContainer>
				{#each groupLetters as groupLetter}
					<div>
						Group {groupLetter}
						<input placeholder="team" bind:value={bulkTeams[groupLetter][0]} />
						<input placeholder="team" bind:value={bulkTeams[groupLetter][1]} />
						<input placeholder="team" bind:value={bulkTeams[groupLetter][2]} />
						<input placeholder="team" bind:value={bulkTeams[groupLetter][3]} />
						{#if Math.floor(bulkType) == 2}
							<input placeholder="team" bind:value={bulkTeams[groupLetter][4]} />
						{/if}
					</div>
				{/each}
			</groupsContainer>
			<button on:click={submitBulk}>Submit</button>
		{/if}
	</container>
</closeout>

<style>
	container {
		position: fixed;
		top: 3rem;
		width: 38rem;
		left: calc(50% - 20rem);
		z-index: 3;
		padding: 1rem;
		text-align: center;
		box-shadow: 0 0.5rem 0.5rem black;
	}
	closeout {
		position: fixed;
		height: 100%;
		width: 100%;
		z-index: 2;
		top: 0;
		left: 0;
	}
	groupsContainer {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
		width: 100%;
	}
	groupsContainer input {
		width: calc(100% - 1rem);
	}
</style>
