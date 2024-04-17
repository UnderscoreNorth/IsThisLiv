<script>
	import { enhance } from '$app/forms';
	import config from '$lib/config.json';
	let api = config.api;
	export let data;
	let type = '32 Team Traditional';
	const types = {
		'32 Team Traditional': { groups: 8, size: 4 },
		'32 Team Rotated Schedule': { groups: 8, size: 4 },
		'40 Team Traditional': { groups: 8, size: 5 },
		'40 Team Rotated Schedule': { groups: 8, size: 5 },
		'64 Team Traditional': { groups: 16, size: 4 }
	};
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
			action={`${api}/tools/groupstage`}
		>
			<label for="cup">Cup</label>
			<select id="cup" name="cup">
				{#each data.rows as row}
					<option value={row.cupID}>{row.cupName}</option>
				{/each}
			</select> <br />

			<label for="type">Type </label><select name="type" bind:value={type}>
				{#each Object.keys(types) as row}
					<option>{row}</option>
				{/each}
			</select>
			<br />
			Do not include "/" in team names<br />
			{#each groups.slice(0, types[type].groups) as group}
				<div class="group">
					Group {group}
					{#each Array(types[type].size) as _, index (index)}
						<input name={group + index} />
					{/each}
				</div>
			{/each}

			<br />

			This tool can only be used on cups without match data <button type="submit">Process</button>
		</form>
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
