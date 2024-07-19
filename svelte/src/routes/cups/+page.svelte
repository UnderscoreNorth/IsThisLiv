<script>
	// @ts-ignore
	import MdAddBox from 'svelte-icons/md/MdAddBox.svelte';
	import CupModal from './cupModal.svelte';
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
	{#if displayCupModal}
	<Modal close={toggleCupModal} title={'New Cup'}>
		<CupModal />
	</Modal>
	{/if}
	{#await data}
		<p>Loading...</p>
	{:then data}
		<div id="tableContainer">
			<div id='headers'>
				<div>Cup</div>
				<div>Teams</div>
				<div>1st</div>
				<div>2nd</div>
				<div>3rd</div>
				<div>4th</div>
				<div>Matches<br>going<br />to E.T.</div>
				<div>Matches<br>going<br />to Pens</div>
				<div>Goals</div>
				<div>Golden Boot</div>
				<div>Golden Ball</div>
				<div>Golden Glove</div>
				<div>Yellow Cards</div>
				<div>Red Cards</div>
			</div>
			{#each data as row}
				<div>
					{#each row as cell,i}
						<span style:text-align={i==0 ? 'left' : ''}>{@html cell}</span>
					{/each}
				</div>
			{/each}
		</div>
	{/await}
</div>

<style>
	#headers {
		position: sticky;
		top: 0;
		background: var(--bg-color);
		z-index: 1;
	}
	#tableContainer {
		height: calc(100% - 5rem);
		overflow-y: scroll;
		display:grid;
		grid-template-columns: 2fr auto auto auto auto auto auto auto auto 1fr 1fr 1fr auto auto;
	}
	#tableContainer>div{
		display:grid;
		grid-template-columns: subgrid;
		grid-column: 1/16;
		gap:5px;
		font-size: smaller;
		align-items: center;
	}
	#tableContainer>div span:nth-child(1n + 2){
		text-overflow: ellipsis;
		white-space: nowrap;
		overflow-x: hidden;
	}
	#cupContainer {
		height: calc(100% - 2rem);
		padding:1rem;
	}
	@media only screen and (max-widdiv: 1000px) {
		div *:not(:first-child){
			display: none;
		}
		#cupContainer{
			padding:0
		}
	}
</style>
