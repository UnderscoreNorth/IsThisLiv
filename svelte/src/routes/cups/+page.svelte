<script>
	// @ts-ignore
	import MdAddBox from 'svelte-icons/md/MdAddBox.svelte';
	import CupModal from '$lib/cupModal.svelte';
	import { User } from '$lib/user';
	import { api } from '$lib/helper';
	import Modal from '$lib/modal.svelte';
	/**
	 * @param {object} api
	 */
	let data = api('/cups');
	let displayCupModal = false;
	let toggleCupModal = () => {
		displayCupModal = !displayCupModal;
	};
</script>

<svelte:head>
	<title>Cups - IsThisLiv</title>
</svelte:head>
<div id="cupContainer">
	<h1>
		Cup Stats
		{#if $User.user}
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<icon
				on:click={() => {
					displayCupModal = true;
				}}
				style="display:inline-block;vertical-align:text-bottom"><MdAddBox /></icon
			>
		{/if}
	</h1>
	<Modal close={toggleCupModal} title={'New Cup'}>
		<CupModal />
	</Modal>
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
					{#each data as row}
						<tr>
							{#each row as cell,i}
								<td style:text-align={i==0 ? 'left' : ''}>{@html cell}</td>
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
		padding:1rem;
	}
	@media only screen and (max-width: 1000px) {
		tr *:not(:first-child){
			display: none;
		}
		#cupContainer{
			padding:0
		}
	}
</style>
