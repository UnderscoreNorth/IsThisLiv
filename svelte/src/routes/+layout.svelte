<script lang="ts">
	import { page } from '$app/stores';
	import { sineIn } from 'svelte/easing';
	import { Drawer } from 'flowbite-svelte';
	import MdPerson from 'svelte-icons/md/MdPerson.svelte';
	import MdMenu from 'svelte-icons/md/MdMenu.svelte';
	import UserModal from '$lib/userModal.svelte';
	import { User } from '$lib/user';
	let width: any;
	let drawerHidden = true;
	let transitionParams = {
		x: -320,
		duration: 0,
		easing: sineIn
	};
	let linksArray = [
		['/', 'IsThisLiv'],
		['/cups', 'Cups'],
		['/teams', 'Teams'],
		['/players', 'Players'],
		['/records', 'Records'],
		['/misc', 'Misc Stats'],
		['/ff', 'Fantasy Football'],
		['https://implyingrigged.info/', 'Wiki'],
		['https://cytu.be/r/the4chancup', 'Stream'],
		['https://implying.fun', 'VODs']
	];
	let links = new Set(linksArray);
	$: if ($User.username) {
		links.add(['/tools', 'Tools']);
	} else {
		console.log($User.username);
	}

	let loginFlag = false;
	function toggleDarkMode() {
		localStorage.setItem(
			'theme',
			document.documentElement.classList.toggle('dark-mode') ? '1' : '0'
		);
	}
	function toggleLogin() {
		loginFlag = !loginFlag;
	}
	if (typeof localStorage !== 'undefined') $User.username = localStorage.getItem('username') || '';
</script>

<svelte:window bind:innerWidth={width} />
<svelte:head>
	<script>
		if (document && typeof document !== 'undefined') {
			if (localStorage.getItem('theme') == '1') document.documentElement.classList.add('dark-mode');
		}
	</script>
</svelte:head>

<Drawer
	backdrop={true}
	transitiontype="fly"
	{transitionParams}
	bind:hidden={drawerHidden}
	id="sidebar1"
>
	<div id="mainDrawer">
		{#each Array.from(links) as link}
			<a href={link[0]} on:click={() => (drawerHidden = true)}>{link[1]}</a>
		{/each}
	</div>
</Drawer>
<nav id="Nav">
	{#if width <= 1000}
		<!-- svelte-ignore a11y-click-events-have-key-events -->
		<icon on:click={() => (drawerHidden = !drawerHidden)}>
			<MdMenu />
		</icon>
		<span style="margin-left:0.5rem"
			>IsThisLiv {Array.from(links)
				.filter((x) => $page.url.pathname.includes(x[0]) && x[0] !== '/')
				.map((x) => '- ' + x[1])
				.join('')}</span
		>
	{:else}
		{#each Array.from(links) as link}
			<a
				href={link[0]}
				class={link[0] == '/'
					? $page.url.pathname == link[0]
						? 'selected'
						: ''
					: $page.url.pathname.includes(link[0])
					? 'selected'
					: ''}
			>
				{link[1]}</a
			>
		{/each}
	{/if}
	<div id="rightNav" style="float:right">
		<button on:click={toggleDarkMode}>Dark Mode</button>
		<icon on:click={toggleLogin}><MdPerson /></icon>
	</div>
</nav>
{#if loginFlag}
	<UserModal />
{/if}
<div style="height:calc(100% - 2.5rem)">
	<slot />
</div>

<style>
	:global(html) {
		font-family: 'Helvetica';
		--bg-color: #f6f6f6;
		--bg-c1: #dde2e7;
		--bg-c2: #dadfe7;
		--fg-color: black;
		background-color: var(--bg-color);
		color: var(--fg-color);
		height: 100%;
	}
	:global(body > div) {
		height: 100%;
	}
	:global(html.dark-mode) {
		--bg-color: #151f27;
		--bg-c1: #3a4050;
		--bg-c2: #5d6477;
		--fg-color: #d9dbdf;
	}
	:global(body) {
		margin: 0;
		position: relative;
		height: 100%;
	}
	:global(td) {
		padding: 0 0.5rem;
		text-align: right;
	}
	:global(a) {
		color: var(--fg-color);
		text-decoration: none;
		padding: 0.1rem;
		margin: -0.1rem;
		border-radius: 3px;
	}
	:global(a:hover) {
		background: #2e51a2;
		color: white;
	}
	:global(.c-1) {
		background: var(--bg-c1);
	}
	:global(.c-2) {
		background: var(--bg-c2);
	}
	:global(vertNav) {
		display: flex;
		position: sticky;
		top: 3.5rem;
		height: calc(100% - 2rem);
		flex-direction: column;
		padding: 1rem;
	}
	:global(.status-win) {
		background: #ddffdd;
	}
	:global(.status-win > a) {
		color: black !important;
	}
	:global(.p-1) {
		padding: 1rem;
	}
	:global(.Gold) {
		background: #e0c068;
		color: black;
		padding: 0 0.5rem;
	}
	:global(.Silver) {
		background: #b7bec5;
		color: black;
		padding: 0 0.5rem;
	}
	:global(.Bronze) {
		background: #964a3c;
		color: black;
		padding: 0 0.5rem;
	}
	:global(.W) {
		background: #ddffdd;
		color: black;
	}
	:global(.D) {
		background: #ffffdd;
		color: black;
	}
	:global(.L) {
		background: #ffdddd;
		color: black;
	}
	:global(.V) {
		background: #ccc;
		color: black;
	}
	nav {
		background: #2e51a2;
		font-size: 15px;
		height: 2.5rem;
		color: white;
		line-height: 2.5rem;
		padding: 0 1.25rem;
		display: flex;
	}
	@media only screen and (max-width: 1000px) {
		nav {
			padding: 0;
		}
	}
	nav a,
	nav button {
		color: white;
		padding: 0 0.5rem !important;
		margin: 0 !important;
		text-decoration: none;
		min-height: 2.5rem;
		display: inline-block;
	}
	nav button {
		background: none;
		border: none;
		cursor: pointer;
	}
	:global(icon) {
		height: 2rem;
		width: 2rem;
		cursor: pointer;
		border-radius: 0.25rem;
		padding: 0.25rem;
		display: block;
	}
	nav a:hover,
	nav button:hover,
	nav icon:hover {
		background: #3a4050;
		border-radius: 0;
	}
	#rightNav {
		margin-left: auto;
		display: flex;
	}
	nav .selected {
		background: white;
		color: #2e51a2;
		font-weight: bold;
	}
	#mainDrawer {
		position: fixed;
		z-index: 2;
		left: 0;
		top: 2.5rem;
		bottom: 0;
		background: var(--bg-c1);
		padding: 1rem;
		display: flex;
		flex-direction: column;
	}
	#mainDrawer a {
		color: var(--color-red);
		font-size: 1rem;
		line-height: 1.5rem;
		text-decoration: none;
	}
	:global(.mobileRow) {
		height: 2.5rem;
		line-height: 2.5rem;
	}
</style>
