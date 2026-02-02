<script lang="ts">
	import Modal from '$lib/modal.svelte';
	import { browser } from '$app/environment';
	import { User } from '$lib/user';
	import { api } from '$lib/helper';
	let data = api('/sql/user/get');
	let newUser = '';
	let newPassword = '';
	async function resetPassword(user: string) {
		newPassword = (await api('/sql/user/resetPassword', { user })).password;
	}
	async function createUser() {
		newPassword = (await api('/sql/user/create', { user: newUser })).password;
		newUser = '';
		data = api('/sql/user/get');
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
			User's new password is {newPassword}
		</Modal>
	{/if}
	{#await data then users}
		<table>
			<tr>
				<td colspan="2"><input bind:value={newUser} /></td>
				<td
					><button
						on:click={() => {
							createUser();
						}}>Create User</button
					></td
				>
			</tr>
			{#each users as user}
				<tr>
					<td>{user.name}</td>
					<td>{user.access}</td>
					<td
						><button
							on:click={() => {
								resetPassword(user.name);
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
