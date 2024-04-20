<script lang='ts'>
    export let close:Function;
	export let title:string;
</script>
<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<closeout on:click={() => {
    close();
}}>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <container class="c-2" on:click={(e)=>{e.stopPropagation()}}>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<header><span>{title}</span><x
				on:click={() => {
					close();
				}}>X</x></header>
			<hr/>
	<slot />
</container>
</closeout>

<style>
	container {
		z-index: 3;
		overflow-y: auto;
		padding: 1rem;
		text-align: center;
		box-shadow: 0 0.5rem 0.5rem black;
        max-width: calc(100vw - 6rem);
        max-height: calc(100vh - 6rem);
        position:relative;
	}
	closeout {
		position: fixed;
		height: 100%;
		width: 100%;
		z-index: 2;
		top: 0;
		left: 0;
        display:flex;
        align-items: center;
        justify-content: center;
	}
	x {
		padding:5px;
		margin-left:5px;
		text-align: center;
		cursor: pointer;
		border-radius: 0.25rem;
		background: rgb(145, 3, 3);
		color: white;
	}
	x:hover {
		background: rgb(95, 8, 8);
	}
	header{
		font-size:larger;
		font-weight: bold;
		display:flex;
		align-items: center;
	}
	header span{
		flex-grow: 1;
	}
</style>
