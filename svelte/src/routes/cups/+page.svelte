<script>
	import config from '$lib/config.json';
	import MdAddBox from 'svelte-icons/md/MdAddBox.svelte';
	import CupModal from '$lib/cupModal.svelte';
	import { User } from '$lib/user';
	/**
	 * @param {object} api
	 */
	let api = config.api;
	export let data;
	let displayCupModal = false;
	let toggleCupModal = () => {
		displayCupModal = !displayCupModal;
	};
</script>

<svelte:head>
	<title>Cups - IsThisLiv</title>
</svelte:head>
<div class="p-1" id="cupContainer">
	<h1>
		Cup Stats
		{#if $User.username}
			<icon
				on:click={() => {
					displayCupModal = true;
				}}
				style="display:inline-block;vertical-align:text-bottom"><MdAddBox /></icon
			>
		{/if}
	</h1>
	{#if displayCupModal}
		<CupModal {toggleCupModal} />
	{/if}
	{#await data}
		<p>Loading...</p>
	{:then data}
		<div id="tableContainer">
			<table>
				<thead>
					<tr>
						<th>Cup</th>
						<th>Teams</th>
						<th>Matches</th>
						<th>1st</th>
						<th>2nd</th>
						<th>3rd</th>
						<th>4th</th>
						<th>Matches going<br />to E.T.</th>
						<th>Matches going<br />to Pens</th>
						<th>Goals</th>
						<th>Golden Boot</th>
						<th>Golden Ball</th>
						<th>Golden Glove</th>
						<th>Yellow Cards</th>
						<th>Red Cards</th>
					</tr>
				</thead>
				<tbody>
					{#each data.rows as row}
						<tr>
							{#each row as cell}
								<td>{@html cell}</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/await}
</div>

<style>
	thead {
		position: sticky;
		top: 0;
		background: var(--bg-color);
	}
	#tableContainer {
		height: calc(100% - 5rem);
		overflow-y: scroll;
	}
	#cupContainer {
		height: calc(100% - 2rem);
	}
</style>
