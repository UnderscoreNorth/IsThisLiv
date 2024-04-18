<script>
	import { api } from '$lib/constants';
	export let toggleModal;
	export let cupID;
	export let hasMatches;
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<closeout on:click={toggleModal}>
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<container
		class="c-2"
		on:click={(e) => {
			e.stopPropagation();
		}}
	>
		<h3>Match Add</h3>

		
	</container>
</closeout>

<style>
	container {
		position: fixed;
		top: 3rem;
		width: 38rem;
		left: calc(50% - 20rem);
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
	groupsContainer {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
		width: 100%;
	}
	groupsContainer input {
		width: calc(100% - 1rem);
	}
</style>
