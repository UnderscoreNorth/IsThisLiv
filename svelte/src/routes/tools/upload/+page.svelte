<script>
	import { enhance } from '$app/forms';
	import config from '$lib/config.json';
	let api = config.api;
	export let data;
	let result = {};
	let loading = false;
</script>

{#await data}
	<p>Loading...</p>
{:then data}
	<div id="content">
		<form
			use:enhance={(e) => {
				loading =true;
				result = {Loading:[]}
				return async (data) => {
					loading = false;
					result = data.result;
				};
			}}
			enctype="multipart/form-data"
			method="post"
			action={`${api}/sql/uploadSaveFile`}
		>
			<label for="file">4CC Editor TSV file</label>
			<input type="file" id="file" name="file" accept=".tsv" required /><br />
			<label for="cup">Cup</label>
			<select id="cup" name="cup">
				{#each data.rows as row}
					<option value={row.cupID}>{row.cupName}</option>
				{/each}
			</select> <br />
			<button disabled={loading} type="submit">Process</button>
			{#if Object.keys(result).length}
				<hr/>
				<button disabled={loading} type='submit' name='save' value='save'>Save</button>
			{/if}
		</form>		
		<div id='results'>
			{#each Object.entries(result) as [team,players]}
			<table>
				<tr><th colspan=4>/{team}/</th></tr>
				{#each players as player}
				<tr><td>{player.shirtNumber}</td><td>{player.name}</td><td>{player.regPos}</td><td>{player.medal}{player.captain ? ' (C)' : ''}</td></tr>
				{/each}
			</table>
			{/each}
		</div>
	</div>
{/await}
<style>
	#content {
		padding: 1rem;
	}
	#results{
		display:flex;
		flex-wrap: wrap;
	}
	table{
		flex-grow: 1;
	}
	th{
		text-align: center;
	}
	td{text-align: left;font-size:0.7rem;}
</style>
