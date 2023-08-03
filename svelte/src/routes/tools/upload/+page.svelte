<script>
	import { enhance } from '$app/forms';
	import config from '$lib/config.json';
	let api = config.api;
	export let data;
</script>

{#await data}
	<p>Loading...</p>
{:then data}
	<div id="content">
		<form
			use:enhance={(e) => {
				console.log(e.data);
				return async ({ update }) => {
					console.log(update);
				};
			}}
			enctype="multipart/form-data"
			method="post"
			action={`${api}api/tools/processSave`}
		>
			<label for="file">4CC Editor TSV file</label>
			<input type="file" id="file" name="file" accept=".tsv" required /><br />
			<label for="cups">Cup</label>
			<select id="cups" name="cups">
				{#each data.rows.reverse() as row}
					<option value={row.iID}>{row.sName}</option>
				{/each}
			</select> <br />
			This tool can only be used on cups without match data <button type="submit">Process</button>
		</form>
	</div>
{/await}

<style>
	#content {
		padding: 1rem;
	}
</style>
