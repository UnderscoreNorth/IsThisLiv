<script lang='ts'>
	import { page } from '$app/stores';
	import { api } from '$lib/helper';
	import Modal from '$lib/modal.svelte';
	import TeamIcon from '$lib/teamIcon.svelte';
	import { User } from '$lib/user';
	let filter = 'All';
	let sort = '';
	const loadData = async (sort) => {
		return await api('/managers',{sort});
	};
	page.subscribe((r) => {
		sort = r.params.slug;
	});
	let newRecord = false;
	function edit(run){
		if($User.access >0){
			editData = JSON.parse(JSON.stringify(run));
			console.log(editData);
			showModal = true;
		}
	}
	let editData = {};
	let showModal = false;
	function closeModal(){
		editData = {};
		showModal = false;
		newRecord = false;
	}
	let processing = false;
	async function process(action:'add'|'update'|'delete'){
		processing = true;
		if(['add','update','delete'].includes(action)){
			editData.action = action;
			await api('/sql/processManager/',editData);
		}
		location.reload();
	}
	
</script>

<svelte:head>
	<title>Managers - IsThisLiv</title>
</svelte:head>
{#if showModal}
<Modal title={'Manager Edit'} close={closeModal}>
	<table>
		<tr><th>Name</th><td><input disabled={!newRecord} bind:value={editData.manager}></td></tr>
		<tr><th>Board</th><td><input disabled={!newRecord} bind:value={editData.board}></td></tr>
		<tr><th>Start</th><td><input type='date' disabled={!newRecord} bind:value={editData.start}></td></tr>
		<tr><th>End</th><td><input type='date' bind:value={editData.end}></td></tr>
	</table>
	{#if newRecord}
		<button disabled={processing} on:click={()=>{process('add')}}>Add</button>
	{:else}
	<button disabled={processing} on:click={()=>{process('update')}}>Update</button>
	<button disabled={processing} on:click={()=>{process('delete')}}>Delete</button>
	{/if}
</Modal>
{/if}
<div id="managerContainer">
	<div id="filters">
		Sort by |
		<a href="/managers/days">Total Days</a> |
		<a href="/managers/start">Start Date</a> |
		<a href="/managers/end">End Date</a> |
		<a href="/managers/board">Board</a> |
		<a href="/managers/eff">Efficiency</a> |
		<a href="/managers/points">Avg Pts</a> | Filter by |
		<input type="radio" bind:group={filter} name="filter" value="All" checked /> All |
		<input type="radio" bind:group={filter} name="filter" value="Active" /> Active |
		<input type="radio" bind:group={filter} name="filter" value="Inactive" /> Inactive
		{#if $User.access > 1}
			<button on:click={()=>{showModal=true;newRecord=true}}>New</button>
		{/if}
	</div>
	{#await loadData(sort)}
		Loading...
	{:then data}
		<div id="tableContainer">
			<table style="border-collapse:collapse">
				<thead>
					<tr>
						<th colspan="2"> Manager </th>
						{#each Array(data.max) as _}
							<th>Board</th>
							<th>Start</th>
							<th>End</th>
							<th>#</th>
						{/each}
						<th>Total Days</th>
						{#if sort == 'points' || sort == 'eff'}
							<th>W</th>
							<th>D</th>
							<th>L</th>
							<th>T</th>
							<th>Eff</th>
							<th>Avg Pts</th>
						{/if}
					</tr>
				</thead>
				<tbody>
					{#each data.rowData as row, i}
						{#if !(filter == 'Active' && !row.active) && !(filter == 'Inactive' && row.active)}
							<tr>
								<td>{i + 1}</td>
								<th>{row.manager}</th>
								{#each Array(data.max) as _, j}
									{#if row.runs[j]}
										<td style="color:black;text-align:center;background:{row.runs[j].colour}"
											>/{row.runs[j].board}/<TeamIcon team={row.runs[j].board}/></td
										>
										<td style="color:black;background:{row.runs[j].colour}">{row.runs[j].start}</td>
										<td on:click={()=>{edit(Object.assign(row.runs[j],{manager:row.manager}))}} class={$User.access > 0 ? 'hover' : ''} style="color:black;background:{row.runs[j].colour}">{row.runs[j].end}</td>
										<th style="color:black;background:{row.runs[j].colour}">{row.runs[j].days}</th>
									{:else}
										<td colspan="4" />
									{/if}
								{/each}
								<th>{row.tot}</th>
								{#if sort == 'points' || sort == 'eff'}
									<td>{row.stats.w}</td>
									<td>{row.stats.d}</td>
									<td>{row.stats.l}</td>
									<td>{row.stats.t}</td>
									<td>{row.stats.e}%</td>
									<td>{row.stats.p}</td>
								{/if}
							</tr>
						{/if}
					{/each}
				</tbody>
			</table>
		</div>
	{/await}
</div>

<style>
	#managerContainer {
		height: 100%;
	}
	thead {
		position: sticky;
		top: 0;
		background: var(--bg-color);
		z-index: 1;
	}
	#filters {
		background: var(--bg-color);
		padding: 0.5rem 1rem;
		height: 1rem;
		width: calc(100% - 2rem);
	}
	#tableContainer {
		width: 100%;
		height: calc(100% - 2rem);
		overflow-x: scroll;
	}
	th,
	td {
		border-bottom: 1px solid rgba(100, 100, 100, 0.5);
		padding: 2px 5px;
	}
	.hover:hover{
		cursor: pointer;
		color:white!important;
	}
</style>
