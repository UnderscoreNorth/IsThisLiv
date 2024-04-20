<script>
	import { User } from './user';
	import Modal from './modal.svelte';
	import { browser } from '$app/environment';
	import { api } from './constants';
	
	let inputUser = '';
	let inputPass = '';
	let error = '';
	const login = async () => {
		let result = await api('/sql/user/login',{user:inputUser,pass:inputPass});
		if(result.error){
			error = result.error;
		} else if (result.user) {
			localStorage.setItem('user', JSON.stringify(result));
			User.set(result);
		}
	};
	const logout = () => {
		User.set({
			user: '',
			accesstoken: '',
			refreshtoken: '',
			expiry: '',
			access:0
		});
		localStorage.removeItem('user');
		if(browser){
			window.location.replace('/')
		}
	};
</script>
{#if error !== ''}
<Modal close={()=>{error=''}} title={'Error'}>
	{error}
</Modal>
{/if}
<modal class="c-1">
	{#if $User.user}
		{$User.user}
		<hr />
		<button on:click={logout}>Logout</button>
	{:else}
		<input placeholder="Username" bind:value={inputUser} />
		<input placeholder="Password" bind:value={inputPass} type="password" />
		<hr />
		<button on:click={login}>Login</button>
	{/if}
</modal>

<style>
	modal {
		position: absolute;
		right: 2rem;
		top: 2.5rem;
		width: 10rem;
		padding: 1rem;
		z-index: 1;
	}
	input {
		width: calc(100% - 0.5rem);
		padding: 0.25rem;
		border: 0;
		margin-bottom: 0.25rem;
	}
	button {
		width: 100%;
	}
</style>
