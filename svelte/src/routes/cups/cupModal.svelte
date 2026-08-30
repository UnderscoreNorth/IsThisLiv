<script lang="ts">
	import { User } from '../../lib/user';
	import { goto } from '$app/navigation';
	import { api } from '$lib/helper';
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
		if (
			$User.user &&
			cupData.name !== '' &&
			cupData.season !== '' &&
			parseInt(cupData.year) > 2010 &&
			parseInt(cupData.year) <= 2030 &&
			cupData.type !== '' &&
			cupData.start != '' &&
			cupData.finish !== '' &&
			parseInt(cupData.version) > 2010 &&
			parseInt(cupData.version) <= 2030
		) {
			cupData.user = $User.user;
			goto(`/cups/${(await api('/sql/newCup', cupData)).cupURL}`);
		}
	};
</script>

<table>
	<tbody>
		<tr
			><td>Name</td><td
				><input class={cupData.name?.length > 0 ? '' : 'error'} bind:value={cupData.name} /></td
			></tr
		>
		<tr
			><td>Season</td><td
				><select class={cupData.season != '' ? '' : 'error'} bind:value={cupData.season}>
					<option>Winter</option>
					<option>Spring</option>
					<option>Summer</option>
					<option>Autumn</option>
				</select></td
			></tr
		>
		<tr
			><td>Year</td><td
				><input
					type="number"
					class={parseInt(cupData.year) > 2010 && parseInt(cupData.year) <= 2030 ? '' : 'error'}
					bind:value={cupData.year}
				/></td
			></tr
		>
		<tr
			><td>Type</td><td
				><select class={cupData.type !== '' ? '' : 'error'} bind:value={cupData.type}>
					<option value="1">Elite</option>
					<option value="2">Babby</option>
					<option value="2.5">Megababby</option>
					<option value="3">Qualifier</option>
					<option value="4">Friendly</option>
					<option value="7">Invitational</option>
				</select></td
			></tr
		>
		<tr
			><td>Start</td><td
				><input
					type="date"
					class={cupData.start != '' ? '' : 'error'}
					bind:value={cupData.start}
				/></td
			></tr
		>
		<tr
			><td>Finish</td><td
				><input
					type="date"
					class={cupData.finish !== '' ? '' : 'error'}
					bind:value={cupData.finish}
				/></td
			></tr
		>
		<tr
			><td>PES Version</td><td
				><input
					type="number"
					class={parseInt(cupData.version) > 2010 && parseInt(cupData.version) <= 2030
						? ''
						: 'error'}
					placeholder="20xx"
					bind:value={cupData.version}
				/></td
			></tr
		>
	</tbody>
</table>
<button on:click={submitCup}>Submit</button>

<style>
	input {
		width: 100%;
	}
	select {
		width: 100%;
	}
	.error {
		background: rgb(255, 135, 135);
	}
</style>
