<script lang='ts'>
	import { goto } from '$app/navigation';
	import { api } from '$lib/helper';
	let data = api('/cups/list');
	const types = {
		'32 Team Traditional': { groups: 8, size: 4 },
		'32 Team Rotated Schedule': { groups: 8, size: 4 },
		//'40 Team Traditional': { groups: 8, size: 5 },
		//'40 Team Rotated Schedule': { groups: 8, size: 5 },
		//'64 Team Traditional': { groups: 16, size: 4 }
	} as const;
	const groups = [
		'A',
		'B',
		'C',
		'D',
		'E',
		'F',
		'G',
		'H',
		'I',
		'J',
		'K',
		'L',
		'M',
		'N',
		'O',
		'P',
		'Q'
	];
	let sendData:{cupID:number,type:keyof typeof types,groups:Record<string,string>} = {
		cupID:0,
		type:'32 Team Rotated Schedule',
		groups:{}
	}
	let processing = false;
	let error = '';
	async function process(){
		let res = await api('/sql/groupStage',sendData);
		error = res.error;
		if(!res.error){
			goto('/cups/' + sendData.cupID)	
		} 
	}
</script>

{#await data}
	<p>Loading...</p>
{:then data}
	<div id="content">
		<div style:color='red'>{error}</div>
		Cup
		<select bind:value={sendData.cupID}>
			{#each data as row}
				<option value={row.cupID}>{row.cupName}</option>
			{/each}
		</select> <br />

		Type<select name="type" bind:value={sendData.type}>
			{#each Object.keys(types) as row}
				<option>{row}</option>
			{/each}
		</select>
		<br />
		Do not include "/" in team names<br />
		{#each groups.slice(0, types[sendData.type].groups) as group}
			<div class="group">
				Group {group}
				{#each Array(types[sendData.type].size) as _, index (index)}
					<input bind:value={sendData.groups[group + index]} />
				{/each}
			</div>
		{/each}
		<br />
		This tool can only be used on cups without match data <button disabled={processing} on:click={()=>{process()}}>Process</button>
	</div>
{/await}

<style>
	#content {
		padding: 1rem;
	}
	.group {
		display: inline-block;
		width: 4rem;
		margin: 5px;
	}
	.group input {
		width: 100%;
	}
</style>
