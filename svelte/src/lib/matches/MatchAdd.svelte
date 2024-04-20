<script lang='ts'>
	import { api } from '$lib/helper';
	import Modal from '$lib/modal.svelte';
	export let toggleModal:Function;
	export let cupID:number;
	let data = {cupID,homeTeam:'',awayTeam:'',round:'',utcTime:'',official:true,valid:true};
	let rounds = api('/sql/rounds');
	let adding = false;
	let added =false;
	let home:HTMLInputElement;
	async function addMatch(){
		if(!(data.homeTeam && data.awayTeam && data.round && data.utcTime)) return;
		adding = true;		
		await api('/sql/addMatch',data);
		adding = false;
		added = true;
		if(home) home.focus();
		data.homeTeam = '';
		data.awayTeam = '';
	}
	function closeModal(){
		if(added){
			location.reload();
		} else {
			toggleModal();
		}
	}
</script>
<Modal close={closeModal} title={'Match Add'}>
	{#await rounds then rounds}
	<table>
		<tr><th>Home</th><th>Away</th><th>Round</th><th>Date</th><th>Official</th><th>Valid</th></tr>
		<tr>
			<td><input bind:this={home} bind:value={data.homeTeam}/></td>
			<td><input bind:value={data.awayTeam}/></td>
			<td><select bind:value={data.round}>
				{#each rounds as round}
					<option>{round.round}</option>
				{/each}
			</select></td>
			<td><input bind:value={data.utcTime} type='datetime-local'/></td>
			<td><input type='checkbox' bind:checked={data.official}/></td>
			<td><input type='checkbox' bind:checked={data.valid}/></td>
		</tr>
	</table>
	<button disabled={adding} on:click={()=>{addMatch()}}>{adding ? 'Adding' : 'Add'}</button>	
	{/await}
</Modal>

<style>
	input:not([type='datetime-local']){
		width:3rem;
	}
</style>
