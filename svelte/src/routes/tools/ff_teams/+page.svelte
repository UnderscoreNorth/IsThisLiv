<script lang="ts">
	import Modal from '$lib/modal.svelte';
	import { browser } from '$app/environment';
	import { User } from '$lib/user';
	import { api } from '$lib/helper';
	let data = api('/ff/teamListID');
	let newUser = '';
	let newPassword = '';
	async function resetPassword(id: string) {
		newPassword = (await api('/ff/resetPassword', { id })).prv;
	}
	if (browser && $User.access < 3) {
		window.location.replace('/');
	}
</script>

<container>
	{#if newPassword}
		<Modal
			close={() => {
				newPassword = '';
			}}
			title={'Password'}
		>
			Team's new password is {newPassword}
		</Modal>
	{/if}
	{#await data then users}
		<table>
			{#each users as user}
				<tr>
					<td>{user.name}</td>
					<td
						><button
							on:click={() => {
								resetPassword(user.teamID);
							}}>Reset Password</button
						></td
					>
				</tr>
			{/each}
		</table>
	{/await}
</container>

<style>
	container {
		padding: 2rem;
	}
	td {
		text-align: left;
		padding-bottom: 1rem;
	}
</style>
