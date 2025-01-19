<script lang="ts">
	import { enhance } from '$app/forms';
	import config from '$lib/config.json';
	import Icons from './icons.svelte';
	let api = config.api;
	let loading = false;
	let key = 0;
</script>

<form
	use:enhance={(e) => {
		loading = true;
		return async (data) => {
			loading = false;
			key = Math.random();
		};
	}}
	enctype="multipart/form-data"
	method="post"
	action={`${api}/sql/uploadIcon`}
>
	<label for="file">Icon uploader</label><br />
	<input type="file" id="file" name="file" accept=".png" required /><br />
	<select name="type" required>
		<option>cups</option>
		<option>cups-small</option>
		<option>team-small</option>
	</select>
	<label for="type">Icon type</label><br />
	<input type="text" name="name" required /> <label for="name">Icon name</label><br />
	<button disabled={loading} type="submit">Upload</button>
</form>
{#key key}
	<Icons />
{/key}

<style>
	input::file-selector-button,
	select,
	input[type='text'] {
		width: 6rem;
	}
</style>
