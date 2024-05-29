<script lang='ts'>
    import { page } from '$app/stores';
	import type { DeepSet } from "./deepSet";
    import { sineIn } from 'svelte/easing';
	import { Drawer } from 'flowbite-svelte';
	import MdMenu from 'svelte-icons/md/MdMenu.svelte';
    let width: any;
	let drawerHidden = true;
	let transitionParams = {
		x: -320,
		duration: 0,
		easing: sineIn
	};
    export let links:DeepSet;
    export let path:string;
    export let nested=false;
</script>
<svelte:window bind:innerWidth={width} />
<Drawer
	backdrop={true}
	transitiontype="fly"
	{transitionParams}
	bind:hidden={drawerHidden}
	id="sidebar1"
>
	<div id="miscDrawer">
        {#if nested}
            {#each Array.from(links) as link}
                {#if typeof link == 'object'}
                    {#each Object.keys(link) as header}
                        {header}
                        {#each link[header] as subLink}
                            <a
                                style="padding-left:0.5rem"
                                href="{path}{header}-{subLink}"
                                on:click={() => (drawerHidden = true)}>{subLink}</a
                            >
                        {/each}
                    {/each}
                {:else}
                    <a href="{path}{link}" on:click={() => (drawerHidden = true)}>{link}</a>
                {/if}
            {/each}
        {:else}
            {#each Array.from(links) as link}
                <a href={path+link[0]} on:click={() => (drawerHidden = true)}>{link[1]}</a>
            {/each}
        {/if}
	</div>
</Drawer>
<div id="container">
	{#if width <= 1000}
		<div class="mobileRow c-1" style="display:flex">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<icon on:click={() => (drawerHidden = !drawerHidden)}>
				<MdMenu />
			</icon>
			<span style="margin-left:0.5rem"
				>{Array.from(links)
					.filter((x) => $page.url.pathname.replace(path,'').includes(x[0]) && x[0] !== '/')
					.map((x) => x[1])
					.join('')}</span
			>
		</div>
	{:else}
		<vertNav class="c-1">
            {#if nested}
                {#each Array.from(links) as link}
                    {#if typeof link == 'object'}
                        {#each Object.keys(link) as header}
                            {header}
                            {#each link[header] as subLink}
                                <a
                                    style="padding-left:0.5rem"
                                    href="{path}{header}-{subLink}"
                                    on:click={() => (drawerHidden = true)}
                                    ><div
                                        class={$page.url.pathname == `${path}${header}-${subLink}`
                                            ? 'selectedPage'
                                            : 'unselectedPage'}
                                    >
                                        {subLink}
                                    </div></a
                                >
                            {/each}
                        {/each}
                    {:else}
                        <a href="/records/{link}" on:click={() => (drawerHidden = true)}
                            ><div
                                class={$page.url.pathname == path + link ? 'selectedPage' : 'unselectedPage'}
                            >
                                {link}
                            </div></a
                        >
                    {/if}
                {/each}
            {:else}
                {#each Array.from(links) as link}
                    <a href={path+link[0]}>
                        <div
                            class={$page.url.pathname == path + link[0] ? 'selectedPage' : 'unselectedPage'}
                        >
                            {link[1]}
                        </div>
                    </a>
                {/each}
            {/if}
			
		</vertNav>
	{/if}
	<div id='slotContainer'>
		<slot />
	</div>
</div>
<style>
	vertNav{
		overflow-y: auto;
	}
	#slotContainer{
		overflow-y: auto;
	}
	#container {
		display: grid;
		grid-template-columns: 10rem 1fr;
		position: relative;
		height: 100%;
	}
	@media only screen and (max-width: 1000px) {
		#container {
			grid-template-columns: 1fr;
			grid-template-rows: 2.5rem 1fr;
		}
	}
	.selectedPage {
		background: rgba(0, 0, 0, 0.5);
		font-weight: bold;
		padding: 0.25rem 0;
		margin-right: -1rem;
		margin-left: -0.25rem;
		padding-left: 0.25rem;
		padding-right: 1rem;
	}
	#miscDrawer {
		position: fixed;
		z-index: 2;
		left: 0;
		top: 5rem;
		bottom: 0;
		background: var(--bg-c1);
		padding: 1rem;
		display: flex;
		flex-direction: column;
		overflow-y: scroll;
	}
	#miscDrawer a {
		color: var(--color-red);
		font-size: 1rem;
		line-height: 1.5rem;
		text-decoration: none;
	}
</style>