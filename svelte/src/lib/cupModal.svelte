<script>
	export let toggleCupModal;
	import { User } from './user';
	import { goto } from '$app/navigation';
	import config from '$lib/config.json';
	let api = config.api;
	let cupData = {
		name: '',
		season: '',
		year: '',
		type: '',
		start: '',
		finish: '',
		version: '',
		user: ''
	};
	let submitCup = async () => {
		if ($User.username) {
			cupData.user = $User.username;
			let response = await fetch(`${api}api/cups/edit`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(cupData)
			});
			let jsonResponse = await response.json();
			goto(`/cups/${jsonResponse.cupURL}`);
		}
	};
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<closeout on:click={toggleCupModal}>
	<container
		class="c-2"
		on:click={(e) => {
			e.stopPropagation();
		}}
	>
		<table>
			<tr><td>Name</td><td><input bind:value={cupData.name} /></td></tr>
			<tr
				><td>Season</td><td
					><select bind:value={cupData.season}>
						<option>Winter</option>
						<option>Spring</option>
						<option>Summer</option>
						<option>Autumn</option>
					</select></td
				></tr
			>
			<tr><td>Year</td><td><input type="number" bind:value={cupData.year} /></td></tr>
			<tr
				><td>Type</td><td
					><select bind:value={cupData.type}>
						<option value="1">Elite</option>
						<option value="2">Babby</option>
						<option value="2.5">Megababby</option>
						<option value="3">Qualifier</option>
						<option value="4">Friendly</option>
						<option value="7">Invitational</option>
					</select></td
				></tr
			>
			<tr><td>Start</td><td><input type="date" bind:value={cupData.start} /></td></tr>
			<tr><td>Finish</td><td><input type="date" bind:value={cupData.finish} /></td></tr>
			<tr
				><td>PES Version</td><td
					><input type="number" placeholder="20xx" bind:value={cupData.version} /></td
				></tr
			>
		</table>
		<button on:click={submitCup}>Submit</button>
	</container>
</closeout>

<style>
	container {
		position: fixed;
		top: 3rem;
		width: 25rem;
		left: calc(50% - 13rem);
		z-index: 3;
		padding: 1rem;
		text-align: center;
		box-shadow: 0 0.5rem 0.5rem black;
	}
	closeout {
		position: fixed;
		height: 100%;
		width: 100%;
		z-index: 2;
		top: 0;
		left: 0;
	}
	input {
		width: 100%;
	}
	select {
		width: 100%;
	}
</style>
